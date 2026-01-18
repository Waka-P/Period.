import type { UserRole } from "@/generated/prisma/enums";
import type { OnboardingFormData } from "@/schemas/onboardingSchema";
import clsx from "clsx";
import Image from "next/image";
import { useFormContext, useWatch } from "react-hook-form";
import styles from "./RoleCard.module.css";

export default function RoleCard({ userRole }: { userRole: UserRole }) {
  const { register, control } = useFormContext<OnboardingFormData>();
  const isAthlete = userRole === "ATHLETE";
  const cardTitle = isAthlete ? "アスリート" : "トレーナー";
  const cardDesc = isAthlete
    ? "自身のパフォーマンス向上を目指します。トレーニング記録や目標管理が中心です。"
    : "アスリートをサポートします。トレーニング管理が主な役割です。";

  const cardImgAttrs = {
    src: isAthlete ? "/images/athlete.png" : "/images/trainer.png",
    alt: cardTitle,
    width: 1536,
    height: 1024,
  };
  const cardBorder = isAthlete ? styles.athleteBorder : styles.trainerBorder;
  const selectedRole = useWatch({
    name: "role",
    control,
  });

  return (
    <label
      className={clsx(
        styles.card,
        cardBorder,
        selectedRole === userRole && styles.selected,
      )}
    >
      <input type="radio" {...register("role")} value={userRole} />
      <Image className={styles.cardImg} {...cardImgAttrs} />
      <h2 className={styles.cardTitle}>{cardTitle}</h2>
      <p className={styles.cardDesc}>{cardDesc}</p>
    </label>
  );
}
