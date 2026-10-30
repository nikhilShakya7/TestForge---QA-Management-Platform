import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TestCasesPage } from "../pages/TestCasesPage";
import { TestRunsPage } from "../pages/TestRunsPage";
import { DefectsPage } from "../pages/DefectsPage";

/**
 * Test fixtures for TestForge E2E tests.
 *
 * Provides:
 * - Authenticated page (logged in as qa@example.com)
 * - Page Object Models for all major pages
 * - Test data generation utilities
 *
 * Usage:
 *   test("create a test case", async ({ page, loginPage, testCasesPage }) => {
 *     await loginPage.login("qa@example.com", "TestForge123!");
 *     await testCasesPage.openCreateForm();
 *     // ...
 *   });
 */
type TestFixtures = {
  // Authenticated page (logged in)
  authenticatedPage: import("@playwright/test").Page;
  // Page Objects
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  testCasesPage: TestCasesPage;
  testRunsPage: TestRunsPage;
  defectsPage: DefectsPage;
  // Test data helpers
  generateTestCaseId: () => string;
  generateDefectTitle: () => string;
  generateTestRunName: () => string;
};

// Module-level counters persist across tests within the same worker
let testCaseCounter = 0;
let defectCounter = 0;
let testRunCounter = 0;

export const test = base.extend<TestFixtures>({
  // Authenticated page fixture - logs in before each test
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("qa@example.com", "TestForge123!");
    // Verify successful login by checking we're on dashboard
    await expect(page).toHaveURL("/");
    await use(page);
  },

  // Page Objects
  loginPage: ({ page }, use) => {
    use(new LoginPage(page));
  },
  dashboardPage: ({ page }, use) => {
    use(new DashboardPage(page));
  },
  testCasesPage: ({ page }, use) => {
    use(new TestCasesPage(page));
  },
  testRunsPage: ({ page }, use) => {
    use(new TestRunsPage(page));
  },
  defectsPage: ({ page }, use) => {
    use(new DefectsPage(page));
  },

  // Test data generators (unique per worker to avoid parallel test conflicts)
  generateTestCaseId: ({}, use) => {
    const workerIdx = process.env.TEST_WORKER_INDEX ?? "0";
    use(() => {
      testCaseCounter += 1;
      return `TC-W${workerIdx}-${String(testCaseCounter).padStart(3, "0")}`;
    });
  },
  generateDefectTitle: ({}, use) => {
    const workerIdx = process.env.TEST_WORKER_INDEX ?? "0";
    use(() => {
      defectCounter += 1;
      return `E2E Defect W${workerIdx}-${defectCounter}`;
    });
  },
  generateTestRunName: ({}, use) => {
    const workerIdx = process.env.TEST_WORKER_INDEX ?? "0";
    use(() => {
      testRunCounter += 1;
      return `E2E Test Run W${workerIdx}-${testRunCounter}`;
    });
  },
});

export { expect };
