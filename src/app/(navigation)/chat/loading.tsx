"use client";
import styles from "../components/chat/Chat.module.css";
import { usePartner } from "../components/PartnerContext";

export default function ChatLoading() {
  const { hasPartner, role } = usePartner();
  const skeletonWidths = [180, 150, 200, 170, 160];

  // パートナー連携が無い場合のローディング
  if (!hasPartner) {
    return (
      <div
        className={styles.container}
        data-role={role === "TRAINER" ? "trainer" : "athlete"}
      >
        <div className={styles.header}>チャット</div>
        <div className={styles.col}>
          <ul className={styles.loading}>
            <li className={styles.loadingDot}></li>
            <li className={styles.loadingDot}></li>
            <li className={styles.loadingDot}></li>
          </ul>
        </div>
      </div>
    );
  }

  // パートナー連携がある場合のローディング
  return (
    <div
      className={styles.skeletonContainer}
      data-role={role === "TRAINER" ? "trainer" : "athlete"}
    >
      <div className={styles.header}>
        <div className={styles.skeletonHeaderText} />
      </div>
      <div className={styles.messages}>
        {skeletonWidths.map((width, i) => (
          <div
            // biome-ignore lint: 順番が変わることはないためindexでkeyを付与
            key={i}
            className={`${styles.skeletonWrapper} ${
              i % 2 === 0 ? styles.skeletonLeft : styles.skeletonRight
            }`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              className={`${styles.skeletonBubble} ${
                i % 2 === 0
                  ? styles.skeletonBubbleLeft
                  : styles.skeletonBubbleRight
              }`}
            >
              <div
                className={styles.skeletonContent}
                style={{ width: `${width}px` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.inputBar}>
        <div className={styles.skeletonInput} />
        <div className={styles.skeletonSendBtn} />
      </div>
    </div>
  );
}
