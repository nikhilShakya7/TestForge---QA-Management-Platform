import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Defects page.
 *
 * Covers creating, editing, deleting defects and inline status updates.
 *
 * Uses stable locators: input name attributes, select name attributes, and button roles.
 */
export class DefectsPage {
  readonly page: Page;
  readonly reportDefectButton: Locator;
  readonly defectRows: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  // Create/Edit form fields (using name attributes)
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly reproStepsInput: Locator;
  readonly expectedResultInput: Locator;
  readonly actualResultInput: Locator;
  readonly severitySelect: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;
  readonly testCaseIdInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reportDefectButton = page.getByRole("button", {
      name: /report defect/i,
    });
    this.defectRows = page.getByRole("row");
    this.createButton = page.getByRole("button", { name: /report defect/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });

    // Create/Edit form fields - use name attributes
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.reproStepsInput = page.locator('textarea[name="reproSteps"]');
    this.expectedResultInput = page.locator('textarea[name="expectedResult"]');
    this.actualResultInput = page.locator('textarea[name="actualResult"]');
    this.severitySelect = page.locator('select[name="severity"]');
    this.prioritySelect = page.locator('select[name="priority"]');
    this.statusSelect = page.locator('select[name="status"]');
    this.testCaseIdInput = page.locator('input[name="testCaseId"]');
  }

  async goto() {
    await this.page.goto("/defects");
  }

  async expectDefectsPage() {
    await expect(this.page).toHaveURL("/defects");
    await expect(this.reportDefectButton).toBeVisible();
  }

  async openCreateForm() {
    await this.reportDefectButton.click();
    await expect(this.titleInput).toBeVisible();
  }

  async fillCreateForm(data: {
    title: string;
    description?: string;
    reproSteps?: string;
    expectedResult?: string;
    actualResult?: string;
    severity: string;
    priority: string;
    status: string;
    testCaseId?: string;
  }) {
    await this.titleInput.fill(data.title);
    if (data.description) await this.descriptionInput.fill(data.description);
    if (data.reproSteps) await this.reproStepsInput.fill(data.reproSteps);
    if (data.expectedResult) await this.expectedResultInput.fill(data.expectedResult);
    if (data.actualResult) await this.actualResultInput.fill(data.actualResult);
    await this.severitySelect.selectOption(data.severity);
    await this.prioritySelect.selectOption(data.priority);
    await this.statusSelect.selectOption(data.status);
    if (data.testCaseId) await this.testCaseIdInput.fill(data.testCaseId);
  }

  async submitCreate() {
    await this.createButton.click();
  }

  async openEdit(defectTitle: string) {
    // Click the Edit button in the row containing this defect title
    await this.page
      .locator('tr', { has: this.page.getByText(defectTitle) })
      .getByRole("button", { name: /edit/i })
      .click();
    await expect(this.titleInput).toBeVisible();
  }

  async deleteDefect(defectTitle: string) {
    await this.page
      .locator('tr', { has: this.page.getByText(defectTitle) })
      .getByRole("button", { name: /delete/i })
      .click();
    await this.page.once("dialog", (dialog) => dialog.accept());
  }

  async expectDefectInList(title: string) {
    await expect.poll(
      () => this.page.getByRole("row").filter({ hasText: title }),
      (rows) => rows.count() > 0,
      { message: `Defect "${title}" should appear in the list`, timeout: 10000 }
    );
  }

  async expectDefectNotInList(title: string) {
    await expect(
      this.page.getByRole("row").filter({ hasText: title })
    ).not.toBeVisible();
  }

  /**
   * Update severity inline for the defect with this title.
   */
  async updateSeverityInline(defectTitle: string, severity: string) {
    await this.page
      .locator('tr', { has: this.page.getByText(defectTitle) })
      .locator('select[name="severity"]')
      .selectOption(severity);
  }
}
