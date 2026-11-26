import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import CommandProvider from "../components/command/CommandProvider";
import { isMac } from "../components/command/commands";
import Kbd from "../components/command/Kbd";
import { useLive } from "../context/LiveContext";
import { useAuth } from "../hooks/useAuth";
import { useCommands } from "../hooks/useCommands";

const NAV = [
  { to: "/", label: "Overview", end: true, icon: "M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z" },
  { to: "/nodes", label: "Nodes", icon: "M10 11v6M6 18h8M10 11a3 3 0 100-6 3 3 0 000 6zM4.5 4.5a8 8 0 000 9M15.5 4.5a8 8 0 010 9" },
  { to: "/incidents", label: "Incidents", icon: "M10 3l8 14H2zM10 8v4M10 14.5v.5" },
  { to: "/analytics", label: "Analytics", icon: "M3 17h14M5 14V9M9 14V5M13 14v-3M17 14V7" },
];

const LIVE = {
  live: { label: "Live", dot: "bg-signal text-signal animate-pulse-ring" },
  connecting: { label: "Connecting", dot: "bg-caution" },
  offline: { label: "Reconnecting", dot: "bg-fjord-400" },
};

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <CommandProvider>
      <div className="min-h-screen lg:flex">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-fjord-800 bg-fjord-950/95 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded p-2 text-fjord-300 hover:bg-fjord-800"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
            aria-label="Menu"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </CommandProvider>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="7" className="fill-fjord-800" />
        <path d="M16 17v8M12 25h8" className="stroke-fjord-300" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="14" r="2.5" className="fill-signal" />
        <path d="M10.5 9.5a8 8 0 000 9M21.5 9.5a8 8 0 010 9" className="stroke-signal" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <div className="leading-tight">
        <p className="font-display text-[17px] font-semibold tracking-tight text-fjord-100">Outage Monitor</p>
        <p className="text-xs text-fjord-400">Network operations</p>
      </div>
    </div>
  );
}

function Sidebar({ open, onNavigate }) {
  const { user, canEdit, logout } = useAuth();
  const { status, health } = useLive();
  const { openPalette } = useCommands();
  const navigate = useNavigate();
  const live = LIVE[status] ?? LIVE.offline;
  const downCount = health?.filter((n) => n.status === "DOWN").length ?? 0;

  const handleLogout = () => {
    logout({ redirectToLogin: false });
    navigate("/login", { replace: true });
  };

  return (
    <aside
      id="sidebar"
      className={`${open ? "block" : "hidden"} border-b border-fjord-800 bg-fjord-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0`}
    >
      <div className="hidden px-5 pt-6 pb-8 lg:block">
        <Brand />
      </div>

      <div className="px-3 pt-3 pb-1 lg:pt-0 lg:pb-3">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            openPalette();
          }}
          className="flex h-10 w-full items-center gap-2.5 rounded-md bg-fjord-950/60 px-3 text-sm text-fjord-400 ring-1 ring-fjord-800 ring-inset hover:text-fjord-100 hover:ring-fjord-700"
        >
          <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l3.5 3.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1 text-left">Search</span>
          <span className="hidden items-center gap-1 lg:inline-flex" aria-hidden="true">
            <Kbd>{isMac() ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1 px-3 py-3 lg:py-0">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
                isActive ? "bg-fjord-800 text-fjord-100" : "text-fjord-300 hover:bg-fjord-850 hover:text-fjord-100"
              }`
            }
          >
            <svg viewBox="0 0 20 20" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span className="flex-1">{item.label}</span>
            {item.to === "/nodes" && downCount > 0 ? (
              <span className="rounded bg-outage/15 px-1.5 text-xs font-semibold text-outage" title={`${downCount} down`}>
                {downCount} down
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4 px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 text-sm text-fjord-300" title="Updates arrive automatically while this shows Live">
          <span className={`size-2 rounded-full ${live.dot}`} />
          {live.label}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-fjord-800 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fjord-100">{user?.username ?? "User"}</p>
            <p className="text-xs text-fjord-400">{canEdit ? "Admin" : "Read-only access"}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded px-2 py-1 text-sm text-fjord-400 hover:bg-fjord-800 hover:text-fjord-100"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default MainLayout;
