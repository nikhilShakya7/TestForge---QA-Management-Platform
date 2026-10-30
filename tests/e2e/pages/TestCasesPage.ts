import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Test Cases page.
 *
 * Covers listing, searching, filtering, creating, and deleting test cases.
 *
 * Uses stable locators: input name attributes, placeholders, and button roles.
 */
export class TestCasesPage {
  readonly page: Page;
  readonly newTestCaseButton: Locator;
  readonly searchInput: Locator;
  readonly testCaseCards: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  // Create form fields (using name attributes)
  readonly testCaseIdInput: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly preconditionsInput: Locator;
  readonly stepsInput: Locator;
  readonly expectedResultInput: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTestCaseButton = page.getByRole("button", {
      name: /new test case/i,
    });
    this.searchInput = page.getByPlaceholder(/search by id, title or description/i);
    this.testCaseCards = page.getByRole("article");
    this.createButton = page.getByRole("button", { name: /create test case/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Create form fields - use name attributes (labels aren't associated via for/id)
    this.testCaseIdInput = page.locator('input[name="testCaseId"]');
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('input[name="description"]');
    this.preconditionsInput = page.locator('input[name="preconditions"]');
    this.stepsInput = page.locator('textarea[name="steps"]');
    this.expectedResultInput = page.locator('textarea[name="expectedResult"]');
    this.prioritySelect = page.locator('select[name="priority"]');
    this.statusSelect = page.locator('select[name="status"]');
    // Aliases for filter dropdowns
    this.priorityFilter = this.prioritySelect;
    this.statusFilter = this.statusSelect;
  }

  async goto() {
    await this.page.goto("/test-cases");
    await this.newTestCaseButton.waitFor({ state: "visible", timeout: 10000 });
  }

  async expectTestCasesPage() {
    await expect(this.page).toHaveURL("/test-cases");
    await expect(this.newTestCaseButton).toBeVisible();
  }

  async openCreateForm() {
    await this.newTestCaseButton.click();
    await expect(this.testCaseIdInput).toBeVisible();
  }

  async fillCreateForm(data: {
    testCaseId: string;
    title: string;
    description?: string;
    preconditions?: string;
    steps: string;
    expectedResult: string;
    priority: string;
    status: string;
  }) {
    await this.testCaseIdInput.fill(data.testCaseId);
    await this.titleInput.fill(data.title);
    if (data.description) await this.descriptionInput.fill(data.description);
    if (data.preconditions) await this.preconditionsInput.fill(data.preconditions);
    await this.stepsInput.fill(data.steps);
    await this.expectedResultInput.fill(data.expectedResult);
    await this.prioritySelect.selectOption(data.priority);
    await this.statusSelect.selectOption(data.status);
  }

  async submitCreate() {
    await this.createButton.click();
  }

  async deleteTestCase(testCaseId: string) {
    const dialogPromise = this.page
      .waitForEvent("dialog")
      .then((dialog) => dialog.accept());
    await this.page
      .locator("article")
      .filter({ hasText: testCaseId })
      .getByRole("button", { name: /delete/i })
      .click();
    await dialogPromise;
  }

  async expectTestCaseInList(testCaseId: string) {
    await expect(
      this.page.locator("article").filter({ hasText: testCaseId }).first(),
      `Test case "${testCaseId}" should appear in the list`,
    ).toBeVisible({ timeout: 10000 });
  }

  async expectTestCaseNotInList(testCaseId: string) {
    await expect(
      this.page.locator("article").filter({ hasText: testCaseId })
    ).not.toBeVisible();
  }
}
