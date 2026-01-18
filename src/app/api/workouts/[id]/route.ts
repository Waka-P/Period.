import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workoutSchema } from "@/schemas/workoutSchema";
import { parseISO } from "date-fns";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "アスリートのみ運動記録を編集できます" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // 権限チェック
    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!existingWorkout) {
      return NextResponse.json(
        { error: "運動記録が見つかりません" },
        { status: 404 },
      );
    }

    if (existingWorkout.athleteId !== session.user.id) {
      return NextResponse.json(
        { error: "この運動記録を編集する権限がありません" },
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

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        workoutDate,
        startTime: startDateTime,
        endTime: endDateTime,
        loadLevel: validatedData.loadLevel,
        trainingName: validatedData.trainingName,
        memo: validatedData.memo || null,
      },
    });

    return NextResponse.json(workout, { status: 200 });
  } catch (error) {
    console.error("Workout update error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "運動記録の更新に失敗しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "ATHLETE") {
      return NextResponse.json(
        { error: "アスリートのみ運動記録を削除できます" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // 権限チェック
    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!existingWorkout) {
      return NextResponse.json(
        { error: "運動記録が見つかりません" },
        { status: 404 },
      );
    }

    if (existingWorkout.athleteId !== session.user.id) {
      return NextResponse.json(
        { error: "この運動記録を削除する権限がありません" },
        { status: 403 },
      );
    }

    await prisma.workout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Workout delete error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "運動記録の削除に失敗しました" },
      { status: 500 },
    );
  }
}
