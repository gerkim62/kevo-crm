"use client";

import {
  BarChart3,
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  Shield,
  Users,
} from "lucide-react";
import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth";

// Navigation items without the static isActive property
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Lead Management",
    url: "/leads",
    icon: Users,
  },
  {
    title: "Policy Management",
    url: "/policies",
    icon: Shield,
  },
  {
    title: "Claims Tracking",
    url: "/claims",
    icon: ClipboardList,
  },
  {
    title: "Commission Tracking",
    url: "/commissions",
    icon: DollarSign,
    adminOnly: true,
  },
  {
    title: "Document Manager",
    url: "/documents",
    icon: FileText,
  },

  {
    title: "User Management",
    url: "/users",
    icon: Users,
    adminOnly: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const { isPending, data } = authClient.useSession();

  // Show loading state
  if (isPending) {
    return (
      <Sidebar {...props}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <SidebarRail />
      </Sidebar>
    );
  }

  // Don't show content if no user session
  if (!data?.user) {
    return null;
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-base">
                    Kevin Insurance Agency
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem
                  className={
                    item.adminOnly && data?.user.role !== "admin"
                      ? "hidden"
                      : ""
                  }
                  key={item.title}
                >
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
