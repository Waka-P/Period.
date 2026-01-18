"use client";
import { useEffect, useState } from "react";
import styles from "./LoadLevelMeter.module.css";

interface Props {
  level: number;
  size?: number;
  theme?: "athlete" | "trainer";
}

export default function LoadLevelMeter({
  level,
  size = 70,
  theme = "athlete",
}: Props) {
  const [mounted, setMounted] = useState(false);

  const progress = level * 20;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const levelColors =
    theme === "trainer"
      ? {
          1: "#bfead0",
          2: "#85d7a5",
          3: "#49c87f",
          4: "#149b4b",
          5: "#005014",
        }
      : {
          1: "#ffc3d5",
          2: "#da9bae",
          3: "#e56b8b",
          4: "#e20039",
          5: "#6d041f",
        };
  // マウント時は0%、その後progressまでアニメーション
  const offset = mounted
    ? circumference - (progress / 100) * circumference
    : circumference;

  useEffect(() => {
    setMounted(true);
  }, []);

  // sizeに応じてフォントサイズを計算
  const levelFontSize = size * 0.4;
  const labelFontSize = size * 0.15;

  return (
    <div
      className={styles.circleContainer}
      style={{ width: size, height: size }}
    >
      <svg
        role="presentation"
        aria-label={`Load level meter showing level ${level}`}
        width={size}
        height={size}
        className={styles.svg}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={levelColors[level as keyof typeof levelColors]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={styles.progressCircle}
        />
      </svg>

      <div className={styles.textContainer}>
        <span
          className={styles.level}
          style={{ fontSize: `${levelFontSize}px` }}
        >
          {level}
        </span>
        <span
          className={styles.label}
          style={{ fontSize: `${labelFontSize}px` }}
        >
          Lv.
        </span>
      </div>
    </div>
  );
}
