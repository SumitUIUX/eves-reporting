import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const projectTags = sqliteTable("project_tags", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  version: integer("version").notNull().default(1),
});
export const appMetadata = sqliteTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
