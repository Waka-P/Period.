import { getCachedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FaUserCog } from "react-icons/fa";
import TrainingCalendar from "../components/calendar/Calendar";
import styles from "../components/calendar/Calendar.module.css";

export default async function CalendarPage() {
  const session = await getCachedSession(await headers());

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as "ATHLETE" | "TRAINER";
  let calendarUserId = session.user.id;
  const theme: "athlete" | "trainer" =
    role === "TRAINER" ? "trainer" : "athlete";

  // トレーナーの場合のみパートナーチェック
  if (role === "TRAINER") {
    const meId = session.user.id;
    const partner = await prisma.trainerAthletePartner.findFirst({
      where: { trainerId: meId },
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

    // トレーナー側は連携アスリートのカレンダーを表示
    calendarUserId = partner.athleteId;
  }

  // ワークアウトデータとアスリートプロフィールを取得
  const workouts = await prisma.workout.findMany({
    where: { athleteId: calendarUserId },
    orderBy: { workoutDate: "desc" },
  });

  const athleteProfile = await prisma.athleteProfile.findUnique({
    where: { userId: calendarUserId },
  });

  return (
    <TrainingCalendar
      theme={theme}
      workouts={workouts}
      userRole={role}
      athleteProfile={athleteProfile ?? undefined}
    />
  );
}
