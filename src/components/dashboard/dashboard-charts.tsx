"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { formatLabel } from "@/lib/constants";

const FUNNEL_COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#10B981"];
const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6"];

interface DashboardChartsProps {
  funnel: { stage: string; count: number }[];
  revenueChart: { month: string; revenue: number }[];
  activityChart: { type: string; count: number }[];
}

export default function DashboardCharts({
  funnel,
  revenueChart,
  activityChart,
}: DashboardChartsProps) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnel} layout="vertical">
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
                  {funnel.map((_, index) => (
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
              <AreaChart data={revenueChart}>
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

      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activityChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tickFormatter={(v) => formatLabel(v)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(label) => formatLabel(String(label))} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {activityChart.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
