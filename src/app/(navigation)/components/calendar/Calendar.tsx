"use client";

import HalfModal from "@/app/components/HalfModal";
import type {
  AthleteProfile,
  UserRole,
  Workout,
} from "@/generated/prisma/client";
import { judgeConditionSafe, type PhaseType } from "@/lib/training";
import clsx from "clsx";
import { formatDate, isSameDay, isSameMonth, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useSwipeable } from "react-swipeable";
import ConditionCard from "../ConditionCard";
import { WorkoutItem } from "../WorkoutItem";
import styles from "./Calendar.module.css";
import "./calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

interface Props {
  theme?: "athlete" | "trainer";
  workouts: Workout[];
  userRole: UserRole;
  athleteProfile?: AthleteProfile;
}

type FilterType = "good" | "care" | "heavy" | "rest" | null;

export default function TrainingCalendar({
  theme = "athlete",
  workouts,
  userRole,
  athleteProfile,
}: Props) {
  const router = useRouter();
  const [value, onChange] = useState<Value>(new Date());

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  // フィルターボタンのクリックハンドラー
  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  // 上スワイプでハーフモーダル表示＆左右スワイプで月送り
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      setShowModal(true);
    },
    onSwipedLeft: () => {
      setActiveStartDate((prev) => {
        const next = new Date(prev);
        next.setMonth(prev.getMonth() + 1);
        return next;
      });
    },
    onSwipedRight: () => {
      setActiveStartDate((prev) => {
        const next = new Date(prev);
        next.setMonth(prev.getMonth() - 1);
        return next;
      });
    },
    delta: 20,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // 月のトレーニング統計を計算
  const monthStats = useMemo(() => {
    // その月の記録をフィルター
    const monthWorkouts = workouts.filter((workout) =>
      isSameMonth(workout.workoutDate, activeStartDate),
    );

    // ユニークな日付の数を計算（同じ日に複数のworkoutがあっても1日とカウント）
    const uniqueDates = new Set(
      monthWorkouts.map((workout) => startOfDay(workout.workoutDate).getTime()),
    );
    const trainingDays = uniqueDates.size;

    const averageLoad =
      monthWorkouts.length > 0
        ? (
            monthWorkouts.reduce((sum, workout) => sum + workout.loadLevel, 0) /
            monthWorkouts.length
          ).toFixed(1)
        : "-";

    return {
      trainingDays,
      averageLoad,
    };
  }, [activeStartDate, workouts]);

  // 月の全日付に対する判定結果を計算（前後の月も含める）
  const monthDayResults = useMemo(() => {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();

    // 前月の最後の週と次月の最初の週も含めるため、範囲を拡張
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // カレンダーグリッドの開始日（前月の日付を含む）
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    // カレンダーグリッドの終了日（次月の日付を含む）
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const results = new Map();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const date = startOfDay(new Date(currentDate));
      const result = judgeConditionSafe(workouts, athleteProfile, date);
      results.set(date.getTime(), result);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }, [activeStartDate, workouts, athleteProfile]);

  // phaseTypeごとに連続期間を検出
  type PhaseSegment = {
    phaseType: "BUILD" | "REST";
    startDate: Date;
    endDate: Date;
  };

  const phaseSegments = useMemo(() => {
    const year = activeStartDate.getFullYear();
    const month = activeStartDate.getMonth();

    // 前月の最後の週と次月の最初の週も含める
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const segments: PhaseSegment[] = [];
    let currentPhase: PhaseType | null = null;
    let segmentStart: Date | null = null;

    dates.forEach((date) => {
      const result = monthDayResults.get(date.getTime());
      const phase = result?.phaseType;

      if (phase === "BUILD" || phase === "REST") {
        if (phase === currentPhase) {
          // 同じフェーズが続いている
        } else {
          // 新しいフェーズが始まる
          if (currentPhase && segmentStart) {
            segments.push({
              phaseType: currentPhase as "BUILD" | "REST",
              startDate: segmentStart,
              endDate: new Date(date.getTime() - 24 * 60 * 60 * 1000), // 前日
            });
          }
          currentPhase = phase;
          segmentStart = date;
        }
      } else {
        // フェーズが終了
        if (currentPhase && segmentStart) {
          segments.push({
            phaseType: currentPhase as "BUILD" | "REST",
            startDate: segmentStart,
            endDate: new Date(date.getTime() - 24 * 60 * 60 * 1000), // 前日
          });
        }
        currentPhase = null;
        segmentStart = null;
      }
    });

    // 最後のセグメントを追加
    if (currentPhase && segmentStart) {
      segments.push({
        phaseType: currentPhase as "BUILD" | "REST",
        startDate: segmentStart,
        endDate: dates[dates.length - 1],
      });
    }

    return segments;
  }, [activeStartDate, monthDayResults]);

  const containerClass = `${styles.calendarContainer} ${
    theme === "trainer" ? styles.trainerTheme : ""
  } ${theme === "trainer" ? "trainer-theme" : ""}`;

  // 各日付のカスタムコンテンツをレンダリング
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateTime = startOfDay(date).getTime();
    const dayResult = monthDayResults.get(dateTime);

    // フィルタリング判定
    const shouldShow = () => {
      if (!activeFilter || !dayResult) return true;

      switch (activeFilter) {
        case "good":
          return (
            dayResult.dayType === "GOOD" &&
            dayResult.phaseType !== "BUILD" &&
            dayResult.phaseType !== "REST"
          );
        case "care":
          return (
            dayResult.dayType === "CAUTION" &&
            dayResult.phaseType !== "BUILD" &&
            dayResult.phaseType !== "REST"
          );
        case "heavy":
          return dayResult.phaseType === "BUILD";
        case "rest":
          return dayResult.phaseType === "REST";
        default:
          return true;
      }
    };

    if (!shouldShow()) return null;

    // ドット表示の判定
    const dayDotClassName = () => {
      if (!dayResult) return "";

      // データ不足の場合はドットなし
      if (dayResult.dayType === "INSUFFICIENT_DATA") {
        return "";
      }

      // 期（BUILD/REST）の場合はバーで表示されるのでドットは不要
      if (dayResult.phaseType === "BUILD" || dayResult.phaseType === "REST") {
        return "";
      }

      // 期ではないが、GOOD/CAUTION の日はドット表示
      if (dayResult.dayType === "GOOD") {
        return styles.activityDay;
      }

      if (dayResult.dayType === "CAUTION") {
        return styles.restDay;
      }

      return "";
    };

    // この日が含まれるphase segmentを見つける
    const segment = phaseSegments.find(
      (seg) =>
        date.getTime() >= seg.startDate.getTime() &&
        date.getTime() <= seg.endDate.getTime(),
    );

    return (
      <div className={styles.tileContentWrapper}>
        <span className={clsx(styles.dot, dayDotClassName())} />
        {segment && (
          <span
            className={clsx(
              styles.phaseBar,
              segment.phaseType === "BUILD"
                ? styles.buildPhase
                : styles.restPhase,
              isSameDay(date, segment.startDate) && styles.phaseStart,
              isSameDay(date, segment.endDate) && styles.phaseEnd,
            )}
          />
        )}
      </div>
    );
  };

  // 各タイルに負荷レベルのクラスを追加
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";

    // フィルタリング判定（tileClassNameでも同じロジックを適用）
    const dateTime = startOfDay(date).getTime();
    const dayResult = monthDayResults.get(dateTime);

    if (activeFilter && dayResult) {
      let shouldShow = false;
      switch (activeFilter) {
        case "good":
          shouldShow =
            dayResult.dayType === "GOOD" &&
            dayResult.phaseType !== "BUILD" &&
            dayResult.phaseType !== "REST";
          break;
        case "care":
          shouldShow =
            dayResult.dayType === "CAUTION" &&
            dayResult.phaseType !== "BUILD" &&
            dayResult.phaseType !== "REST";
          break;
        case "heavy":
          shouldShow = dayResult.phaseType === "BUILD";
          break;
        case "rest":
          shouldShow = dayResult.phaseType === "REST";
          break;
      }
      if (!shouldShow) return "filtered-out";
    }

    const currRecords = workouts.filter((r) => isSameDay(r.workoutDate, date));
    const loadLevels = currRecords.map((r) => r.loadLevel);
    const maxLoadLevel = loadLevels.length ? Math.max(...loadLevels) : 0;
    const recorded = currRecords.length > 0;

    if (!recorded) return "";

    switch (maxLoadLevel) {
      case 1:
        return "load-lv1";
      case 2:
        return "load-lv2";
      case 3:
        return "load-lv3";
      case 4:
        return "load-lv4";
      case 5:
        return "load-lv5";
      default:
        return "";
    }
  };

  const selectedWorkouts = useMemo(() => {
    return workouts
      .filter((w) => isSameDay(w.workoutDate, selectedDate))
      .sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [workouts, selectedDate]);

  const result = judgeConditionSafe(workouts, athleteProfile, selectedDate);

  const handleWorkoutClick = (workout: Workout) => {
    router.push(`/?workoutId=${workout.id}`);
  };

  return (
    <>
      <div {...swipeHandlers} className={containerClass}>
        <Calendar
          onChange={onChange}
          value={value}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setActiveStartDate(activeStartDate);
            }
          }}
          formatDay={(_locale, date) => String(date.getDate())}
          onClickDay={(date) => {
            setSelectedDate(date);
            setShowModal(true);
          }}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
        {/* 月集計 */}
        <div className={styles.calendarStats}>
          <div className={styles.stat}>
            <div className={styles.number}>{monthStats.trainingDays}</div>
            <div className={styles.label}>トレーニング日数</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.number}>{monthStats.averageLoad}</div>
            <div className={styles.label}>平均負荷</div>
          </div>
        </div>

        {/* ラベルボタン */}
        <div className={styles.calendarTags}>
          <button
            type="button"
            className={clsx(
              styles.tag,
              activeFilter === "good" && styles.active,
            )}
            onClick={() => handleFilterClick("good")}
          >
            <span className={styles.good} />
            好調日
          </button>
          <button
            type="button"
            className={clsx(
              styles.tag,
              activeFilter === "care" && styles.active,
            )}
            onClick={() => handleFilterClick("care")}
          >
            <span className={styles.care} />
            いたわり日
          </button>
          <button
            type="button"
            className={clsx(
              styles.tag,
              activeFilter === "heavy" && styles.active,
            )}
            onClick={() => handleFilterClick("heavy")}
          >
            <span className={styles.heavy} />
            おいこみ期
          </button>
          <button
            type="button"
            className={clsx(
              styles.tag,
              activeFilter === "rest" && styles.active,
            )}
            onClick={() => handleFilterClick("rest")}
          >
            <span className={styles.rest} />
            休息期
          </button>
        </div>
      </div>

      {/* ハーフモーダル */}
      <HalfModal
        title="日付"
        description="トレーニング詳細"
        showModal={showModal}
        setShowModal={setShowModal}
      >
        <div
          className={clsx(
            styles.modalCont,
            theme === "trainer" && styles.trainerTheme,
            theme === "trainer" && "trainer-theme",
          )}
        >
          <ConditionCard
            dayType={result.dayType}
            phaseType={result.phaseType}
            streakDays={result.streakDays}
            selectedDate={selectedDate}
            workouts={selectedWorkouts}
            userRole={userRole}
          />

          <h2 className={styles.title}>
            {formatDate(selectedDate, "yyyy年MM月dd日")}
          </h2>

          {selectedWorkouts.length === 0 ? (
            <p>記録がありません。</p>
          ) : (
            <ul className={styles.workouts}>
              {selectedWorkouts.map((workout) => (
                <li key={workout.id}>
                  <WorkoutItem
                    workout={workout}
                    theme={theme}
                    onClick={() => handleWorkoutClick(workout)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </HalfModal>
    </>
  );
}
