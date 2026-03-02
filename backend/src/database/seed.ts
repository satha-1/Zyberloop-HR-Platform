import bcrypt from "bcryptjs";
import { connectDatabase } from "./connection";
import { User } from "../modules/users/user.model";
import { config } from "../config";

import { LeaveType } from "../modules/leave/leaveType.model";

async function seedData() {
  try {
    await connectDatabase();

    // Seed Admin
    const existingAdmin = await User.findOne({ email: config.admin.seedEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(config.admin.seedPassword, 10);
      const admin = new User({
        email: config.admin.seedEmail,
        passwordHash,
        name: "System Administrator",
        roles: ["ADMIN", "SYSTEM_ADMIN", "HR_ADMIN"],
        status: "ACTIVE",
      });
      await admin.save();
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Seed Leave Types
    const existingLeaveTypes = await LeaveType.countDocuments();
    if (existingLeaveTypes === 0) {
      const defaultLeaveTypes = [
        {
          code: "ANNUAL",
          name: "Annual Leave",
          entitlementDays: 14,
          accrualRule: { perMonth: 0 }, // Handled by complex annual logic in controller
        },
        {
          code: "SICK",
          name: "Sick Leave",
          entitlementDays: 14,
          accrualRule: { perMonth: 0 }, // Handled by complex annual logic in controller
        },
        {
          code: "CASUAL",
          name: "Casual Leave",
          entitlementDays: 7,
          accrualRule: { perMonth: 0.5 },
        },
      ];
      await LeaveType.insertMany(defaultLeaveTypes);
      console.log("✅ Default leave types seeded successfully");
    } else {
      console.log("✅ Leave types already exist");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
