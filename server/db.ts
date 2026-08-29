import { count, desc, eq, lt, sql } from "drizzle-orm";
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
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

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

export const defaultShowcaseProjects: Project[] = [
  {
    id: 1,
    slug: "kinetic-editorial",
    title: "Kinetic Editorial Design System",
    codename: "KINETIC",
    summary:
      "Asymmetric typography, signal-red motion corridors, and paper/ink material architecture.",
    description:
      "A high-impact editorial design system built for high-conviction creative practices. Featuring Space Grotesk display typography, subtle grain layers, responsive coordinate axes, and Web Audio API harmonic soundscapes.",
    status: "shipped",
    visibility: "public",
    progress: 100,
    accent: "#ef3d32",
    leadOpenId: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    slug: "signal-orbit",
    title: "Signal Orbit Interactive Canvas",
    codename: "ORBIT",
    summary:
      "Real-time planetary physics and coordinate nodes rendering creative signals.",
    description:
      "An interactive 2D orbital simulation mapping creative collective coordinates into dynamic physical nodes. Built with performant 60fps HTML5 Canvas and spring physics.",
    status: "active",
    visibility: "public",
    progress: 85,
    accent: "#38bdf8",
    leadOpenId: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    slug: "atelier-os",
    title: "Atelier OS Control Room",
    codename: "ATELIER",
    summary:
      "Distributed telemetry, rate-limiting guards, and zero-trust team dashboard.",
    description:
      "A complete operating system layer for creative collectives. Features automated lead routing, distributed IP abuse guards, and real-time project analytics.",
    status: "active",
    visibility: "public",
    progress: 90,
    accent: "#eab308",
    leadOpenId: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function listPublicProjects(): Promise<Project[]> {
  const db = await getDb();
  if (!db) return defaultShowcaseProjects;

  try {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.visibility, "public"))
      .orderBy(desc(projects.updatedAt))
      .limit(48);
    return results.length > 0 ? results : defaultShowcaseProjects;
  } catch (error) {
    console.warn("[Projects] Public index unavailable:", error);
    return defaultShowcaseProjects;
  }
}

export async function listProjectsForTeam(): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(100);
  } catch (error) {
    console.warn("[Projects] Team index unavailable:", error);
    return [];
  }
}

export type ProjectAnalytics = {
  totalProjects: number;
  publicProjects: number;
  privateProjects: number;
  averageProgress: number;
  teamMembers: number;
  statusBreakdown: Record<Project["status"], number>;
  recentProjects: Project[];
  dataAvailable: boolean;
};

const emptyProjectAnalytics = (): ProjectAnalytics => ({
  totalProjects: 0,
  publicProjects: 0,
  privateProjects: 0,
  averageProgress: 0,
  teamMembers: 0,
  statusBreakdown: { idea: 0, active: 0, shipped: 0, paused: 0 },
  recentProjects: [],
  dataAvailable: false,
});

export async function getProjectAnalytics(): Promise<ProjectAnalytics> {
  const db = await getDb();
  if (!db) return emptyProjectAnalytics();

  try {
    const [allProjects, memberCount] = await Promise.all([
      db.select().from(projects).orderBy(desc(projects.updatedAt)).limit(100),
      db.select({ value: count() }).from(users),
    ]);
    const statusBreakdown = emptyProjectAnalytics().statusBreakdown;
    allProjects.forEach(project => {
      statusBreakdown[project.status] += 1;
    });
    const progressTotal = allProjects.reduce(
      (total, project) => total + project.progress,
      0
    );

    return {
      totalProjects: allProjects.length,
      publicProjects: allProjects.filter(
        project => project.visibility === "public"
      ).length,
      privateProjects: allProjects.filter(
        project => project.visibility === "private"
      ).length,
      averageProgress: allProjects.length
        ? Math.round(progressTotal / allProjects.length)
        : 0,
      teamMembers: Number(memberCount[0]?.value ?? 0),
      statusBreakdown,
      recentProjects: allProjects.slice(0, 5),
      dataAvailable: true,
    };
  } catch (error) {
    console.warn("[Analytics] Project metrics unavailable:", error);
    return emptyProjectAnalytics();
  }
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
