import type { UserRole, Workout } from "@/generated/prisma/client";
import type { DayType, PhaseType } from "@/lib/training";
import clsx from "clsx";
import { isSameDay } from "date-fns";
import { FaPersonRunning } from "react-icons/fa6";
import { MdFreeBreakfast } from "react-icons/md";
import styles from "./ConditionCard.module.css";

interface ConditionCardProps {
  dayType: DayType;
  phaseType: PhaseType;
  streakDays?: number;
  selectedDate: Date;
  workouts: Workout[];
  userRole: UserRole;
}

const getDayText = (dayType: DayType): string => {
  switch (dayType) {
    case "GOOD":
      return "好調日";
    case "CAUTION":
      return "いたわり日";
    default:
      return "";
  }
};

const getPhaseText = (phaseType: PhaseType): string => {
  switch (phaseType) {
    case "BUILD":
      return "おいこみ期";
    case "REST":
      return "休息期";
    default:
      return "";
  }
};

const getWorkoutSummary = (workouts: Workout[]): string => {
  if (workouts.length === 0) return "";

  const totalMinutes = workouts.reduce((sum, w) => {
    const mins = Math.round(
      (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60),
    );
    return sum + mins;
  }, 0);

  const avgLoadLevel =
    workouts.reduce((sum, w) => sum + w.loadLevel, 0) / workouts.length;
  const count = workouts.length;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeStr =
    hours > 0 ? `${hours}時間${mins > 0 ? `${mins}分` : ""}` : `${mins}分`;

  const intensityStr =
    avgLoadLevel >= 4 ? "高負荷" : avgLoadLevel >= 3 ? "中負荷" : "軽負荷";
  const countStr = count > 1 ? `${count}回、` : "";

  return `${countStr}${intensityStr}で${timeStr}のトレーニング`;
};

const getTrainingAdvice = (
  dayType: DayType,
  phaseType: PhaseType,
  date: Date,
  workouts: Workout[],
  userRole: UserRole,
): string => {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  const today = new Date();
  const isToday = isSameDay(date, today);
  const isPast = date < today && !isToday;
  const isFuture = date > today;

  const hasRecords = workouts.length > 0;
  const summary = getWorkoutSummary(workouts);

  const avgLoad = hasRecords
    ? workouts.reduce((sum, w) => sum + w.loadLevel, 0) / workouts.length
    : 0;
  const isOverworking =
    (dayType === "CAUTION" || phaseType === "REST") && avgLoad >= 3;

  const isTrainer = userRole === "TRAINER";

  if (dayType === "GOOD" && phaseType === "BUILD") {
    if (isPast) {
      if (!hasRecords) {
        const athleteMessages = [
          "好調な状態でしたが記録なし。もったいなかったですね。",
          "良い時期でしたが休養。チャンスを逃したかも。",
          "良いコンディションでしたが記録なし。残念です。",
          "トレーニング可能でしたが別の優先事項があったのかも。",
        ];
        const trainerMessages = [
          "選手の好調期でしたが記録なし。次回は積極的な指導を。",
          "良い時期でしたがトレーニングなし。選手と計画を見直しましょう。",
          "好調期を活かせませんでした。次のチャンスを逃さないように。",
          "コンディション良好時でしたが記録なし。計画の再調整を検討しては。",
        ];
        const messages = isTrainer ? trainerMessages : athleteMessages;
        return messages[dayOfYear % messages.length];
      }
      const athleteMessages = [
        `好調でしたね。${summary}。`,
        `良い時期でした。${summary}で充実していましたね。`,
        `良いコンディション。${summary}でした。`,
        `${summary}。調子の良い日でしたね。`,
      ];
      const trainerMessages = [
        `選手の好調期。${summary}で充実したセッションでした。`,
        `良いコンディション活用。${summary}で効果的でしたね。`,
        `${summary}。選手の好調を活かせました。`,
        `好調期を活かした${summary}。良い指導でした。`,
      ];
      const messages = isTrainer ? trainerMessages : athleteMessages;
      return messages[dayOfYear % messages.length];
    }

    if (isFuture) {
      const athleteMessages = [
        "積極的にトレーニングを行うと良いでしょう。",
        "体調が良いと予想されるので負荷を上げてみましょう。",
        "新しいトレーニングに挑戦する好機になりそうです。",
        "長めのトレーニングに適した日になるでしょう。",
      ];
      const trainerMessages = [
        "選手の好調期。強度の高いメニューを計画しましょう。",
        "コンディション良好が予想されます。負荷を上げた指導を。",
        "新しい技術や戦術の習得に最適な時期です。",
        "長時間メニューや高負荷トレーニングの好機です。",
      ];
      const messages = isTrainer ? trainerMessages : athleteMessages;
      return messages[dayOfYear % messages.length];
    }

    if (hasRecords) {
      return isTrainer
        ? `${summary}。選手の好調期を活かせています！`
        : `${summary}。素晴らしいですね！`;
    }

    const athleteMessages = [
      "積極的にトレーニングを行いましょう。",
      "体調が良いので、負荷を上げてみましょう。",
      "新しいトレーニングに挑戦してみましょう。",
      "長めのトレーニングに最適です。",
    ];
    const trainerMessages = [
      "選手の好調期。積極的なメニューを組みましょう。",
      "コンディション良好。高負荷トレーニングの指導を。",
      "新しい技術習得のチャンス。挑戦的なメニューを。",
      "長時間のトレーニングセッションに最適です。",
    ];
    const messages = isTrainer ? trainerMessages : athleteMessages;
    return messages[dayOfYear % messages.length];
  }

  if (dayType === "CAUTION" || phaseType === "REST") {
    if (isPast) {
      if (!hasRecords) {
        const athleteMessages = [
          "休息期。しっかり休めていました。良い判断ですね。",
          "いたわる時期で適切に休養。完璧です。",
          "リカバリー期。記録なしは良い判断でした。",
          "休息優先。正解です。",
        ];
        const trainerMessages = [
          "選手の休息期。適切に休養させました。良い判断です。",
          "リカバリー期に休養。選手のケアができていますね。",
          "休息期の休養は適切でした。選手の体調管理◎。",
          "休息優先の指導。正しい判断でした。",
        ];
        const messages = isTrainer ? trainerMessages : athleteMessages;
        return messages[dayOfYear % messages.length];
      }
      if (isOverworking) {
        const athleteMessages = [
          `休息期でしたが${summary}。無理をしすぎたかも。`,
          `休息期に${summary}。今後は注意しましょう。`,
          `リカバリー期に${summary}は負荷が高すぎました。`,
          `休息期に${summary}。ハードすぎたようです。`,
        ];
        const trainerMessages = [
          `休息期でしたが${summary}。選手に過負荷だったかも。`,
          `休息期に${summary}。今後は負荷管理を見直しましょう。`,
          `リカバリー期に${summary}。強度を抑えるべきでした。`,
          `休息期に${summary}。選手のコンディションに注意を。`,
        ];
        const messages = isTrainer ? trainerMessages : athleteMessages;
        return messages[dayOfYear % messages.length];
      }
      const athleteMessages = [
        `休息期。${summary}で適度に動いていましたね。`,
        `無理せず${summary}。良いですね。`,
        `リカバリー優先で${summary}でした。`,
        `体をいたわりながら${summary}。`,
      ];
      const trainerMessages = [
        `休息期。${summary}で適度な運動量でした。`,
        `無理のない${summary}。適切な指導ですね。`,
        `リカバリー重視で${summary}。良いバランスです。`,
        `選手に配慮した${summary}でした。`,
      ];
      const messages = isTrainer ? trainerMessages : athleteMessages;
      return messages[dayOfYear % messages.length];
    }

    if (isFuture) {
      const athleteMessages = [
        "軽めの運動にとどめると良いでしょう。",
        "無理をせず体を休めることを優先しましょう。",
        "リカバリーに重点を置くことをおすすめします。",
        "ストレッチやヨガで体をほぐしましょう。",
      ];
      const trainerMessages = [
        "選手には軽めのメニューを組みましょう。",
        "無理をさせず、リカバリーを優先した指導を。",
        "アクティブレストやストレッチを中心に計画を。",
        "選手の疲労回復に重点を置いたセッションを。",
      ];
      const messages = isTrainer ? trainerMessages : athleteMessages;
      return messages[dayOfYear % messages.length];
    }

    if (hasRecords) {
      if (isOverworking) {
        return isTrainer
          ? `${summary}。休息期なので選手の負荷を抑えるべきでした。`
          : `${summary}。休息期なので控えめにした方が良いかも。`;
      }
      return isTrainer
        ? `${summary}。適度な運動量で良いバランスです。`
        : `${summary}。無理のない範囲で良いですね。`;
    }

    const athleteMessages = [
      "軽めの運動にとどめましょう。",
      "無理をせず、体を休めることを優先しましょう。",
      "リカバリーに重点を置きましょう。",
      "ストレッチやヨガで体をほぐしましょう。",
    ];
    const trainerMessages = [
      "選手には軽めのメニューを組みましょう。",
      "無理をさせず、休息を優先した指導を。",
      "選手のリカバリーを重視したプランを。",
      "ストレッチやリカバリーセッションを計画しましょう。",
    ];
    const messages = isTrainer ? trainerMessages : athleteMessages;
    return messages[dayOfYear % messages.length];
  }

  // NORMAL
  if (isPast) {
    if (!hasRecords) {
      const athleteMessages = [
        "トレーニングの記録なし。",
        "休養日として過ごしていたようです。",
        "トレーニングなし。",
        "記録なし。リフレッシュできていたでしょうか。",
      ];
      const trainerMessages = [
        "選手のトレーニング記録なし。",
        "休養日だったようです。",
        "トレーニングなし。計画通りでしたか。",
        "記録なし。選手の状態は確認済みですか。",
      ];
      const messages = isTrainer ? trainerMessages : athleteMessages;
      return messages[dayOfYear % messages.length];
    }
    const athleteMessages = [
      `通常通り${summary}。`,
      `体調に注意しながら${summary}。`,
      `バランス良く${summary}。`,
      `順調に${summary}。`,
    ];
    const trainerMessages = [
      `通常通り${summary}でした。`,
      `選手の体調に配慮した${summary}。`,
      `バランスの良い${summary}でしたね。`,
      `順調に${summary}を実施。`,
    ];
    const messages = isTrainer ? trainerMessages : athleteMessages;
    return messages[dayOfYear % messages.length];
  }

  if (isFuture) {
    const athleteMessages = [
      "通常通りのトレーニングを行うと良いでしょう。",
      "体調に注意しながら続けましょう。",
      "バランスの取れたトレーニングを心がけましょう。",
      "いつも通りのペースで進めましょう。",
    ];
    const trainerMessages = [
      "選手には通常メニューを計画しましょう。",
      "選手の体調を確認しながら指導を進めましょう。",
      "バランスの取れたメニューを組みましょう。",
      "いつも通りのペースで指導を進めましょう。",
    ];
    const messages = isTrainer ? trainerMessages : athleteMessages;
    return messages[dayOfYear % messages.length];
  }

  if (hasRecords) {
    return isTrainer
      ? `${summary}。良いペースで指導できていますね！`
      : `${summary}。いいペースですね！`;
  }

  const athleteMessages = [
    "通常通りのトレーニングを行いましょう。",
    "体調に注意しながら続けましょう。",
    "バランスの取れたトレーニングを心がけましょう。",
    "今日も頑張りましょう。",
  ];
  const trainerMessages = [
    "選手には通常のメニューを組みましょう。",
    "選手の体調をチェックしながら指導しましょう。",
    "バランスの取れたプランを立てましょう。",
    "今日も良い指導を心がけましょう。",
  ];
  const messages = isTrainer ? trainerMessages : athleteMessages;
  return messages[dayOfYear % messages.length];
};

export default function ConditionCard({
  dayType,
  phaseType,
  streakDays,
  selectedDate,
  workouts,
  userRole,
}: ConditionCardProps) {
  const dayText = getDayText(dayType);
  const phaseText = getPhaseText(phaseType);
  const hasGoodCondition = dayType === "GOOD" || phaseType === "BUILD";
  const hasCautionCondition = dayType === "CAUTION" || phaseType === "REST";
  const hasPhaseCondition = phaseType === "BUILD" || phaseType === "REST";
  const hasSpecialCondition = hasGoodCondition || hasCautionCondition;
  const advice = getTrainingAdvice(
    dayType,
    phaseType,
    selectedDate,
    workouts,
    userRole,
  );
  const containerClass = `${userRole === "TRAINER" ? styles.trainerTheme : ""} ${
    userRole === "TRAINER" ? "trainer-theme" : ""
  }`;

  return (
    <div className={clsx(styles.conditionCard, containerClass)}>
      {hasSpecialCondition && (
        <span className={styles.conditionIcon}>
          {hasGoodCondition && <FaPersonRunning />}
          {hasCautionCondition && <MdFreeBreakfast />}
        </span>
      )}
      <div className={styles.conditionInfo}>
        {hasSpecialCondition && (
          <p className={styles.conditionText}>
            {!hasPhaseCondition && dayText}
            {phaseText &&
              typeof streakDays === "number" &&
              `${phaseText}${streakDays - 1}日目`}
          </p>
        )}
        <p className={styles.adviceText}>{advice}</p>
      </div>
    </div>
  );
}
