import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor"); // メッセージIDをカーソルとして使用
    const limit = 50;

    const partner = await prisma.trainerAthletePartner.findFirst({
      where: { OR: [{ athleteId: meId }, { trainerId: meId }] },
      include: {
        athlete: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    if (!partner) {
      return NextResponse.json({ success: true, linked: false });
    }

    const isMeAthlete = partner.athleteId === meId;
    const partnerUser = isMeAthlete ? partner.trainer : partner.athlete;

    if (!partnerUser) {
      return NextResponse.json({ success: true, linked: false });
    }

    // チャットルームを取得または作成
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { partnerId: partner.id },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: { id: nanoid(), partnerId: partner.id },
      });
    }

    // カーソルベースでメッセージを取得（古い順に50件）
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoom.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const hasMore = messages.length === limit;
    const nextCursor = hasMore
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

    // 既読更新（自分宛の未読を既読化）- カーソルなし（初回）のみ
    if (!cursor) {
      const updated = await prisma.chatMessage.updateMany({
        where: {
          chatRoomId: chatRoom.id,
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
      }
    }

    const messageList = messages.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      receiverId: m.receiverId,
      createdAt: m.createdAt,
      readStatus: m.readStatus,
    }));

    return NextResponse.json({
      success: true,
      linked: true,
      partnerName: partnerUser.name ?? "",
      partnerId: partnerUser.id,
      messages: messageList,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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

    const { content } = await req.json();
    const text = (content ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { success: false, error: "メッセージを入力してください" },
        { status: 400 },
      );
    }

    const meId = session.user.id;
    const partner = await prisma.trainerAthletePartner.findFirst({
      where: { OR: [{ athleteId: meId }, { trainerId: meId }] },
      include: {
        athlete: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
        chat: { select: { id: true } },
      },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "連携相手がいません" },
        { status: 404 },
      );
    }

    const isMeAthlete = partner.athleteId === meId;
    const receiverId = isMeAthlete ? partner.trainer?.id : partner.athlete?.id;
    if (!receiverId) {
      return NextResponse.json(
        { success: false, error: "連携情報が不正です" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let roomId = partner.chat?.id;
      if (!roomId) {
        const room = await tx.chatRoom.create({
          data: { id: nanoid(), partnerId: partner.id },
        });
        roomId = room.id;
      }
      const msg = await tx.chatMessage.create({
        data: {
          id: nanoid(),
          chatRoomId: roomId,
          senderId: meId,
          receiverId,
          content: text,
        },
      });
      return { chatRoomId: msg.chatRoomId, message: msg };
    });

    // Pusherでリアルタイム配信
    const channelName = `private-chat-${partner.id}`;
    await pusherServer.trigger(channelName, "new-message", {
      id: result.message.id,
      content: result.message.content,
      senderId: result.message.senderId,
      receiverId: result.message.receiverId,
      createdAt: result.message.createdAt.toISOString(),
      readStatus: result.message.readStatus,
    });

    return NextResponse.json({ success: true, chatRoomId: result.chatRoomId });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
