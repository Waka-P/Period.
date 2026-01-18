import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSchema } from "@/schemas/workoutSchema";
import { parseISO } from "date-fns";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "アスリートのみ運動記録を作成できます" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validatedData = workoutSchema.parse(body);

    // workoutDate, startTime, endTime を DateTime に変換
    const startDateTime = parseISO(
      `${validatedData.workoutDate}T${validatedData.startTime}:00`,
    );
    const endDateTime = parseISO(
      `${validatedData.workoutDate}T${validatedData.endTime}:00`,
    );
    const workoutDate = parseISO(validatedData.workoutDate);

    const workout = await prisma.workout.create({
      data: {
        id: nanoid(),
        athleteId: session.user.id,
        workoutDate,
        startTime: startDateTime,
        endTime: endDateTime,
        loadLevel: validatedData.loadLevel,
        trainingName: validatedData.trainingName,
        memo: validatedData.memo || null,
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error("Workout creation error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "運動記録の作成に失敗しました" },
      { status: 500 },
    );
  }
}
