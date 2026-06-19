import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      totalCustomers,
      openOpportunities,
      wonOpportunities,
      lastMonthLeads,
      lastMonthCustomers,
      activities,
      recentActivities,
      leadFunnel,
      monthlyRevenue,
      activityBreakdown,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.customer.count(),
      prisma.opportunity.count({
        where: { stage: { notIn: ["WON", "LOST"] } },
      }),
      prisma.opportunity.findMany({
        where: { stage: "WON" },
        select: { expectedRevenue: true, updatedAt: true },
      }),
      prisma.lead.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.customer.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.activity.findMany({
        where: { date: { gte: now } },
        take: 5,
        orderBy: { date: "asc" },
        include: { customer: { select: { companyName: true } } },
      }),
      prisma.activity.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { companyName: true } } },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.opportunity.findMany({
        where: { stage: "WON" },
        select: { expectedRevenue: true, updatedAt: true },
      }),
      prisma.activity.groupBy({ by: ["type"], _count: true }),
    ]);

    const monthlyRevenueTotal = wonOpportunities.reduce((sum, o) => sum + o.expectedRevenue, 0);

    const revenueByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      revenueByMonth[key] = 0;
    }
    monthlyRevenue.forEach((o) => {
      const key = new Date(o.updatedAt).toLocaleString("en-US", { month: "short" });
      if (key in revenueByMonth) revenueByMonth[key] += o.expectedRevenue;
    });

    const funnelOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON"];
    const funnel = funnelOrder.map((stage) => ({
      stage,
      count: leadFunnel.find((f) => f.status === stage)?._count || 0,
    }));

    const thisMonthLeads = await prisma.lead.count({
      where: { createdAt: { gte: thisMonth } },
    });
    const thisMonthCustomers = await prisma.customer.count({
      where: { createdAt: { gte: thisMonth } },
    });

    return NextResponse.json({
      stats: {
        totalLeads,
        totalCustomers,
        openOpportunities,
        monthlyRevenue: monthlyRevenueTotal,
        leadsGrowth: lastMonthLeads
          ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100)
          : 12,
        customersGrowth: lastMonthCustomers
          ? Math.round(((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
          : 8,
        opportunitiesGrowth: 15,
        revenueGrowth: 22,
      },
      funnel,
      revenueChart: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      activityChart: activityBreakdown.map((a) => ({
        type: a.type,
        count: a._count,
      })),
      upcomingActivities: activities,
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        title: a.subject,
        description: a.customer?.companyName || a.description,
        type: a.type,
        timestamp: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
