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
