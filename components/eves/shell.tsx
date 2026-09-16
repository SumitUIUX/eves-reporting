"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  FileText,
  Tags,
  Activity,
  ChartNoAxesCombined,
  Building2,
  Clock3,
  Settings,
  CircleHelp,
  X,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    icon: ChartNoAxesCombined,
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
  return (
    <Sidebar collapsible="offcanvas">
      <div className={styles.sidebar}>
        <div className={styles.brandArea}>
          <Link
            href="/reports/project-tags"
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
              {categories.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={category === item.label}
                    className={styles.categoryLink}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                      aria-current={
                        category === item.label ? "true" : undefined
                      }
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarFooter className={styles.sidebarFooter}>
          <SidebarMenu className={styles.utilityMenu}>
            {[
              { label: "Settings", icon: Settings },
              { label: "Help & Support", icon: CircleHelp },
            ].map((item) => (
              <SidebarMenuItem
                key={item.label}
                title={`${item.label} is not available in this workspace`}
              >
                <SidebarMenuButton disabled className={styles.utilityLink}>
                  <item.icon aria-hidden="true" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={styles.account} tabIndex={0}>
                <span className={styles.avatar} aria-hidden="true">
                  EV
                </span>
                <div>
                  <p>EVES workspace</p>
                  <small>Operator</small>
                </div>
                <span className="sr-only">Reference data</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-64">
              Report examples are copied from the original dashboard. No live
              charger connection is configured.
            </TooltipContent>
          </Tooltip>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const current = navigation.find((n) => n.href === path);
  const category = current?.group ?? categories[0].label;
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
              {navigation
                .filter((item) => item.group === category)
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
        </header>
        <TabsContent value={path} className={styles.tabPanel}>
          <main id="main-content" className="page-content">
            {children}
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
