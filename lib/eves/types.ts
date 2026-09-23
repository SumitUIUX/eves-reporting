import { z } from "zod";
export const tagInputSchema = z
  .object({
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
    type: z.enum(["Funding Agency", "Zone"]),
    agency: z.enum(["CEC", "CIC", "Cal-EvIP", "NEVI", ""]),
    awardId: z.string().trim().max(80),
    description: z.string().trim().max(1000),
    mappings: z.record(z.array(z.string().max(100)).max(100)).default({}),
  })
  .superRefine((t, ctx) => {
    if (t.type === "Funding Agency" && !t.agency)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a funding agency.",
        path: ["agency"],
      });
  });
export type TagInput = z.infer<typeof tagInputSchema>;
export type ProjectTag = TagInput & {
  id: string;
  createdBy: string;
  createdAt: string;
  version: number;
};
export interface ReportDataset {
  headers: string[];
  rows: string[][];
}
export type ReportKind =
  | "sessions"
  | "intervals"
  | "throughput"
  | "uptime"
  | "events"
  | "chargingPerformance"
  | "sitePerformance"
  | "chargerPerformance"
  | "energyDemand"
  | "tenantUptime"
  | "revenueTransaction";
