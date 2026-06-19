"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, FileText, Target, Users,
} from "lucide-react";
import { Timeline } from "@/components/shared/timeline";
import { StatusBadge } from "@/components/shared/status-badge";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";

interface CustomerDetail {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  createdAt: string;
  contacts: Array<{ id: string; name: string; designation?: string; email: string; mobile?: string; department?: string }>;
  opportunities: Array<{ id: string; name: string; stage: string; expectedRevenue: number; probability: number; closingDate: string }>;
  quotations: Array<{ id: string; number: string; status: string; total: number; date: string; validUntil: string; items: Array<{ item: string; quantity: number; rate: number; total: number }> }>;
  documents: Array<{ id: string; name: string; fileType: string; fileSize: number; category: string; createdAt: string }>;
  activities: Array<{ id: string; subject: string; type: string; description?: string; date: string }>;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
  if (!customer) return <p className="text-muted-foreground">Customer not found</p>;

  const timelineItems = customer.activities.map((a) => ({
    id: a.id, title: a.subject, description: a.description, type: a.type, timestamp: a.date,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">{customer.companyName}</h2>
          <p className="text-sm text-muted-foreground font-mono">{customer.customerCode}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({customer.contacts.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({customer.opportunities.length})</TabsTrigger>
          <TabsTrigger value="quotations">Quotations ({customer.quotations.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({customer.documents.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-xl">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Company Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Users className="h-4 w-4" />} label="Contact Person" value={customer.contactPerson} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
                {customer.website && <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={customer.website} />}
                {customer.industry && <InfoRow label="Industry" value={customer.industry} />}
                {(customer.city || customer.country) && (
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={[customer.city, customer.country].filter(Boolean).join(", ")} />
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <StatBox label="Contacts" value={customer.contacts.length} />
                <StatBox label="Opportunities" value={customer.opportunities.length} />
                <StatBox label="Quotations" value={customer.quotations.length} />
                <StatBox label="Documents" value={customer.documents.length} />
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader><CardTitle className="text-base">Revenue Pipeline</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(customer.opportunities.filter((o) => !["WON", "LOST"].includes(o.stage)).reduce((s, o) => s + o.expectedRevenue, 0))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Open pipeline value</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              {customer.contacts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No contacts yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {customer.contacts.map((c) => (
                    <div key={c.id} className="rounded-xl border border-border p-4 space-y-2">
                      <p className="font-medium">{c.name}</p>
                      {c.designation && <p className="text-sm text-muted-foreground">{c.designation}</p>}
                      <p className="text-sm">{c.email}</p>
                      {c.mobile && <p className="text-sm text-muted-foreground">{c.mobile}</p>}
                      {c.department && <Badge variant="outline">{c.department}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              {customer.opportunities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No opportunities yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.opportunities.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2"><Target className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="font-medium">{o.name}</p>
                          <p className="text-sm text-muted-foreground">Close: {formatDate(o.closingDate)} • {o.probability}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(o.expectedRevenue)}</p>
                        <StatusBadge status={o.stage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              {customer.quotations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No quotations yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.quotations.map((q) => (
                    <div key={q.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium font-mono">{q.number}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(q.date)} — Valid until {formatDate(q.validUntil)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(q.total)}</p>
                          <StatusBadge status={q.status} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{q.items.length} line item{q.items.length !== 1 ? "s" : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              {customer.documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No documents yet</p>
              ) : (
                <div className="space-y-2">
                  {customer.documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <div className="rounded-lg bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{formatLabel(d.category)} • {formatDate(d.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <Timeline items={timelineItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      {icon && <span className="text-primary">{icon}</span>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
