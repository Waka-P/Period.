import type { AthleteProfile } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/schemas/onboardingSchema";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "ログインしてください" },
        { status: 401 },
      );
    }

    // 既にプロフィール設定が完了している場合はエラー
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileCompleted: true, role: true },
    });

    if (existingUser?.profileCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: "プロフィール設定は既に完了しています",
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "不正な入力があります",
          details: validation.error,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // トランザクションでユーザー更新とプロフィール作成を実行
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: data.role,
          profileCompleted: true,
        },
      });

      let athleteProfile: AthleteProfile | null = null;
      if (data.role === "ATHLETE") {
        athleteProfile = await prisma.athleteProfile.create({
          data: {
            userId: session.user.id,
            gender: data.gender,
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            age: data.age,
            activityLevel: data.activityLevel,
          },
        });
      }

      return { user, athleteProfile };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        role: result.user.role,
        profileCompleted: result.user.profileCompleted,
      },
      athleteProfile: result.athleteProfile
        ? {
            gender: result.athleteProfile.gender,
            heightCm: result.athleteProfile.heightCm,
            weightKg: result.athleteProfile.weightKg,
            age: result.athleteProfile.age,
            activityLevel: result.athleteProfile.activityLevel,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
