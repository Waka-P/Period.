"use client";
import HalfModal from "@/app/components/HalfModal";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Settings.module.css";

export default function DeleteAccountBtn() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <button
        className={styles.deleteConfirmBtn}
        type="button"
        onClick={() => setShowModal(true)}
        title="アカウントを削除"
      >
        アカウント削除
      </button>
      <HalfModal
        showModal={showModal}
        setShowModal={setShowModal}
        title="このアカウントを削除しますか？"
        description="削除すると元に戻せません"
      >
        <div className={styles.deleteCont}>
          <p className={styles.deleteText}>このアカウントを削除しますか？</p>
          <div className={styles.deleteBtnCont}>
            <button
              type="button"
              className={styles.deleteCancelBtn}
              onClick={() => setShowModal(false)}
              aria-label="キャンセル"
              title="キャンセル"
            >
              キャンセル
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={async () => {
                if (deleting) return;
                try {
                  setDeleting(true);
                  const res = await fetcher<{
                    success: boolean;
                    error?: string;
                  }>("/api/settings/account/delete", { method: "DELETE" });
                  if (res.success) {
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          router.push("/login");
                        },
                      },
                    });
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setDeleting(false);
                  setShowModal(false);
                }
              }}
              disabled={deleting}
              aria-label="削除"
              title="削除"
            >
              削除
            </button>
          </div>
        </div>
      </HalfModal>
    </>
  );
}
