import { test, expect } from "./fixtures/test-fixtures";
import {
  generateUniqueTestCaseId,
  generateUniqueDefectTitle,
} from "./utils/test-helpers";

/**
 * Test Case Management Tests
 *
 * Covers:
 * - Positive: create, view, search, filter, delete test cases
 * - Negative: duplicate test case ID, missing required fields
 * - Boundary: long titles, empty optional fields
 * - Authorization: unauthenticated access blocked
 */
test.describe("Test Case Management", () => {
  test.use({ tag: ["@test-cases"] });

  test("positive: create a test case successfully", {
    tag: ["@test-cases", "@positive"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const testCaseId = generateTestCaseId();
    await testCasesPage.goto();
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "E2E Login Test",
      description: "Verify user login flow",
      preconditions: "User is on login page",
      steps: "1. Enter email\n2. Enter password\n3. Click login",
      expectedResult: "User is redirected to dashboard",
      priority: "High",
      status: "Active",
    });
    await testCasesPage.submitCreate();
    await testCasesPage.expectTestCaseInList(testCaseId);
  });

  test("positive: search filters test cases", {
    tag: ["@test-cases", "@positive"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const testCaseId = generateTestCaseId();
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "Searchable Test Case",
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Medium",
      status: "Draft",
    });
    await testCasesPage.submitCreate();
    await testCasesPage.expectTestCaseInList(testCaseId);

    // Search by test case ID
    await testCasesPage.searchInput.fill(testCaseId);
    await testCasesPage.expectTestCaseInList(testCaseId);
  });

  test("positive: filter by priority", {
    tag: ["@test-cases", "@positive"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const testCaseId = generateTestCaseId();
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "Critical Priority Test",
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Critical",
      status: "Active",
    });
    await testCasesPage.submitCreate();

    await testCasesPage.priorityFilter.selectOption("Critical");
    await testCasesPage.expectTestCaseInList(testCaseId);
  });

  test("positive: delete a test case", {
    tag: ["@test-cases", "@positive"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const testCaseId = generateTestCaseId();
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "To Be Deleted",
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Low",
      status: "Draft",
    });
    await testCasesPage.submitCreate();
    await testCasesPage.expectTestCaseInList(testCaseId);

    await testCasesPage.deleteTestCase(testCaseId);
    await testCasesPage.expectTestCaseNotInList(testCaseId);
  });

  test("negative: duplicate test case ID is rejected", {
    tag: ["@test-cases", "@negative"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const testCaseId = generateTestCaseId();

    // Create first test case
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "First Test Case",
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Medium",
      status: "Draft",
    });
    await testCasesPage.submitCreate();
    await testCasesPage.expectTestCaseInList(testCaseId);

    // Try to create duplicate
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: "Duplicate Test Case",
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Medium",
      status: "Draft",
    });
    await testCasesPage.submitCreate();

    // Should show error (duplicate ID)
    await expect(testCasesPage.page.getByText(/already exists/i)).toBeVisible();
  });

  test("negative: missing required fields shows validation", {
    tag: ["@test-cases", "@negative"],
  }, async ({ authenticatedPage, testCasesPage }) => {
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    // Leave title and steps empty
    await testCasesPage.testCaseIdInput.fill("TC-EMPTY");
    await testCasesPage.submitCreate();

    // HTML5 required validation should flag empty required fields
    await expect(testCasesPage.titleInput).toHaveAttribute("required");
  });

  test("boundary: very long title (500 chars)", {
    tag: ["@test-cases", "@boundary"],
  }, async ({ authenticatedPage, testCasesPage, generateTestCaseId }) => {
    const longTitle = "A".repeat(500);
    const testCaseId = generateTestCaseId();
    await testCasesPage.goto();
    await testCasesPage.openCreateForm();
    await testCasesPage.fillCreateForm({
      testCaseId,
      title: longTitle,
      steps: "Test step",
      expectedResult: "Expected result",
      priority: "Medium",
      status: "Draft",
    });
    await testCasesPage.submitCreate();
    // Should either accept or show validation error (not crash)
    await expect(
      testCasesPage.page.locator("body")
    ).not.toContainText("Internal Server Error");
  });

  test("authorization: unauthenticated user cannot access test cases", {
    tag: ["@test-cases", "@authorization"],
  }, async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/test-cases");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
