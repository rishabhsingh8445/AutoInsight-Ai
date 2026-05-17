import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDataStore } from "@/store/dataStore";
import { LogOut } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", exact: true },
  { to: "/upload", label: "Upload", exact: false },
  { to: "/tables", label: "Tables", exact: false },
  { to: "/dashboard", label: "Dashboard", exact: false },
  { to: "/analytics", label: "Analytics", exact: false },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const { clear } = useDataStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setProfile({ name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "Account" });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user;
        setProfile({ name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? "Account" });
      } else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    document.addEventListener("astro:page-load", close);
    return () => document.removeEventListener("astro:page-load", close);
  }, []);

  useEffect(() => {
    document.getElementById("mobile-menu-btn")?.classList.toggle("is-open", menuOpen);
    document.getElementById("mobile-nav")?.classList.toggle("is-open", menuOpen);
    document.getElementById("mobile-menu-btn")?.setAttribute("aria-expanded", menuOpen ? "true" : "false");
  }, [menuOpen]);

  const isActive = (to: string, exact?: boolean) => {
    const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
    const target = to === "/" ? "/" : to.replace(/\/+$/, "");
    return exact ? path === target : path === target || path.startsWith(target + "/");
  };

  const handleLogout = async () => {
    clear();
    await supabase.auth.signOut();
    window.location.href = "/upload";
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__dot" aria-hidden="true" />
          <span className="brand__text">AUTOINSIGHT AI</span>
        </Link>

        <nav className="nav" aria-label="Primary">
          {navItems.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              className={`nav__link${isActive(to, exact) ? " nav__link--current" : ""}`}
              aria-current={isActive(to, exact) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/chat"
            className={`nav__pill${isActive("/chat") ? " nav__link--current" : ""}`}
          >
            Chat
          </Link>
          {profile && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="nav__link"
              style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
              title={`Sign out (${profile.name})`}
            >
              <LogOut style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Sign out
            </button>
          )}
        </nav>

        <div className="mobile-controls">
          <button
            type="button"
            className="mobile-menu-btn"
            id="mobile-menu-btn"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="mobile-menu-btn__bar" />
            <span className="mobile-menu-btn__bar" />
            <span className="mobile-menu-btn__bar" />
          </button>
        </div>
      </div>

      <nav className={`mobile-nav${menuOpen ? " is-open" : ""}`} id="mobile-nav" aria-label="Mobile Primary">
        {navItems.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            className={`mobile-nav__link${isActive(to, exact) ? " mobile-nav__link--current" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link
          to="/chat"
          className={`mobile-nav__link mobile-nav__link--cta${isActive("/chat") ? " mobile-nav__link--current" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          Chat
        </Link>
      </nav>
    </header>
  );
}
