import { isAfter, parseISO, startOfDay } from "date-fns";
import z from "zod";

export const workoutSchema = z
  .object({
    workoutDate: z.iso.date(),
    startTime: z.iso.time(),
    endTime: z.iso.time(),
    loadLevel: z
      .number()
      .min(1, "負荷は1以上である必要があります")
      .max(5, "負荷は5以下である必要があります"),
    trainingName: z
      .string()
      .min(1, "トレーニング名を入力してください")
      .max(100, "トレーニング名は100字まで入力できます"),
    memo: z.string().max(500, "メモは500字まで入力できます").optional(),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const workoutDateObj = parseISO(data.workoutDate);

    if (isAfter(startOfDay(workoutDateObj), startOfDay(now))) {
      ctx.addIssue({
        code: "custom",
        message: "未来の日付は選択できません",
        path: ["workoutDate"],
      });
    }

    if (data.startTime >= data.endTime) {
      ctx.addIssue({
        code: "custom",
        message: "終了時刻は開始時刻より後である必要があります",
        path: ["endTime"],
      });
    }

    const startDateTime = parseISO(`${data.workoutDate}T${data.startTime}`);
    if (isAfter(startDateTime, now)) {
      ctx.addIssue({
        code: "custom",
        message: "未来の開始時刻は選択できません",
        path: ["startTime"],
      });
    }

    const endDateTime = parseISO(`${data.workoutDate}T${data.endTime}`);
    if (isAfter(endDateTime, now)) {
      ctx.addIssue({
        code: "custom",
        message: "未来の終了時刻は選択できません",
        path: ["endTime"],
      });
    }
  });

export type WorkoutFormData = z.infer<typeof workoutSchema>;
