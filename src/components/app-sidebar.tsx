
import {
  Home,
  User,
  ShoppingBag,
  Store,
  Command,
  Banknote,
  Package,
  Star,
  FileText,
  CircleHelp,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import NavUser from "./nav-user"
import { ScrollArea } from "./ui/scroll-area"
import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useState } from "react"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin/",
    icon: Home,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: Package,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: User,
  },
  {
    title: "Stores",
    url: "/admin/stores",
    icon: Store,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: ShoppingBag,
  },
  {
    title: "Finance",
    url: "/admin/finance",
    icon: Banknote,
  },
  {
    title: "Idols",
    url: "/admin/idols",
    icon: Star,
  },
  {
    title: "Policy",
    url: "/admin/policy",
    icon: FileText,
  },
  {
    title: "FAQ",
    url: "/admin/faq",
    icon: CircleHelp,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  // State to hold user info
  const [user, setUser] = useState({
    name: "Admin",
    email: "admin@lovaselcard.com",
    avatar: "/avatars/shadcn.jpg",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            setUser({
                name: parsed.fullName || "Admin",
                email: parsed.email || "admin@lovaselcard.com",
                avatar: parsed.avatar || "/avatars/shadcn.jpg"
            });
        } catch (e) {
            console.error("Failed to parse user from localstorage");
        }
    }
  }, []);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Lova-Selcard</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = item.url === "/admin/"
                    ? pathname === "/admin" || pathname === "/admin/"
                    : pathname === item.url ||
                      pathname.startsWith(item.url + "/")

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
