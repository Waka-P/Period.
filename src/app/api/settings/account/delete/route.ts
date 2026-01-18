import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "ログインしてください" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    await prisma.$transaction([
      prisma.chatMessage.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
