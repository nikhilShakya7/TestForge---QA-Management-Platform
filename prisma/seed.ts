import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a default user (password hash is a placeholder; real hashing added in auth phase)
  const user = await prisma.user.upsert({
    where: { email: "qa@example.com" },
    update: {},
    create: {
      email: "qa@example.com",
      name: "QA Engineer",
      passwordHash:
        "$2b$10$placeholder.hash.does.not.verify.use.auth.phase", // placeholder only
      role: "ADMIN",
    },
  });

  // Create test suites
  const loginSuite = await prisma.testSuite.create({
    data: {
      name: "Login Suite",
      description: "Tests covering user authentication flows",
      createdById: user.id,
    },
  });

  const checkoutSuite = await prisma.testSuite.create({
    data: {
      name: "Checkout Suite",
      description: "Tests covering the purchase/checkout flow",
      createdById: user.id,
    },
  });

  // Helper to create test cases
  const createTestCase = (data: {
    testCaseId: string;
    title: string;
    suiteId: string;
    steps: string;
    priority: string;
    status: string;
  }) => {
    return prisma.testCase.create({
      data: {
        testCaseId: data.testCaseId,
        title: data.title,
        description: `Verify ${data.title.toLowerCase()}`,
        preconditions: "User is on the application homepage",
        steps: data.steps,
        expectedResult: "Action completes successfully without errors",
        priority: data.priority,
        status: data.status,
        suiteId: data.suiteId,
        createdById: user.id,
      },
    });
  };

  await createTestCase({
    testCaseId: "TC-001",
    title: "User login with valid credentials",
    suiteId: loginSuite.id,
    steps: JSON.stringify([
      "Navigate to the login page",
      "Enter a valid username",
      "Enter a valid password",
      "Click the login button",
    ]),
    priority: "High",
    status: "Active",
  });

  await createTestCase({
    testCaseId: "TC-002",
    title: "User login with invalid password",
    suiteId: loginSuite.id,
    steps: JSON.stringify([
      "Navigate to the login page",
      "Enter a valid username",
      "Enter an invalid password",
      "Click the login button",
    ]),
    priority: "High",
    status: "Active",
  });

  await createTestCase({
    testCaseId: "TC-003",
    title: "Password reset flow",
    suiteId: loginSuite.id,
    steps: JSON.stringify([
      "Click 'Forgot password'",
      "Enter a registered email address",
      "Click 'Send reset link'",
      "Open the email and click the reset link",
      "Enter a new password",
    ]),
    priority: "Medium",
    status: "Draft",
  });

  await createTestCase({
    testCaseId: "TC-004",
    title: "Checkout page validation",
    suiteId: checkoutSuite.id,
    steps: JSON.stringify([
      "Add an item to the cart",
      "Proceed to checkout",
      "Leave required fields empty",
      "Click 'Place order'",
    ]),
    priority: "Critical",
    status: "Active",
  });

  await createTestCase({
    testCaseId: "TC-005",
    title: "User registration with duplicate email",
    suiteId: loginSuite.id,
    steps: JSON.stringify([
      "Navigate to the registration page",
      "Enter an email address that already exists",
      "Complete the rest of the form",
      "Click 'Register'",
    ]),
    priority: "Medium",
    status: "Draft",
  });

  console.log("Database seeded successfully.");
  console.log(`User: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
