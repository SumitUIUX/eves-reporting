"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  ChevronDown,
  Tags,
  Activity,
  ChartNoAxesCombined,
  Building2,
  Clock3,
  X,
  UserRound,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TenantProvider, useTenant } from "./tenant-context";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import styles from "./navigation.module.css";

const categories = [
  {
    label: "Regulatory Reports",
    href: "/reports/project-tags",
    icon: FileText,
  },
  {
    label: "Master Reports",
    href: "/reports/charging-sessions",
    icon: ChartNoAxesColumnIncreasing,
  },
] as const;

type ReportCategory = (typeof categories)[number]["label"];

export const navigation = [
  {
    href: "/reports/project-tags",
    label: "Project Tagging",
    icon: Tags,
    group: "Regulatory Reports",
  },
  {
    href: "/reports/regulatory",
    label: "Generate Reports",
    icon: FileText,
    group: "Regulatory Reports",
  },
  {
    href: "/reports/charging-sessions",
    label: "Charging Sessions",
    icon: Clock3,
    group: "Master Reports",
  },
  {
    href: "/reports/interval-load-profile",
    label: "Interval Load Profile",
    icon: ChartNoAxesCombined,
    group: "Master Reports",
  },
  {
    href: "/reports/throughput",
    label: "Infrastructure & Throughput",
    icon: Building2,
    group: "Master Reports",
  },
  {
    href: "/",
    label: "Uptime & Reliability",
    icon: Activity,
    group: "Master Reports",
  },
] as const;

function Navigation({ category }: { category: ReportCategory }) {
  const { setOpenMobile } = useSidebar();
  const { tenantView, active } = useTenant();
  const path = usePathname();
  const visibleCategories = categories.filter(item => !tenantView || (item.label === "Regulatory Reports" ? active.regulatory : active.master));
  const [reportingOpen, setReportingOpen] = useState(true);
  return (
    <Sidebar collapsible="offcanvas">
      <div className={styles.sidebar}>
        <div className={styles.brandArea}>
          <Link
            href={tenantView ? "/tenants" : "/reports/project-tags"}
            className={`eves-brand ${styles.brand}`}
            aria-label="EVES reporting home"
            onClick={() => setOpenMobile(false)}
          >
            <Image
              src="/eves-logo.svg"
              alt="EVES"
              width={295}
              height={330}
              className={styles.logo}
              unoptimized
            />
          </Link>
          <button
            type="button"
            className={styles.closeSidebar}
            aria-label="Close navigation"
            onClick={() => setOpenMobile(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <SidebarContent className={styles.sidebarContent}>
          <nav aria-label="Report categories">
            <SidebarMenu className={styles.categoryMenu}>
              {tenantView && <SidebarMenuItem><SidebarMenuButton asChild className={styles.tenantLink} isActive={path === "/tenants"}><Link href="/tenants" onClick={() => setOpenMobile(false)} aria-current={path === "/tenants" ? "page" : undefined}><Building2 aria-hidden="true" /><span>Tenant</span></Link></SidebarMenuButton></SidebarMenuItem>}
              {visibleCategories.length > 0 && <SidebarMenuItem>
                <SidebarMenuButton
                  className={styles.reportingToggle}
                  isActive={reportingOpen}
                  aria-expanded={reportingOpen}
                  aria-controls="reporting-submenu"
                  onClick={() => setReportingOpen((open) => !open)}
                >
                  <ChartNoAxesColumnIncreasing aria-hidden="true" />
                  <span>Reporting</span>
                  {reportingOpen ? (
                    <ChevronDown className={styles.chevron} aria-hidden="true" />
                  ) : (
                    <ChevronRight className={styles.chevron} aria-hidden="true" />
                  )}
                </SidebarMenuButton>
                <ul
                  id="reporting-submenu"
                  className={styles.submenu}
                  hidden={!reportingOpen}
                >
                  {visibleCategories.map((item) => (
                    <SidebarMenuItem key={item.label} className={styles.submenuItem}>
                      <SidebarMenuButton
                        asChild
                        isActive={category === item.label}
                        className={styles.categoryLink}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                          aria-current={category === item.label ? "true" : undefined}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </ul>
              </SidebarMenuItem>}
            </SidebarMenu>
          </nav>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  return <TenantProvider><ShellContent>{children}</ShellContent></TenantProvider>;
}
function ShellContent({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { tenantView, setTenantView, active } = useTenant();
  const current = navigation.find((n) => n.href === path);
  const category = current?.group ?? categories[0].label;
  const allowed = tenantView ? path === "/tenants" || (current?.group === "Regulatory Reports" ? active.regulatory : current?.group === "Master Reports" ? active.master : false) : path !== "/tenants";
  useEffect(() => { if (!allowed) router.replace(tenantView ? "/tenants" : "/reports/project-tags"); }, [allowed, tenantView, router]);
  function switchView(value: string) {
    setTenantView(value === "tenant");
    router.push(value === "tenant" ? "/tenants" : "/reports/project-tags");
  }
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Keep the active page visible when its tab starts outside a narrow screen.
    activeTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [path]);

  return (
    <SidebarProvider open className={`eves-shell ${styles.shell}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navigation category={category} />
      <Tabs value={path} activationMode="manual" className={styles.workspace}>
        <header className={styles.tabBar}>
          <SidebarTrigger className={styles.mobileTrigger} />
          <nav className={styles.tabScroll} aria-label="Report sub-navigation">
            <TabsList className={styles.tabList} aria-label="Report pages">
              {(tenantView && path === "/tenants" ? [{ href: "/tenants", label: "Tenant", icon: Building2, group: "Tenant" }] : navigation)
                .filter((item) => allowed && (path === "/tenants" || item.group === category))
                .map((item) => (
                  <TabsTrigger
                    asChild
                    key={item.href}
                    value={item.href}
                    className={styles.tab}
                    onKeyDown={(event) => {
                      // Anchors activate with Enter; add the tab widget's Space key.
                      if (event.key === " " || event.code === "Space") {
                        event.preventDefault();
                        router.push(item.href);
                      }
                    }}
                  >
                    <Link
                      href={item.href}
                      ref={path === item.href ? activeTabRef : undefined}
                      aria-current={path === item.href ? "page" : undefined}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </TabsTrigger>
                ))}
            </TabsList>
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={styles.profile} aria-label="Select view">
                <span className={styles.profileAvatar} aria-hidden="true"><UserRound size={19} /></span>
                <span>{tenantView ? "Tenant View" : "Super Admin"}</span><ChevronDown size={14} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={tenantView ? "tenant" : "admin"} onValueChange={switchView}>
                <DropdownMenuRadioItem value="admin">Super Admin</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="tenant">Tenant View</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <TabsContent value={path} className={styles.tabPanel}>
          <main id="main-content" className="page-content">
            {tenantView && <div className={styles.tenantContext}>Tenant: {active.name}</div>}
            {allowed ? children : null}
            <footer className="page-foot">
              <span>© 2026 EVES. All rights reserved.</span>
            </footer>
          </main>
        </TabsContent>
      </Tabs>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
