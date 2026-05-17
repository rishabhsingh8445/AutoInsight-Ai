import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { BackgroundParticles } from "@/components/BackgroundParticles";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

const PROTECTED = ["/dashboard", "/tables", "/analytics", "/chat"];

function NotFoundComponent() {
  return (
    <section className="about page">
      <div className="about__hero">
        <div className="about__badge"><span>404</span></div>
        <h1 className="about__title">Page <span className="about__titleAccent">not found</span></h1>
        <p className="about__lead muted">This page doesn&apos;t exist.</p>
        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <Link to="/" className="btn btn--primary">Go home</Link>
        </div>
      </div>
    </section>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AutoInsight AI" },
      { name: "description", content: "AI-Powered Data Analysis" },
      { name: "color-scheme", content: "dark light" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  beforeLoad: async ({ location }) => {
    const isProtected = PROTECTED.some((p) => location.pathname.startsWith(p));
    if (!isProtected) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { throw redirect({ to: "/upload" }); }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <div className="bg">
        <div className="bg__mesh" aria-hidden="true" />
        <div className="bg__noise" aria-hidden="true" />
        <div className="bg__vignette" aria-hidden="true" />
        <div className="bg__orbs" aria-hidden="true">
          <div className="bg__orb bg__orb--1" />
          <div className="bg__orb bg__orb--2" />
          <div className="bg__orb bg__orb--3" />
        </div>
      </div>
      <BackgroundParticles />

      <Sidebar />

      <main id="content" className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <Outlet />
      </main>

      <footer className="wrap footer">
        <div className="footer__left">
          <span className="muted">&copy; {new Date().getFullYear()} AutoInsight AI</span>
        </div>
        <div className="footer__right">
          <span className="muted">Data intelligence platform</span>
        </div>
      </footer>
    </>
  );
}
