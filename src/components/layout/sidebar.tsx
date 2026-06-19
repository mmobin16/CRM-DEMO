"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, UserPlus, Building2, Contact, Target, Calendar,
  CheckSquare, FileText, FolderOpen, BarChart3, Settings, ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { useUIStore } from "@/store";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, UserPlus, Building2, Contact, Target, Calendar,
  CheckSquare, FileText, FolderOpen, BarChart3, Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-secondary text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[70px] items-center justify-between px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-bold text-sm">
              CP
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs font-medium text-white/90">Need help?</p>
            <p className="mt-1 text-xs text-white/60">Contact support for assistance</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  return (
    <button
      onClick={toggleSidebar}
      className="hidden lg:flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
    >
      <ChevronLeft className={cn("h-5 w-5 transition-transform", !sidebarOpen && "rotate-180")} />
    </button>
  );
}
