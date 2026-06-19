"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry?: string;
  city?: string;
  country?: string;
  createdAt: string;
  _count?: { contacts: number; opportunities: number };
}

const emptyForm = {
  companyName: "", contactPerson: "", email: "", phone: "",
  industry: "", address: "", city: "", country: "", website: "",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({
      companyName: c.companyName, contactPerson: c.contactPerson,
      email: c.email, phone: c.phone, industry: c.industry || "",
      address: "", city: c.city || "", country: c.country || "", website: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setDialogOpen(false);
    fetchCustomers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCustomers();
  };

  const exportCSV = () => {
    const headers = ["customerCode", "companyName", "contactPerson", "email", "phone", "industry", "city", "country"];
    const rows = customers.map((c) =>
      headers.map((h) => `"${String((c as unknown as Record<string, unknown>)[h] ?? "")}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setImporting(true);
    const lines = importText.trim().split("\n").slice(1);
    for (const line of lines) {
      const [companyName, contactPerson, email, phone, industry, city, country] = line.split(",").map((s) => s.replace(/"/g, "").trim());
      if (companyName) {
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName, contactPerson, email, phone, industry, city, country }),
        });
      }
    }
    setImporting(false);
    setImportOpen(false);
    setImportText("");
    fetchCustomers();
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "customerCode", header: "Code", cell: ({ row }) => (
      <span className="font-mono text-xs text-primary">{row.original.customerCode}</span>
    )},
    { accessorKey: "companyName", header: "Company" },
    { accessorKey: "contactPerson", header: "Contact" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "industry", header: "Industry", cell: ({ row }) => row.original.industry || "—" },
    { id: "counts", header: "Contacts / Opps", cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original._count?.contacts || 0} / {row.original._count?.opportunities || 0}</span>
    )},
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: "", cell: ({ row }) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={(e) => openEdit(row.original, e)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Manage your customer relationships</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Customer</Button>
        </div>
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 rounded-xl" />
          </div>

          {loading ? <TableSkeleton /> : customers.length === 0 ? (
            <EmptyState title="No customers found" action={{ label: "Add Customer", onClick: openCreate }} />
          ) : (
            <>
              <DataTable columns={columns} data={customers} onRowClick={(row) => router.push(`/customers/${row.id}`)} />
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
          <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Company Name</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Paste CSV data with headers: companyName, contactPerson, email, phone, industry, city, country</p>
          <textarea
            className="w-full h-40 rounded-xl border border-border p-3 text-sm font-mono"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="companyName,contactPerson,email,phone,industry,city,country&#10;Acme Corp,John Doe,john@acme.com,+1234567890,Technology,SF,USA"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing}>{importing ? "Importing..." : "Import"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Customer" description="This will permanently delete the customer and all related data." confirmLabel="Delete" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
