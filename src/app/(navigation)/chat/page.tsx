import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FaUserCog } from "react-icons/fa";
import Chat from "../components/chat/Chat";
import styles from "../components/chat/Chat.module.css";

export default async function ChatPage() {
  const session = await getCachedSession(await headers());

  if (!session) {
    redirect("/login");
  }

  const meId = session.user.id;
  const role = session.user.role as "ATHLETE" | "TRAINER";

  // 連携状態をサーバーサイドで確認
  const partner = await prisma.trainerAthletePartner.findFirst({
    where: { OR: [{ athleteId: meId }, { trainerId: meId }] },
    include: {
      athlete: { select: { id: true, name: true } },
      trainer: { select: { id: true, name: true } },
    },
  });

  if (!partner) {
    return (
      <div
        className={styles.container}
        data-role={role === "TRAINER" ? "trainer" : "athlete"}
      >
        <div className={styles.header}>チャット</div>
        <div className={`${styles.messages} ${styles.noPartner}`}>
          <FaUserCog className={styles.settingsIcon} />
          <p>
            パートナーがいません。
            <br />
            <a href="/settings" className={styles.toSettingLink}>
              設定
            </a>
            から連携してください。
          </p>
        </div>
      </div>
    );
  }

  const isMeAthlete = partner.athleteId === meId;
  const partnerUser = isMeAthlete ? partner.trainer : partner.athlete;

  if (!partnerUser) {
    return (
      <div
        className={styles.container}
        data-role={role === "TRAINER" ? "trainer" : "athlete"}
      >
        <div className={styles.header}>チャット</div>
        <div className={`${styles.messages} ${styles.noPartner}`}>
          パートナー情報が見つかりません。
        </div>
      </div>
    );
  }

  // メッセージをサーバーサイドで取得（最新50件）
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { partnerId: partner.id },
  });

  const messages = chatRoom
    ? await prisma.chatMessage.findMany({
        where: { chatRoomId: chatRoom.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  // 古い順に並び替え
  const sortedMessages = messages.reverse();

  return (
    <Chat
      meId={meId}
      role={role}
      partnerId={partner.id}
      partnerName={partnerUser.name ?? ""}
      initialMessages={sortedMessages}
    />
  );
}
