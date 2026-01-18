import Pusher from "pusher";
import PusherClient from "pusher-js";

// サーバー側
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap3",
  useTLS: true,
});

// クライアント側のシングルトンインスタンス
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (pusherClientInstance) {
    return pusherClientInstance;
  }

  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap3";

  pusherClientInstance = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "",
    {
      cluster,
      authEndpoint: "/api/pusher/auth",
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
      activityTimeout: 120000,
    },
  );

  // 接続エラーをハンドリング
  pusherClientInstance.connection.bind("error", (err: unknown) => {
    console.error("Pusher接続エラー:", err);
  });

  pusherClientInstance.connection.bind("failed", () => {
    console.error("Pusher接続失敗: WebSocket接続を確立できませんでした");
  });

  return pusherClientInstance;
};
