import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Blocks,
  Palette,
  BarChart3,
  Bot,
  Boxes,
  CreditCard,
  FileText,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareWarning,

  ScrollText,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Store,
  UserCog,
} from "lucide-react";
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
} from "@/components/ui/sidebar";

export type AdminNavItem = { to: string; label: string; icon: typeof BarChart3; keywords?: string };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: BarChart3, keywords: "revenue sales analytics stats" },
      { to: "/admin/health", label: "System health", icon: Activity, keywords: "errors uptime stock alerts" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: "/admin/products", label: "Products", icon: Boxes, keywords: "catalog inventory stock sku" },
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart, keywords: "sales fulfilment shipping" },
      { to: "/admin/payments", label: "Payments", icon: CreditCard, keywords: "razorpay upi cod refunds" },
    ],
  },
  {
    label: "Storefront",
    items: [
      { to: "/admin/builder", label: "Page builder", icon: Blocks, keywords: "drag drop sections layout live preview" },
      { to: "/admin/design", label: "Design studio", icon: Palette, keywords: "theme colors fonts radius branding" },
      { to: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, keywords: "hero banners sections" },
      { to: "/admin/navigation", label: "Navigation", icon: Menu, keywords: "menu links mega menu" },
      { to: "/admin/social", label: "Social & QR", icon: Share2, keywords: "instagram whatsapp qr" },
      { to: "/admin/content", label: "Content", icon: FileText, keywords: "faq testimonials pages footer" },
      { to: "/admin/settings", label: "Site settings", icon: Settings, keywords: "logo favicon brand contact" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/admin/ai-chat", label: "AI Chat", icon: Bot, keywords: "assistant support chatbot" },
      { to: "/admin/enquiries", label: "Enquiries", icon: MessageSquareWarning, keywords: "complaints support tickets feedback" },
    ],
  },

  {
    label: "Administration",
    items: [
      { to: "/admin/team", label: "Team & roles", icon: UserCog, keywords: "staff permissions rbac users" },
      { to: "/admin/security", label: "Security", icon: Shield, keywords: "2fa ip lockout captcha" },
      { to: "/admin/logs", label: "Audit logs", icon: ScrollText, keywords: "activity history tracking" },
    ],
  },
];

export function AdminSidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-bold leading-tight">Mazhalai Ulagam</p>
            <p className="truncate text-[11px] text-muted-foreground">Admin console</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View storefront">
              <Link to="/">
                <Store className="h-4 w-4" />
                <span>View storefront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sign out" className="text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
