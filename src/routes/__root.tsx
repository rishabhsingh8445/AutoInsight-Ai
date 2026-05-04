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
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="gradient-bg mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary-foreground"
        >
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
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  // Auth guard — runs before every route renders
  beforeLoad: async ({ location }) => {
    const isProtected = PROTECTED.some((p) => location.pathname.startsWith(p));
    if (!isProtected) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/upload" });
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="animated-background" aria-hidden="true">
        <span className="data-stream data-stream-1" />
        <span className="data-stream data-stream-2" />
        <span className="data-stream data-stream-3" />
        <span className="signal-node signal-node-1" />
        <span className="signal-node signal-node-2" />
        <span className="signal-node signal-node-3" />
      </div>
      <Sidebar />
      <main className="relative z-10 ml-72 px-8 py-4">
        <Outlet />
      </main>
    </div>
  );
}
