import { Link } from "@tanstack/react-router";
import { Home, Upload, Table, BarChart3, MessageSquare, Sparkles, LogOut, LineChart, ChevronDown, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDataStore } from "@/store/dataStore";
import { useEffect, useState, useRef } from "react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/tables", label: "Tables", icon: Table },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/chat", label: "Chat", icon: MessageSquare },
] as const;

interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
}

export function Sidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { clear } = useDataStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setProfile({
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "User",
          email: u.email ?? "",
          avatar: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user;
        setProfile({
          name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "User",
          email: u.email ?? "",
          avatar: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
        });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    clear();
    await supabase.auth.signOut();
    window.location.href = "/upload";
  };

  const initials = profile
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <aside className="fixed top-4 bottom-4 left-4 z-30 flex w-60 flex-col p-4 rounded-2xl border border-[#1a1a1a]"
        style={{ background: "#050505" }}
      >
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)", boxShadow: "0 0 20px -4px rgba(16,185,129,0.4)" }}
          >
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="logo-shimmer text-sm font-bold leading-none tracking-tight">AutoInsight</div>
            <div className="gradient-text text-[10px] font-semibold tracking-widest uppercase">AI</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "sidebar-link-active" }}
              inactiveProps={{ className: "text-[#666] hover:text-[#ccc]" }}
              className="sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            >
              <Icon className="sidebar-icon h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        {profile && (
          <div ref={menuRef} className="relative mt-2">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#050505] px-3 py-2.5 transition-all hover:border-[#2a2a2a] hover:bg-[#0a0a0a]"
            >
              <div className="relative shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-[#10b981]/30"
                  />
                ) : (
                  <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-black ring-2 ring-[#10b981]/30">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#050505]" />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-semibold truncate text-[#f0f0f0]">{profile.name}</div>
                <div className="text-[10px] text-[#555] truncate">{profile.email}</div>
              </div>

              <ChevronDown className={`h-3 w-3 text-[#555] transition-transform shrink-0 ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-[#1a1a1a] shadow-2xl"
                style={{ background: "#050505" }}
              >
                <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-4 py-3">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-black">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{profile.name}</div>
                    <div className="text-xs text-[#555] truncate">{profile.email}</div>
                  </div>
                </div>

                <div className="px-4 py-2 border-b border-[#1a1a1a]">
                  <div className="flex items-center gap-2 text-xs text-[#555]">
                    <User className="h-3 w-3" />
                    <span>Signed in with Google</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[#ef4444] hover:bg-[#ef4444]/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}