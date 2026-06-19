"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatCurrency } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";
import { Target, TrendingUp, Users } from "lucide-react";

interface ReportsData {
  leadsBySource: Array<{ source: string; count: number }>;
  leadsByStatus: Array<{ status: string; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  wonOpportunities: number;
  newCustomers: Array<{ companyName: string; createdAt: string; industry?: string }>;
  topCustomers: Array<{ companyName: string; revenue: number }>;
}

const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#EC4899"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Report", "Category", "Value"],
      ...data.leadsBySource.map((l) => ["Leads by Source", formatLabel(l.source), l.count]),
      ...data.leadsByStatus.map((l) => ["Leads by Status", formatLabel(l.status), l.count]),
      ...data.monthlyRevenue.map((m) => ["Monthly Revenue", m.month, m.revenue]),
      ...data.topCustomers.map((c) => ["Top Customer", c.companyName, c.revenue]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.leadsBySource.map((l) => ({ Source: formatLabel(l.source), Count: l.count }))
    ), "Leads by Source");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.leadsByStatus.map((l) => ({ Status: formatLabel(l.status), Count: l.count }))
    ), "Leads by Status");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.monthlyRevenue.map((m) => ({ Month: m.month, Revenue: m.revenue }))
    ), "Revenue");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      data.topCustomers.map((c) => ({ Customer: c.companyName, Revenue: c.revenue }))
    ), "Top Customers");
    XLSX.writeFile(wb, "crm-reports.xlsx");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (!data) return null;

  const totalLeads = data.leadsByStatus.reduce((s, l) => s + l.count, 0);
  const totalRevenue = data.monthlyRevenue.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Analytics and insights across your CRM data</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Total Leads" value={totalLeads} icon={Users} iconColor="bg-blue-100 text-blue-600" />
        <KpiCard title="Won Opportunities" value={data.wonOpportunities} icon={Target} iconColor="bg-emerald-100 text-emerald-600" />
        <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} iconColor="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={100} label={(props) => `${formatLabel(String(props.name ?? ""))}: ${props.value}`}>
                  {data.leadsBySource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, formatLabel(String(name))]} />
                <Legend formatter={(v) => formatLabel(String(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickFormatter={(v) => formatLabel(v)} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip labelFormatter={(l) => formatLabel(String(l))} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.leadsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader><CardTitle>Top Customers by Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="companyName" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
