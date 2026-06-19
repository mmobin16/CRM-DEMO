"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Printer, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface QuotationItem {
  item: string;
  description?: string;
  quantity: number;
  rate: number;
  total: number;
}

interface Quotation {
  id: string;
  number: string;
  customerId: string;
  customer: { companyName: string };
  date: string;
  validUntil: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: QuotationItem[];
}

interface LineItemForm {
  item: string;
  description: string;
  quantity: string;
  rate: string;
}

const emptyLineItem = (): LineItemForm => ({ item: "", description: "", quantity: "1", rate: "" });

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([emptyLineItem()]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [qRes, cRes] = await Promise.all([
      fetch("/api/quotations"),
      fetch("/api/customers?limit=100"),
    ]);
    const qData = await qRes.json();
    const cData = await cRes.json();
    setQuotations(qData.quotations || []);
    setCustomers(cData.customers || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    setSaving(true);
    await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        validUntil: new Date(validUntil).toISOString(),
        items: lineItems.map((li) => ({
          item: li.item,
          description: li.description,
          quantity: parseFloat(li.quantity),
          rate: parseFloat(li.rate),
        })),
      }),
    });
    setSaving(false);
    setCreateOpen(false);
    setCustomerId("");
    setValidUntil("");
    setLineItems([emptyLineItem()]);
    fetchData();
  };

  const printPDF = (q: Quotation) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Quotation", 14, 22);
    doc.setFontSize(10);
    doc.text(`Number: ${q.number}`, 14, 32);
    doc.text(`Customer: ${q.customer.companyName}`, 14, 38);
    doc.text(`Date: ${formatDate(q.date)}`, 14, 44);
    doc.text(`Valid Until: ${formatDate(q.validUntil)}`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Item", "Description", "Qty", "Rate", "Total"]],
      body: q.items.map((i) => [
        i.item, i.description || "", i.quantity, formatCurrency(i.rate), formatCurrency(i.total),
      ]),
    });

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${formatCurrency(q.subtotal)}`, 140, finalY);
    doc.text(`Tax (10%): ${formatCurrency(q.tax)}`, 140, finalY + 6);
    doc.setFontSize(12);
    doc.text(`Total: ${formatCurrency(q.total)}`, 140, finalY + 14);

    doc.save(`${q.number}.pdf`);
  };

  const subtotal = lineItems.reduce((s, li) => s + (parseFloat(li.quantity) || 0) * (parseFloat(li.rate) || 0), 0);

  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "number", header: "Number", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.number}</span>
    )},
    { id: "customer", header: "Customer", cell: ({ row }) => row.original.customer.companyName },
    { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: "validUntil", header: "Valid Until", cell: ({ row }) => formatDate(row.original.validUntil) },
    { accessorKey: "total", header: "Total", cell: ({ row }) => (
      <span className="font-semibold">{formatCurrency(row.original.total)}</span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: "actions", header: "", cell: ({ row }) => (
      <Button variant="ghost" size="icon" onClick={() => printPDF(row.original)} title="Print PDF">
        <Printer className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Create and manage sales quotations</p>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Quotation</Button>
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="p-6">
          {loading ? <TableSkeleton /> : quotations.length === 0 ? (
            <EmptyState title="No quotations yet" action={{ label: "Create Quotation", onClick: () => setCreateOpen(true) }} />
          ) : (
            <DataTable columns={columns} data={quotations} />
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button variant="outline" size="sm" onClick={() => setLineItems([...lineItems, emptyLineItem()])}>
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>
              {lineItems.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end rounded-xl border border-border p-3">
                  <div className="col-span-3 grid gap-1">
                    <Label className="text-xs">Item</Label>
                    <Input value={li.item} onChange={(e) => { const n = [...lineItems]; n[idx].item = e.target.value; setLineItems(n); }} />
                  </div>
                  <div className="col-span-3 grid gap-1">
                    <Label className="text-xs">Description</Label>
                    <Input value={li.description} onChange={(e) => { const n = [...lineItems]; n[idx].description = e.target.value; setLineItems(n); }} />
                  </div>
                  <div className="col-span-2 grid gap-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" value={li.quantity} onChange={(e) => { const n = [...lineItems]; n[idx].quantity = e.target.value; setLineItems(n); }} />
                  </div>
                  <div className="col-span-2 grid gap-1">
                    <Label className="text-xs">Rate</Label>
                    <Input type="number" value={li.rate} onChange={(e) => { const n = [...lineItems]; n[idx].rate = e.target.value; setLineItems(n); }} />
                  </div>
                  <div className="col-span-1 text-sm font-medium pt-5">
                    {formatCurrency((parseFloat(li.quantity) || 0) * (parseFloat(li.rate) || 0))}
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-1 text-right">
              <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
              <p className="text-sm text-muted-foreground">Tax (10%): {formatCurrency(subtotal * 0.1)}</p>
              <p className="text-lg font-bold">Total: {formatCurrency(subtotal * 1.1)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !customerId || !validUntil}>
              {saving ? "Creating..." : "Create Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
