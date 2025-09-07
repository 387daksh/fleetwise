import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

// Get today's induction decisions
export const getTodayInductions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const today = new Date().toISOString().split('T')[0];
    
    const decisions = await ctx.db
      .query("inductionDecisions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    // Get trainset details for each decision
    const decisionsWithTrainsets = await Promise.all(
      decisions.map(async (decision) => {
        const trainset = await ctx.db.get(decision.trainsetId);
        return {
          ...decision,
          trainset,
        };
      })
    );

    return decisionsWithTrainsets.sort((a, b) => a.priority - b.priority);
  },
});

// Generate induction recommendations
export const generateInductionRecommendations = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    // Get all active trainsets
    const trainsets = await ctx.db
      .query("trainsets")
      .withIndex("by_status", (q) => q.eq("currentStatus", "active"))
      .collect();

    // Get fitness certificates for each trainset
    const recommendations: Array<{
      trainsetId: Id<"trainsets">;
      trainsetNumber: string;
      decision: "revenue_service" | "standby" | "maintenance";
      score: number;
      constraints: string[];
      conflicts: string[];
      reasoning: string;
      priority?: number;
    }> = [];
    
    for (let i = 0; i < trainsets.length; i++) {
      const trainset = trainsets[i];
      
      // Check fitness certificates
      const certificates = await ctx.db
        .query("fitnessCertificates")
        .withIndex("by_trainset", (q) => q.eq("trainsetId", trainset._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Check job cards
      const openJobCards = await ctx.db
        .query("jobCards")
        .withIndex("by_trainset", (q) => q.eq("trainsetId", trainset._id))
        .filter((q) => q.neq(q.field("status"), "closed"))
        .collect();

      // Simple scoring algorithm
      let score = 100;
      const constraints: string[] = [];
      const conflicts: string[] = [];

      // Check certificate validity
      const tomorrow = new Date(args.date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTime = tomorrow.getTime();

      certificates.forEach(cert => {
        if (cert.validUntil < tomorrowTime) {
          score -= 50;
          constraints.push(`${cert.certificateType} certificate expires soon`);
        }
      });

      // Check open job cards
      if (openJobCards.length > 0) {
        const highPriorityJobs = openJobCards.filter(job => job.priority === "HIGH");
        if (highPriorityJobs.length > 0) {
          score -= 30;
          constraints.push(`${highPriorityJobs.length} high priority job cards open`);
        }
      }

      // Determine recommendation
      let decision: "revenue_service" | "standby" | "maintenance" = "revenue_service";
      if (score < 50) {
        decision = "maintenance";
      } else if (score < 70) {
        decision = "standby";
      }

      recommendations.push({
        trainsetId: trainset._id,
        trainsetNumber: trainset.trainsetNumber,
        decision,
        score,
        constraints,
        conflicts,
        reasoning: `Score: ${score}/100. ${constraints.join('. ')}`,
      });
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    // Assign priorities
    recommendations.forEach((rec, index) => {
      rec.priority = index + 1;
    });

    return recommendations;
  },
});

// Save induction decisions
export const saveInductionDecisions = mutation({
  args: {
    date: v.string(),
    decisions: v.array(v.object({
      trainsetId: v.id("trainsets"),
      decision: v.string(),
      priority: v.number(),
      reasoning: v.string(),
      constraints: v.array(v.string()),
      conflictAlerts: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    // Delete existing decisions for the date
    const existing = await ctx.db
      .query("inductionDecisions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    for (const decision of existing) {
      await ctx.db.delete(decision._id);
    }

    // Insert new decisions
    const results = [];
    for (const decision of args.decisions) {
      const result = await ctx.db.insert("inductionDecisions", {
        date: args.date,
        trainsetId: decision.trainsetId,
        decision: decision.decision as any,
        priority: decision.priority,
        reasoning: decision.reasoning,
        constraints: decision.constraints,
        conflictAlerts: decision.conflictAlerts,
        approvedBy: user._id,
        approvedAt: Date.now(),
      });
      results.push(result);
    }

    return results;
  },
});