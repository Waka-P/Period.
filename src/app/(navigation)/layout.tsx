import { UserRole } from "@/generated/prisma/enums";
import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import NavigationWrapper from "./components/NavigationWrapper";
import { PartnerProvider } from "./components/PartnerContext";

export default async function NavigationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const session = await getCachedSession(headersList);
  const currUser = session?.user;
  const userRole = session?.user?.role;

  if (
    !(
      currUser &&
      (userRole === UserRole.ATHLETE || userRole === UserRole.TRAINER)
    )
  ) {
    return <>{children}</>;
  }

  // チャットページで連携確認を行い、連携がない場合のみナビゲーションを非表示
  const partner = await prisma.trainerAthletePartner.findFirst({
    where: { OR: [{ athleteId: currUser.id }, { trainerId: currUser.id }] },
  });

  // 未読メッセージ数を取得
  const unreadCount = await prisma.chatMessage.count({
    where: {
      receiverId: currUser.id,
      readStatus: "UNREAD",
    },
  });

  return (
    <PartnerProvider
      hasPartner={!!partner}
      role={userRole as "ATHLETE" | "TRAINER"}
    >
      <main id="main-content">{children}</main>
      <NavigationWrapper
        userRole={userRole}
        hasPartner={!!partner}
        unreadCount={unreadCount}
        userId={currUser.id}
      />
    </PartnerProvider>
  );
}
