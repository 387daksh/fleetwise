import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get all active alerts
export const getActiveAlerts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const alerts = await ctx.db
      .query("alerts")
      .filter((q) => q.eq(q.field("isResolved"), false))
      .collect();

    // Get trainset details for alerts and always include a `trainset` field (null if not present)
    const alertsWithTrainsets = await Promise.all(
      alerts.map(async (alert) => {
        const trainset = alert.trainsetId ? await ctx.db.get(alert.trainsetId) : null;
        return { ...alert, trainset };
      })
    );

    return alertsWithTrainsets.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  },
});

// Mark alert as read
export const markAlertAsRead = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.alertId, {
      isRead: true,
    });
  },
});

// Resolve alert
export const resolveAlert = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.alertId, {
      isResolved: true,
      resolvedBy: user._id,
      resolvedAt: Date.now(),
    });
  },
});

// Create new alert
export const createAlert = mutation({
  args: {
    type: v.string(),
    severity: v.string(),
    title: v.string(),
    message: v.string(),
    trainsetId: v.optional(v.id("trainsets")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      type: args.type as any,
      severity: args.severity as any,
      title: args.title,
      message: args.message,
      trainsetId: args.trainsetId,
      isRead: false,
      isResolved: false,
    });
  },
});