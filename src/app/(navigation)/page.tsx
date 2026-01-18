import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { FaUserCog } from "react-icons/fa";
import styles from "./components/calendar/Calendar.module.css";
import Home from "./components/home/Home";

export default async function HomePage() {
  const session = await getCachedSession(await headers());

  // ユーザ情報取得
  const viewer = await prisma.user.findUnique({
    where: { id: session?.user.id || "" },
    include: { athleteProfiles: { take: 1 } },
  });

  if (!viewer) {
    return null;
  }

  const role = viewer.role as "ATHLETE" | "TRAINER";

  // 表示対象（アスリート）を決定
  let subjectAthleteId = viewer.id;
  if (role === "TRAINER") {
    const partner = await prisma.trainerAthletePartner.findFirst({
      where: { trainerId: viewer.id },
    });

    if (!partner) {
      return (
        <div className={styles.noPartnerCont}>
          <div className={styles.noPartner}>
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
    subjectAthleteId = partner.athleteId;
  }

  // 連携アスリートの情報を取得
  const subject = await prisma.user.findUnique({
    where: { id: subjectAthleteId },
    include: { athleteProfiles: { take: 1 } },
  });

  const athleteProfile = subject?.athleteProfiles[0] || undefined;
  const workouts = await prisma.workout.findMany({
    where: { athleteId: subjectAthleteId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Home workouts={workouts} user={viewer} athleteProfile={athleteProfile} />
  );
}
