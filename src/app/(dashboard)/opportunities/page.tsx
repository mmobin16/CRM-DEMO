"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, DollarSign, Calendar } from "lucide-react";
import { Drawer } from "@/components/shared/drawer";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { formatLabel, OPPORTUNITY_STAGES } from "@/lib/constants";

interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customer: { companyName: string };
  expectedRevenue: number;
  probability: number;
  closingDate: string;
  stage: string;
  notes?: string;
}

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "border-t-slate-400",
  QUALIFICATION: "border-t-purple-500",
  PROPOSAL: "border-t-blue-500",
  NEGOTIATION: "border-t-amber-500",
  WON: "border-t-emerald-500",
  LOST: "border-t-red-500",
};

function OpportunityCard({ opp, isDragging }: { opp: Opportunity; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: opp.id, data: { opp } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-medium leading-tight">{opp.name}</p>
          <p className="text-xs text-muted-foreground truncate">{opp.customer.companyName}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">{formatCurrency(opp.expectedRevenue)}</span>
            <span className="text-xs text-muted-foreground">{opp.probability}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, opportunities, onCardClick }: {
  stage: string;
  opportunities: Opportunity[];
  onCardClick: (opp: Opportunity) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className={cn("rounded-t-xl border-t-4 bg-muted/30 px-4 py-3", STAGE_COLORS[stage])}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{formatLabel(stage)}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{opportunities.length}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(opportunities.reduce((s, o) => s + o.expectedRevenue, 0))}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-3 rounded-b-xl border border-t-0 border-border bg-muted/10 p-3 min-h-[400px] transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {opportunities.map((opp) => (
          <div key={opp.id} onClick={() => onCardClick(opp)}>
            <OpportunityCard opp={opp} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", customerId: "", expectedRevenue: "", probability: "50",
    closingDate: "", notes: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchData = useCallback(async () => {
    const [oppRes, custRes] = await Promise.all([
      fetch("/api/opportunities"),
      fetch("/api/customers?limit=100"),
    ]);
    const oppData = await oppRes.json();
    const custData = await custRes.json();
    setOpportunities(oppData.opportunities || []);
    setCustomers(custData.customers || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragStart = (event: DragStartEvent) => {
    const opp = opportunities.find((o) => o.id === event.active.id);
    if (opp) setActiveOpp(opp);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOpp(null);
    const { active, over } = event;
    if (!over) return;

    const oppId = active.id as string;
    const newStage = over.id as string;
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage === newStage || !OPPORTUNITY_STAGES.includes(newStage as typeof OPPORTUNITY_STAGES[number])) return;

    setOpportunities((prev) => prev.map((o) => o.id === oppId ? { ...o, stage: newStage } : o));
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: oppId, stage: newStage }),
    });
  };

  const handleCreate = async () => {
    await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        customerId: form.customerId,
        expectedRevenue: parseFloat(form.expectedRevenue),
        probability: parseInt(form.probability),
        closingDate: new Date(form.closingDate).toISOString(),
        notes: form.notes,
      }),
    });
    setCreateOpen(false);
    setForm({ name: "", customerId: "", expectedRevenue: "", probability: "50", closingDate: "", notes: "" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {OPPORTUNITY_STAGES.map((s) => (
          <div key={s} className="min-w-[280px] h-[500px] rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag opportunities between stages to update pipeline</p>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Opportunity</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {OPPORTUNITY_STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              opportunities={opportunities.filter((o) => o.stage === stage)}
              onCardClick={setSelectedOpp}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOpp ? <OpportunityCard opp={activeOpp} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <Drawer
        open={!!selectedOpp}
        onClose={() => setSelectedOpp(null)}
        title={selectedOpp?.name || ""}
        description={selectedOpp?.customer.companyName}
      >
        {selectedOpp && (
          <div className="space-y-6">
            <StatusBadge status={selectedOpp.stage} />
            <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Expected Revenue</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(selectedOpp.expectedRevenue)}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Closing Date</span>
                  </div>
                  <p className="text-xl font-bold">{formatDate(selectedOpp.closingDate)}</p>
                </CardContent>
              </Card>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Probability</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selectedOpp.probability}%` }} />
              </div>
              <p className="text-sm font-medium mt-1">{selectedOpp.probability}%</p>
            </div>
            {selectedOpp.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm rounded-xl bg-muted/50 p-3">{selectedOpp.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Revenue ($)</Label><Input type="number" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Probability (%)</Label><Input type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Closing Date</Label><Input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
