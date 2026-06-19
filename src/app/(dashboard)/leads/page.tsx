"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, UserCheck, Search } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { formatLabel, LEAD_STATUSES } from "@/lib/constants";

interface Lead {
  id: string;
  leadId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes?: string;
  createdAt: string;
}

const LEAD_SOURCES = [
  "WEBSITE", "REFERRAL", "LINKEDIN", "COLD_CALL", "TRADE_SHOW", "EMAIL_CAMPAIGN", "OTHER",
] as const;

const emptyForm = {
  companyName: "", contactPerson: "", email: "", phone: "",
  source: "WEBSITE", status: "NEW", notes: "",
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openCreate = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLead(lead);
    setForm({
      companyName: lead.companyName, contactPerson: lead.contactPerson,
      email: lead.email, phone: lead.phone, source: lead.source,
      status: lead.status, notes: lead.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editingLead ? `/api/leads/${editingLead.id}` : "/api/leads";
    const method = editingLead ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setDialogOpen(false);
    fetchLeads();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/leads/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchLeads();
  };

  const handleConvert = async () => {
    if (!convertId) return;
    const res = await fetch(`/api/leads/${convertId}/convert`, { method: "POST" });
    const customer = await res.json();
    setConvertId(null);
    fetchLeads();
    if (customer.id) router.push(`/customers/${customer.id}`);
  };

  const columns: ColumnDef<Lead>[] = [
    { accessorKey: "leadId", header: "Lead ID", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.leadId}</span>
    )},
    { accessorKey: "companyName", header: "Company" },
    { accessorKey: "contactPerson", header: "Contact" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "source", header: "Source", cell: ({ row }) => formatLabel(row.original.source) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {row.original.status !== "WON" && (
          <Button variant="ghost" size="icon" title="Convert to customer" onClick={() => setConvertId(row.original.id)}>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={(e) => openEdit(row.original, e)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : leads.length === 0 ? (
            <EmptyState title="No leads found" description="Create your first lead to get started" action={{ label: "Add Lead", onClick: openCreate }} />
          ) : (
            <>
              <DataTable columns={columns} data={leads} onRowClick={(row) => router.push(`/leads/${row.id}`)} />
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmationDialog
        open={!!convertId}
        onOpenChange={() => setConvertId(null)}
        title="Convert to Customer"
        description="This will create a new customer from this lead and mark the lead as Won."
        confirmLabel="Convert"
        onConfirm={handleConvert}
      />
    </div>
  );
}
