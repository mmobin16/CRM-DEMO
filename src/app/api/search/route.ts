import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) return NextResponse.json({ results: [] });

    const [leads, customers, opportunities, contacts] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { companyName: { contains: q } },
            { contactPerson: { contains: q } },
            { leadId: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { companyName: { contains: q } },
            { contactPerson: { contains: q } },
            { customerCode: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.opportunity.findMany({
        where: { name: { contains: q } },
        include: { customer: { select: { companyName: true } } },
        take: 5,
      }),
      prisma.contact.findMany({
        where: {
          OR: [{ name: { contains: q } }, { email: { contains: q } }],
        },
        include: { customer: { select: { companyName: true } } },
        take: 5,
      }),
    ]);

    const results = [
      ...leads.map((l) => ({
        id: l.id,
        type: "lead" as const,
        title: l.companyName,
        subtitle: `${l.contactPerson} • ${l.leadId}`,
        href: `/leads/${l.id}`,
      })),
      ...customers.map((c) => ({
        id: c.id,
        type: "customer" as const,
        title: c.companyName,
        subtitle: `${c.contactPerson} • ${c.customerCode}`,
        href: `/customers/${c.id}`,
      })),
      ...opportunities.map((o) => ({
        id: o.id,
        type: "opportunity" as const,
        title: o.name,
        subtitle: o.customer.companyName,
        href: `/opportunities`,
      })),
      ...contacts.map((c) => ({
        id: c.id,
        type: "contact" as const,
        title: c.name,
        subtitle: c.customer.companyName,
        href: `/customers/${c.customerId}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] });
  }
}
