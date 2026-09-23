import dashboardSnapshot from "@/data/report-dashboard.json";
import type { DataSource } from "./data-source";

export type DashboardMetric<T extends number | string = number> = {
  value: T;
  previous_period_value?: T;
  total?: number;
  change_percent: number;
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
