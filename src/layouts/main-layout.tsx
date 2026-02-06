import { cn } from "@/lib/utils";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/header";

export default function MainLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-svh w-full bg-background font-sans antialiased text-foreground">
        <Outlet />
        <Toaster />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main
        className={cn(
          "min-h-svh flex-1 flex items-center flex-col px-2 pb-2 w-full",
        )}
        >
        <Header />
        <div className="w-full flex-1 flex flex-col gap-2 rounded-lg">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
