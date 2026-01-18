import type { Workout } from "@/generated/prisma/client";
import { formatDate } from "date-fns";
import { FaRegClock } from "react-icons/fa6";
import LoadLevelMeter from "./LoadLevelMeter";
import styles from "./WorkoutItem.module.css";

export function WorkoutItem({
  workout,
  theme = "athlete",
  onClick,
}: {
  workout: Workout;
  theme?: "athlete" | "trainer";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.item}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <LoadLevelMeter level={workout.loadLevel} theme={theme} />
      <div className={styles.info}>
        <p className={styles.time}>
          <FaRegClock className={styles.timeIcon} />
          {formatDate(workout.startTime, "HH:mm")} ~{" "}
          {formatDate(workout.endTime, "HH:mm")}
        </p>
        <p className={styles.name}>{workout.trainingName}</p>
        {workout.memo && <p className={styles.memo}>{workout.memo}</p>}
      </div>
    </button>
  );
}
