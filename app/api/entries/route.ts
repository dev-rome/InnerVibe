import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createEntrySchema = z.object({
  moodScore: z.number().int().min(1).max(10),
  journalText: z.string().min(1).max(5000),

  occurredAt: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    return v;
  }, z.string().datetime().optional()),
});

export async function GET() {
  try {
    const user = await requireUser();

    const entries = await prisma.entry.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsedBody = createEntrySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { moodScore, journalText, occurredAt } = parsedBody.data;

    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        moodScore,
        journalText,
        occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
