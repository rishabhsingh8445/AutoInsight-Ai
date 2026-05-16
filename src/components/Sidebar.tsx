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
      } else { setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-none">AutoInsight</div>
            <div className="text-[10px] font-semibold text-emerald-500 tracking-widest uppercase">AI</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "sidebar-link-active" }}
            inactiveProps={{ className: "text-gray-500 hover:text-gray-900" }}
            className="sidebar-link flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
          >
            <Icon className="sidebar-icon h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      {profile && (
        <div ref={menuRef} className="relative border-t border-gray-100 p-3">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-gray-50"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-gray-900 truncate">{profile.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{profile.email}</div>
            </div>
            <ChevronDown className={`h-3 w-3 text-gray-400 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{profile.name}</div>
                  <div className="text-xs text-gray-400 truncate">{profile.email}</div>
                </div>
              </div>
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User className="h-3 w-3" />
                  <span>Signed in with Google</span>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}