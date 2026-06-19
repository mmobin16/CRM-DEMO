import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      include: { customer: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ opportunities });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const opportunity = await prisma.opportunity.create({ data: body });
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, stage } = body;
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: { stage },
    });
    return NextResponse.json(opportunity);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
  }
}
