import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const month = searchParams.get("month") || "";

    const where = {
      ...(type && { type: type as never }),
      ...(month && {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
        },
      }),
    };

    const activities = await prisma.activity.findMany({
      where,
      include: {
        customer: { select: { companyName: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const activity = await prisma.activity.create({ data: body });
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
