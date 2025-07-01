import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Code editor settings (for future use)
export const editorSettings = pgTable("editor_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  theme: text("theme").notNull().default("vs-dark"),
  fontSize: integer("font_size").notNull().default(14),
  language: text("language").notNull().default("javascript"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEditorSettingsSchema = createInsertSchema(editorSettings).pick({
  theme: true,
  fontSize: true,
  language: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EditorSettings = typeof editorSettings.$inferSelect;
export type InsertEditorSettings = z.infer<typeof insertEditorSettingsSchema>;
