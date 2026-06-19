import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        customer: { select: { companyName: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ quotations });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...data } = body;
    const count = await prisma.quotation.count();
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; rate: number }) =>
        sum + item.quantity * item.rate,
      0
    );
    const tax = subtotal * 0.1;

    const quotation = await prisma.quotation.create({
      data: {
        number: `QT-${String(count + 1).padStart(5, "0")}`,
        ...data,
        subtotal,
        tax,
        total: subtotal + tax,
        items: {
          create: items.map((item: { item: string; description?: string; quantity: number; rate: number }) => ({
            ...item,
            total: item.quantity * item.rate,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
