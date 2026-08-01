import { Link, useRouterState } from "@tanstack/react-router";
import {
  UserCheck,
  BadgeCheck,
  CalendarRange,
  ClipboardCheck,
  Brain,
  Filter,
  Users,
  TrendingUp,
  GitCompareArrows,
  FileText,
  Eye,
  AlertTriangle,

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

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Phase 1 — Capacity Building",
    items: [
      { title: "MT Selection", url: "/mt-selection", icon: UserCheck },
      { title: "MT Certification", url: "/mt-certification", icon: BadgeCheck },
      { title: "MT Batch Performance", url: "/mt-batch-performance", icon: CalendarRange },
      { title: "MT Process Adherence", url: "/mt-process-adherence", icon: ClipboardCheck },
      { title: "MT Learning & Cognitive", url: "/mt-learning-cognitive", icon: Brain },
      { title: "Capacity Building Funnel", url: "/mt-capacity-funnel", icon: Filter },
    ],
  },
  {
    label: "Phase 2 — Deployment Rollout",
    items: [
      { title: "Field Staff Certification", url: "/fs-certification", icon: BadgeCheck },
      { title: "Field Staff Batch Performance", url: "/fs-batch-performance", icon: CalendarRange },
      { title: "Field Staff Process Adherence", url: "/fs-process-adherence", icon: ClipboardCheck },
      { title: "Field Staff Learning & Cognitive", url: "/fs-learning-cognitive", icon: Brain },
      { title: "Batch Composition", url: "/batch-composition", icon: Filter },
    ],
  },
  {
    label: "Trainer Performance Analytics",
    items: [
      { title: "Trainer Utilization", url: "/trainer-utilization", icon: Users },
      { title: "Trainer Performance", url: "/trainer-performance", icon: TrendingUp },
      { title: "Trainer Combination", url: "/trainer-combination", icon: GitCompareArrows },
      { title: "Improvement Report Usage", url: "/improvement-report-usage", icon: FileText },
    ],
  },
  {
    label: "Watchlist",
    items: [
      { title: "Today's Watchlist", url: "/todays-watchlist", icon: Eye },
      { title: "Repeat Default Watchlist", url: "/repeat-default-watchlist", icon: AlertTriangle },
    ],
  },
];


export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => currentPath === url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-14 flex-row items-center px-3 gap-2">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">Z</span>
        </div>
        <div className="leading-tight group-data-[collapsible=icon]:hidden">
          <span className="block text-sm font-semibold">Zilla Analytics</span>
          <span className="block text-[9px] font-medium tracking-wide text-muted-foreground">FOR INTERNAL STAKEHOLDERS</span>
        </div>
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
