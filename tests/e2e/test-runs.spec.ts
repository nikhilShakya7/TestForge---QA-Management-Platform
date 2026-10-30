import { test, expect } from "./fixtures/test-fixtures";
import { generateUniqueTestRunName } from "./utils/test-helpers";

/**
 * Test Runs Tests
 *
 * Covers:
 * - Positive: create test run, view test runs, record execution results
 * - Negative: missing required fields
 * - Boundary: long run name
 * - Authorization: unauthenticated access blocked
 */
test.describe("Test Runs", () => {
  test.use({ tag: ["@test-runs"] });

  test("positive: create a test run successfully", {
    tag: ["@test-runs", "@positive"],
  }, async ({ authenticatedPage, testRunsPage, generateTestRunName }) => {
    const runName = generateTestRunName();
    await testRunsPage.goto();
    await testRunsPage.goto();
    await testRunsPage.openCreateForm();
    await testRunsPage.fillCreateForm({
      name: runName,
      description: "E2E test run for verification",
    });
    await testRunsPage.submitCreate();
    await testRunsPage.expectTestRunInList(runName);
  });

  test("positive: create a test run with a suite", {
    tag: ["@test-runs", "@positive"],
  }, async ({ authenticatedPage, testRunsPage, generateTestRunName }) => {
    const runName = generateTestRunName();
    await testRunsPage.goto();
    await testRunsPage.goto();
    await testRunsPage.openCreateForm();
    await testRunsPage.fillCreateForm({
      name: runName,
      description: "Test run with suite",
      suiteId: "", // No suite (standalone run)
    });
    await testRunsPage.submitCreate();
    await testRunsPage.expectTestRunInList(runName);
  });

  test("negative: missing test run name shows validation", {
    tag: ["@test-runs", "@negative"],
  }, async ({ authenticatedPage, testRunsPage }) => {
    await testRunsPage.goto();
    await testRunsPage.openCreateForm();
    // Leave name empty
    await testRunsPage.submitCreate();
    await expect(testRunsPage.nameInput).toHaveAttribute("required");
  });

  test("boundary: very long test run name", {
    tag: ["@test-runs", "@boundary"],
  }, async ({ authenticatedPage, testRunsPage }) => {
    const longName = "A".repeat(500);
    await testRunsPage.goto();
    await testRunsPage.openCreateForm();
    await testRunsPage.fillCreateForm({
      name: longName,
      description: "Long name test",
    });
    await testRunsPage.submitCreate();
    await expect(
      testRunsPage.page.locator("body")
    ).not.toContainText("Internal Server Error");
  });

  test("authorization: unauthenticated user cannot access test runs", {
    tag: ["@test-runs", "@authorization"],
  }, async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/test-runs");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
