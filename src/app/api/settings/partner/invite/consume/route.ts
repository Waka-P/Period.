import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

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

    const body = await req.json();
    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();
    if (!code || code.length < 6) {
      return NextResponse.json(
        { success: false, error: "招待コードが不正です" },
        { status: 400 },
      );
    }

    const invite = await prisma.partnerInvite.findUnique({
      where: { code },
      include: { issuer: { select: { id: true, role: true } } },
    });
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "招待コードが見つかりません" },
        { status: 404 },
      );
    }
    if (invite.usedAt) {
      return NextResponse.json(
        { success: false, error: "招待コードは既に使用されています" },
        { status: 400 },
      );
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "招待コードの有効期限が切れています" },
        { status: 400 },
      );
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });
    if (!me?.role || !invite.issuer.role) {
      return NextResponse.json(
        { success: false, error: "ロールが設定されていません" },
        { status: 400 },
      );
    }
    if (me.id === invite.issuer.id) {
      return NextResponse.json(
        { success: false, error: "自身のコードは使用できません" },
        { status: 400 },
      );
    }

    // 役割が異なること
    const roles = [me.role, invite.issuer.role].sort().join(":");
    if (roles !== "ATHLETE:TRAINER") {
      return NextResponse.json(
        {
          success: false,
          error: "トレーナーとアスリートの組み合わせのみ連携できます",
        },
        { status: 400 },
      );
    }

    // 既存連携チェック
    const [meExisting, issuerExisting] = await Promise.all([
      prisma.trainerAthletePartner.findFirst({
        where: { OR: [{ athleteId: me.id }, { trainerId: me.id }] },
        select: { id: true },
      }),
      prisma.trainerAthletePartner.findFirst({
        where: {
          OR: [
            { athleteId: invite.issuer.id },
            { trainerId: invite.issuer.id },
          ],
        },
        select: { id: true },
      }),
    ]);
    if (meExisting || issuerExisting) {
      return NextResponse.json(
        { success: false, error: "いずれかのユーザーが既に連携済みです" },
        { status: 400 },
      );
    }

    const athleteId = me.role === "ATHLETE" ? me.id : invite.issuer.id;
    const trainerId = me.role === "TRAINER" ? me.id : invite.issuer.id;

    await prisma.$transaction(async (tx) => {
      await tx.trainerAthletePartner.create({
        data: { id: crypto.randomUUID(), athleteId, trainerId },
      });
      await tx.partnerInvite.update({
        where: { code },
        data: { usedAt: new Date() },
      });
    });

    // Pusherで両ユーザーに連携完了を通知
    await Promise.all([
      pusherServer.trigger(`user-${athleteId}`, "partner:updated", {
        linked: true,
      }),
      pusherServer.trigger(`user-${trainerId}`, "partner:updated", {
        linked: true,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consume invite error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
