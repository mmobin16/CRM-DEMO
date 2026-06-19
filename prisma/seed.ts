import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const companies = [
  "Acme Corporation", "Globex Industries", "Initech Solutions", "Umbrella Corp",
  "Stark Enterprises", "Wayne Industries", "Oscorp Technologies", "LexCorp",
  "Cyberdyne Systems", "Soylent Corp", "Massive Dynamic", "Hooli Inc",
  "Pied Piper", "Aviato", "Raviga Capital", "Endframe", "Bachmanity",
  "TechFlow Solutions", "CloudNine Systems", "DataPulse Analytics",
  "Quantum Leap Tech", "Nexus Innovations", "Vertex Dynamics", "Apex Digital",
  "Summit Software", "Horizon Ventures", "Pinnacle Group", "Meridian Corp",
  "Atlas Technologies", "Zenith Solutions", "Nova Systems", "Pulse Analytics",
  "BrightPath Inc", "ClearView Media", "DeepBlue Consulting", "Echo Partners",
  "Fusion Labs", "GridPoint Energy", "Helix Biotech", "IronBridge Capital",
];

const firstNames = [
  "James", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Amanda",
  "William", "Jennifer", "Richard", "Lisa", "Thomas", "Michelle", "Daniel",
  "Ashley", "Matthew", "Stephanie", "Christopher", "Nicole", "Andrew", "Elizabeth",
  "Joshua", "Melissa", "Ryan", "Rebecca", "Brandon", "Laura", "Kevin", "Rachel",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
  "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
];

const industries = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail",
  "Education", "Real Estate", "Consulting", "Media", "Energy",
];

const cities = [
  "New York", "San Francisco", "Chicago", "Austin", "Seattle",
  "Boston", "Denver", "Atlanta", "Los Angeles", "Miami",
];

const countries = ["United States", "Canada", "United Kingdom", "Germany", "Australia"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(first: string, last: string, company: string) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return `${first.toLowerCase()}.${last.toLowerCase()}@${domain}.com`;
}

function generatePhone() {
  return `+1 (${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.notification.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@crmpro.com",
      password: hashedPassword,
      role: "ADMIN",
      avatar: null,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Sarah Mitchell",
      email: "manager@crmpro.com",
      password: hashedPassword,
      role: "SALES_MANAGER",
    },
  });

  const executive = await prisma.user.create({
    data: {
      name: "James Wilson",
      email: "sales@crmpro.com",
      password: hashedPassword,
      role: "SALES_EXECUTIVE",
    },
  });

  const users = [admin, manager, executive];

  await prisma.companySettings.create({
    data: {
      name: "CRM Pro Inc.",
      email: "contact@crmpro.com",
      phone: "+1 (555) 123-4567",
      address: "123 Business Ave, San Francisco, CA 94105",
      website: "https://crmpro.com",
    },
  });

  await prisma.emailTemplate.createMany({
    data: [
      {
        name: "Welcome Email",
        subject: "Welcome to CRM Pro!",
        body: "Dear {{name}},\n\nWelcome to CRM Pro. We're excited to have you on board.\n\nBest regards,\nCRM Pro Team",
      },
      {
        name: "Follow Up",
        subject: "Following up on our conversation",
        body: "Hi {{name}},\n\nI wanted to follow up on our recent conversation. Please let me know if you have any questions.\n\nBest,\n{{sender}}",
      },
      {
        name: "Quotation Sent",
        subject: "Your quotation from CRM Pro",
        body: "Dear {{name}},\n\nPlease find attached your quotation {{quotation_number}}.\n\nValid until: {{valid_until}}\n\nRegards,\nCRM Pro Sales Team",
      },
    ],
  });

  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"] as const;
  const leadSources = ["WEBSITE", "REFERRAL", "LINKEDIN", "COLD_CALL", "TRADE_SHOW", "EMAIL_CAMPAIGN", "OTHER"] as const;

  console.log("Creating 100 leads...");
  for (let i = 1; i <= 100; i++) {
    const first = randomItem(firstNames);
    const last = randomItem(lastNames);
    const company = randomItem(companies);
    await prisma.lead.create({
      data: {
        leadId: `LD-${String(i).padStart(5, "0")}`,
        companyName: `${company} ${i > 20 ? "" : ""}`.trim() || company,
        contactPerson: `${first} ${last}`,
        email: generateEmail(first, last, company),
        phone: generatePhone(),
        source: randomItem([...leadSources]),
        status: randomItem([...leadStatuses]),
        notes: i % 3 === 0 ? `Initial contact made. ${first} showed interest in our enterprise plan.` : null,
        createdAt: randomDate(new Date("2024-01-01"), new Date()),
      },
    });
  }

  console.log("Creating 50 customers...");
  const customers = [];
  for (let i = 1; i <= 50; i++) {
    const first = randomItem(firstNames);
    const last = randomItem(lastNames);
    const company = companies[i % companies.length];
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUST-${String(i).padStart(4, "0")}`,
        companyName: company,
        contactPerson: `${first} ${last}`,
        email: generateEmail(first, last, company),
        phone: generatePhone(),
        industry: randomItem(industries),
        address: `${randomInt(100, 9999)} ${randomItem(["Main", "Oak", "Market", "Tech", "Innovation"])} St`,
        city: randomItem(cities),
        country: randomItem(countries),
        website: `https://www.${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      },
    });
    customers.push(customer);

    const contactCount = randomInt(1, 3);
    for (let j = 0; j < contactCount; j++) {
      const cFirst = randomItem(firstNames);
      const cLast = randomItem(lastNames);
      await prisma.contact.create({
        data: {
          name: `${cFirst} ${cLast}`,
          designation: randomItem(["CEO", "CTO", "VP Sales", "Director", "Manager", "Analyst"]),
          email: generateEmail(cFirst, cLast, company),
          mobile: generatePhone(),
          department: randomItem(["Sales", "Engineering", "Marketing", "Finance", "Operations"]),
          customerId: customer.id,
        },
      });
    }
  }

  console.log("Creating 30 opportunities...");
  const stages = ["PROSPECT", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
  for (let i = 1; i <= 30; i++) {
    const customer = randomItem(customers);
    await prisma.opportunity.create({
      data: {
        name: `${customer.companyName} - ${randomItem(["Enterprise Deal", "Annual Contract", "Platform Upgrade", "New Implementation", "Expansion"])}`,
        customerId: customer.id,
        expectedRevenue: randomInt(10000, 500000),
        probability: randomInt(10, 95),
        closingDate: randomDate(new Date(), new Date("2026-12-31")),
        stage: randomItem([...stages]),
        notes: "Key decision maker engaged. Follow up scheduled.",
      },
    });
  }

  console.log("Creating 150 activities...");
  const activityTypes = ["CALL", "MEETING", "TASK", "EMAIL"] as const;
  const subjects = {
    CALL: ["Discovery call", "Follow-up call", "Demo call", "Check-in call"],
    MEETING: ["Product demo", "Strategy meeting", "Quarterly review", "Onboarding session"],
    TASK: ["Send proposal", "Prepare contract", "Update CRM records", "Research competitor"],
    EMAIL: ["Introduction email", "Proposal follow-up", "Meeting confirmation", "Thank you email"],
  };

  for (let i = 1; i <= 150; i++) {
    const type = randomItem([...activityTypes]);
    const customer = randomItem(customers);
    const user = randomItem(users);
    await prisma.activity.create({
      data: {
        type,
        subject: randomItem(subjects[type]),
        description: `Activity related to ${customer.companyName}`,
        date: randomDate(new Date("2024-06-01"), new Date("2026-12-31")),
        time: `${String(randomInt(8, 17)).padStart(2, "0")}:${randomItem(["00", "15", "30", "45"])}`,
        assignedTo: user.id,
        customerId: customer.id,
      },
    });
  }

  console.log("Creating 40 tasks...");
  const taskStatuses = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const taskTitles = [
    "Prepare quarterly report", "Update customer records", "Schedule demo call",
    "Review contract terms", "Send follow-up email", "Create presentation deck",
    "Research market trends", "Update pipeline forecast", "Contact new leads",
    "Complete onboarding checklist",
  ];

  for (let i = 1; i <= 40; i++) {
    const status = randomItem([...taskStatuses]);
    await prisma.task.create({
      data: {
        title: randomItem(taskTitles),
        description: "Task assigned from CRM dashboard",
        status,
        priority: randomItem([...priorities]),
        dueDate: randomDate(new Date(), new Date("2026-06-30")),
        progress: status === "COMPLETED" ? 100 : status === "IN_PROGRESS" ? randomInt(20, 80) : 0,
        assignedTo: randomItem(users).id,
      },
    });
  }

  console.log("Creating quotations...");
  for (let i = 1; i <= 15; i++) {
    const customer = randomItem(customers);
    const items = [
      { item: "Enterprise License", description: "Annual subscription", quantity: 1, rate: randomInt(5000, 50000) },
      { item: "Implementation", description: "Setup and onboarding", quantity: 1, rate: randomInt(2000, 15000) },
      { item: "Support Package", description: "Premium support", quantity: 12, rate: randomInt(200, 1000) },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = subtotal * 0.1;
    await prisma.quotation.create({
      data: {
        number: `QT-${String(i).padStart(5, "0")}`,
        customerId: customer.id,
        date: randomDate(new Date("2024-01-01"), new Date()),
        validUntil: randomDate(new Date(), new Date("2026-12-31")),
        status: randomItem(["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const),
        subtotal,
        tax,
        total: subtotal + tax,
        items: {
          create: items.map((item) => ({
            ...item,
            total: item.quantity * item.rate,
          })),
        },
      },
    });
  }

  console.log("Creating documents...");
  const docCategories = ["CONTRACTS", "QUOTATIONS", "CUSTOMER_DOCUMENTS", "GENERAL"] as const;
  const docNames = [
    "Service Agreement.pdf", "Proposal Q1 2025.pdf", "NDA Template.docx",
    "Product Brochure.pdf", "Case Study - TechFlow.pdf", "Invoice Template.xlsx",
    "Meeting Notes.docx", "Contract Draft v2.pdf", "Pricing Sheet.xlsx",
  ];

  for (let i = 0; i < 20; i++) {
    const name = randomItem(docNames);
    const ext = name.split(".").pop() || "pdf";
    await prisma.document.create({
      data: {
        name,
        fileName: name,
        fileType: ext,
        fileSize: randomInt(50000, 5000000),
        category: randomItem([...docCategories]),
        url: `/uploads/${name.replace(/\s/g, "-").toLowerCase()}`,
        customerId: randomItem(customers).id,
      },
    });
  }

  console.log("Creating notifications...");
  const notificationData = [
    { title: "New Lead Assigned", message: "Lead LD-00042 from TechFlow Solutions has been assigned to you", type: "lead" },
    { title: "Task Due Today", message: "Prepare quarterly report is due today", type: "task" },
    { title: "Meeting Reminder", message: "Product demo with Acme Corp in 30 minutes", type: "meeting" },
    { title: "Opportunity Won", message: "Globex Industries deal closed for $125,000", type: "opportunity" },
    { title: "New Lead Assigned", message: "Lead LD-00078 from Nexus Innovations assigned to you", type: "lead" },
    { title: "Quotation Accepted", message: "QT-00003 has been accepted by Stark Enterprises", type: "quotation" },
  ];

  for (const notif of notificationData) {
    await prisma.notification.create({
      data: {
        ...notif,
        read: Math.random() > 0.5,
        userId: admin.id,
      },
    });
  }

  console.log("✅ Seeding completed!");
  console.log("\nDemo credentials:");
  console.log("  admin@crmpro.com / password123");
  console.log("  manager@crmpro.com / password123");
  console.log("  sales@crmpro.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
