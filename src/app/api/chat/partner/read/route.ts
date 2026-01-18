import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
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
      include: {
        chat: { select: { id: true } },
      },
    });

    if (!partner?.chat?.id) {
      return NextResponse.json(
        { success: false, error: "チャットルームが見つかりません" },
        { status: 404 },
      );
    }

    // 自分宛の未読メッセージを既読化
    const updated = await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: partner.chat.id,
        receiverId: meId,
        readStatus: "UNREAD",
      },
      data: { readStatus: "READ" },
    });

    // 既読通知をPusherで送信
    if (updated.count > 0) {
      const channelName = `private-chat-${partner.id}`;
      await pusherServer.trigger(channelName, "messages-read", {
        readerId: meId,
      });

      // 自分の未読数を更新
      const newUnreadCount = await prisma.chatMessage.count({
        where: {
          receiverId: meId,
          readStatus: "UNREAD",
        },
      });

      // 自分専用のチャンネルに未読数更新を通知
      const userChannelName = `private-user-${meId}`;
      await pusherServer.trigger(userChannelName, "unread-updated", {
        count: newUnreadCount,
      });
    }

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
