"use client";

import HalfModal from "@/app/components/HalfModal";
import type { Workout } from "@/generated/prisma/client";
import { type WorkoutFormData, workoutSchema } from "@/schemas/workoutSchema";
import { fetcher } from "@/utils/fetcher";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, parse, subMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import DatePicker from "./DateTimePicker/DatePicker";
import TimePicker from "./DateTimePicker/TimePicker";
import { LoadLevelBtn } from "./LoadLevelBtn";
import styles from "./WorkoutForm.module.css";

export default function WorkoutForm({
  closeFormModal,
  selectedDate,
  initialWorkout,
}: {
  closeFormModal: () => void;
  selectedDate: Date;
  initialWorkout?: Workout;
}) {
  const now = new Date();
  const thirtyMinutesAgo = subMinutes(now, 30);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const methods = useForm<WorkoutFormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(workoutSchema),
    defaultValues: initialWorkout
      ? {
          workoutDate: format(initialWorkout.workoutDate, "yyyy-MM-dd"),
          startTime: format(initialWorkout.startTime, "HH:mm"),
          endTime: format(initialWorkout.endTime, "HH:mm"),
          loadLevel: initialWorkout.loadLevel,
          trainingName: initialWorkout.trainingName || "トレーニング",
          memo: initialWorkout.memo || "",
        }
      : {
          workoutDate: format(now, "yyyy-MM-dd"),
          startTime: format(thirtyMinutesAgo, "HH:mm"),
          endTime: format(now, "HH:mm"),
          loadLevel: 3,
          trainingName: "トレーニング",
          memo: "",
        },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, dirtyFields },
    trigger,
    watch,
    setValue,
  } = methods;
  const router = useRouter();

  const startTime = watch("startTime");

  useEffect(() => {
    if (startTime && dirtyFields.startTime && !dirtyFields.endTime) {
      const parsedStartTime = parse(startTime, "HH:mm", new Date());
      const endTimeValue = addMinutes(parsedStartTime, 30);
      setValue("endTime", format(endTimeValue, "HH:mm"));
    }
  }, [startTime, setValue, dirtyFields]);

  useEffect(() => {
    // selectedDate に合わせて workoutDate を更新する
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    setValue("workoutDate", formattedDate);
  }, [selectedDate, setValue]);

  const onSubmit = async (data: WorkoutFormData) => {
    try {
      if (initialWorkout) {
        // 編集モード
        await fetcher(`/api/workouts/${initialWorkout.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        // 新規作成モード
        await fetcher("/api/workouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      closeFormModal();
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      alert(error instanceof Error ? error.message : "登録に失敗しました");
    }
  };

  const handleChangeField = () => {
    if (!isSubmitted) return;
    trigger();
  };

  const confirmDelete = async () => {
    if (!initialWorkout) return;

    try {
      await fetcher(`/api/workouts/${initialWorkout.id}`, {
        method: "DELETE",
      });

      triggerRef.current?.click(); // モーダルを閉じる
      closeFormModal();
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.wrapper}>
        <h1 className={styles.title}>
          {initialWorkout ? "運動の記録を編集" : "運動の記録を追加"}
        </h1>
        <div className={styles.formGroup}>
          <p>日付</p>
          <DatePicker name="workoutDate" onChange={handleChangeField} />
          {errors?.workoutDate && (
            <p className={styles.error}>{errors.workoutDate.message}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <p>時間</p>
          <div className={styles.timePickers}>
            <TimePicker name="startTime" onChange={handleChangeField} />
            {" 〜 "}
            <TimePicker name="endTime" onChange={handleChangeField} />
          </div>
          {errors?.startTime && (
            <p className={styles.error}>{errors.startTime.message}</p>
          )}
          {errors?.endTime && (
            <p className={styles.error}>{errors.endTime.message}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <p>負荷</p>
          <LoadLevelBtn onChange={handleChangeField} />
          {errors?.loadLevel && (
            <p className={styles.error}>{errors.loadLevel.message}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="trainingName">トレーニング名</label>
          <input
            type="text"
            id="trainingName"
            {...register("trainingName", {
              onChange: handleChangeField,
            })}
            placeholder="トレーニング名を入力"
            className={styles.formInput}
          />
          {errors?.trainingName && (
            <p className={styles.error}>{errors.trainingName.message}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="memo">メモ</label>
          <textarea
            id="memo"
            {...register("memo", {
              onChange: handleChangeField,
            })}
            placeholder="メモを入力"
            className={styles.formInput}
          />
          {errors?.memo && (
            <p className={styles.error}>{errors.memo.message}</p>
          )}
        </div>
        <button type="submit" className={styles.submitButton}>
          {initialWorkout ? "更新" : "登録"}
        </button>
      </form>
      {initialWorkout && (
        <HalfModal
          title="削除の確認"
          description="本当にこのトレーニングを削除しますか?"
          modalClassNames={{
            content: styles.deleteModalContent,
            handle: styles.deleteModalHandle,
          }}
          isNested
          trigger={
            <button
              type="button"
              className={styles.deleteConfirmBtn}
              ref={triggerRef}
            >
              削除
            </button>
          }
        >
          <div className={styles.deleteModalBody}>
            <p className={styles.deleteWarning}>
              このトレーニングを削除しますか？
            </p>
            <div className={styles.deleteModalButtons}>
              <button
                type="button"
                onClick={() => triggerRef.current?.click()}
                className={styles.deleteCancelBtn}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className={styles.deleteBtn}
              >
                削除
              </button>
            </div>
          </div>
        </HalfModal>
      )}
    </FormProvider>
  );
}
