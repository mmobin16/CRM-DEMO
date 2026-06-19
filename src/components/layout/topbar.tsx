"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/shared/search-bar";
import { useUIStore, useNotificationStore } from "@/store";
import { formatLabel, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode, toggleSidebar } = useUIStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotificationStore();

  const pageTitle =
    NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      ?.title || "Dashboard";

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, [setNotifications]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <SearchBar className="hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount()}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount() > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn("flex flex-col items-start gap-1 p-3 cursor-pointer", !n.read && "bg-accent/50")}
                  onClick={() => markAsRead(n.id)}
                >
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                {session?.user?.name || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>{session?.user?.name}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {session?.user?.email}
              </div>
              {session?.user?.role && (
                <div className="text-xs font-normal text-primary mt-1">
                  {formatLabel(session.user.role)}
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
