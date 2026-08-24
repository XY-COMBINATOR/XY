import { desc, eq, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ContactRequest,
  InsertUser,
  NewContactRequest,
  InsertProject,
  Project,
  contactRateWindows,
  contactRequests,
  projects,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }

  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function listPublicProjects(): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(projects)
    .where(eq(projects.visibility, "public"))
    .orderBy(desc(projects.updatedAt))
    .limit(48);
}

export async function listProjectsForTeam(): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(100);
}

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Projects are temporarily unavailable");

  await db.insert(projects).values(project);
  const [created] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, project.slug))
    .limit(1);
  if (!created) throw new Error("Project was not created");
  return created;
}

export async function updateProject(
  id: number,
  project: Partial<InsertProject>
): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Projects are temporarily unavailable");

  await db.update(projects).set(project).where(eq(projects.id, id));
  const [updated] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return updated;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Store a validated inquiry only after the router has applied abuse controls. */
export async function createContactRequest(
  input: NewContactRequest
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Contact requests are temporarily unavailable");
  }

  await db.insert(contactRequests).values(input);
}

/** Admin-only views use a fixed, bounded result set to avoid accidental data overfetching. */
export async function listContactRequests(
  limit: number
): Promise<ContactRequest[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(contactRequests)
    .orderBy(desc(contactRequests.createdAt))
    .limit(limit);
}

/**
 * Atomically increment a contact rate window. Returning null preserves the
 * local guard fallback for development when a database connection is absent.
 */
export async function recordContactAttempt(
  sourceHash: string,
  now: Date,
  windowEndsAt: Date,
  limit: number
): Promise<boolean | null> {
  const db = await getDb();
  if (!db) return null;

  // Expired windows no longer contribute to throttling and are removed on the
  // write path using an indexed timestamp, avoiding unbounded state growth.
  await db
    .delete(contactRateWindows)
    .where(lt(contactRateWindows.windowEndsAt, now));

  await db
    .insert(contactRateWindows)
    .values({ sourceHash, attempts: 1, windowEndsAt })
    .onDuplicateKeyUpdate({
      set: {
        attempts: sql`IF(${contactRateWindows.windowEndsAt} <= ${now}, 1, ${contactRateWindows.attempts} + 1)`,
        windowEndsAt: sql`IF(${contactRateWindows.windowEndsAt} <= ${now}, ${windowEndsAt}, ${contactRateWindows.windowEndsAt})`,
        updatedAt: now,
      },
    });

  const result = await db
    .select({ attempts: contactRateWindows.attempts })
    .from(contactRateWindows)
    .where(eq(contactRateWindows.sourceHash, sourceHash))
    .limit(1);
  return (result[0]?.attempts ?? limit + 1) <= limit;
}
