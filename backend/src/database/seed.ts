import bcrypt from "bcryptjs";
import { connectDatabase } from "./connection";
import { User } from "../modules/users/user.model";
import { config } from "../config";
import { LeaveType } from "../modules/leave/leaveType.model";
import { Employee } from "../modules/employees/employee.model";
import { Department } from "../modules/departments/department.model";
import { generateEmployeeNumber } from "../modules/employees/employeeNumber.service";
import { getNextEmployeeCode } from "../modules/employees/employeeCode.service";
import { generateDepartmentCode } from "../modules/departments/departmentCode.service";
import { seedComplianceFilingTypes } from "../modules/compliance/compliance.seed";

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

    // Seed Compliance Filing Types
    await seedComplianceFilingTypes();

    // Seed Leave Types
    const existingLeaveTypes = await LeaveType.countDocuments();
    if (existingLeaveTypes === 0) {
      const defaultLeaveTypes = [
        {
          code: "ANNUAL",
          name: "Annual Leave",
          entitlementDays: 14,
          accrualRule: { perMonth: 0 },
        },
        {
          code: "SICK",
          name: "Sick Leave",
          entitlementDays: 14,
          accrualRule: { perMonth: 0 },
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

    // Seed Departments
    const departmentsToSeed = [
      {
        name: "Human Resources",
        // code will be auto-generated with unique number
        description: "Handles recruitment, onboarding, employee relations, payroll coordination, and talent management",
        location: "Head Office - Colombo",
        costCenter: "CC-1001",
        status: "ACTIVE" as const,
        email: "hr@company.com",
        phoneExt: "100",
      },
      {
        name: "Information Technology",
        // code will be auto-generated with unique number
        description: "Manages IT infrastructure, software development, system administration, and technical support",
        location: "Head Office - Colombo",
        costCenter: "CC-2001",
        status: "ACTIVE" as const,
        email: "it@company.com",
        phoneExt: "200",
      },
      {
        name: "Finance",
        // code will be auto-generated with unique number
        description: "Handles accounting, financial planning, budgeting, and financial reporting",
        location: "Head Office - Colombo",
        costCenter: "CC-3001",
        status: "ACTIVE" as const,
        email: "finance@company.com",
        phoneExt: "300",
      },
      {
        name: "Marketing",
        // code will be auto-generated with unique number
        description: "Manages brand promotion, digital marketing, advertising, and market research",
        location: "Head Office - Colombo",
        costCenter: "CC-4001",
        status: "ACTIVE" as const,
        email: "marketing@company.com",
        phoneExt: "400",
      },
      {
        name: "Operations",
        // code will be auto-generated with unique number
        description: "Oversees day-to-day operations, process improvement, and operational efficiency",
        location: "Head Office - Colombo",
        costCenter: "CC-5001",
        status: "ACTIVE" as const,
        email: "operations@company.com",
        phoneExt: "500",
      },
      {
        name: "Sales",
        // code will be auto-generated with unique number
        description: "Manages sales activities, customer acquisition, and revenue generation",
        location: "Head Office - Colombo",
        costCenter: "CC-6001",
        status: "ACTIVE" as const,
        email: "sales@company.com",
        phoneExt: "600",
      },
      {
        name: "Customer Service",
        // code will be auto-generated with unique number
        description: "Handles customer support, inquiries, and relationship management",
        location: "Head Office - Colombo",
        costCenter: "CC-7001",
        status: "ACTIVE" as const,
        email: "support@company.com",
        phoneExt: "700",
      },
    ];

    const createdDepartments: any[] = [];
    let deptCreatedCount = 0;

    for (const deptData of departmentsToSeed) {
      // Check if department exists by name (since code will be auto-generated)
      const existingDept = await Department.findOne({ name: deptData.name });
      if (!existingDept) {
        // Generate unique code using the global sequence
        const deptCode = await generateDepartmentCode(deptData.name);
        const department = new Department({
          name: deptData.name,
          code: deptCode,
          description: deptData.description,
          location: deptData.location,
          costCenter: deptData.costCenter,
          status: deptData.status,
          email: deptData.email,
          phoneExt: deptData.phoneExt,
          effectiveFrom: new Date(),
        });
        await department.save();
        createdDepartments.push(department);
        deptCreatedCount++;
        console.log(`✅ Created department: ${deptData.name} (${deptCode})`);
      } else {
        createdDepartments.push(existingDept);
        console.log(`⏭️  Department ${deptData.name} already exists (${existingDept.code})`);
      }
    }

    if (deptCreatedCount > 0) {
      console.log(`✅ Successfully seeded ${deptCreatedCount} new departments`);
    }

    // Seed Employees - Job titles matched to departments
    const employeesToSeed = [
      // HR Department Employees
      {
        departmentCode: "HR-001",
        firstName: "Michael",
        lastName: "Chen",
        fullName: "Michael Chen",
        initials: "M.C.",
        preferredName: "Mike",
        email: "michael.chen@company.com",
        phone: "+94771234567",
        dob: new Date("1988-08-22"),
        currentAddress: "123 HR Street, Colombo 05",
        permanentAddress: "123 HR Street, Colombo 05",
        jobTitle: "HR Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2021-03-10"),
        status: "active" as const,
        salary: 150000,
        emergencyContact: {
          name: "Lisa Chen",
          relationship: "Sister",
          phone: "+94771234568",
          email: "lisa.chen@email.com",
        },
      },
      {
        departmentCode: "HR-001",
        firstName: "Priya",
        lastName: "Fernando",
        fullName: "Priya Fernando",
        initials: "P.F.",
        preferredName: "Priya",
        email: "priya.fernando@company.com",
        phone: "+94772345678",
        dob: new Date("1992-05-15"),
        currentAddress: "456 HR Avenue, Colombo 07",
        permanentAddress: "456 HR Avenue, Colombo 07",
        jobTitle: "HR Executive",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2023-01-15"),
        status: "active" as const,
        salary: 95000,
        emergencyContact: {
          name: "Ravi Fernando",
          relationship: "Brother",
          phone: "+94772345679",
          email: "ravi.fernando@email.com",
        },
      },
      {
        departmentCode: "HR-001",
        firstName: "Nimal",
        lastName: "Perera",
        fullName: "Nimal Perera",
        initials: "N.P.",
        preferredName: "Nimal",
        email: "nimal.perera@company.com",
        phone: "+94773456789",
        dob: new Date("1995-11-20"),
        currentAddress: "789 HR Road, Kandy",
        permanentAddress: "789 HR Road, Kandy",
        jobTitle: "Recruitment Specialist",
        employmentType: "permanent" as const,
        workLocation: "Regional Office - Kandy",
        hireDate: new Date("2024-02-01"),
        status: "active" as const,
        salary: 75000,
        emergencyContact: {
          name: "Kamani Perera",
          relationship: "Wife",
          phone: "+94773456790",
          email: "kamani.perera@email.com",
        },
      },
      // IT Department Employees
      {
        departmentCode: "IT-001",
        firstName: "Sarah",
        lastName: "Johnson",
        fullName: "Sarah Johnson",
        initials: "S.J.",
        preferredName: "Sarah",
        email: "sarah.johnson@company.com",
        phone: "+94774567890",
        dob: new Date("1990-05-15"),
        currentAddress: "123 Tech Street, Colombo 05",
        permanentAddress: "123 Tech Street, Colombo 05",
        jobTitle: "Senior Software Engineer",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2022-01-15"),
        status: "active" as const,
        salary: 125000,
        emergencyContact: {
          name: "John Johnson",
          relationship: "Spouse",
          phone: "+94774567891",
          email: "john.johnson@email.com",
        },
      },
      {
        departmentCode: "IT-001",
        firstName: "David",
        lastName: "Silva",
        fullName: "David Silva",
        initials: "D.S.",
        preferredName: "Dave",
        email: "david.silva@company.com",
        phone: "+94775678901",
        dob: new Date("1993-07-10"),
        currentAddress: "456 Tech Avenue, Colombo 07",
        permanentAddress: "456 Tech Avenue, Colombo 07",
        jobTitle: "Software Developer",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2023-06-01"),
        status: "active" as const,
        salary: 95000,
        emergencyContact: {
          name: "Maria Silva",
          relationship: "Sister",
          phone: "+94775678902",
          email: "maria.silva@email.com",
        },
      },
      {
        departmentCode: "IT-001",
        firstName: "Amal",
        lastName: "Wickramasinghe",
        fullName: "Amal Wickramasinghe",
        initials: "A.W.",
        preferredName: "Amal",
        email: "amal.wickramasinghe@company.com",
        phone: "+94776789012",
        dob: new Date("1996-03-25"),
        currentAddress: "789 Tech Road, Galle",
        permanentAddress: "789 Tech Road, Galle",
        jobTitle: "Junior Developer",
        employmentType: "contract" as const,
        workLocation: "Remote",
        hireDate: new Date("2024-01-10"),
        status: "active" as const,
        salary: 65000,
        emergencyContact: {
          name: "Sunil Wickramasinghe",
          relationship: "Father",
          phone: "+94776789013",
          email: "sunil.wickramasinghe@email.com",
        },
      },
      {
        departmentCode: "IT-001",
        firstName: "James",
        lastName: "Wilson",
        fullName: "James Wilson",
        initials: "J.W.",
        preferredName: "James",
        email: "james.wilson@company.com",
        phone: "+94777890123",
        dob: new Date("1987-12-25"),
        currentAddress: "321 IT Tower, Colombo 03",
        permanentAddress: "321 IT Tower, Colombo 03",
        jobTitle: "IT Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2019-11-05"),
        status: "active" as const,
        salary: 140000,
        emergencyContact: {
          name: "Susan Wilson",
          relationship: "Wife",
          phone: "+94777890124",
          email: "susan.wilson@email.com",
        },
      },
      // Finance Department Employees
      {
        departmentCode: "FIN-001",
        firstName: "David",
        lastName: "Williams",
        fullName: "David Williams",
        initials: "D.W.",
        preferredName: "Dave",
        email: "david.williams@company.com",
        phone: "+94778901234",
        dob: new Date("1985-02-14"),
        currentAddress: "123 Finance Street, Colombo 05",
        permanentAddress: "123 Finance Street, Colombo 05",
        jobTitle: "Finance Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2020-09-20"),
        status: "active" as const,
        salary: 135000,
        emergencyContact: {
          name: "Mary Williams",
          relationship: "Wife",
          phone: "+94778901235",
          email: "mary.williams@email.com",
        },
      },
      {
        departmentCode: "FIN-001",
        firstName: "Samantha",
        lastName: "Gunasekara",
        fullName: "Samantha Gunasekara",
        initials: "S.G.",
        preferredName: "Sam",
        email: "samantha.gunasekara@company.com",
        phone: "+94779012345",
        dob: new Date("1991-09-30"),
        currentAddress: "456 Finance Avenue, Colombo 07",
        permanentAddress: "456 Finance Avenue, Colombo 07",
        jobTitle: "Financial Analyst",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2022-05-15"),
        status: "active" as const,
        salary: 110000,
        emergencyContact: {
          name: "Rohan Gunasekara",
          relationship: "Brother",
          phone: "+94779012346",
          email: "rohan.gunasekara@email.com",
        },
      },
      {
        departmentCode: "FIN-001",
        firstName: "Lakshmi",
        lastName: "Jayawardena",
        fullName: "Lakshmi Jayawardena",
        initials: "L.J.",
        preferredName: "Lakshmi",
        email: "lakshmi.jayawardena@company.com",
        phone: "+94770123456",
        dob: new Date("1994-04-18"),
        currentAddress: "789 Finance Road, Kandy",
        permanentAddress: "789 Finance Road, Kandy",
        jobTitle: "Accountant",
        employmentType: "permanent" as const,
        workLocation: "Regional Office - Kandy",
        hireDate: new Date("2023-08-01"),
        status: "active" as const,
        salary: 85000,
        emergencyContact: {
          name: "Nimal Jayawardena",
          relationship: "Husband",
          phone: "+94770123457",
          email: "nimal.jayawardena@email.com",
        },
      },
      // Marketing Department Employees
      {
        departmentCode: "MKT-001",
        firstName: "Emily",
        lastName: "Rodriguez",
        fullName: "Emily Rodriguez",
        initials: "E.R.",
        preferredName: "Emily",
        email: "emily.rodriguez@company.com",
        phone: "+94771234560",
        dob: new Date("1992-11-30"),
        currentAddress: "123 Marketing Street, Colombo 05",
        permanentAddress: "123 Marketing Street, Colombo 05",
        jobTitle: "Marketing Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2021-07-01"),
        status: "active" as const,
        salary: 130000,
        emergencyContact: {
          name: "Carlos Rodriguez",
          relationship: "Father",
          phone: "+94771234561",
          email: "carlos.rodriguez@email.com",
        },
      },
      {
        departmentCode: "MKT-001",
        firstName: "Tharindu",
        lastName: "Bandara",
        fullName: "Tharindu Bandara",
        initials: "T.B.",
        preferredName: "Tharindu",
        email: "tharindu.bandara@company.com",
        phone: "+94772345670",
        dob: new Date("1993-06-12"),
        currentAddress: "456 Marketing Avenue, Colombo 07",
        permanentAddress: "456 Marketing Avenue, Colombo 07",
        jobTitle: "Marketing Executive",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2023-06-01"),
        status: "active" as const,
        salary: 85000,
        emergencyContact: {
          name: "Sanduni Bandara",
          relationship: "Sister",
          phone: "+94772345671",
          email: "sanduni.bandara@email.com",
        },
      },
      {
        departmentCode: "MKT-001",
        firstName: "Chaminda",
        lastName: "Ratnayake",
        fullName: "Chaminda Ratnayake",
        initials: "C.R.",
        preferredName: "Chaminda",
        email: "chaminda.ratnayake@company.com",
        phone: "+94773456780",
        dob: new Date("1996-01-08"),
        currentAddress: "789 Marketing Road, Galle",
        permanentAddress: "789 Marketing Road, Galle",
        jobTitle: "Digital Marketing Specialist",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2024-03-15"),
        status: "active" as const,
        salary: 75000,
        emergencyContact: {
          name: "Nayana Ratnayake",
          relationship: "Wife",
          phone: "+94773456781",
          email: "nayana.ratnayake@email.com",
        },
      },
      // Operations Department Employees
      {
        departmentCode: "OPS-001",
        firstName: "Kamal",
        lastName: "Fernando",
        fullName: "Kamal Fernando",
        initials: "K.F.",
        preferredName: "Kamal",
        email: "kamal.fernando@company.com",
        phone: "+94774567890",
        dob: new Date("1986-10-05"),
        currentAddress: "123 Operations Street, Colombo 05",
        permanentAddress: "123 Operations Street, Colombo 05",
        jobTitle: "Operations Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2019-05-20"),
        status: "active" as const,
        salary: 140000,
        emergencyContact: {
          name: "Nisha Fernando",
          relationship: "Wife",
          phone: "+94774567891",
          email: "nisha.fernando@email.com",
        },
      },
      {
        departmentCode: "OPS-001",
        firstName: "Dilani",
        lastName: "Perera",
        fullName: "Dilani Perera",
        initials: "D.P.",
        preferredName: "Dilani",
        email: "dilani.perera@company.com",
        phone: "+94775678900",
        dob: new Date("1990-08-22"),
        currentAddress: "456 Operations Avenue, Colombo 07",
        permanentAddress: "456 Operations Avenue, Colombo 07",
        jobTitle: "Operations Coordinator",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2022-11-10"),
        status: "active" as const,
        salary: 90000,
        emergencyContact: {
          name: "Suresh Perera",
          relationship: "Husband",
          phone: "+94775678901",
          email: "suresh.perera@email.com",
        },
      },
      // Sales Department Employees
      {
        departmentCode: "SAL-001",
        firstName: "Nuwan",
        lastName: "Jayasuriya",
        fullName: "Nuwan Jayasuriya",
        initials: "N.J.",
        preferredName: "Nuwan",
        email: "nuwan.jayasuriya@company.com",
        phone: "+94776789010",
        dob: new Date("1989-03-15"),
        currentAddress: "123 Sales Street, Colombo 05",
        permanentAddress: "123 Sales Street, Colombo 05",
        jobTitle: "Sales Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2020-02-01"),
        status: "active" as const,
        salary: 120000,
        emergencyContact: {
          name: "Kumari Jayasuriya",
          relationship: "Wife",
          phone: "+94776789011",
          email: "kumari.jayasuriya@email.com",
        },
      },
      {
        departmentCode: "SAL-001",
        firstName: "Ishara",
        lastName: "Wijesinghe",
        fullName: "Ishara Wijesinghe",
        initials: "I.W.",
        preferredName: "Ishara",
        email: "ishara.wijesinghe@company.com",
        phone: "+94777890120",
        dob: new Date("1994-07-20"),
        currentAddress: "456 Sales Avenue, Colombo 07",
        permanentAddress: "456 Sales Avenue, Colombo 07",
        jobTitle: "Sales Executive",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2023-04-10"),
        status: "active" as const,
        salary: 80000,
        emergencyContact: {
          name: "Ashan Wijesinghe",
          relationship: "Brother",
          phone: "+94777890121",
          email: "ashan.wijesinghe@email.com",
        },
      },
      {
        departmentCode: "SAL-001",
        firstName: "Rashmi",
        lastName: "De Silva",
        fullName: "Rashmi De Silva",
        initials: "R.D.S.",
        preferredName: "Rashmi",
        email: "rashmi.desilva@company.com",
        phone: "+94778901230",
        dob: new Date("1997-12-05"),
        currentAddress: "789 Sales Road, Kandy",
        permanentAddress: "789 Sales Road, Kandy",
        jobTitle: "Sales Representative",
        employmentType: "permanent" as const,
        workLocation: "Regional Office - Kandy",
        hireDate: new Date("2024-05-01"),
        status: "active" as const,
        salary: 70000,
        emergencyContact: {
          name: "Dilshan De Silva",
          relationship: "Brother",
          phone: "+94778901231",
          email: "dilshan.desilva@email.com",
        },
      },
      // Customer Service Department Employees
      {
        departmentCode: "CS-001",
        firstName: "Anjali",
        lastName: "Wickramasinghe",
        fullName: "Anjali Wickramasinghe",
        initials: "A.W.",
        preferredName: "Anjali",
        email: "anjali.wickramasinghe@company.com",
        phone: "+94779012340",
        dob: new Date("1991-04-18"),
        currentAddress: "123 Customer Service Street, Colombo 05",
        permanentAddress: "123 Customer Service Street, Colombo 05",
        jobTitle: "Customer Service Manager",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2021-09-15"),
        status: "active" as const,
        salary: 115000,
        emergencyContact: {
          name: "Prasanna Wickramasinghe",
          relationship: "Husband",
          phone: "+94779012341",
          email: "prasanna.wickramasinghe@email.com",
        },
      },
      {
        departmentCode: "CS-001",
        firstName: "Sachini",
        lastName: "Gunawardena",
        fullName: "Sachini Gunawardena",
        initials: "S.G.",
        preferredName: "Sachini",
        email: "sachini.gunawardena@company.com",
        phone: "+94770123450",
        dob: new Date("1995-09-25"),
        currentAddress: "456 Customer Service Avenue, Colombo 07",
        permanentAddress: "456 Customer Service Avenue, Colombo 07",
        jobTitle: "Customer Service Representative",
        employmentType: "permanent" as const,
        workLocation: "Head Office - Colombo",
        hireDate: new Date("2023-07-01"),
        status: "active" as const,
        salary: 75000,
        emergencyContact: {
          name: "Tharaka Gunawardena",
          relationship: "Brother",
          phone: "+94770123451",
          email: "tharaka.gunawardena@email.com",
        },
      },
    ];

    let empCreatedCount = 0;
    // Create maps for both code and name lookups
    const departmentMapByCode = new Map<string, any>();
    const departmentMapByName = new Map<string, any>();
    createdDepartments.forEach((dept) => {
      departmentMapByCode.set(dept.code, dept);
      departmentMapByName.set(dept.name, dept);
    });

    // Create managers first (for manager assignments)
    const managers: any[] = [];

    for (const empData of employeesToSeed) {
      // Try to find department by code first (for backward compatibility), then by name
      let dept = departmentMapByCode.get(empData.departmentCode);
      if (!dept) {
        // If code doesn't match, try to find by matching department name
        // Map common department codes to names
        const deptNameMap: Record<string, string> = {
          "HR-001": "Human Resources",
          "IT-001": "Information Technology",
          "FIN-001": "Finance",
          "MKT-001": "Marketing",
          "OPS-001": "Operations",
          "SAL-001": "Sales",
          "CS-001": "Customer Service",
        };
        const deptName = deptNameMap[empData.departmentCode] || empData.departmentCode;
        dept = departmentMapByName.get(deptName);
      }
      
      if (!dept) {
        console.log(`⚠️  Department ${empData.departmentCode} not found, skipping employee ${empData.fullName}`);
        continue;
      }

      // Check if employee already exists
      const existingEmployee = await Employee.findOne({
        email: empData.email,
      });

      if (!existingEmployee) {
        // Generate employee code
        const employeeCode = await getNextEmployeeCode();
        
        // Generate employee number (EMPNO) based on department
        const employeeNumber = await generateEmployeeNumber(dept._id);

        // Assign manager if available (first manager in department becomes manager for others)
        let managerId = undefined;
        const deptManagers = managers.filter(m => m.departmentId?.toString() === dept._id.toString());
        if (deptManagers.length > 0 && !empData.jobTitle.toLowerCase().includes('manager')) {
          managerId = deptManagers[0]._id;
        }

        const employee = new Employee({
          ...empData,
          empNo: employeeNumber,
          employeeNumber: employeeNumber,
          employeeCode,
          departmentId: dept._id,
          managerId,
        });

        await employee.save();
        
        // Track managers for later assignments
        if (empData.jobTitle.toLowerCase().includes('manager')) {
          managers.push(employee);
        }
        
        empCreatedCount++;
        console.log(`✅ Created employee: ${empData.fullName} (${employeeCode}) - ${empData.jobTitle} in ${dept.name}`);
      } else {
        console.log(`⏭️  Employee ${empData.fullName} already exists, skipping...`);
      }
    }

    if (empCreatedCount > 0) {
      console.log(`✅ Successfully seeded ${empCreatedCount} new employees`);
    } else {
      console.log("✅ All employees already exist in database");
    }

    console.log("\n📊 Summary:");
    console.log(`   - Departments: ${createdDepartments.length} total (${deptCreatedCount} newly created)`);
    console.log(`   - Employees: ${empCreatedCount} newly created`);
    console.log("\n✅ Seed completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
