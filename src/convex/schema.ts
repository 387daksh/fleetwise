import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles for the metro system
export const ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor", 
  OPERATOR: "operator",
  MAINTENANCE: "maintenance",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.SUPERVISOR),
  v.literal(ROLES.OPERATOR),
  v.literal(ROLES.MAINTENANCE),
);
export type Role = Infer<typeof roleValidator>;

// Trainset status types
export const TRAINSET_STATUS = {
  ACTIVE: "active",
  STANDBY: "standby",
  MAINTENANCE: "maintenance",
  OUT_OF_SERVICE: "out_of_service",
} as const;

export const trainsetStatusValidator = v.union(
  v.literal(TRAINSET_STATUS.ACTIVE),
  v.literal(TRAINSET_STATUS.STANDBY),
  v.literal(TRAINSET_STATUS.MAINTENANCE),
  v.literal(TRAINSET_STATUS.OUT_OF_SERVICE),
);

// Fitness certificate types
export const FITNESS_CERT_TYPES = {
  ROLLING_STOCK: "rolling_stock",
  SIGNALLING: "signalling",
  TELECOM: "telecom",
} as const;

export const fitnessCertTypeValidator = v.union(
  v.literal(FITNESS_CERT_TYPES.ROLLING_STOCK),
  v.literal(FITNESS_CERT_TYPES.SIGNALLING),
  v.literal(FITNESS_CERT_TYPES.TELECOM),
);

// Job card status
export const JOB_CARD_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",
  CANCELLED: "cancelled",
} as const;

export const jobCardStatusValidator = v.union(
  v.literal(JOB_CARD_STATUS.OPEN),
  v.literal(JOB_CARD_STATUS.IN_PROGRESS),
  v.literal(JOB_CARD_STATUS.CLOSED),
  v.literal(JOB_CARD_STATUS.CANCELLED),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      department: v.optional(v.string()),
      employeeId: v.optional(v.string()),
    }).index("email", ["email"]),

    // Trainset master data
    trainsets: defineTable({
      trainsetNumber: v.string(),
      manufacturer: v.string(),
      yearOfManufacture: v.number(),
      totalMileage: v.number(),
      currentStatus: trainsetStatusValidator,
      currentLocation: v.string(), // depot/station
      lastMaintenanceDate: v.optional(v.number()),
      nextScheduledMaintenance: v.optional(v.number()),
      brandingContract: v.optional(v.string()),
      brandingExpiryDate: v.optional(v.number()),
      isActive: v.boolean(),
    })
      .index("by_trainset_number", ["trainsetNumber"])
      .index("by_status", ["currentStatus"])
      .index("by_location", ["currentLocation"]),

    // Fitness certificates
    fitnessCertificates: defineTable({
      trainsetId: v.id("trainsets"),
      certificateType: fitnessCertTypeValidator,
      issuedBy: v.string(),
      issuedDate: v.number(),
      validFrom: v.number(),
      validUntil: v.number(),
      certificateNumber: v.string(),
      isActive: v.boolean(),
      remarks: v.optional(v.string()),
    })
      .index("by_trainset", ["trainsetId"])
      .index("by_type_and_trainset", ["certificateType", "trainsetId"])
      .index("by_validity", ["validFrom", "validUntil"]),

    // Job cards from Maximo
    jobCards: defineTable({
      trainsetId: v.id("trainsets"),
      maximoWorkOrderId: v.string(),
      title: v.string(),
      description: v.string(),
      priority: v.string(), // HIGH, MEDIUM, LOW
      status: jobCardStatusValidator,
      assignedTo: v.optional(v.string()),
      estimatedHours: v.optional(v.number()),
      actualHours: v.optional(v.number()),
      scheduledDate: v.optional(v.number()),
      completedDate: v.optional(v.number()),
      components: v.array(v.string()),
      cost: v.optional(v.number()),
    })
      .index("by_trainset", ["trainsetId"])
      .index("by_status", ["status"])
      .index("by_priority", ["priority"])
      .index("by_maximo_id", ["maximoWorkOrderId"]),

    // Daily induction decisions
    inductionDecisions: defineTable({
      date: v.string(), // YYYY-MM-DD format
      trainsetId: v.id("trainsets"),
      decision: v.union(
        v.literal("revenue_service"),
        v.literal("standby"),
        v.literal("maintenance")
      ),
      priority: v.number(), // 1-25 ranking
      reasoning: v.string(),
      constraints: v.array(v.string()),
      conflictAlerts: v.array(v.string()),
      approvedBy: v.optional(v.id("users")),
      approvedAt: v.optional(v.number()),
      actualOutcome: v.optional(v.string()),
      performanceScore: v.optional(v.number()),
    })
      .index("by_date", ["date"])
      .index("by_trainset_and_date", ["trainsetId", "date"])
      .index("by_decision", ["decision"]),

    // Mileage tracking
    mileageRecords: defineTable({
      trainsetId: v.id("trainsets"),
      date: v.string(),
      startMileage: v.number(),
      endMileage: v.number(),
      dailyMileage: v.number(),
      route: v.string(),
      driverRemarks: v.optional(v.string()),
    })
      .index("by_trainset", ["trainsetId"])
      .index("by_date", ["date"])
      .index("by_trainset_and_date", ["trainsetId", "date"]),

    // Cleaning and maintenance slots
    maintenanceSlots: defineTable({
      date: v.string(),
      slotNumber: v.number(),
      bayLocation: v.string(),
      slotType: v.union(
        v.literal("cleaning"),
        v.literal("inspection"),
        v.literal("repair"),
        v.literal("deep_maintenance")
      ),
      duration: v.number(), // hours
      assignedTrainset: v.optional(v.id("trainsets")),
      assignedCrew: v.optional(v.string()),
      status: v.union(
        v.literal("available"),
        v.literal("booked"),
        v.literal("in_progress"),
        v.literal("completed")
      ),
    })
      .index("by_date", ["date"])
      .index("by_bay", ["bayLocation"])
      .index("by_date_and_bay", ["date", "bayLocation"]),

    // Branding contracts and priorities
    brandingContracts: defineTable({
      contractId: v.string(),
      advertiser: v.string(),
      contractValue: v.number(),
      startDate: v.number(),
      endDate: v.number(),
      minimumExposureHours: v.number(),
      currentExposureHours: v.number(),
      assignedTrainsets: v.array(v.id("trainsets")),
      penaltyClause: v.string(),
      isActive: v.boolean(),
    })
      .index("by_contract_id", ["contractId"])
      .index("by_advertiser", ["advertiser"])
      .index("by_active", ["isActive"]),

    // System alerts and notifications
    alerts: defineTable({
      type: v.union(
        v.literal("fitness_expiry"),
        v.literal("maintenance_due"),
        v.literal("branding_breach"),
        v.literal("mileage_imbalance"),
        v.literal("system_error")
      ),
      severity: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      title: v.string(),
      message: v.string(),
      trainsetId: v.optional(v.id("trainsets")),
      isRead: v.boolean(),
      isResolved: v.boolean(),
      resolvedBy: v.optional(v.id("users")),
      resolvedAt: v.optional(v.number()),
    })
      .index("by_severity", ["severity"])
      .index("by_type", ["type"])
      .index("by_read_status", ["isRead"])
      .index("by_trainset", ["trainsetId"]),

    // Optimization parameters and ML model data
    optimizationParams: defineTable({
      parameterName: v.string(),
      value: v.union(v.string(), v.number(), v.boolean()),
      description: v.string(),
      lastUpdated: v.number(),
      updatedBy: v.id("users"),
    }).index("by_parameter", ["parameterName"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;