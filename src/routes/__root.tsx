import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

const PROTECTED = ["/dashboard", "/tables", "/analytics", "/chat"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="gradient-text text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-[#1a1a1a]">Page not found</h2>
        <p className="mt-2 text-sm text-[#888]">This page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm">
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AutoInsight AI" },
      { name: "description", content: "AI-Powered Data Analysis" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
    ],
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
    <div className="grain relative min-h-screen">
      {/* Ambient floating blobs — visible on every page */}
      <div className="ambient-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Sidebar />
      <main className="relative z-10 ml-[220px] min-h-screen px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
