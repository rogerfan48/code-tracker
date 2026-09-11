"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, CalendarClock, History, LayoutList, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import { useTracker } from "@/components/tracker/tracker-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Wordmark } from "./wordmark";
import s from "./app-shell.module.scss";

const TABS = [
  { href: "/problems", label: "Problems", icon: LayoutList },
  { href: "/due", label: "Due", icon: CalendarClock },
  { href: "/recent", label: "Recent", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const { dueMap } = useTracker();
  let dueCount = 0;
  for (const d of dueMap.values()) if (d.status === "overdue" || d.status === "today") dueCount++;

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={s.brand} aria-label="Code Tracker home">
            <Wordmark />
          </Link>
          <nav className={s.tabs} aria-label="Sections">
            {TABS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className={cn(s.tab, active && s.tabActive)} aria-current={active ? "page" : undefined}>
                  <Icon size={16} aria-hidden />
                  <span>{label}</span>
                  {href === "/due" && dueCount > 0 ? <span className={s.badge}>{dueCount}</span> : null}
                </Link>
              );
            })}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger className={s.user} aria-label="Account menu">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className={s.avatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={s.avatarFallback}>{(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email ?? user.name}</DropdownMenuLabel>
              <div className={s.role}>{user.role}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                <LogOut size={14} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={s.main}>{children}</main>
    </div>
  );
}
