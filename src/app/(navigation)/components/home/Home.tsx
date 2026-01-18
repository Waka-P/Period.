"use client";

import HalfModal from "@/app/components/HalfModal";
import type { AthleteProfile, User, Workout } from "@/generated/prisma/client";
import { judgeConditionSafe } from "@/lib/training";
import { addDays, formatDate, isSameDay, subDays } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";
import ConditionCard from "../ConditionCard";
import { WorkoutItem } from "../WorkoutItem";
import AddWorkoutBtn from "./AddWorkoutBtn";
import styles from "./Home.module.css";
import HorizontalDateCalendar from "./HorizontalCalendar";
import WorkoutForm from "./WorkoutForm";

export default function Home({
  workouts,
  user,
  athleteProfile,
}: {
  workouts: Workout[];
  user: User;
  athleteProfile?: AthleteProfile;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme: "athlete" | "trainer" =
    user?.role === "TRAINER" ? "trainer" : "athlete";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const selectedWorkouts = useMemo(() => {
    return workouts
      .filter((w) => isSameDay(w.workoutDate, selectedDate))
      .sort((a, b) => {
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [workouts, selectedDate]);

  const result = judgeConditionSafe(workouts, athleteProfile, selectedDate);

  // クエリパラメータからworkoutIdを取得して編集モーダルを開く
  useEffect(() => {
    const workoutId = searchParams.get("workoutId");
    if (workoutId) {
      const workout = workouts.find((w) => w.id === workoutId);
      if (workout) {
        setEditingWorkout(workout);
        setSelectedDate(workout.workoutDate);
        setShowEditModal(true);
        // クエリパラメータをクリア
        router.replace("/", { scroll: false });
      }
    }
  }, [searchParams, workouts, router]);

  const handleWorkoutClick = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowEditModal(true);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // 左スワイプで次の日へ
      setSelectedDate((prev) => addDays(prev, 1));
    },
    onSwipedRight: () => {
      // 右スワイプで前の日へ
      setSelectedDate((prev) => subDays(prev, 1));
    },
    trackMouse: true, // マウスドラッグでもスワイプを検知（開発時便利）
  });

  const containerClass = `${theme === "trainer" ? styles.trainerTheme : ""} ${
    theme === "trainer" ? "trainer-theme" : ""
  }`;

  return (
    <div className={containerClass}>
      <HorizontalDateCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        workouts={workouts}
        athleteProfile={athleteProfile}
      />
      <div className={styles.workoutsWrapper} {...handlers}>
        <ConditionCard
          dayType={result.dayType}
          phaseType={result.phaseType}
          streakDays={result.streakDays}
          selectedDate={selectedDate}
          workouts={selectedWorkouts}
          userRole={user.role || "ATHLETE"}
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
      {user?.role === "ATHLETE" && (
        <>
          <AddWorkoutBtn selectedDate={selectedDate} />
          <HalfModal
            showModal={showEditModal}
            setShowModal={setShowEditModal}
            title="運動の記録を編集する"
            description="運動の記録を編集・削除できます"
            modalClassNames={{
              content: styles.formModalContent,
              body: styles.formModalBody,
              handle: styles.formModalHandle,
            }}
          >
            {editingWorkout && (
              <WorkoutForm
                closeFormModal={() => {
                  setShowEditModal(false);
                  setEditingWorkout(null);
                }}
                selectedDate={selectedDate}
                initialWorkout={editingWorkout}
              />
            )}
          </HalfModal>
        </>
      )}
    </div>
  );
}
