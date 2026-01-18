"use client";
import HalfModal from "@/app/components/HalfModal";
import { fetcher } from "@/utils/fetcher";
import clsx from "clsx";
import { useState } from "react";
import { FaAngleRight } from "react-icons/fa6";
import { FiCheckCircle } from "react-icons/fi";
import styles from "./Settings.module.css";

type PartnerLinkBtnProps = {
  isTrainer?: boolean;
  linked?: boolean;
};

export default function PartnerLinkBtn({
  isTrainer,
  linked,
}: PartnerLinkBtnProps) {
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"menu" | "input" | "create" | "done">(
    "menu",
  );
  const [inviteCode, setInviteCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [modalMode, setModalMode] = useState<"link" | "unlink">("link");
  const index =
    view === "menu" ? 0 : view === "input" ? 1 : view === "create" ? 2 : 3;

  return (
    <>
      <button
        type="button"
        className={clsx(styles.settingBtn, linked && styles.unlinkBtn)}
        onClick={() => {
          setModalMode(linked ? "unlink" : "link");
          setShowModal(true);
        }}
        title={linked ? "連携解除の確認" : "パートナー連携を開く"}
      >
        {linked ? "解除する" : "連携する"}
      </button>
      <HalfModal
        showModal={showModal}
        setShowModal={setShowModal}
        title={linked ? "連携解除" : "パートナー連携"}
        description={
          linked ? "連携解除の確認" : "パートナー連携の操作を選択してください"
        }
        modalClassNames={
          isTrainer ? { content: styles.trainerModal } : undefined
        }
      >
        {modalMode === "unlink" ? (
          <div className={styles.deleteCont}>
            <p className={styles.deleteText}>
              パートナーとのデータはすべて消去されます。よろしいですか？
            </p>
            <div className={styles.deleteBtnCont}>
              <button
                type="button"
                className={styles.deleteCancelBtn}
                onClick={() => {
                  setShowModal(false);
                  setModalMode("link");
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={async () => {
                  try {
                    setBusy(true);
                    const res = await fetcher<{
                      success: boolean;
                      error?: string;
                    }>("/api/settings/partner/unlink", { method: "POST" });
                    if (res.success) {
                      window.dispatchEvent(new CustomEvent("partner:updated"));
                      setShowModal(false);
                      setModalMode("link");
                    }
                  } catch (e: any) {
                    setStatus(e?.message ?? "解除に失敗しました");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                解除
              </button>
            </div>
            {status && <p className={styles.info}>{status}</p>}
          </div>
        ) : (
          <>
            <h3 className={styles.LinkModalTitle}>パートナー連携</h3>
            <div className={styles.LinkStepsViewport}>
              <div
                className={styles.LinkStepsContainer}
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {/* メニュー */}
                <div className={styles.LinkStep}>
                  <div className={styles.LinkBtnCont}>
                    <button
                      type="button"
                      className={styles.LinkBtn}
                      aria-label="招待コードを入力する"
                      title="招待コードを入力する"
                      onClick={() => {
                        setStatus("");
                        setInputCode("");
                        setView("input");
                      }}
                    >
                      招待コードを入力する
                      <FaAngleRight />
                    </button>
                    <button
                      type="button"
                      className={styles.LinkBtn}
                      aria-label="招待コードを作成する"
                      title="招待コードを作成する"
                      onClick={async () => {
                        try {
                          setBusy(true);
                          setStatus("");
                          const res = await fetcher<{
                            success: boolean;
                            code?: string;
                            error?: string;
                          }>("/api/settings/partner/invite/create", {
                            method: "POST",
                          });
                          if (res.success && res.code) {
                            setInviteCode(res.code);
                            setView("create");
                          }
                        } catch (e: any) {
                          setStatus(e?.message ?? "生成に失敗しました");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      招待コードを作成する
                      <FaAngleRight />
                    </button>
                  </div>
                </div>

                {/* 入力 */}
                <div className={styles.LinkStep}>
                  <div className={styles.LinkInputCont}>
                    <input
                      className={styles.LinkInput}
                      placeholder="例：ABCD1234"
                      value={inputCode}
                      onChange={(e) =>
                        setInputCode(e.target.value.toUpperCase())
                      }
                      disabled={busy}
                    />
                    <div className={styles.LinkActions}>
                      {status && <p className={styles.LinkError}>{status}</p>}
                      <button
                        type="button"
                        className={styles.settingBtn}
                        onClick={() => setView("menu")}
                        disabled={busy}
                      >
                        戻る
                      </button>
                      <button
                        type="button"
                        className={styles.completeBtn}
                        disabled={busy || !inputCode}
                        onClick={async () => {
                          try {
                            setBusy(true);
                            setStatus("");
                            const res = await fetcher<{
                              success: boolean;
                              error?: string;
                            }>("/api/settings/partner/invite/consume", {
                              method: "POST",
                              body: JSON.stringify({ code: inputCode.trim() }),
                            });
                            if (res.success) {
                              window.dispatchEvent(
                                new CustomEvent("partner:updated"),
                              );
                              setView("done");
                            }
                          } catch (e: any) {
                            setStatus(e?.message ?? "連携に失敗しました");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        連携
                      </button>
                    </div>
                  </div>
                </div>

                {/* 作成 */}
                <div className={styles.LinkStep}>
                  <div className={styles.LinkInputCont}>
                    <p className={styles.info}>
                      以下のコードを
                      <br />
                      パートナーに共有してください
                    </p>
                    <div className={styles.CodeBox}>{inviteCode}</div>
                    <div className={styles.CodeActions}>
                      <button
                        type="button"
                        className={styles.settingBtn}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inviteCode);
                            setCopyStatus("コードをコピーしました");
                            setTimeout(() => setCopyStatus(""), 2000);
                          } catch {
                            setCopyStatus("コピーに失敗しました");
                            setTimeout(() => setCopyStatus(""), 2000);
                          }
                        }}
                      >
                        コードをコピー
                      </button>
                      <button
                        type="button"
                        className={styles.completeBtn}
                        onClick={() => {
                          setShowModal(false);
                          setView("menu");
                          setInviteCode("");
                          setStatus("");
                        }}
                      >
                        完了
                      </button>
                      {copyStatus && (
                        <p className={styles.LinkStatus}>{copyStatus}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 完了 */}
                <div className={styles.LinkStep}>
                  <div className={styles.LinkInputCont}>
                    <p className={styles.info}>連携が完了しました</p>
                    <FiCheckCircle className={styles.DoneIcon} />
                    <div className={styles.LinkActions}>
                      <button
                        type="button"
                        className={styles.settingBtn}
                        onClick={() => {
                          setShowModal(false);
                          setView("menu");
                          setInputCode("");
                          setInviteCode("");
                          setStatus("");
                          setCopyStatus("");
                          setModalMode("link");
                        }}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </HalfModal>
    </>
  );
}
