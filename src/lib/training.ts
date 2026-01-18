import type { AthleteProfile, Workout } from "@/generated/prisma/client";
import { ActivityLevel } from "@/generated/prisma/enums";
import { differenceInMinutes, startOfDay, subDays } from "date-fns";
// 'GOOD'：好調日, 'NORMAL'：通常日, 'CAUTION'：いたわり日, 'INSUFFICIENT_DATA'：判定不可（データ不足）
export type DayType = "GOOD" | "NORMAL" | "CAUTION" | "INSUFFICIENT_DATA";

// 'BUILD'：おいこみ期, 'NORMAL'：通常期, 'REST'：休息期, 'INSUFFICIENT_DATA'：判定不可（データ不足）
export type PhaseType = "BUILD" | "NORMAL" | "REST" | "INSUFFICIENT_DATA";

type TrainingGuide =
  | {
      type: "NO_TARGET";
      message: string;
    }
  | {
      type: "PER_TRAINING_DAY";
      weeklyTarget: number;
      trainingDaysPerWeek: number;
      perTrainingDayTarget: number;
    };

function calcSessionLoad(workout: Workout): number {
  const minutes = differenceInMinutes(workout.endTime, workout.startTime);
  // 負荷がマイナスにならないよう安全性チェック
  if (minutes < 0) return 0;
  return minutes * workout.loadLevel;
}
function calcDailyLoads(workouts: Workout[]) {
  const map = new Map<string, number>();

  workouts.forEach((w) => {
    const dayKey = startOfDay(w.workoutDate).toISOString();
    const load = calcSessionLoad(w);

    map.set(dayKey, (map.get(dayKey) ?? 0) + load);
  });

  return map; // key: day ISO, value: dailyLoad
}
function calcAverageLoad(
  dailyLoads: Map<string, number>,
  days: number,
  baseDate: Date,
): number {
  let sum = 0;
  let count = 0;

  for (let i = 0; i < days; i++) {
    const day = startOfDay(subDays(baseDate, i)).toISOString();
    if (dailyLoads.has(day)) {
      // biome-ignore lint: Map.get() の戻り値は undefined ではないことが保証されているため
      sum += dailyLoads.get(day)!;
      count++;
    }
  }

  return count === 0 ? 0 : sum / count;
}
function calcProfileFactor(profile?: AthleteProfile): number {
  if (!profile) return 1.0;

  let factor = 1.0;

  switch (profile.activityLevel) {
    case ActivityLevel.BEGINNER:
      factor *= 0.9;
      break;
    case ActivityLevel.INTERMEDIATE:
      factor *= 1.0;
      break;
    case ActivityLevel.ADVANCED:
      factor *= 1.1;
      break;
  }

  if (profile.age >= 50) factor *= 0.9;
  else if (profile.age >= 40) factor *= 0.95;

  return factor;
}

export function judgeCondition(
  workouts: Workout[],
  profile?: AthleteProfile,
  today = new Date(),
) {
  const dailyLoads = calcDailyLoads(workouts);
  const profileFactor = calcProfileFactor(profile);

  const acute = calcAverageLoad(dailyLoads, 7, today) * profileFactor;
  const chronic = calcAverageLoad(dailyLoads, 28, today) * profileFactor;

  if (chronic === 0) {
    return {
      dayType: "NORMAL" as const,
      phaseType: "NORMAL" as const,
      acute,
      chronic,
      ratio: 0,
    };
  }

  const ratio = acute / chronic;

  // 過去28日間のratioを取得（長期の連続判定のため）
  const ratios = calcRatiosByDay(workouts, profile, 28, today);
  const goodStreak = calcStreak(ratios, "GOOD");
  const cautionStreak = calcStreak(ratios, "CAUTION");

  // DayTypeは今日のratioで判定（ratio=0はデータなしなのNORMAL）
  let dayType: DayType = "NORMAL";
  if (ratio > 0 && ratio < 0.8) dayType = "GOOD";
  else if (ratio > 1.3) dayType = "CAUTION";

  // PhaseTypeは2日以上連続で期として扱う（1日だけの場合はDayTypeのドット表示）
  let phaseType: PhaseType = "NORMAL";
  if (goodStreak >= 2) phaseType = "BUILD";
  else if (cautionStreak >= 2) phaseType = "REST";

  return {
    dayType,
    phaseType,
    acute,
    chronic,
    ratio,
  };
}

function isDataSufficient(workouts: Workout[]): boolean {
  if (workouts.length < 5) return false;

  const days = new Set(
    workouts.map((w) => startOfDay(w.workoutDate).toISOString()),
  );

  return days.size >= 7;
}

export function calcProfileBasedGuide(
  profile?: AthleteProfile,
): TrainingGuide | null {
  if (!profile) return null;

  switch (profile.activityLevel) {
    case "BEGINNER":
      return {
        type: "NO_TARGET",
        message: "まずは日常生活の中で体を動かすことを意識しましょう。",
      };

    case "INTERMEDIATE": {
      const weeklyTarget = 2000;
      const trainingDaysPerWeek = 2;
      return {
        type: "PER_TRAINING_DAY",
        weeklyTarget,
        trainingDaysPerWeek,
        perTrainingDayTarget: weeklyTarget / trainingDaysPerWeek,
      };
    }

    case "ADVANCED": {
      const weeklyTarget = 3000;
      const trainingDaysPerWeek = 7;
      return {
        type: "PER_TRAINING_DAY",
        weeklyTarget,
        trainingDaysPerWeek,
        perTrainingDayTarget: weeklyTarget / trainingDaysPerWeek,
      };
    }
  }
}

function calcRatiosByDay(
  workouts: Workout[],
  profile?: AthleteProfile,
  days = 7,
  today = new Date(),
): number[] {
  const dailyLoads = calcDailyLoads(workouts);
  const profileFactor = calcProfileFactor(profile);
  const ratios: number[] = [];

  for (let i = 0; i < days; i++) {
    const baseDate = subDays(today, i);
    const acute = calcAverageLoad(dailyLoads, 7, baseDate) * profileFactor;
    const chronic = calcAverageLoad(dailyLoads, 28, baseDate) * profileFactor;

    // chronic=0の時も配列に含める（連続判定のため）
    if (chronic === 0) {
      ratios.push(0);
    } else {
      ratios.push(acute / chronic);
    }
  }

  return ratios; // 今日が先頭
}

function calcStreak(ratios: number[], type: "GOOD" | "CAUTION"): number {
  let count = 0;
  for (const r of ratios) {
    // ratio=0（データなし）はスキップ
    if (r === 0) break;

    if (type === "GOOD" && r < 0.8) count++;
    else if (type === "CAUTION" && r > 1.3) count++;
    else break; // 連続でなくなったら終了
  }
  return count;
}

export function judgeConditionSafe(
  workouts: Workout[],
  profile?: AthleteProfile,
  today = new Date(),
) {
  // データ不足判定
  if (!isDataSufficient(workouts)) {
    return {
      dayType: "INSUFFICIENT_DATA" as const,
      phaseType: "INSUFFICIENT_DATA" as const,
      guide: calcProfileBasedGuide(profile),
    };
  }

  const dailyLoads = calcDailyLoads(workouts);
  const profileFactor = calcProfileFactor(profile);

  const acute = calcAverageLoad(dailyLoads, 7, today) * profileFactor;
  const chronic = calcAverageLoad(dailyLoads, 28, today) * profileFactor;

  if (chronic === 0) {
    return {
      dayType: "NORMAL" as const,
      phaseType: "NORMAL" as const,
      acute,
      chronic,
      ratio: 0,
      guide: calcProfileBasedGuide(profile),
    };
  }

  const ratio = acute / chronic;

  // 過去28日間の ratio を取得（長期の連続判定のため）
  const ratios = calcRatiosByDay(workouts, profile, 28, today);
  const goodStreak = calcStreak(ratios, "GOOD");
  const cautionStreak = calcStreak(ratios, "CAUTION");
  const todayIsGood = ratio > 0 && ratio < 0.8;
  const todayIsCaution = ratio > 1.3;

  // 1. streak から phase を先に決める
  let phaseType: PhaseType = "NORMAL";
  if (todayIsGood && goodStreak >= 2) phaseType = "BUILD";
  else if (todayIsCaution && cautionStreak >= 2) phaseType = "REST";

  let dayType: DayType = "NORMAL";

  if (phaseType === "NORMAL") {
    if (ratio > 0 && ratio < 0.8) dayType = "GOOD";
    else if (ratio > 1.3) dayType = "CAUTION";
  }

  return {
    dayType,
    phaseType,
    acute,
    chronic,
    ratio,
    guide: null,
    streakDays:
      phaseType === "BUILD"
        ? goodStreak
        : phaseType === "REST"
          ? cautionStreak
          : 0,
  };
}
