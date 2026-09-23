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
  Zap,
  ChartNoAxesCombined,
  Building2,
  Clock3,
  X,
  UserRound,
  Database,
  FlaskConical,
  LayoutDashboard,
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
import { TenantProvider, useTenant, type Tenant } from "./tenant-context";
import { DataSourceProvider, useDataSource, type DataSource } from "@/lib/eves/data-source";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import styles from "./navigation.module.css";

const categories = [
  {
    label: "Regulatory Reports",
    href: "/reports/project-tags",
    icon: FileText,
    tenantOnly: false,
  },
  {
    label: "Master Reports",
    href: "/reports/charging-sessions",
    icon: ChartNoAxesColumnIncreasing,
    tenantOnly: false,
  },
  {
    label: "Performance & Insights",
    href: "/reports/charging-performance",
    icon: Activity,
    tenantOnly: true,
  },
] as const;

type ReportCategory = (typeof categories)[number]["label"];

export const navigation = [
  {
    href: "/reports/project-tags",
    label: "Project Tagging",
    icon: Tags,
    group: "Regulatory Reports",
    reportId: "project-tagging",
  },
  {
    href: "/reports/regulatory",
    label: "Generate Reports",
    icon: FileText,
    group: "Regulatory Reports",
    reportId: "generate-reports",
  },
  {
    href: "/reports/charging-sessions",
    label: "Charging Sessions",
    icon: Clock3,
    group: "Master Reports",
    reportId: "charging-sessions",
  },
  {
    href: "/reports/interval-load-profile",
    label: "Interval Load Profile",
    icon: ChartNoAxesCombined,
    group: "Master Reports",
    reportId: "interval-load-profile",
  },
  {
    href: "/reports/throughput",
    label: "Infrastructure & Throughput",
    icon: Building2,
    group: "Master Reports",
    reportId: "infrastructure-throughput",
  },
  {
    href: "/",
    label: "Uptime & Reliability",
    icon: Activity,
    group: "Master Reports",
    reportId: "uptime-reliability",
  },
  {
    href: "/dashboard",
    label: "Executive Overview",
    icon: LayoutDashboard,
    group: "Performance & Insights",
    reportId: "executive-overview",
  },
  {
    href: "/reports/charging-performance",
    label: "Charging Performance",
    icon: Zap,
    group: "Performance & Insights",
    reportId: "charging-performance",
  },
  {
    href: "/reports/site-performance",
    label: "Site Performance",
    icon: Building2,
    group: "Performance & Insights",
    reportId: "site-performance",
  },
  {
    href: "/reports/charger-performance",
    label: "Charger Performance",
    icon: Activity,
    group: "Performance & Insights",
    reportId: "charger-connector-performance",
  },
  {
    href: "/reports/energy-demand",
    label: "Energy & Demand",
    icon: ChartNoAxesCombined,
    group: "Performance & Insights",
    reportId: "energy-demand",
  },
  {
    href: "/reports/tenant-uptime-reliability",
    label: "Uptime & Reliability",
    icon: Activity,
    group: "Performance & Insights",
    reportId: "tenant-uptime-reliability",
  },
  {
    href: "/reports/revenue-transaction",
    label: "Revenue & Transaction",
    icon: ChartNoAxesColumnIncreasing,
    group: "Performance & Insights",
    reportId: "revenue-financial",
  },
] as const;

function tenantReportHome(active: Tenant) {
  if (!active.components["Reports/Analytics"]) return null;
  return navigation.find((item) => active.reports[item.reportId])?.href ?? null;
}

function Navigation({ category }: { category: ReportCategory }) {
  const { setOpenMobile } = useSidebar();
  const { tenantView, active } = useTenant();
  const path = usePathname();
  const unlocked = !tenantView || !active.id;
  const visibleCategories = categories.filter((item) => {
    if (unlocked) return !item.tenantOnly;
    return (
      active.components["Reports/Analytics"] &&
      navigation.some(
        (page) =>
          page.group === item.label && active.reports[page.reportId],
      )
    );
  });
  const [reportingOpen, setReportingOpen] = useState(true);
  return (
    <Sidebar collapsible="offcanvas">
      <div className={styles.sidebar}>
        <div className={styles.brandArea}>
          <Link
            href={tenantView ? (tenantReportHome(active) ?? "/reports/project-tags") : "/reports/project-tags"}
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
              {!tenantView && <SidebarMenuItem><SidebarMenuButton asChild className={styles.tenantLink} isActive={path === "/tenants"}><Link href="/tenants" onClick={() => setOpenMobile(false)} aria-current={path === "/tenants" ? "page" : undefined}><Building2 aria-hidden="true" /><span>Tenant</span></Link></SidebarMenuButton></SidebarMenuItem>}
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
                        isActive={path !== "/tenants" && category === item.label}
                        className={styles.categoryLink}
                      >
                        <Link
                          href={
                            tenantView
                              ? (navigation.find(
                                  (page) =>
                                    page.group === item.label &&
                                    active.reports[page.reportId],
                                )?.href ?? item.href)
                              : item.href
                          }
                          onClick={() => setOpenMobile(false)}
                          aria-current={path !== "/tenants" && category === item.label ? "page" : undefined}
                        >
                          <item.icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {tenantView && <ul className={styles.reportPages}>{enabledReports.filter(r => r.group === item.label).map(report => <li key={report.key}><Link href={report.href} onClick={() => setOpenMobile(false)} aria-current={path === report.href ? "page" : undefined}>{report.label}</Link></li>)}</ul>}
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
  return (
    <DataSourceProvider>
      <TenantProvider>
        <ShellContent>{children}</ShellContent>
      </TenantProvider>
    </DataSourceProvider>
  );
}

function DataSourceMenu() {
  const { source, selectSource } = useDataSource();
  const isSample = source === "sample";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={styles.dataSource}
          aria-label={`Data source: ${isSample ? "Sample data" : "Workspace data"}`}
        >
          {isSample ? <FlaskConical size={16} aria-hidden="true" /> : <Database size={16} aria-hidden="true" />}
          <span>{isSample ? "Sample data" : "Workspace data"}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuRadioGroup
          value={source}
          onValueChange={(value) => selectSource(value as DataSource)}
        >
          <DropdownMenuRadioItem value="sample">Sample data</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="workspace">Workspace data</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {isSample
            ? "Sample data loads from the local sample files on every screen."
            : "Workspace data uses the connected APIs. Screens without an API stay empty."}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function ShellContent({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { tenantView, setTenantView, active } = useTenant();
  const current = navigation.find((n) => n.href === path);
  const category = current?.group ?? categories[0].label;
  const tenantReport = current?.group === "Performance & Insights";
  const reportAllowed =
    !!current &&
    (!active.id ||
      (!!active.components["Reports/Analytics"] &&
        active.reports[current.reportId]));
  const allowed = tenantView
    ? path !== "/tenants" && reportAllowed
    : !tenantReport;
  useEffect(() => {
    if (allowed) return;
    const destination = tenantView ? tenantReportHome(active) : "/reports/project-tags";
    if (destination && destination !== path) router.replace(destination);
  }, [allowed, tenantView, active, path, router]);
  function switchView(value: string) {
    const nextTenant = value === "tenant";
    setTenantView(nextTenant);
    if (nextTenant && path === "/tenants") router.push(tenantReportHome(active) ?? "/reports/project-tags");
  }
  const activeTabRef = useRef<HTMLAnchorElement>(null);
  const tabs =
    path === "/tenants"
        ? [{ href: "/tenants", label: "Tenant", icon: Building2 }]
        : navigation.filter(
            (item) =>
              item.group === category &&
              (!tenantView || active.reports[item.reportId]),
          );

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
              {tabs
                .filter(() => allowed)
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
                      <span>{tenantView ? reportOptions.find(r => r.href === item.href)?.label ?? item.label : item.label}</span>
                    </Link>
                  </TabsTrigger>
                ))}
            </TabsList>
          </nav>
          <div className={styles.barActions}>
            <DataSourceMenu />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={styles.profile}
                aria-label={
                  tenantView
                    ? `Select view. Tenant View, ${active.name}`
                    : "Select view. Super Admin"
                }
              >
                <span className={styles.profileAvatar} aria-hidden="true"><UserRound size={19} /></span>
                <span className={styles.profileCopy}>
                  <span>{tenantView ? "Tenant View" : "Super Admin"}</span>
                  {tenantView && (
                    <span className={styles.profileName}>{active.name}</span>
                  )}
                </span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={tenantView ? "tenant" : "admin"} onValueChange={switchView}>
                <DropdownMenuRadioItem value="admin">Super Admin</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="tenant">Tenant View</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <TabsContent value={path} className={styles.tabPanel}>
          <main id="main-content" className="page-content">
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
