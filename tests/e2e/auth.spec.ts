import { test, expect } from "./fixtures/test-fixtures";

/**
 * Authentication Tests
 *
 * Covers:
 * - Positive: valid login, successful redirect to dashboard
 * - Negative: invalid credentials, empty fields
 * - Boundary: very long email/password
 * - Authorization: unauthenticated access redirects to login
 */
test.describe("Authentication", () => {
  test("positive: valid login redirects to dashboard", {
    tag: ["@auth", "@positive"],
  }, async ({ authenticatedPage, dashboardPage }) => {
    // authenticatedPage fixture already logs in
    await dashboardPage.expectDashboardLoaded();
  });

  test("negative: invalid email shows error", {
    tag: ["@auth", "@negative"],
  }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login("invalid@example.com", "wrongpassword");
    await loginPage.expectErrorMessage();
  });

  test("negative: empty email shows validation error", {
    tag: ["@auth", "@negative"],
  }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill("");
    await loginPage.passwordInput.fill("TestForge123!");
    await loginPage.submitButton.click();
    // HTML5 required validation should prevent submission
    await expect(loginPage.emailInput).toHaveAttribute("required");
  });

  test("negative: empty password shows validation error", {
    tag: ["@auth", "@negative"],
  }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill("qa@example.com");
    await loginPage.passwordInput.fill("");
    await loginPage.submitButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute("required");
  });

  test("boundary: very long email (255 chars)", {
    tag: ["@auth", "@boundary"],
  }, async ({ page, loginPage }) => {
    const longEmail = "a".repeat(240) + "@example.com";
    await loginPage.goto();
    await loginPage.login(longEmail, "TestForge123!");
    // Should show "Invalid email or password" (not a server crash)
    await loginPage.expectErrorMessage();
  });

  test("boundary: very long password (200 chars)", {
    tag: ["@auth", "@boundary"],
  }, async ({ page, loginPage }) => {
    const longPassword = "x".repeat(200);
    await loginPage.goto();
    await loginPage.login("qa@example.com", longPassword);
    await loginPage.expectErrorMessage();
  });

  test("authorization: unauthenticated access to dashboard redirects to login", {
    tag: ["@auth", "@authorization"],
  }, async ({ page }) => {
    // Clear cookies to simulate unauthenticated state
    await page.context().clearCookies();
    await page.goto("/");
    await page.waitForURL(/\/auth\/login/);
  });

  test("authorization: unauthenticated access to test-cases redirects to login", {
    tag: ["@auth", "@authorization"],
  }, async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/test-cases");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("authorization: authenticated user can access dashboard", {
    tag: ["@auth", "@authorization"],
  }, async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.expectDashboardLoaded();
  });
});
