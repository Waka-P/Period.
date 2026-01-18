import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Settings from "../components/settings/Settings";

export default async function SettingsPage() {
  const session = await getCachedSession(await headers());

  if (!session) {
    redirect("/login");
  }

  // ユーザー情報とアスリートプロフィールを取得
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      athleteProfiles: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const athleteProfile = user.athleteProfiles[0];

  // パートナー情報を取得
  const meId = session.user.id;
  const partner = await prisma.trainerAthletePartner.findFirst({
    where: { OR: [{ athleteId: meId }, { trainerId: meId }] },
    include: {
      athlete: { select: { id: true, name: true } },
      trainer: { select: { id: true, name: true } },
    },
  });

  let partnerInfo: { linked: boolean; label?: string; partnerName?: string } = {
    linked: false,
  };

  if (partner) {
    const isMeAthlete = partner.athleteId === meId;
    const partnerUser = isMeAthlete ? partner.trainer : partner.athlete;
    partnerInfo = {
      linked: true,
      label: isMeAthlete ? "トレーナーと連携中" : "アスリートと連携中",
      partnerName: partnerUser?.name ?? "",
    };
  }

  return (
    <Settings
      user={user}
      athleteProfile={athleteProfile}
      initialPartnerInfo={partnerInfo}
    />
  );
}
