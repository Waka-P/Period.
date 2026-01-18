"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import styles from "./Settings.module.css";

export default function LogoutBtn() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.logoutBtn}
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/login");
            },
          },
        });
      }}
    >
      ログアウト
    </button>
  );
}
