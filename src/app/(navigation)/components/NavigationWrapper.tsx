"use client";
import type { UserRole } from "@/generated/prisma/enums";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

export default function NavigationWrapper({
  userRole,
  hasPartner,
  unreadCount,
  userId,
}: {
  userRole: UserRole;
  hasPartner: boolean;
  unreadCount: number;
  userId: string;
}) {
  const pathname = usePathname();

  // チャットページかつ、パートナー連携がある場合はナビゲーションを表示しない
  const isChatPage = pathname.startsWith("/chat");
  if (isChatPage && hasPartner) {
    return null;
  }

  return (
    <Navigation userRole={userRole} unreadCount={unreadCount} userId={userId} />
  );
}
