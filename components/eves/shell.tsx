"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  FileText,
  Tags,
  Activity,
  ChartNoAxesCombined,
  Building2,
  Clock3,
  ChevronRight,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
export const navigation = [
  {
    href: "/reports/project-tags",
    label: "Project tagging",
    icon: Tags,
    group: "Regulatory reports",
  },
  {
    href: "/reports/regulatory",
    label: "Generate reports",
    icon: FileText,
    group: "Regulatory reports",
  },
  {
    href: "/reports/charging-sessions",
    label: "Charging sessions",
    icon: Clock3,
    group: "Master reports",
  },
  {
    href: "/reports/interval-load-profile",
    label: "Interval load profile",
    icon: ChartNoAxesCombined,
    group: "Master reports",
  },
  {
    href: "/reports/throughput",
    label: "Infrastructure & throughput",
    icon: Building2,
    group: "Master reports",
  },
  {
    href: "/",
    label: "Uptime & reliability",
    icon: Activity,
    group: "Master reports",
  },
];
function Navigation() {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar collapsible="offcanvas">
      <Link
        href="/reports/project-tags"
        className="eves-brand"
        aria-label="EVES reporting home"
      >
        <span className="brand-mark">
          <Zap fill="currentColor" />
        </span>
        <div>EVES</div>
      </Link>
      <div className="workspace-box">
        <span className="workspace-icon">
          <Layers size={18} />
        </span>
        <div>
          <div className="workspace-name">EVES workspace</div>
          <div className="workspace-caption">Reporting & compliance</div>
        </div>
      </div>
      <SidebarContent>
        <div className="nav-caption">WORKSPACE</div>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "0 28px",
            alignItems: "center",
            fontSize: 14,
            color: "#414659",
            fontWeight: 600,
          }}
        >
          <FileText size={18} />
          Reports
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#a0a4b1" }}>
            06
          </span>
        </div>
        {["Regulatory reports", "Master reports"].map((group) => (
          <div key={group}>
            <div className="nav-group-title">{group}</div>
            <SidebarMenu className="eves-nav">
              {navigation
                .filter((n) => n.group === group)
                .map((n) => (
                  <SidebarMenuItem key={n.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={path === n.href}
                      tooltip={n.label}
                    >
                      <Link
                        href={n.href}
                        onClick={() => setOpenMobile(false)}
                        aria-current={path === n.href ? "page" : undefined}
                      >
                        <n.icon />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-0">
        <div className="nav-footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 12,
              color: "#79778f",
              marginBottom: 7,
            }}
          >
            <ShieldCheck size={16} /> Reference workspace
          </div>
          <p>Live charger sync is not connected.</p>
          <p>EVES Reporting · v1.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const current = navigation.find((n) => n.href === path);
  return (
    <SidebarProvider className="eves-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navigation />
      <div className="min-w-0 flex-1">
        <header className="topbar">
          <div className="topbar-left">
            <SidebarTrigger className="text-muted-foreground" />
            <span className="breadcrumb-parent">Workspace</span>
            <ChevronRight size={13} className="breadcrumb-chevron" />
            <strong className="breadcrumb-parent">Reports</strong>
            <ChevronRight size={13} className="breadcrumb-chevron" />
            <span>{current?.label ?? "Page not found"}</span>
          </div>
          <div className="topbar-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="reference-badge">
                  <Layers size={12} />
                  Reference data
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Report examples are copied from the original dashboard. No live
                charger connection is configured.
              </TooltipContent>
            </Tooltip>
            <div className="profile">
              <span className="avatar">EV</span>
              <div>
                <p>EVES workspace</p>
                <small>Operator</small>
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" className="page-content">
          {children}
          <footer className="page-foot">
            <span>© 2026 EVES. All rights reserved.</span>
          </footer>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
