"use client";

import { useEffect, useState } from "react";
import {
  Users, Building2, Target, DollarSign, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { KpiCard } from "@/components/shared/kpi-card";
import { Timeline } from "@/components/shared/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";

interface DashboardData {
  stats: {
    totalLeads: number;
    totalCustomers: number;
    openOpportunities: number;
    monthlyRevenue: number;
    leadsGrowth: number;
    customersGrowth: number;
    opportunitiesGrowth: number;
    revenueGrowth: number;
  };
  funnel: { stage: string; count: number }[];
  revenueChart: { month: string; revenue: number }[];
  activityChart: { type: string; count: number }[];
  upcomingActivities: Array<{
    id: string;
    subject: string;
    type: string;
    date: string;
    customer?: { companyName: string };
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    timestamp: string;
  }>;
}

const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6"];
const FUNNEL_COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#10B981"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Leads"
          value={data.stats.totalLeads}
          growth={data.stats.leadsGrowth}
          icon={Users}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KpiCard
          title="Total Customers"
          value={data.stats.totalCustomers}
          growth={data.stats.customersGrowth}
          icon={Building2}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <KpiCard
          title="Open Opportunities"
          value={data.stats.openOpportunities}
          growth={data.stats.opportunitiesGrowth}
          icon={Target}
          iconColor="bg-amber-100 text-amber-600"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(data.stats.monthlyRevenue)}
          growth={data.stats.revenueGrowth}
          icon={DollarSign}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={100}
                  tickFormatter={(v) => formatLabel(v)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [value, "Leads"]}
                  labelFormatter={(label) => formatLabel(String(label))}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.funnel.map((_, index) => (
                    <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.revenueChart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.activityChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tickFormatter={(v) => formatLabel(v)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={(label) => formatLabel(String(label))} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.activityChart.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming activities</p>
              ) : (
                data.upcomingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 text-primary text-xs font-medium">
                      {formatLabel(activity.type).slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.customer?.companyName} • {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={data.recentActivities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
