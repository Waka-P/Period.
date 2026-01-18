import { ActivityLevel, Gender } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "ログインしてください" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const updates: Partial<{
      heightCm: number;
      weightKg: number;
      age: number;
      activityLevel: ActivityLevel;
      gender: Gender;
    }> = {};

    if (body.heightCm !== undefined) {
      const n = Number(body.heightCm);
      if (!Number.isInteger(n) || n < 50 || n > 300) {
        return NextResponse.json(
          { success: false, error: "身長は50〜300の整数で入力してください" },
          { status: 400 },
        );
      }
      updates.heightCm = n;
    }

    if (body.weightKg !== undefined) {
      const n = Number(body.weightKg);
      if (!Number.isFinite(n) || n < 20 || n > 300) {
        return NextResponse.json(
          { success: false, error: "体重は20〜300の数値で入力してください" },
          { status: 400 },
        );
      }
      updates.weightKg = n;
    }

    if (body.age !== undefined) {
      const n = Number(body.age);
      if (!Number.isInteger(n) || n < 5 || n > 120) {
        return NextResponse.json(
          { success: false, error: "年齢は5〜120の整数で入力してください" },
          { status: 400 },
        );
      }
      updates.age = n;
    }

    if (body.activityLevel !== undefined) {
      const val = String(body.activityLevel).toUpperCase();
      const allowed = Object.values(ActivityLevel);
      if (!allowed.includes(val as ActivityLevel)) {
        return NextResponse.json(
          { success: false, error: "運動レベルが不正です" },
          { status: 400 },
        );
      }
      updates.activityLevel = val as ActivityLevel;
    }

    if (body.gender !== undefined) {
      const val = String(body.gender).toUpperCase();
      const allowed = Object.values(Gender);
      if (!allowed.includes(val as Gender)) {
        return NextResponse.json(
          { success: false, error: "性別が不正です" },
          { status: 400 },
        );
      }
      updates.gender = val as Gender;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "更新対象がありません" },
        { status: 400 },
      );
    }

    // プロフィールの存在確認
    const profile = await prisma.athleteProfile.findUnique({
      where: { userId: session.user.id },
      select: { userId: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "アスリートプロフィールがありません" },
        { status: 400 },
      );
    }

    const updated = await prisma.athleteProfile.update({
      where: { userId: session.user.id },
      data: updates,
      select: {
        heightCm: true,
        weightKg: true,
        age: true,
        activityLevel: true,
        gender: true,
      },
    });

    return NextResponse.json({ success: true, athleteProfile: updated });
  } catch (error) {
    console.error("Update athlete profile error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
