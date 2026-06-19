import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const count = await prisma.customer.count();
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-${String(count + 1).padStart(4, "0")}`,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
      },
    });

    await prisma.lead.update({ where: { id }, data: { status: "WON" } });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert lead" }, { status: 500 });
  }
}
