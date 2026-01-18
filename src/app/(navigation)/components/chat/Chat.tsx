"use client";

import { getPusherClient } from "@/lib/pusher";
import { fetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaAngleLeft } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import styles from "./Chat.module.css";

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string | Date;
  readStatus: "UNREAD" | "READ";
};

export default function Chat({
  meId,
  role,
  partnerId,
  partnerName,
  initialMessages = [],
}: {
  meId: string;
  role: "ATHLETE" | "TRAINER";
  partnerId: string;
  partnerName: string;
  initialMessages?: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(
    initialMessages.length > 0
      ? initialMessages[0].createdAt instanceof Date
        ? initialMessages[0].createdAt.toISOString()
        : initialMessages[0].createdAt
      : null,
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef<boolean>(true); // 初回は下にスクロール

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 9}px`;
    }
  };

  // 過去のメッセージを読み込む
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !cursor) return;

    setIsLoadingMore(true);
    try {
      const response = await fetcher<{
        success: boolean;
        messages: Message[];
        hasMore: boolean;
        nextCursor: string | null;
      }>(`/api/chat/partner?cursor=${encodeURIComponent(cursor)}`, {
        method: "GET",
      });

      if (response.success && response.messages.length > 0) {
        const el = listRef.current;
        if (el) {
          prevScrollHeightRef.current = el.scrollHeight;
        }

        shouldScrollToBottomRef.current = false; // 過去メッセージ読み込みなので下にスクロールしない
        setMessages((prev) => {
          // 重複を避けるために、既存のメッセージIDをチェック
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = response.messages.filter(
            (m) => !existingIds.has(m.id),
          );
          return [...newMessages, ...prev];
        });
        setHasMore(response.hasMore);
        setCursor(response.nextCursor);
      }
    } catch (e: unknown) {
      console.error("Failed to load more messages:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursor, hasMore, isLoadingMore]);

  // スクロール監視
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      // スクロール位置が上部から200px以内なら次を読み込む
      if (el.scrollTop < 200 && !isLoadingMore && hasMore) {
        loadMoreMessages();
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  // biome-ignore lint: メッセージ追加後、スクロール位置を維持
  useEffect(() => {
    const el = listRef.current;
    if (el && prevScrollHeightRef.current > 0) {
      const newScrollHeight = el.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      el.scrollTop += scrollDiff;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  // Pusherでリアルタイム受信
  useEffect(() => {
    if (!partnerId) return;

    const pusher = getPusherClient();
    const channelName = `private-chat-${partnerId}`;

    // 既存のチャンネルがあればそれを使用、なければ購読
    let channel = pusher.channel(channelName);
    if (!channel) {
      channel = pusher.subscribe(channelName);
    }

    // 既存のバインドを一旦クリア
    channel.unbind("new-message");
    channel.unbind("messages-read");

    // 新しいメッセージを受信
    channel.bind("new-message", async (data: Message) => {
      shouldScrollToBottomRef.current = true; // 新メッセージなので下にスクロール
      setMessages((prev) => {
        // 重複チェック
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });

      // 自分宛のメッセージなら即座に既読にする
      if (data.receiverId === meId) {
        try {
          await fetcher("/api/chat/partner/read", {
            method: "PATCH",
          });
        } catch (error) {
          console.error("Failed to mark as read:", error);
        }
      }
    });

    // 既読通知を受信
    channel.bind("messages-read", (data: { readerId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === meId && m.receiverId === data.readerId
            ? { ...m, readStatus: "READ" as const }
            : m,
        ),
      );
    });

    return () => {
      channel.unbind("new-message");
      channel.unbind("messages-read");
      // チャンネルはunsubscribeしない（シングルトンなので再利用）
    };
  }, [partnerId, meId]);

  // チャット表示時はナビゲーションを表示しない
  useEffect(() => {
    document.body.classList.add("hide-nav-chat");
    return () => {
      document.body.classList.remove("hide-nav-chat");
    };
  }, []);

  // 初回表示時に未読を既読化
  useEffect(() => {
    const markReadOnMount = async () => {
      try {
        await fetcher("/api/chat/partner/read", { method: "PATCH" });
      } catch (error) {
        console.error("Failed to mark as read on mount:", error);
      }
    };
    markReadOnMount();
  }, [partnerId, meId]);

  // biome-ignore lint: scrollToBottomはuseCallbackでメモ化済み
  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime =
        a.createdAt instanceof Date
          ? a.createdAt.getTime()
          : new Date(a.createdAt).getTime();
      const bTime =
        b.createdAt instanceof Date
          ? b.createdAt.getTime()
          : new Date(b.createdAt).getTime();
      return aTime - bTime;
    });
  }, [messages]);

  const localDateKey = (d: Date) => {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const formatDayLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const key = localDateKey(d);
    const todayKey = localDateKey(today);
    const yestKey = localDateKey(yesterday);
    if (key === todayKey) return "今日";
    if (key === yestKey) return "昨日";
    const youbi = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日(${youbi})`;
  };

  const formatTimeLabel = (d: Date) => {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const send = async () => {
    if (!canSend) return;
    const body = { content: text.trim() };
    setText(""); // 先にクリア
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    try {
      await fetcher("/api/chat/partner", {
        method: "POST",
        body: JSON.stringify(body),
      });
      // Pusherから受信するのでここでは追加しない
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
      setText(body.content); // エラー時は戻す
    }
  };

  return (
    <div
      className={styles.container}
      data-role={role === "TRAINER" ? "trainer" : "athlete"}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          aria-label="戻る"
          onClick={() => {
            try {
              const prev = sessionStorage.getItem("prevNavPath");
              if (prev && prev !== "/chat") {
                router.replace(prev);
                return;
              }
            } catch {}
            if (window.history.length > 1) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
          <FaAngleLeft />
        </button>
        <div className={styles.partnerNameCont}>
          <p className={styles.partnerName}>
            {partnerName ? `${partnerName}` : ""}
          </p>
          <span className={styles.honorific}>さん</span>
        </div>
      </div>
      <div ref={listRef} className={styles.messages}>
        {isLoadingMore && (
          <>
            {[0, 1].map((i) => (
              <div
                key={`skeleton-${i}`}
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
                  style={{ width: i === 0 ? "180px" : "150px" }}
                >
                  <div className={styles.skeletonContent} />
                </div>
              </div>
            ))}
          </>
        )}
        {sortedMessages.map((m, i) => {
          const self = m.senderId === meId;
          const d =
            m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
          const currKey = localDateKey(d);
          const prevKey =
            i > 0
              ? localDateKey(
                  sortedMessages[i - 1].createdAt instanceof Date
                    ? (sortedMessages[i - 1].createdAt as Date)
                    : new Date(sortedMessages[i - 1].createdAt),
                )
              : null;
          const showSeparator = i === 0 || prevKey !== currKey;
          return (
            <div key={m.id}>
              {showSeparator && (
                <div className={styles.daySeparator}>
                  <span className={styles.dayLabel}>{formatDayLabel(d)}</span>
                </div>
              )}
              <div className={styles.messageRow}>
                <div
                  className={`${styles.bubble} ${
                    self ? styles.messageSelf : styles.messageOther
                  }`}
                >
                  <div className={styles.bubbleContent}>
                    {m.content}
                    {self && m.readStatus === "READ" && (
                      <div
                        className={`${styles.readReceipt} ${styles.readReceiptSelf}`}
                      >
                        既読
                      </div>
                    )}
                    <div
                      className={`${styles.timestamp} ${
                        self ? styles.timestampSelf : styles.timestampOther
                      }`}
                    >
                      {formatTimeLabel(d)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.inputBar}>
        <textarea
          ref={textareaRef}
          className={styles.text}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            adjustTextareaHeight();
          }}
          placeholder="メッセージを入力"
          rows={1}
          onKeyDown={(e) => {
            // IME入力中（日本語変換中）は無視
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          className={styles.send}
          onClick={send}
          disabled={!canSend}
        >
          <IoIosSend />
        </button>
      </div>
      {error && (
        <div style={{ color: "#b00020", padding: "0 12px 12px" }}>{error}</div>
      )}
    </div>
  );
}
