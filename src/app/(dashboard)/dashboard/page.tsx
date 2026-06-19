"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Users, Building2, Target, DollarSign, Calendar, AlertCircle,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Timeline } from "@/components/shared/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";

const DashboardCharts = dynamic(() => import("@/components/dashboard/dashboard-charts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
});

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error || !json.stats) {
          throw new Error(json.error || "Failed to load dashboard data");
        }
        setData(json);
      })
      .catch((err) => {
        setData(null);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
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

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold">Dashboard couldn&apos;t load</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error || "Something went wrong while fetching dashboard data."}
        </p>
        <Button onClick={loadDashboard} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

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

      <DashboardCharts
        funnel={data.funnel}
        revenueChart={data.revenueChart}
        activityChart={data.activityChart}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
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

        <Card className="lg:col-span-2">
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
