import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where = {
      ...(search && {
        OR: [
          { companyName: { contains: search } },
          { contactPerson: { contains: search } },
          { email: { contains: search } },
          { leadId: { contains: search } },
        ],
      }),
      ...(status && { status: status as never }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = await prisma.lead.count();
    const lead = await prisma.lead.create({
      data: {
        leadId: `LD-${String(count + 1).padStart(5, "0")}`,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        source: body.source || "WEBSITE",
        status: body.status || "NEW",
        notes: body.notes,
      },
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Create lead error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
