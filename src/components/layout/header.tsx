"use client";

import { authClient } from "@/lib/auth";
import { UserButton } from "../auth/user-button";
import { ModeToggle } from "../mode-toggle";
import { SidebarTrigger } from "../ui/sidebar";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const session = authClient.useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname()

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count ?? 0);
        }
      } catch {}
    }
    fetchUnread();
  }, [pathname]);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <SidebarTrigger
        style={{
          opacity: session.data?.session ? 1 : 0,
        }}
        className="border p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      />
      <div className="flex items-center space-x-2">
        <Link href="/notifications" className="relative group">
          <Bell className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 bg-destructive  px-1.5 py-0.5 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Link>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
