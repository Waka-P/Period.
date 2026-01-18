import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "ログインしてください" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const name = (body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "名前を入力してください" },
        { status: 400 },
      );
    }
    if (name.length > 50) {
      return NextResponse.json(
        { success: false, error: "名前は50文字以内で入力してください" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Update name error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
