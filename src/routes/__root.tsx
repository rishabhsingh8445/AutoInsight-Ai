import { Outlet, Link, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

// Routes that require login
const PROTECTED = ["/dashboard", "/tables", "/analytics", "/chat"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="gradient-text text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="mt-2 text-sm text-gray-500">This page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium">
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
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" },
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
    <div className="relative min-h-screen" style={{ backgroundColor: "#f9fafb" }}>
      <Sidebar />
      <main className="relative ml-[240px] min-h-screen px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
