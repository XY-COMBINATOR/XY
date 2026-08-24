import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contact requests remain intentionally small: only the information necessary
 * to respond to an enquiry is persisted, and message bytes stay outside logs.
 */
export const contactRequests = mysqlTable("contactRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactRequest = typeof contactRequests.$inferSelect;
export type NewContactRequest = typeof contactRequests.$inferInsert;

/**
 * Shared throttle state keeps public contact limits consistent when autoscaling
 * serves requests from more than one application instance. Source addresses are
 * represented only by a SHA-256 hash to avoid persisting raw network data.
 */
export const contactRateWindows = mysqlTable(
  "contactRateWindows",
  {
    sourceHash: varchar("sourceHash", { length: 64 }).primaryKey(),
    attempts: int("attempts").notNull().default(0),
    windowEndsAt: timestamp("windowEndsAt").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("contactRateWindowsWindowEndsAtIndex").on(table.windowEndsAt)]
);

export type ContactRateWindow = typeof contactRateWindows.$inferSelect;

/**
 * Project Radar records. Visibility is enforced in server procedures, while
 * the public fields remain bounded so the radar cannot overfetch or expose
 * private drafts accidentally.
 */
export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 96 }).notNull().unique(),
    title: varchar("title", { length: 120 }).notNull(),
    codename: varchar("codename", { length: 48 }).notNull(),
    summary: varchar("summary", { length: 280 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", ["idea", "active", "shipped", "paused"])
      .default("idea")
      .notNull(),
    visibility: mysqlEnum("visibility", ["public", "private"])
      .default("private")
      .notNull(),
    progress: int("progress").default(0).notNull(),
    leadOpenId: varchar("leadOpenId", { length: 64 }),
    accent: varchar("accent", { length: 16 }).default("#ef3d32").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("projectsVisibilityStatusIndex").on(table.visibility, table.status),
    index("projectsLeadOpenIdIndex").on(table.leadOpenId),
  ]
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
