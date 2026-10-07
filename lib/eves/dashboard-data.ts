import dashboardSnapshot from "@/data/report-dashboard.json";
import type { DataSource } from "./data-source";

export type DashboardMetric<T extends number | string = number> = {
  value: T;
  previous_period_value?: T;
  total?: number;
  change_percent: number;
  note?: string;
  available?: boolean;
};

export type DashboardSite = {
  site_id: string;
  site_name: string;
  sessions: number;
  energy_delivered_kwh: number;
  revenue: number;
  utilization_percent: number;
};

export type ExecutiveDashboardData = {
  dashboard_period: {
    start_date: string;
    end_date: string;
  };
  charging: {
    sessions: DashboardMetric;
    energy_delivered_kwh: DashboardMetric;
    revenue: DashboardMetric;
    average_session_duration: DashboardMetric<string>;
  };
  infrastructure: {
    active_chargers: DashboardMetric;
    connector_count: DashboardMetric;
    utilization_percent: DashboardMetric;
    uptime_percent: DashboardMetric;
  };
  business: {
    revenue_trend: Array<{ date: string; revenue: number }>;
    top_performing_sites: DashboardSite[];
    underperforming_sites: DashboardSite[];
  };
  alerts_attention_required: {
    chargers_below_sla: {
      count: number;
      sla_threshold_percent: number;
      chargers: Array<{
        evse_id: string;
        site_name: string;
        uptime_percent: number;
      }>;
    };
    sites_with_declining_utilization: {
      available?: boolean;
      count: number;
      sites: Array<{
        site_id: string;
        site_name: string;
        current_utilization_percent: number;
        previous_period_utilization_percent: number;
        change_percent: number;
      }>;
    };
    high_downtime: {
      count: number;
      events: Array<{
        evse_id: string;
        site_name: string;
        downtime_duration: string;
        downtime_events: number;
        primary_reason: string;
      }>;
    };
  };
};

const sampleDashboard = dashboardSnapshot satisfies ExecutiveDashboardData;

/**
 * Dashboard data boundary. Replace the workspace branch with the dashboard API
 * when it is available; consumers do not need to know where the data came from.
 */
export async function loadExecutiveDashboard(
  source: DataSource,
): Promise<ExecutiveDashboardData | null> {
  return source === "sample" ? sampleDashboard : null;
}

/** Preserve the dashboard schema without borrowing any sample measurements. */
export function emptyExecutiveDashboard(): ExecutiveDashboardData {
  const missing = { value: 0, available: false, change_percent: NaN };
  return {
    dashboard_period: { start_date: "", end_date: "" },
    charging: { sessions: {...missing}, energy_delivered_kwh: {...missing}, revenue: {...missing}, average_session_duration: {...missing, value: "—"} },
    infrastructure: { active_chargers: {...missing}, connector_count: {...missing}, utilization_percent: {...missing}, uptime_percent: {...missing} },
    business: { revenue_trend: [], top_performing_sites: [], underperforming_sites: [] },
    alerts_attention_required: { chargers_below_sla: { count: 0, sla_threshold_percent: 95, chargers: [] }, sites_with_declining_utilization: { count: 0, sites: [] }, high_downtime: { count: 0, events: [] } },
  };
}
