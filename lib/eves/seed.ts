import type { ProjectTag } from "./types";
// Records observed in the user's original public dashboard. Never presented as live telemetry.
export const referenceTags: ProjectTag[] = [
  {
    id: "reference-cec-110",
    name: "Downtown DC Fast Expansion",
    type: "Funding Agency",
    agency: "CEC",
    awardId: "CEC-FND-110",
    description: "",
    mappings: {
      "Downtown Transit Hub": ["1", "2", "3", "4"],
      "Airport Fast Charge Plaza": ["1", "2", "3"],
    },
    createdBy: "Anita S",
    createdAt: "2026-04-03T00:00:00Z",
    version: 1,
  },
  {
    id: "reference-cic-204",
    name: "Mall Corridor Reliability Upgrade",
    type: "Funding Agency",
    agency: "CIC",
    awardId: "CIC-FND-204",
    description: "",
    mappings: { "Central Mall Parking": ["1", "2", "3"] },
    createdBy: "Rahul K",
    createdAt: "2026-04-08T00:00:00Z",
    version: 1,
  },
  {
    id: "reference-zone-north",
    name: "Priority North Zone",
    type: "Zone",
    agency: "",
    awardId: "",
    description: "",
    mappings: {},
    createdBy: "Mary L",
    createdAt: "2026-04-12T00:00:00Z",
    version: 1,
  },
];
export interface ReferenceSite {
  name: string;
  area?: string;
  chargers: string[];
}

// Site names, areas and capacities from the supplied mapping references.
// Numbers remain selection labels, not inferred live charger IDs.
export const referenceSites: ReferenceSite[] = [
  { name: "Downtown Transit Hub", chargers: ["1", "2", "3", "4"] },
  { name: "Airport Fast Charge Plaza", chargers: ["1", "2", "3", "4", "5"] },
  { name: "Central Mall Parking", area: "East", chargers: ["1", "2", "3"] },
  { name: "Harbor Ride & Charge", area: "South", chargers: ["1", "2"] },
  { name: "University Garage C", area: "Central", chargers: ["1", "2", "3"] },
  { name: "City Library Annex", area: "North", chargers: ["1", "2"] },
];
