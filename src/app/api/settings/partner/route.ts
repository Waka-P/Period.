import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
        athlete: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    if (!partner) {
      return NextResponse.json({ success: true, linked: false });
    }

    const isMeAthlete = partner.athleteId === meId;
    const partnerUser = isMeAthlete ? partner.trainer : partner.athlete;
    const label = isMeAthlete ? "トレーナーと連携中" : "アスリートと連携中";

    return NextResponse.json({
      success: true,
      linked: true,
      label,
      partnerId: partner.id,
      partnerName: partnerUser?.name ?? "",
    });
  } catch (error) {
    console.error("Get partner error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
