import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
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

    const meId = session.user.id;
    const partner = await prisma.trainerAthletePartner.findFirst({
      where: { OR: [{ athleteId: meId }, { trainerId: meId }] },
      include: { chat: { select: { id: true } } },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "連携が見つかりません" },
        { status: 404 },
      );
    }

    const athleteId = partner.athleteId;
    const trainerId = partner.trainerId;

    await prisma.$transaction(async (tx) => {
      if (partner.chat) {
        await tx.chatMessage.deleteMany({
          where: { chatRoomId: partner.chat.id },
        });
        await tx.chatRoom.delete({ where: { id: partner.chat.id } });
      }
      await tx.trainerAthletePartner.delete({ where: { id: partner.id } });
    });

    // Pusherで両ユーザーに連携解除を通知
    await Promise.all([
      pusherServer.trigger(`user-${athleteId}`, "partner:updated", {
        linked: false,
      }),
      pusherServer.trigger(`user-${trainerId}`, "partner:updated", {
        linked: false,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlink partner error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
