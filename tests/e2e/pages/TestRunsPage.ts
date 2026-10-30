import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Test Runs page.
 *
 * Covers creating test runs and recording execution results.
 *
 * Uses stable locators: input name attributes, select name attributes, and button roles.
 */
export class TestRunsPage {
  readonly page: Page;
  readonly newTestRunButton: Locator;
  readonly testRunCards: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  // Create form fields (using name attributes)
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly suiteSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTestRunButton = page.getByRole("button", {
      name: /new test run/i,
    });
    this.testRunCards = page.getByRole("article");
    this.createButton = page.getByRole("button", { name: /create test run/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Create form fields - use name attributes
    this.nameInput = page.locator('input[name="name"]');
    this.descriptionInput = page.locator('input[name="description"]');
    this.suiteSelect = page.locator('select[name="suiteId"]');
  }

  async goto() {
    await this.page.goto("/test-runs");
  }

  async expectTestRunsPage() {
    await expect(this.page).toHaveURL("/test-runs");
    await expect(this.newTestRunButton).toBeVisible();
  }

  async openCreateForm() {
    await this.newTestRunButton.click();
    await expect(this.nameInput).toBeVisible();
  }

  async fillCreateForm(data: {
    name: string;
    description?: string;
    suiteId?: string;
  }) {
    await this.nameInput.fill(data.name);
    if (data.description) await this.descriptionInput.fill(data.description);
    if (data.suiteId) await this.suiteSelect.selectOption(data.suiteId);
  }

  async submitCreate() {
    await this.createButton.click();
  }

  async expectTestRunInList(runName: string) {
    await expect(
      this.page.locator("article").filter({ hasText: runName }).first(),
      `Test run "${runName}" should appear in the list`,
    ).toBeVisible({ timeout: 10000 });
  }
}
