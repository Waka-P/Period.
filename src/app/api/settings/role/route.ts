import { ActivityLevel, Gender, UserRole } from "@/generated/prisma/enums";
import type {
  AthleteProfileCreateInput,
  AthleteProfileUpdateInput,
} from "@/generated/prisma/models";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

type Body = {
  role: UserRole;
  // アスリート切替時に任意で更新する項目
  name?: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  activityLevel?: ActivityLevel;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "ログインしてください" },
        { status: 401 },
      );
    }

    const body = (await req.json()) as Body;
    const role = String(body.role).toUpperCase() as UserRole;
    const allowedRoles = Object.values(UserRole);
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "ロールが不正です" },
        { status: 400 },
      );
    }

    if (role === "ATHLETE") {
      if (
        body.gender === undefined ||
        body.heightCm === undefined ||
        body.weightKg === undefined ||
        body.age === undefined ||
        body.activityLevel === undefined
      ) {
        return NextResponse.json(
          { success: false, error: "ATHLETE には全プロフィール項目が必要です" },
          { status: 400 },
        );
      }
    }

    // 任意項目の検証
    let name: string | undefined;
    if (body.name !== undefined) {
      name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { success: false, error: "名前を入力してください" },
          { status: 400 },
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { success: false, error: "名前が長すぎます" },
          { status: 400 },
        );
      }
    }

    const updates: AthleteProfileUpdateInput = {};
    let createData: AthleteProfileCreateInput | undefined;

    if (role === "ATHLETE") {
      const { gender, heightCm, weightKg, age, activityLevel } =
        body as Required<
          Pick<
            Body,
            "gender" | "heightCm" | "weightKg" | "age" | "activityLevel"
          >
        >;

      createData = {
        user: { connect: { id: session.user.id } },
        gender,
        heightCm,
        weightKg,
        age,
        activityLevel,
      };
    }

    if (body.heightCm !== undefined) {
      const n = Number(body.heightCm);
      if (!Number.isInteger(n) || n <= 0 || n > 300) {
        return NextResponse.json(
          { success: false, error: "身長は1〜300の整数で入力してください" },
          { status: 400 },
        );
      }
      updates.heightCm = n;
    }
    if (body.weightKg !== undefined) {
      const n = Number(body.weightKg);
      if (!Number.isFinite(n) || n <= 0 || n > 500) {
        return NextResponse.json(
          { success: false, error: "体重は1〜500の数値で入力してください" },
          { status: 400 },
        );
      }
      updates.weightKg = n;
    }
    if (body.age !== undefined) {
      const n = Number(body.age);
      if (!Number.isInteger(n) || n <= 0 || n > 120) {
        return NextResponse.json(
          { success: false, error: "年齢は1〜120の整数で入力してください" },
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

    const result = await prisma.$transaction(async (tx) => {
      // ロール更新
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: { role },
        select: { id: true, role: true },
      });

      // 名前の更新（指定時）
      if (name !== undefined) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { name },
          select: { id: true },
        });
      }

      // ロール切替時に全パートナー連携を解除
      await tx.trainerAthletePartner.deleteMany({
        where: {
          OR: [{ athleteId: session.user.id }, { trainerId: session.user.id }],
        },
      });

      // ATHLETE切替かつプロフィール項目があればUpsert
      if (role === "ATHLETE") {
        await tx.athleteProfile.upsert({
          where: { userId: session.user.id },
          update: updates,
          // biome-ignore lint/style/noNonNullAssertion: undefinedでないことは保証されているため
          create: createData!,
        });
      }

      return { user };
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Switch role error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
