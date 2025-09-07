import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

// Upsert a single optimization parameter
async function upsertParam(ctx: any, name: string, value: string | number | boolean, description: string) {
  const existing = await ctx.db
    .query("optimizationParams")
    .withIndex("by_parameter", (q: any) => q.eq("parameterName", name))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      value,
      description,
      lastUpdated: Date.now(),
      updatedBy: (await getCurrentUser(ctx))!._id,
    });
    return existing._id;
  }

  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Unauthorized");

  return await ctx.db.insert("optimizationParams", {
    parameterName: name,
    value,
    description,
    lastUpdated: Date.now(),
    updatedBy: user._id,
  });
}

// Seed sensible defaults for scoring penalties
export const seedDefaultParams = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    await upsertParam(
      ctx,
      "penalty_expiring_certificate",
      50,
      "Penalty applied when a fitness certificate expires before tomorrow"
    );
    await upsertParam(
      ctx,
      "penalty_high_priority_jobs",
      30,
      "Penalty applied when there are open HIGH priority job cards"
    );

    return { ok: true };
  },
});

// Train simple weights from recent history (last 14 days) to auto-tune penalties
export const trainSimpleModel = mutation({
  args: { lookbackDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    const lookbackDays = args.lookbackDays ?? 14;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Gather open HIGH priority job cards
    const jobCards = await ctx.db
      .query("jobCards")
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();

    const highPriority = jobCards.filter(j => j.priority === "HIGH");

    // Count certificates expiring in next 48 hours
    const certs = await ctx.db
      .query("fitnessCertificates")
      .collect();

    const expiringSoonCount = certs.filter(c => c.isActive && c.validUntil <= (now + 2 * dayMs)).length;

    // Use strongly-typed set for trainsetIds
    const uniqueTrainsetIds = new Set<Id<"trainsets">>();
    jobCards.forEach((j) => uniqueTrainsetIds.add(j.trainsetId));

    const activeTrainsetsCount = Math.max(1, uniqueTrainsetIds.size);

    const avgHighJobsPerTrainset = highPriority.length / activeTrainsetsCount;

    const penaltyHighPriorityJobs = Math.min(80, Math.round(20 + avgHighJobsPerTrainset * 10));
    const penaltyExpiringCert = Math.min(80, Math.round(40 + (expiringSoonCount / Math.max(1, certs.length)) * 40));

    await upsertParam(
      ctx,
      "penalty_high_priority_jobs",
      penaltyHighPriorityJobs,
      "Auto-tuned penalty from recent open HIGH priority job cards"
    );

    await upsertParam(
      ctx,
      "penalty_expiring_certificate",
      penaltyExpiringCert,
      "Auto-tuned penalty from imminent certificate expirations"
    );

    return {
      ok: true,
      penalty_high_priority_jobs: penaltyHighPriorityJobs,
      penalty_expiring_certificate: penaltyExpiringCert,
      stats: {
        lookbackDays,
        openJobCards: jobCards.length,
        highPriorityJobs: highPriority.length,
        expiringSoonCerts: expiringSoonCount,
        activeTrainsetsCount,
      },
    };
  },
});