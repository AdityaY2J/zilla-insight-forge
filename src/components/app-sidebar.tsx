import { Link, useRouterState } from "@tanstack/react-router";
import {
  UserCheck,
  BadgeCheck,
  CalendarRange,
  Gauge,
  ClipboardCheck,
  GraduationCap,
  Users,
  LineChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    label: "Master Trainers",
    items: [
      { title: "MT Selection", url: "/mt-selection", icon: UserCheck },
      { title: "MT Certification", url: "/mt-certification", icon: BadgeCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Batch Operations", url: "/batch-operations", icon: CalendarRange },
      { title: "Batch Quality", url: "/batch-quality", icon: ClipboardCheck },
    ],
  },
  {
    label: "Deployment Rollout",
    items: [
      { title: "Deployment Readiness", url: "/deployment-readiness", icon: Gauge },
      { title: "Student Certification", url: "/student-certification", icon: GraduationCap },
      { title: "Trainer Performance", url: "/trainer-performance", icon: Users },
      { title: "Performance Insights", url: "/performance-insights", icon: LineChart },
    ],
  },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => currentPath === url || currentPath.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-14 flex-row items-center px-3 gap-2">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">Z</span>
        </div>
        <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
          Zilla Analytics
        </span>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
