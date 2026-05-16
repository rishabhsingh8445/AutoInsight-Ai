import { Link } from "@tanstack/react-router";
import { Home, Upload, Table, BarChart3, MessageSquare, Sparkles, LogOut, LineChart, ChevronDown, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDataStore } from "@/store/dataStore";
import { useEffect, useState, useRef } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/tables", label: "Tables", icon: Table },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/chat", label: "Chat", icon: MessageSquare },
] as const;

interface UserProfile { name: string; email: string; avatar: string | null; }

export function Sidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { clear } = useDataStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setProfile({ name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "User", email: u.email ?? "", avatar: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user;
        setProfile({ name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "User", email: u.email ?? "", avatar: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null });
      } else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => { setMenuOpen(false); clear(); await supabase.auth.signOut(); window.location.href = "/upload"; };

  const initials = profile ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col"
      style={{ background: "rgba(250,249,246,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid rgba(0,0,0,0.06)" }}>

      {/* Logo */}
      <div className="px-6 pt-7 pb-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
            style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#1a1a1a] leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AutoInsight</div>
            <div className="text-[9px] font-semibold text-emerald-500 tracking-[0.25em] uppercase mt-0.5">AI</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "sidebar-link-active" }}
            inactiveProps={{ className: "text-[#888]" }}
            className="sidebar-link flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium"
          >
            <Icon className="sidebar-icon h-[16px] w-[16px]" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      {profile && (
        <div ref={menuRef} className="relative px-3 pb-4">
          <div className="mb-3" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all hover:bg-black/[0.03]"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>{initials}</div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[11px] font-semibold text-[#1a1a1a] truncate">{profile.name}</div>
            </div>
            <ChevronDown className={`h-3 w-3 text-[#bbb] shrink-0 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-2xl border border-black/[0.06] shadow-lg"
              style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.04]">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>{initials}</div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1a1a1a] truncate">{profile.name}</div>
                  <div className="text-[11px] text-[#aaa] truncate">{profile.email}</div>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50/50 transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}