"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Mail, Phone, Upload, FileText, Trash2, UserCheck,
} from "lucide-react";
import { Timeline } from "@/components/shared/timeline";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

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
  updatedAt: string;
  attachments: Document[];
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const fetchLead = async () => {
    const res = await fetch(`/api/leads/${id}`);
    const data = await res.json();
    setLead(data);
    setNotes(data.notes || "");
    setLoading(false);
  };

  useEffect(() => { fetchLead(); }, [id]);

  const saveNotes = async () => {
    setSavingNotes(true);
    await fetch(`/api/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    fetchLead();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        category: "GENERAL",
        url: `/uploads/${file.name}`,
        leadId: id,
      }),
    });
    setUploading(false);
    fetchLead();
    e.target.value = "";
  };

  const deleteAttachment = async (docId: string) => {
    await fetch(`/api/documents?id=${docId}`, { method: "DELETE" });
    fetchLead();
  };

  const handleConvert = async () => {
    const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
    const customer = await res.json();
    setConvertOpen(false);
    if (customer.id) router.push(`/customers/${customer.id}`);
  };

  if (loading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
  if (!lead) return <p className="text-muted-foreground">Lead not found</p>;

  const timelineItems = [
    { id: "created", title: "Lead created", description: `${lead.companyName} added to pipeline`, type: "lead", timestamp: lead.createdAt },
    ...(lead.updatedAt !== lead.createdAt ? [{ id: "updated", title: "Lead updated", description: `Status: ${formatLabel(lead.status)}`, type: "lead", timestamp: lead.updatedAt }] : []),
    ...lead.attachments.map((a) => ({
      id: a.id, title: "Attachment added", description: a.name, type: "lead", timestamp: a.createdAt,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{lead.companyName}</h2>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-sm text-muted-foreground font-mono">{lead.leadId}</p>
          </div>
        </div>
        {lead.status !== "WON" && (
          <Button onClick={() => setConvertOpen(true)}>
            <UserCheck className="h-4 w-4" /> Convert to Customer
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Building2 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Contact Person</p>
                <p className="text-sm font-medium">{lead.contactPerson}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm font-medium">{formatLabel(lead.source)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(lead.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Add notes about this lead..." className="rounded-xl" />
            <Button onClick={saveNotes} disabled={savingNotes} size="sm">
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            <Timeline items={timelineItems} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Attachments</CardTitle>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <span><Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}</span>
              </Button>
              <input id="file-upload" type="file" className="hidden" onChange={handleUpload} />
            </Label>
          </CardHeader>
          <CardContent>
            {lead.attachments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No attachments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lead.attachments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(doc.createdAt)} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteAttachment(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title="Convert to Customer"
        description="Create a customer record from this lead?"
        confirmLabel="Convert"
        onConfirm={handleConvert}
      />
    </div>
  );
}
