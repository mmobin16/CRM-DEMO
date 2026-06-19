"use client";

import { useCallback, useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Contact } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContactRecord {
  id: string;
  name: string;
  designation?: string;
  email: string;
  mobile?: string;
  department?: string;
  customer: { companyName: string };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const columns: ColumnDef<ContactRecord>[] = [
    { accessorKey: "name", header: "Name", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {row.original.name.charAt(0)}
        </div>
        <span className="font-medium">{row.original.name}</span>
      </div>
    )},
    { accessorKey: "designation", header: "Designation", cell: ({ row }) => row.original.designation || "—" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "mobile", header: "Mobile", cell: ({ row }) => row.original.mobile || "—" },
    { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department ? <Badge variant="outline">{row.original.department}</Badge> : "—" },
    { id: "customer", header: "Company", cell: ({ row }) => row.original.customer.companyName },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">View and search all contacts across customers</p>

      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {loading ? (
            <TableSkeleton />
          ) : contacts.length === 0 ? (
            <EmptyState icon={<Contact className="h-8 w-8" />} title="No contacts found" description="Contacts are created from customer records" />
          ) : (
            <DataTable columns={columns} data={contacts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
