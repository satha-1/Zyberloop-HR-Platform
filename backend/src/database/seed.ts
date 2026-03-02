import bcrypt from "bcryptjs";
import { connectDatabase } from "./connection";
import { User } from "../modules/users/user.model";
import { config } from "../config";
import { LeaveType } from "../modules/leave/leaveType.model";
import { Employee } from "../modules/employees/employee.model";
import { Department } from "../modules/departments/department.model";

const generateNextEmployeeCode = async (): Promise<string> => {
  // Randomized code generation with uniqueness check.
  for (let i = 0; i < 10; i += 1) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const candidate = `EMP-${randomNumber}`;
    const exists = await Employee.exists({ employeeCode: candidate });
    if (!exists) {
      return candidate;
    }
  }
  // Fallback to timestamp-based suffix if random collisions occur repeatedly.
  const fallback = `EMP-${Date.now().toString().slice(-6)}`;
  return fallback;
};

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

    // Seed Employees
    const existingEmployeeCount = await Employee.countDocuments();
    const departments = await Department.find({ status: "ACTIVE" });
    
    if (departments.length === 0) {
      console.log("⚠️  No departments found. Please create departments first before seeding employees.");
    } else {
      const employeesToSeed = [
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 1).padStart(4, "0")}`,
          firstName: "Sarah",
          lastName: "Johnson",
          fullName: "Sarah Johnson",
          initials: "S.J.",
          preferredName: "Sarah",
          email: `sarah.johnson${existingEmployeeCount + 1}@company.com`,
          phone: "+94771234567",
          dob: new Date("1990-05-15"),
          currentAddress: "123 Main Street, Colombo 05",
          permanentAddress: "123 Main Street, Colombo 05",
          jobTitle: "Senior Software Engineer",
          employmentType: "permanent" as const,
          workLocation: "Head Office - Colombo",
          hireDate: new Date("2022-01-15"),
          status: "active" as const,
          salary: 125000,
          emergencyContact: {
            name: "John Johnson",
            relationship: "Spouse",
            phone: "+94771234568",
            email: "john.johnson@email.com",
          },
        },
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 2).padStart(4, "0")}`,
          firstName: "Michael",
          lastName: "Chen",
          fullName: "Michael Chen",
          initials: "M.C.",
          preferredName: "Mike",
          email: `michael.chen${existingEmployeeCount + 2}@company.com`,
          phone: "+94772345678",
          dob: new Date("1988-08-22"),
          currentAddress: "456 Park Avenue, Kandy",
          permanentAddress: "456 Park Avenue, Kandy",
          jobTitle: "HR Manager",
          employmentType: "permanent" as const,
          workLocation: "Regional Office - Kandy",
          hireDate: new Date("2021-03-10"),
          status: "active" as const,
          salary: 150000,
          emergencyContact: {
            name: "Lisa Chen",
            relationship: "Sister",
            phone: "+94772345679",
            email: "lisa.chen@email.com",
          },
        },
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 3).padStart(4, "0")}`,
          firstName: "Emily",
          lastName: "Rodriguez",
          fullName: "Emily Rodriguez",
          initials: "E.R.",
          preferredName: "Emily",
          email: `emily.rodriguez${existingEmployeeCount + 3}@company.com`,
          phone: "+94773456789",
          dob: new Date("1992-11-30"),
          currentAddress: "789 Beach Road, Galle",
          permanentAddress: "789 Beach Road, Galle",
          jobTitle: "Marketing Executive",
          employmentType: "permanent" as const,
          workLocation: "Head Office - Colombo",
          hireDate: new Date("2023-06-01"),
          status: "active" as const,
          salary: 85000,
          emergencyContact: {
            name: "Carlos Rodriguez",
            relationship: "Father",
            phone: "+94773456790",
            email: "carlos.rodriguez@email.com",
          },
        },
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 4).padStart(4, "0")}`,
          firstName: "David",
          lastName: "Williams",
          fullName: "David Williams",
          initials: "D.W.",
          preferredName: "Dave",
          email: `david.williams${existingEmployeeCount + 4}@company.com`,
          phone: "+94774567890",
          dob: new Date("1985-02-14"),
          currentAddress: "321 Business District, Colombo 03",
          permanentAddress: "321 Business District, Colombo 03",
          jobTitle: "Finance Analyst",
          employmentType: "permanent" as const,
          workLocation: "Head Office - Colombo",
          hireDate: new Date("2020-09-20"),
          status: "active" as const,
          salary: 110000,
          emergencyContact: {
            name: "Mary Williams",
            relationship: "Wife",
            phone: "+94774567891",
            email: "mary.williams@email.com",
          },
        },
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 5).padStart(4, "0")}`,
          firstName: "Priya",
          lastName: "Fernando",
          fullName: "Priya Fernando",
          initials: "P.F.",
          preferredName: "Priya",
          email: `priya.fernando${existingEmployeeCount + 5}@company.com`,
          phone: "+94775678901",
          dob: new Date("1995-07-08"),
          currentAddress: "654 Hill Street, Nuwara Eliya",
          permanentAddress: "654 Hill Street, Nuwara Eliya",
          jobTitle: "Junior Developer",
          employmentType: "contract" as const,
          workLocation: "Remote",
          hireDate: new Date("2024-01-10"),
          status: "active" as const,
          salary: 65000,
          emergencyContact: {
            name: "Ravi Fernando",
            relationship: "Brother",
            phone: "+94775678902",
            email: "ravi.fernando@email.com",
          },
        },
        {
          employeeNumber: `EMP${String(existingEmployeeCount + 6).padStart(4, "0")}`,
          firstName: "James",
          lastName: "Wilson",
          fullName: "James Wilson",
          initials: "J.W.",
          preferredName: "James",
          email: `james.wilson${existingEmployeeCount + 6}@company.com`,
          phone: "+94776789012",
          dob: new Date("1987-12-25"),
          currentAddress: "987 Corporate Tower, Colombo 07",
          permanentAddress: "987 Corporate Tower, Colombo 07",
          jobTitle: "Operations Manager",
          employmentType: "permanent" as const,
          workLocation: "Head Office - Colombo",
          hireDate: new Date("2019-11-05"),
          status: "active" as const,
          salary: 140000,
          emergencyContact: {
            name: "Susan Wilson",
            relationship: "Wife",
            phone: "+94776789013",
            email: "susan.wilson@email.com",
          },
        },
      ];

      let createdCount = 0;
      for (const empData of employeesToSeed) {
        // Check if employee already exists
        const existingEmployee = await Employee.findOne({
          $or: [
            { email: empData.email },
            { employeeNumber: empData.employeeNumber },
          ],
        });

        if (!existingEmployee) {
          // Assign random department
          const randomDept = departments[Math.floor(Math.random() * departments.length)];
          
          // Generate employee code
          const employeeCode = await generateNextEmployeeCode();

          const employee = new Employee({
            ...empData,
            employeeCode,
            departmentId: randomDept._id,
            // Optionally assign manager (first employee can be manager for others)
            managerId: createdCount > 0 && Math.random() > 0.5 
              ? (await Employee.findOne({ jobTitle: { $regex: /Manager|Senior/i } }))?._id 
              : undefined,
          });

          await employee.save();
          createdCount++;
          console.log(`✅ Created employee: ${empData.fullName} (${employeeCode})`);
        } else {
          console.log(`⏭️  Employee ${empData.fullName} already exists, skipping...`);
        }
      }

      if (createdCount > 0) {
        console.log(`✅ Successfully seeded ${createdCount} new employees`);
      } else {
        console.log("✅ All employees already exist in database");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
