import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      leadsBySource,
      leadsByStatus,
      monthlyRevenue,
      wonOpportunities,
      newCustomers,
      topCustomers,
    ] = await Promise.all([
      prisma.lead.groupBy({ by: ["source"], _count: true }),
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.opportunity.findMany({
        where: { stage: "WON" },
        select: { expectedRevenue: true, updatedAt: true },
      }),
      prisma.opportunity.count({ where: { stage: "WON" } }),
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { companyName: true, createdAt: true, industry: true },
      }),
      prisma.opportunity.groupBy({
        by: ["customerId"],
        _sum: { expectedRevenue: true },
        orderBy: { _sum: { expectedRevenue: "desc" } },
        take: 5,
      }),
    ]);

    const customerIds = topCustomers.map((t) => t.customerId);
    const customerNames = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, companyName: true },
    });

    const revenueByMonth: Record<string, number> = {};
    monthlyRevenue.forEach((o) => {
      const key = new Date(o.updatedAt).toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      revenueByMonth[key] = (revenueByMonth[key] || 0) + o.expectedRevenue;
    });

    return NextResponse.json({
      leadsBySource: leadsBySource.map((l) => ({
        source: l.source,
        count: l._count,
      })),
      leadsByStatus: leadsByStatus.map((l) => ({
        status: l.status,
        count: l._count,
      })),
      monthlyRevenue: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      })),
      wonOpportunities,
      newCustomers,
      topCustomers: topCustomers.map((t) => ({
        companyName:
          customerNames.find((c) => c.id === t.customerId)?.companyName || "Unknown",
        revenue: t._sum.expectedRevenue || 0,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
