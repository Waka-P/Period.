import { ActivityLevel, Gender, UserRole } from "@/generated/prisma/enums";
import { z } from "zod";

const athleteSchema = z.object({
  role: z.literal(UserRole.ATHLETE),
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
  gender: z.enum([Gender.MALE, Gender.FEMALE], {
    error: "性別を選択してください",
  }),
  heightCm: z
    .number("身長を入力してください")
    .int("身長は整数で入力してください")
    .min(50, "身長は50cm以上で入力してください")
    .max(300, "身長は300cm以下で入力してください"),
  weightKg: z
    .number("体重を入力してください")
    .min(20, "体重は20kg以上で入力してください")
    .max(300, "体重は300kg以下で入力してください"),
  age: z
    .number("年齢を入力してください")
    .min(5, "年齢は5歳以上で入力してください")
    .max(120, "年齢は120歳以下で入力してください"),
  activityLevel: z.enum(
    [
      ActivityLevel.BEGINNER,
      ActivityLevel.INTERMEDIATE,
      ActivityLevel.ADVANCED,
    ],
    {
      error: "運動レベルを選択してください",
    },
  ),
});

const trainerSchema = z.object({
  role: z.literal(UserRole.TRAINER),
  name: z.unknown(),
  gender: z.unknown(),
  heightCm: z.unknown(),
  weightKg: z.unknown(),
  age: z.unknown(),
  activityLevel: z.unknown(),
});

export const onboardingSchema = z.discriminatedUnion("role", [
  athleteSchema,
  trainerSchema,
]);

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
