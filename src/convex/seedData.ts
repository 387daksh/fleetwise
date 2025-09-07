import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample trainsets
    const trainsetIds = [];
    
    for (let i = 1; i <= 25; i++) {
      const trainsetId = await ctx.db.insert("trainsets", {
        trainsetNumber: `KM-${i.toString().padStart(3, '0')}`,
        manufacturer: i <= 15 ? "Alstom" : "BEML",
        yearOfManufacture: 2017 + (i % 5),
        totalMileage: Math.floor(Math.random() * 100000) + 50000,
        currentStatus: ["active", "standby", "maintenance"][Math.floor(Math.random() * 3)] as any,
        currentLocation: i <= 12 ? "Aluva Depot" : "Petta Depot",
        lastMaintenanceDate: Date.now() - (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        nextScheduledMaintenance: Date.now() + (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        brandingContract: Math.random() > 0.7 ? `ADV-${Math.floor(Math.random() * 10) + 1}` : undefined,
        brandingExpiryDate: Math.random() > 0.7 ? Date.now() + (Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000) : undefined,
        isActive: true,
      });
      trainsetIds.push(trainsetId);
    }

    // Create fitness certificates for each trainset
    for (const trainsetId of trainsetIds) {
      const certTypes = ["rolling_stock", "signalling", "telecom"] as const;
      
      for (const certType of certTypes) {
        await ctx.db.insert("fitnessCertificates", {
          trainsetId,
          certificateType: certType,
          issuedBy: `${certType.toUpperCase()} Department`,
          issuedDate: Date.now() - (Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          validFrom: Date.now() - (Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
          validUntil: Date.now() + (Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
          certificateNumber: `${certType.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
          isActive: true,
          remarks: Math.random() > 0.8 ? "Renewal required soon" : undefined,
        });
      }
    }

    // Create some job cards
    for (let i = 0; i < 15; i++) {
      const trainsetId = trainsetIds[Math.floor(Math.random() * trainsetIds.length)];
      
      await ctx.db.insert("jobCards", {
        trainsetId,
        maximoWorkOrderId: `WO-${Math.floor(Math.random() * 100000)}`,
        title: [
          "Brake Pad Replacement",
          "HVAC System Maintenance", 
          "Door Mechanism Repair",
          "Bogie Inspection",
          "Electrical System Check"
        ][Math.floor(Math.random() * 5)],
        description: "Scheduled maintenance work as per preventive maintenance plan",
        priority: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)],
        status: ["open", "in_progress", "closed"][Math.floor(Math.random() * 3)] as any,
        assignedTo: `Technician ${Math.floor(Math.random() * 10) + 1}`,
        estimatedHours: Math.floor(Math.random() * 8) + 2,
        scheduledDate: Date.now() + (Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        components: ["Brake System", "HVAC", "Doors", "Electrical"],
        cost: Math.floor(Math.random() * 50000) + 10000,
      });
    }

    // Create some alerts
    const alertTypes = ["fitness_expiry", "maintenance_due", "branding_breach", "mileage_imbalance"] as const;
    const severities = ["low", "medium", "high", "critical"] as const;
    
    for (let i = 0; i < 8; i++) {
      const trainsetId = Math.random() > 0.3 ? trainsetIds[Math.floor(Math.random() * trainsetIds.length)] : undefined;
      
      await ctx.db.insert("alerts", {
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: [
          "Fitness Certificate Expiring Soon",
          "Maintenance Overdue",
          "Branding Contract Breach Risk",
          "Mileage Imbalance Detected"
        ][Math.floor(Math.random() * 4)],
        message: "This alert requires immediate attention from the operations team.",
        trainsetId,
        isRead: Math.random() > 0.5,
        isResolved: false,
      });
    }

    // Create maintenance slots
    const today = new Date();
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      
      for (let slot = 1; slot <= 8; slot++) {
        await ctx.db.insert("maintenanceSlots", {
          date: dateStr,
          slotNumber: slot,
          bayLocation: `Bay ${Math.ceil(slot / 2)}`,
          slotType: ["cleaning", "inspection", "repair"][Math.floor(Math.random() * 3)] as any,
          duration: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
          assignedTrainset: Math.random() > 0.6 ? trainsetIds[Math.floor(Math.random() * trainsetIds.length)] : undefined,
          assignedCrew: Math.random() > 0.6 ? `Crew ${Math.floor(Math.random() * 5) + 1}` : undefined,
          status: ["available", "booked", "in_progress", "completed"][Math.floor(Math.random() * 4)] as any,
        });
      }
    }

    return { message: "Database seeded successfully", trainsetCount: trainsetIds.length };
  },
});
