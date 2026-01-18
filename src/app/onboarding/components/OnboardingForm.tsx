"use client";

import HalfModal from "@/app/components/HalfModal";
import { ActivityLevel, Gender, UserRole } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth-client";
import {
  type OnboardingFormData,
  onboardingSchema,
} from "@/schemas/onboardingSchema";
import { fetcher } from "@/utils/fetcher";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { FaInfo } from "react-icons/fa6";
import { IoIosArrowBack } from "react-icons/io";
import { IoFemale, IoMale } from "react-icons/io5";

import styles from "./OnboardingForm.module.css";
import RoleCard from "./RoleCard";

type OnboardingFormProps = {
  isRoleSwitchModal?: boolean;
  currentRole?: UserRole;
  onCancel?: () => void;
};

export default function OnboardingForm({
  isRoleSwitchModal = false,
  currentRole,
  onCancel,
}: OnboardingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showGenderInfo, setShowGenderInfo] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const methods = useForm<OnboardingFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: currentRole,
    },
  });
  const {
    control,
    handleSubmit,
    register,
    trigger,
    setValue,
    formState: { errors, isSubmitted },
  } = methods;
  const role = useWatch({
    control: control,
    name: "role",
  });
  const gender = useWatch({
    control: control,
    name: "gender",
  });
  const activityLevel = useWatch({
    control: control,
    name: "activityLevel",
  });
  const canSubmit = role === "TRAINER" || (role === "ATHLETE" && step === 1);
  const showActionButton = isRoleSwitchModal
    ? !!role && role !== currentRole
    : true;
  const showCancelButton = isRoleSwitchModal
    ? !!role && role === currentRole
    : false;

  const levelBtnText = () => {
    switch (activityLevel) {
      case ActivityLevel.BEGINNER:
        return "初心者";
      case ActivityLevel.INTERMEDIATE:
        return "中級者";
      case ActivityLevel.ADVANCED:
        return "上級者";
      default:
        return "選択してください";
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      if (isRoleSwitchModal) {
        if (data.role === "TRAINER") {
          await fetcher("/api/settings/role", {
            method: "POST",
            body: JSON.stringify({ role: data.role }),
          });
          router.push("/");
          router.refresh();
          return;
        }
        // アスリート切替時、ロール変更とプロフィール更新を同時に実行
        await fetcher("/api/settings/role", {
          method: "POST",
          body: JSON.stringify({
            role: data.role,
            name: data.name,
            gender: data.gender,
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            age: data.age,
            activityLevel: data.activityLevel,
          }),
        });
        router.push("/");
        router.refresh();
        return;
      }

      // 通常
      await fetcher("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push("/");
    } catch (error) {
      console.error("Error during onboarding:", error);
    }
  };

  const handleNext = async () => {
    // トレーナー選択/基本情報入力完了後はフォーム送信
    if (canSubmit) {
      handleSubmit(onSubmit)();
      return;
    }

    const isValid = await trigger("role");
    if (!isValid) return;
    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
  };

  const openGenderInfo = () => {
    setShowGenderInfo(true);
  };

  const openLevelModal = () => {
    setShowLevelModal(true);
  };

  const handleChangeField = () => {
    if (!isSubmitted) return;
    trigger();
  };

  // biome-ignore lint: 初回レンダリング時にユーザー名をセット
  useEffect(() => {
    const setName = async () => {
      const { data: session } = await authClient.getSession();
      if (!session?.user?.name) {
        setValue("name", "", {
          shouldValidate: true,
        });
      } else {
        setValue("name", session.user.name, { shouldValidate: true });
      }
    };
    setName();
  }, []);
  // biome-ignore lint: activityLevelが選択されたらモーダルを閉じる
  useEffect(() => {
    if (!showLevelModal) return;
    setShowLevelModal(false);
  }, [activityLevel]);

  return (
    <FormProvider {...methods}>
      <form
        className={clsx(
          styles.formWrapper,
          isRoleSwitchModal && styles.modalVariant,
        )}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div
          className={styles.stepsContainer}
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          <div className={styles.step}>
            {isRoleSwitchModal ? (
              <p className={styles.roleSwitchWarning}>
                ロールを切り替えると
                <br />
                パートナー連携が解除されます
              </p>
            ) : (
              <h1 className={styles.title}>あなたはどっち？</h1>
            )}
            <div>
              <RoleCard userRole="ATHLETE" />
              <RoleCard userRole="TRAINER" />
              {errors?.role && (
                <p className={styles.error}>{errors.role.message}</p>
              )}
            </div>
            {showCancelButton && (
              <button
                type="button"
                className={clsx(styles.cancelBtn)}
                onClick={onCancel}
              >
                キャンセル
              </button>
            )}
            {showActionButton && (
              <button
                type="button"
                className={clsx(
                  styles.nextBtn,
                  role === "ATHLETE"
                    ? clsx(styles.athleteBg, styles.athleteColor)
                    : clsx(styles.trainerBg, styles.trainerColor),
                  !role && styles.disabled,
                )}
                onClick={handleNext}
                disabled={!role}
              >
                {role === "TRAINER" ? "始める" : "次へ"}
              </button>
            )}
          </div>
          <div className={styles.step}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.backBtn}
            >
              <IoIosArrowBack />
            </button>
            <h1 className={styles.title}>あなたについて教えてください</h1>
            <div className={styles.formGroup}>
              <label htmlFor="name">お名前</label>
              <input
                type="text"
                id="name"
                {...register("name", {
                  onChange: handleChangeField,
                })}
                placeholder="ピリオドタロー"
                className={styles.formInput}
              />
              {errors?.name && (
                <p className={styles.error}>{errors.name.message}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <p className={styles.genderLabel}>
                <span>性別</span>
                {/* TODO：文字をアイコンに変更(アイコンライブラリ選定) */}
                <button
                  type="button"
                  className={styles.infoBtn}
                  onClick={openGenderInfo}
                >
                  <FaInfo />
                </button>
              </p>
              <div className={styles.genderOptions}>
                <label
                  className={clsx(
                    styles.genderOption,
                    gender === "MALE" && styles.active,
                  )}
                >
                  <input
                    type="radio"
                    id="male"
                    {...register("gender", {
                      onChange: handleChangeField,
                    })}
                    value={Gender.MALE}
                    className={styles.hidden}
                  />
                  <span className={styles.genderIcon}>
                    <IoMale />
                  </span>
                  <p className={styles.genderLabel}>男性</p>
                </label>
                <label
                  className={clsx(
                    styles.genderOption,
                    gender === "FEMALE" && styles.active,
                  )}
                >
                  <input
                    type="radio"
                    id="female"
                    {...register("gender", {
                      onChange: handleChangeField,
                    })}
                    value={Gender.FEMALE}
                    className={styles.hidden}
                  />
                  <span className={styles.genderIcon}>
                    <IoFemale />
                  </span>
                  <p className={styles.genderLabel}>女性</p>
                </label>
              </div>
              {errors?.gender && (
                <p className={styles.error}>{errors.gender.message}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="heightCm">身長</label>
              <div className={styles.withUnit}>
                <input
                  type="number"
                  id="heightCm"
                  {...register("heightCm", {
                    valueAsNumber: true,
                    onChange: handleChangeField,
                  })}
                  placeholder="170"
                  className={styles.formInput}
                />
                <span>cm</span>
              </div>
              {errors?.heightCm && (
                <p className={styles.error}>{errors.heightCm.message}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="weightKg">体重</label>
              <div className={styles.withUnit}>
                <input
                  type="number"
                  id="weightKg"
                  {...register("weightKg", {
                    valueAsNumber: true,
                    onChange: handleChangeField,
                  })}
                  step={0.1}
                  inputMode="decimal"
                  min={20}
                  max={300}
                  placeholder="63.5"
                  className={styles.formInput}
                />
                <span>kg</span>
              </div>
              {errors?.weightKg && (
                <p className={styles.error}>{errors.weightKg.message}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="age">年齢</label>
              <div className={styles.withUnit}>
                <input
                  type="number"
                  id="age"
                  {...register("age", {
                    valueAsNumber: true,
                    onChange: handleChangeField,
                  })}
                  placeholder="25"
                  className={styles.formInput}
                />
                <span>歳</span>
              </div>
              {errors?.age && (
                <p className={styles.error}>{errors.age.message}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <p className={styles.levelLabel}>運動レベル</p>
              <button
                type="button"
                className={styles.levelBtn}
                onClick={openLevelModal}
              >
                {levelBtnText()}
              </button>
              {errors?.activityLevel && (
                <p className={styles.error}>{errors.activityLevel.message}</p>
              )}
            </div>
            <button
              type="submit"
              className={clsx(
                styles.nextBtn,
                styles.athleteBg,
                styles.athleteColor,
              )}
            >
              始める
            </button>
          </div>
        </div>
      </form>
      <HalfModal
        showModal={showGenderInfo}
        setShowModal={setShowGenderInfo}
        title="性別について"
        description="健康管理やトレーニング計画を最適化するために、生物学的性別を選択してください。"
      >
        <h2 className={styles.genderInfoTitle}>性別について</h2>
        <p className={styles.genderInfoText}>
          健康管理やトレーニング計画を最適化するために、生物学的性別を選択してください。
        </p>
      </HalfModal>
      <HalfModal
        showModal={showLevelModal}
        setShowModal={setShowLevelModal}
        title="最も近い運動レベルを選択"
        description="あなたの日常的な身体活動のレベルを選択してください。"
      >
        <h2 className={styles.levelModalTitle}>最も近い運動レベルを選択</h2>
        <label
          className={clsx(
            styles.levelOption,
            activityLevel === "BEGINNER" && styles.active,
          )}
        >
          <input
            type="radio"
            {...register("activityLevel", {
              onChange: handleChangeField,
            })}
            value={ActivityLevel.BEGINNER}
          />
          <h3 className={styles.levelOptionTitle}>初心者</h3>
          <p className={styles.levelOptionText}>階段で息切れ・週0回運動</p>
        </label>
        <label
          className={clsx(
            styles.levelOption,
            activityLevel === "INTERMEDIATE" && styles.active,
          )}
        >
          <input
            type="radio"
            {...register("activityLevel", {
              onChange: handleChangeField,
            })}
            value={ActivityLevel.INTERMEDIATE}
          />
          <h3 className={styles.levelOptionTitle}>中級者</h3>
          <p className={styles.levelOptionText}>週2回は運動する</p>
        </label>
        <label
          className={clsx(
            styles.levelOption,
            activityLevel === "ADVANCED" && styles.active,
          )}
        >
          <input
            type="radio"
            {...register("activityLevel", {
              onChange: handleChangeField,
            })}
            value={ActivityLevel.ADVANCED}
          />
          <h3 className={styles.levelOptionTitle}>上級者</h3>
          <p className={styles.levelOptionText}>ほぼ毎日トレーニング</p>
        </label>
      </HalfModal>
    </FormProvider>
  );
}
