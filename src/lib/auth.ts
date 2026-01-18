import { prisma } from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { headers as headersType } from "next/headers";
import { cache } from "react";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  experimental: {
    joins: true,
  },
  socialProviders: {
    google: {
      // アカウントの選択を求める
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: true,
      },
      profileCompleted: {
        type: "boolean",
        input: false,
      },
    },
  },
});

// セッション取得をキャッシュする（同一リクエスト内で再利用）
export const getCachedSession = cache(
  async (headers: Awaited<ReturnType<typeof headersType>>) => {
    return auth.api.getSession({ headers });
  },
);
