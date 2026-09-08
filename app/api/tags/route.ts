import { query, batch } from "@/lib/eves/database";
import { referenceTags, referenceSites } from "@/lib/eves/seed";
import { tagInputSchema, type ProjectTag } from "@/lib/eves/types";
import { z } from "zod";
export const dynamic = "force-dynamic";
function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function validOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}
async function initialize() {
  await batch([
    ...referenceTags.map((t) => ({
      sql: "INSERT OR IGNORE INTO project_tags (id,data,version) SELECT ?,?,1 WHERE NOT EXISTS (SELECT 1 FROM app_metadata WHERE key = 'reference_seed')",
      params: [t.id, JSON.stringify(t)],
    })),
    {
      sql: "INSERT OR IGNORE INTO app_metadata (key,value) VALUES ('reference_seed','1')",
      params: [],
    },
  ]);
}
function validateMappings(mappings: Record<string, string[]>) {
  return Object.entries(mappings).every(([name, ids]) => {
    const site = referenceSites.find((s) => s.name === name);
    return (
      !!site &&
      ids.length > 0 &&
      new Set(ids).size === ids.length &&
      ids.every((id) => site.chargers.includes(id))
    );
  });
}
export async function GET() {
  try {
    await initialize();
    const r = await query(
      "SELECT data,version FROM project_tags ORDER BY json_extract(data,'$.createdAt') ASC",
    );
    return reply(
      r.results.map((row) => ({
        ...JSON.parse(String(row.data)),
        version: row.version,
      })),
    );
  } catch (error) {
    console.error("Tags load failed", error);
    return reply({ error: "Tags could not be loaded. Please try again." }, 503);
  }
}
export async function POST(req: Request) {
  if (!validOrigin(req))
    return reply({ error: "Request origin is not allowed." }, 403);
  try {
    const input = tagInputSchema.parse(await req.json());
    if (!validateMappings(input.mappings))
      return reply(
        { error: "Choose valid sites and charger selections." },
        400,
      );
    const tag: ProjectTag = {
      ...input,
      agency: input.type === "Zone" ? "" : input.agency,
      awardId: input.type === "Zone" ? "" : input.awardId,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      createdBy: "You",
      version: 1,
    };
    await query("INSERT INTO project_tags (id,data,version) VALUES (?,?,1)", [
      tag.id,
      JSON.stringify(tag),
    ]);
    return reply(tag, 201);
  } catch (error) {
    if (error instanceof z.ZodError)
      return reply({ error: error.issues[0].message }, 400);
    if (error instanceof SyntaxError)
      return reply({ error: "Invalid request body." }, 400);
    console.error("Tag create failed", error);
    return reply(
      { error: "Tag could not be saved. Your input is still available." },
      503,
    );
  }
}
export async function PUT(req: Request) {
  if (!validOrigin(req))
    return reply({ error: "Request origin is not allowed." }, 403);
  try {
    const body = await req.json();
    const input = tagInputSchema.parse(body);
    const { id, version } = z
      .object({
        id: z.string().min(1).max(100),
        version: z.number().int().positive(),
      })
      .parse(body);
    if (!validateMappings(input.mappings))
      return reply(
        { error: "Choose valid sites and charger selections." },
        400,
      );
    const current = await query("SELECT data FROM project_tags WHERE id=?", [
      id,
    ]);
    if (!current.results.length)
      return reply({ error: "This tag no longer exists." }, 404);
    const original = JSON.parse(String(current.results[0].data)) as ProjectTag;
    const tag = {
      ...original,
      ...input,
      agency: input.type === "Zone" ? "" : input.agency,
      awardId: input.type === "Zone" ? "" : input.awardId,
      version: version + 1,
    };
    const result = await query(
      "UPDATE project_tags SET data=?,version=version+1 WHERE id=? AND version=?",
      [JSON.stringify(tag), id, version],
    );
    if (!result.meta.changes)
      return reply(
        {
          error:
            "This tag changed in another session. Close the dialog and refresh before editing.",
        },
        409,
      );
    return reply(tag);
  } catch (error) {
    if (error instanceof z.ZodError)
      return reply({ error: error.issues[0].message }, 400);
    console.error("Tag update failed", error);
    return reply(
      { error: "Changes could not be saved. Please try again." },
      503,
    );
  }
}
export async function DELETE(req: Request) {
  if (!validOrigin(req))
    return reply({ error: "Request origin is not allowed." }, 403);
  try {
    const { id, version } = z
      .object({
        id: z.string().min(1).max(100),
        version: z.number().int().positive(),
      })
      .parse(await req.json());
    const result = await query(
      "DELETE FROM project_tags WHERE id=? AND version=?",
      [id, version],
    );
    if (!result.meta.changes)
      return reply(
        { error: "This tag changed or was deleted. Refresh and try again." },
        409,
      );
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return reply({ error: "Invalid tag." }, 400);
    console.error("Tag delete failed", error);
    return reply({ error: "Tag could not be deleted. Please try again." }, 503);
  }
}
