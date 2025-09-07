import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get all trainsets with their current status
export const getAllTrainsets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("trainsets")
      .withIndex("by_status")
      .collect();
  },
});

// Get trainset by number
export const getTrainsetByNumber = query({
  args: { trainsetNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("trainsets")
      .withIndex("by_trainset_number", (q) => 
        q.eq("trainsetNumber", args.trainsetNumber)
      )
      .unique();
  },
});

// Get trainsets by status
export const getTrainsetsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("trainsets")
      .withIndex("by_status", (q) => 
        q.eq("currentStatus", args.status as any)
      )
      .collect();
  },
});

// Create new trainset
export const createTrainset = mutation({
  args: {
    trainsetNumber: v.string(),
    manufacturer: v.string(),
    yearOfManufacture: v.number(),
    currentLocation: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("trainsets", {
      ...args,
      totalMileage: 0,
      currentStatus: "standby",
      isActive: true,
    });
  },
});

// Update trainset status
export const updateTrainsetStatus = mutation({
  args: {
    trainsetId: v.id("trainsets"),
    status: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      currentStatus: args.status,
    };

    if (args.location) {
      updates.currentLocation = args.location;
    }

    return await ctx.db.patch(args.trainsetId, updates);
  },
});

// Get trainset dashboard stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const trainsets = await ctx.db.query("trainsets").collect();
    
    const stats = {
      total: trainsets.length,
      active: trainsets.filter(t => t.currentStatus === "active").length,
      standby: trainsets.filter(t => t.currentStatus === "standby").length,
      maintenance: trainsets.filter(t => t.currentStatus === "maintenance").length,
      outOfService: trainsets.filter(t => t.currentStatus === "out_of_service").length,
    };

    return stats;
  },
});

export const bulkUpsertTrainsets = mutation({
  args: {
    rows: v.array(
      v.object({
        trainsetNumber: v.string(),
        manufacturer: v.string(),
        yearOfManufacture: v.number(),
        currentLocation: v.string(),
        totalMileage: v.optional(v.number()),
        currentStatus: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      throw new Error("Unauthorized");
    }

    const results: Array<{ trainsetNumber: string; _id: any; action: "inserted" | "updated" }> = [];

    for (const row of args.rows) {
      const existing = await ctx.db
        .query("trainsets")
        .withIndex("by_trainset_number", (q) => q.eq("trainsetNumber", row.trainsetNumber))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          manufacturer: row.manufacturer,
          yearOfManufacture: row.yearOfManufacture,
          currentLocation: row.currentLocation,
          ...(row.totalMileage !== undefined ? { totalMileage: row.totalMileage } : {}),
          ...(row.currentStatus ? { currentStatus: row.currentStatus as any } : {}),
          ...(row.isActive !== undefined ? { isActive: row.isActive } : {}),
        });
        results.push({ trainsetNumber: row.trainsetNumber, _id: existing._id, action: "updated" });
      } else {
        const _id = await ctx.db.insert("trainsets", {
          trainsetNumber: row.trainsetNumber,
          manufacturer: row.manufacturer,
          yearOfManufacture: row.yearOfManufacture,
          totalMileage: row.totalMileage ?? 0,
          currentStatus: (row.currentStatus ?? "standby") as any,
          currentLocation: row.currentLocation,
          isActive: row.isActive ?? true,
        });
        results.push({ trainsetNumber: row.trainsetNumber, _id, action: "inserted" });
      }
    }

    return results;
  },
});