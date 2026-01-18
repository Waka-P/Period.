import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// 8桁の英数字（大文字）でコード生成
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
function genCode(): string {
  return nanoid();
}

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

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });
    if (!me?.role) {
      return NextResponse.json(
        { success: false, error: "ロールが設定されていません" },
        { status: 400 },
      );
    }

    // 既に誰かと連携していないかチェック
    const existing = await prisma.trainerAthletePartner.findFirst({
      where: { OR: [{ athleteId: me.id }, { trainerId: me.id }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "既にパートナーと連携しています" },
        { status: 400 },
      );
    }

    // 一意なコード生成（最大5回リトライ）
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const dup = await prisma.partnerInvite.findUnique({ where: { code } });
      if (!dup) break;
      code = genCode();
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間

    await prisma.partnerInvite.create({
      data: {
        id: crypto.randomUUID(),
        code,
        issuerId: me.id,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
