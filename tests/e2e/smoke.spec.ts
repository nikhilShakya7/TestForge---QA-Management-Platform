import { test, expect } from "./fixtures/test-fixtures";

/**
 * Smoke Tests - basic verification that the application loads and
 * core navigation works.
 */
test.describe("Smoke Tests", () => {
  test("application loads and shows dashboard", {
    tag: ["@smoke"],
  }, async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.expectDashboardLoaded();
  });

  test("navigation works between all pages", {
    tag: ["@smoke"],
  }, async ({
    authenticatedPage,
    dashboardPage,
    testCasesPage,
    testRunsPage,
    defectsPage,
  }) => {
    // Dashboard -> Test Cases
    await dashboardPage.clickNavLink("Test Cases");
    await testCasesPage.expectTestCasesPage();

    // Test Cases -> Test Runs
    await testCasesPage.page.getByRole("link", { name: "Test Runs" }).click();
    await testRunsPage.expectTestRunsPage();

    // Test Runs -> Defects
    await testRunsPage.page.getByRole("link", { name: "Defects" }).click();
    await defectsPage.expectDefectsPage();

    // Defects -> Settings
    await defectsPage.page.getByRole("link", { name: "Settings" }).click();
    await expect(authenticatedPage).toHaveURL("/settings");

    // Settings -> Dashboard
    await authenticatedPage.getByRole("link", { name: "Dashboard" }).click();
    await dashboardPage.expectDashboardLoaded();
  });

  test("sidebar shows user profile when logged in", {
    tag: ["@smoke"],
  }, async ({ authenticatedPage }) => {
    // Should show user email or name in sidebar
    await expect(
      authenticatedPage.getByText(/qa@example\.com/)
    ).toBeVisible();
  });

  test("sign out works", {
    tag: ["@smoke", "@auth"],
  }, async ({ authenticatedPage, page }) => {
    // Click sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
