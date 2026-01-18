"use client";
import type { AthleteProfile, Workout } from "@/generated/prisma/client";
import { judgeConditionSafe, type PhaseType } from "@/lib/training";
import clsx from "clsx";
import {
  addMonths,
  eachDayOfInterval,
  format,
  getMonth,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import styles from "./HorizontalCalendar.module.css";

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  workouts: Workout[];
  athleteProfile?: AthleteProfile;
};

export default function HorizontalDateCalendar({
  selectedDate,
  onSelectDate,
  workouts,
  athleteProfile,
}: Props) {
  const recordedDates = workouts.map((w) => w.workoutDate);
  const today = startOfDay(new Date());

  const todayRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  const days = eachDayOfInterval({
    start: addMonths(today, -3),
    end: addMonths(today, 3),
  });

  // 各日の判定結果をキャッシュ
  const dayResults = days.map((date) => ({
    date,
    result: judgeConditionSafe(workouts, athleteProfile, date),
  }));

  // phaseTypeごとに連続期間を検出
  type PhaseSegment = {
    phaseType: "BUILD" | "REST";
    startIndex: number;
    endIndex: number;
  };

  const phaseSegments: PhaseSegment[] = [];
  let currentPhase: PhaseType | null = null;
  let segmentStart = -1;

  dayResults.forEach(({ result }, index) => {
    const phase = result.phaseType;

    if (phase === "BUILD" || phase === "REST") {
      if (phase === currentPhase) {
        // 同じフェーズが続いている
      } else {
        // 新しいフェーズが始まる
        if (currentPhase && segmentStart >= 0) {
          phaseSegments.push({
            phaseType: currentPhase as "BUILD" | "REST",
            startIndex: segmentStart,
            endIndex: index - 1,
          });
        }
        currentPhase = phase;
        segmentStart = index;
      }
    } else {
      // フェーズが終了
      if (currentPhase && segmentStart >= 0) {
        phaseSegments.push({
          phaseType: currentPhase as "BUILD" | "REST",
          startIndex: segmentStart,
          endIndex: index - 1,
        });
      }
      currentPhase = null;
      segmentStart = -1;
    }
  });

  // 最後のセグメントを追加
  if (currentPhase && segmentStart >= 0) {
    phaseSegments.push({
      phaseType: currentPhase as "BUILD" | "REST",
      startIndex: segmentStart,
      endIndex: days.length - 1,
    });
  }

  type MonthSegment = {
    month: number;
    startIndex: number;
    endIndex: number;
  };

  const monthSegments: MonthSegment[] = [];
  let currentMonth = getMonth(days[0]);
  let monthSegmentStart = 0;

  days.forEach((date, index) => {
    const month = getMonth(date);
    if (month !== currentMonth) {
      monthSegments.push({
        month: currentMonth,
        startIndex: monthSegmentStart,
        endIndex: index - 1,
      });
      currentMonth = month;
      monthSegmentStart = index;
    }
  });

  monthSegments.push({
    month: currentMonth,
    startIndex: monthSegmentStart,
    endIndex: days.length - 1,
  });

  // 初期表示で今日を中央に寄せる
  useEffect(() => {
    todayRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
    });

    if (todayRef.current && scrollRef.current) {
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const buttonRect = todayRef.current.getBoundingClientRect();

      setUnderlineStyle({
        left: buttonRect.left - scrollRect.left + scrollRef.current.scrollLeft,
        width: buttonRect.width,
      });

      // 位置設定後、次のフレームでtransitionを有効化
      requestAnimationFrame(() => {
        setMounted(true);
      });
    }
  }, []);

  // 選択された日付に下線を移動し、スムーズスクロール
  useEffect(() => {
    const selectedButton = buttonRefs.current.get(selectedDate.toISOString());
    if (selectedButton && scrollRef.current) {
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();

      setUnderlineStyle({
        left: buttonRect.left - scrollRect.left + scrollRef.current.scrollLeft,
        width: buttonRect.width,
      });

      selectedButton.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedDate]);

  return (
    <div ref={scrollRef} className={styles.scroll}>
      {/* 月表示 */}
      {monthSegments.map((segment, idx) => {
        const startButton = buttonRefs.current.get(
          days[segment.startIndex].toISOString(),
        );
        const endButton = buttonRefs.current.get(
          days[segment.endIndex].toISOString(),
        );

        if (!startButton || !endButton || !scrollRef.current) return null;

        const scrollRect = scrollRef.current.getBoundingClientRect();
        const startRect = startButton.getBoundingClientRect();
        const endRect = endButton.getBoundingClientRect();

        const left =
          startRect.left - scrollRect.left + scrollRef.current.scrollLeft;
        const width = endRect.right - startRect.left;

        return (
          <div
            // biome-ignore lint: 順序が保証されているため
            key={idx}
            className={styles.monthBar}
            style={{
              left: `${left}px`,
              width: `${width}px`,
            }}
          >
            <span className={styles.monthLabel}>
              {format(days[segment.startIndex], "yyyy年M月", { locale: ja })}
            </span>
          </div>
        );
      })}

      {/* Phase bars */}
      {phaseSegments.map((segment, idx) => {
        const startButton = buttonRefs.current.get(
          days[segment.startIndex].toISOString(),
        );
        const endButton = buttonRefs.current.get(
          days[segment.endIndex].toISOString(),
        );

        if (!startButton || !endButton || !scrollRef.current) return null;

        const scrollRect = scrollRef.current.getBoundingClientRect();
        const startRect = startButton.getBoundingClientRect();
        const endRect = endButton.getBoundingClientRect();

        const left =
          startRect.left - scrollRect.left + scrollRef.current.scrollLeft;
        const width = endRect.right - startRect.left;

        return (
          <div
            // biome-ignore lint: 順序が保証されているため
            key={idx}
            className={clsx(
              styles.phaseBar,
              segment.phaseType === "BUILD"
                ? styles.buildPhase
                : styles.restPhase,
            )}
            style={{
              left: `${left}px`,
              width: `${width}px`,
            }}
          />
        );
      })}

      {days.map((date, i) => {
        const dayResult = dayResults[i].result;
        const currRecords = workouts.filter((r) =>
          isSameDay(r.workoutDate, date),
        );
        const loadLevels = currRecords.map((r) => r.loadLevel);
        const maxLoadLevel = loadLevels.length ? Math.max(...loadLevels) : 0;
        const recorded = recordedDates.some((d) => isSameDay(d, date));
        const todayFlag = isToday(date);
        const loadLvClassName = (recorded: boolean, loadLv: number) => {
          if (!recorded) {
            return "";
          }

          switch (loadLv) {
            case 1:
              return styles.lv1;
            case 2:
              return styles.lv2;
            case 3:
              return styles.lv3;
            case 4:
              return styles.lv4;
            case 5:
              return styles.lv5;
            default:
              return "";
          }
        };
        const dayDotClassName = () => {
          // データ不足の場合はドットなし
          if (dayResult.dayType === "INSUFFICIENT_DATA") {
            return "";
          }

          // 期（BUILD/REST）の場合はバーで表示されるのでドットは不要
          if (
            dayResult.phaseType === "BUILD" ||
            dayResult.phaseType === "REST"
          ) {
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

        return (
          <button
            type="button"
            key={date.toISOString()}
            ref={(el) => {
              if (el) buttonRefs.current.set(date.toISOString(), el);
              if (todayFlag && el) todayRef.current = el;
            }}
            className={styles.day}
            onClick={() => onSelectDate(date)}
          >
            <span className={styles.weekday}>
              {format(date, "EEE", { locale: ja })}
            </span>

            <span
              className={clsx(
                styles.date,
                todayFlag && styles.today,
                loadLvClassName(recorded, maxLoadLevel),
              )}
            >
              {format(date, "d")}
            </span>

            <span className={clsx(styles.dot, dayDotClassName())} />
          </button>
        );
      })}
      <div
        className={clsx(styles.underline, mounted && styles.enableTransition)}
        style={{
          left: `${underlineStyle.left}px`,
          width: `${underlineStyle.width}px`,
        }}
      />
    </div>
  );
}
