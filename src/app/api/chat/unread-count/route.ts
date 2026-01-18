import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const headersList = await headers();
    const session = await getCachedSession(headersList);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.chatMessage.count({
      where: {
        receiverId: userId,
        readStatus: "UNREAD",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
