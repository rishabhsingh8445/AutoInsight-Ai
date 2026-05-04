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
    clear(); // Wipe localStorage data on logout
    await supabase.auth.signOut();
    window.location.href = "/upload";
  };

  const initials = profile
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside className="glass-card fixed top-4 bottom-4 left-4 z-30 flex w-60 flex-col p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2">
        <div className="gradient-bg flex h-9 w-9 items-center justify-center rounded-lg">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">AutoInsight</div>
          <div className="gradient-text text-xs font-medium">AI</div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "bg-primary/15 text-foreground border-primary/30" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-white/5 hover:text-foreground border-transparent" }}
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {profile && (
        <div ref={menuRef} className="relative mt-2">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-all hover:bg-white/10"
          >
            <div className="relative shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-purple-500/40"
                />
              ) : (
                <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-purple-500/40">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-400 ring-2 ring-[#0a0a0f]" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold truncate text-foreground">{profile.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{profile.email}</div>
            </div>

            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform shrink-0 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#13131f] shadow-xl">
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{profile.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
                </div>
              </div>

              <div className="px-4 py-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Signed in with Google</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}