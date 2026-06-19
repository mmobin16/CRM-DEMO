"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Upload, FileText, Trash2, Eye, FolderOpen,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { formatLabel, DOCUMENT_CATEGORIES } from "@/lib/constants";

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  url: string;
  createdAt: string;
  customer?: { companyName: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  CONTRACTS: "bg-purple-100 text-purple-700",
  QUOTATIONS: "bg-blue-100 text-blue-700",
  CUSTOMER_DOCUMENTS: "bg-emerald-100 text-emerald-700",
  GENERAL: "bg-slate-100 text-slate-700",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Document | null>(null);
  const [uploadCategory, setUploadCategory] = useState("GENERAL");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const [allRes, filteredRes] = await Promise.all([
      fetch("/api/documents"),
      fetch(`/api/documents${category ? `?category=${category}` : ""}`),
    ]);
    const allData = await allRes.json();
    const filteredData = await filteredRes.json();
    setAllDocuments(allData.documents || []);
    setDocuments(filteredData.documents || []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

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
        category: uploadCategory,
        url: `/uploads/${file.name}`,
      }),
    });
    setUploading(false);
    fetchDocuments();
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/documents?id=${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchDocuments();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryCounts = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = allDocuments.filter((d) => d.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Central document repository for your organization</p>
        <div className="flex items-center gap-2">
          <Select value={uploadCategory} onValueChange={setUploadCategory}>
            <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Label htmlFor="doc-upload" className="cursor-pointer">
            <Button disabled={uploading} asChild>
              <span><Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}</span>
            </Button>
            <input id="doc-upload" type="file" className="hidden" onChange={handleUpload} />
          </Label>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <CategoryCard
          label="All Documents"
          count={allDocuments.length}
          active={!category}
          onClick={() => setCategory("")}
        />
        {DOCUMENT_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat}
            label={formatLabel(cat)}
            count={categoryCounts[cat] || 0}
            active={category === cat}
            onClick={() => setCategory(cat)}
            colorClass={CATEGORY_ICONS[cat]}
          />
        ))}
      </div>

      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {category ? formatLabel(category) : "All Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState title="No documents found" description="Upload your first document to get started" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc.id} className="group rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={cn("rounded-lg p-2.5", CATEGORY_ICONS[doc.category])}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                      </p>
                      {doc.customer && (
                        <p className="text-xs text-muted-foreground truncate">{doc.customer.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => setPreview(doc)}>
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {preview?.name}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-6 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">{preview.fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {preview.fileType} • {formatFileSize(preview.fileSize)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Category:</span> {formatLabel(preview.category)}</div>
                <div><span className="text-muted-foreground">Uploaded:</span> {formatDate(preview.createdAt)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Document"
        description="Are you sure you want to delete this document?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CategoryCard({
  label, count, active, onClick, colorClass,
}: {
  label: string; count: number; active: boolean; onClick: () => void; colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all hover:shadow-md",
        active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
      )}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", colorClass && "text-inherit")}>{count}</p>
    </button>
  );
}
