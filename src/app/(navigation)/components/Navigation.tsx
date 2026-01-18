"use client";
import Link from "@/app/components/Link";
import type { UserRole } from "@/generated/prisma/enums";
import { getPusherClient } from "@/lib/pusher";
import { fetcher } from "@/utils/fetcher";
import clsx from "clsx";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./Navigation.module.css";

const PATHS = ["/", "/calendar", "/chat", "/settings"] as const;
type NavPath = (typeof PATHS)[number];

const NAV_ITEMS = [
  { path: "/" as const, icon: "home", label: "ホーム", width: 80, height: 80 },
  {
    path: "/calendar" as const,
    icon: "calendar",
    label: "カレンダー",
    width: 112,
    height: 96,
  },
  {
    path: "/chat" as const,
    icon: "chat",
    label: "チャット",
    width: 80,
    height: 96,
  },
  {
    path: "/settings" as const,
    icon: "settings",
    label: "設定",
    width: 112,
    height: 96,
  },
] as const;

const getRolePath = (userRole: UserRole): string => {
  return userRole === "ATHLETE" ? "athlete" : "trainer";
};

const getIconPath = (rolePath: string, iconName: string): string => {
  return `/images/nav-icons/${rolePath}/${iconName}.png`;
};

const getRoleStyles = (userRole: UserRole) => {
  const isAthlete = userRole === "ATHLETE";
  return {
    bg: isAthlete ? styles.athleteBg : styles.trainerBg,
    color: isAthlete ? styles.athleteColor : styles.trainerColor,
    border: isAthlete ? styles.athleteBorder : styles.trainerBorder,
    badge: isAthlete ? styles.badgeAthlete : styles.badgeTrainer,
  };
};

export default function Navigation({
  userRole,
  unreadCount = 0,
  userId,
}: {
  userRole: UserRole;
  unreadCount?: number;
  userId: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentUnreadCount, setCurrentUnreadCount] = useState(unreadCount);
  const pathname = usePathname();

  const rolePath = getRolePath(userRole);
  const roleStyles = getRoleStyles(userRole);

  const isActive = (path: NavPath): boolean => pathname === path;

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // 未読数をリアルタイム更新
  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `private-user-${userId}`;

    let channel = pusher.channel(channelName);
    if (!channel) {
      channel = pusher.subscribe(channelName);
    }

    // 既存のバインドをクリア
    channel.unbind("unread-updated");

    // 未読数更新イベントを監視
    channel.bind("unread-updated", (data: { count: number }) => {
      setCurrentUnreadCount(data.count);
    });

    // チャットページから戻ったときに未読数を再取得
    const fetchUnreadCount = async () => {
      try {
        const response = await fetcher<{ count: number }>(
          "/api/chat/unread-count",
          { method: "GET" },
        );
        setCurrentUnreadCount(response.count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    // チャットページでないときに未読数を更新
    if (!pathname.startsWith("/chat")) {
      fetchUnreadCount();
    }

    return () => {
      channel.unbind("unread-updated");
    };
  }, [pathname, userId]);

  return (
    <nav
      className={clsx(styles.navigation, roleStyles.bg, roleStyles.color)}
      id="app-navigation"
      ref={navRef}
    >
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={clsx(
                styles.navItem,
                isActive(item.path) && styles.active,
              )}
              onClick={() => {
                // チャットへ遷移する直前のパスを記録して、戻る時のフォールバックに使う
                try {
                  if (item.path === "/chat") {
                    sessionStorage.setItem("prevNavPath", pathname);
                  }
                } catch {}
              }}
            >
              <div style={{ position: "relative" }}>
                <Image
                  width={item.width}
                  height={item.height}
                  alt={item.label}
                  src={getIconPath(rolePath, item.icon)}
                  className={styles.navIcon}
                />
                {item.path === "/chat" && currentUnreadCount > 0 && (
                  <div className={clsx(styles.badge, roleStyles.badge)}>
                    {currentUnreadCount > 99 ? "99+" : currentUnreadCount}
                  </div>
                )}
              </div>
              <span className={styles.navLabel}>{item.label}</span>
              <div
                className={clsx(
                  styles.indicator,
                  roleStyles.bg,
                  mounted && styles.enableTransition,
                  isActive(item.path) && styles.active,
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
