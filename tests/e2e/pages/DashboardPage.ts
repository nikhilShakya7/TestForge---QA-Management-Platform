import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Dashboard page.
 *
 * Uses stable locators: headings, buttons, and nav links.
 */
export class DashboardPage {
  readonly page: Page;
  readonly totalTestsStat: Locator;
  readonly loadingText: Locator;
    readonly newTestRunButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Find stat cards by their label text
    this.totalTestsStat = page.getByText("Total Test Cases");
    this.loadingText = page.getByText(/loading dashboard/i);
    this.newTestRunButton = page.getByRole("button", {
      name: /new test run/i,
    });
  }

  async goto() {
    await this.page.goto("/");
  }

  async expectDashboardLoaded() {
    await expect(this.page).toHaveURL("/");
    // Wait for loading to complete (either stats appear or loading disappears)
    await expect(
      this.page.locator("body")
    ).not.toContainText("Loading dashboard…", { timeout: 15000 });
    await expect(this.totalTestsStat).toBeVisible();
  }

  async clickNavLink(name: string) {
    await this.page.getByRole("link", { name }).click();
  }
}
