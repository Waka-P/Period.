import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    // private-chat- または private-user- で始まるチャンネルのみ許可
    if (
      !channelName.startsWith("private-chat-") &&
      !channelName.startsWith("private-user-")
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid channel" },
        { status: 403 },
      );
    }

    // private-user-チャンネルの場合、自分のチャンネルであることを確認
    if (channelName.startsWith("private-user-")) {
      const userId = channelName.replace("private-user-", "");
      if (userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized channel" },
          { status: 403 },
        );
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
