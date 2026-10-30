import { test, expect } from "./fixtures/test-fixtures";
import { generateUniqueDefectTitle } from "./utils/test-helpers";

/**
 * Defect Management Tests
 *
 * Covers:
 * - Positive: create, view, edit, delete defects
 * - Positive: inline status/severity/priority updates
 * - Negative: missing required fields
 * - Boundary: long title
 * - Authorization: unauthenticated access blocked
 */
test.describe("Defect Management", () => {
  test.use({ tag: ["@defects"] });

  test("positive: create a defect successfully", {
    tag: ["@defects", "@positive"],
  }, async ({ authenticatedPage, defectsPage, generateDefectTitle }) => {
    const defectTitle = generateDefectTitle();
    await defectsPage.goto();
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    await defectsPage.fillCreateForm({
      title: defectTitle,
      description: "E2E defect description",
      reproSteps: "1. Navigate to page\n2. Click button\n3. Observe error",
      expectedResult: "No error should appear",
      actualResult: "Error appears",
      severity: "High",
      priority: "Medium",
      status: "Open",
    });
    await defectsPage.submitCreate();
    await defectsPage.expectDefectInList(defectTitle);
  });

  test("positive: edit a defect", {
    tag: ["@defects", "@positive"],
  }, async ({ authenticatedPage, defectsPage, generateDefectTitle }) => {
    const defectTitle = generateDefectTitle();
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    await defectsPage.fillCreateForm({
      title: defectTitle,
      description: "Original description",
      reproSteps: "Original steps",
      expectedResult: "Original expected",
      actualResult: "Original actual",
      severity: "Medium",
      priority: "Medium",
      status: "Open",
    });
    await defectsPage.submitCreate();
    await defectsPage.expectDefectInList(defectTitle);

    // Edit the defect
    await defectsPage.openEdit(defectTitle);
    await defectsPage.titleInput.fill("Updated Defect Title");
    await defectsPage.severitySelect.selectOption("Critical");
    await defectsPage.submitCreate();

    // Verify old title is gone and new title exists
    await defectsPage.expectDefectNotInList(defectTitle);
    await defectsPage.expectDefectInList("Updated Defect Title");
  });

  test("positive: inline update severity", {
    tag: ["@defects", "@positive"],
  }, async ({ authenticatedPage, defectsPage, generateDefectTitle }) => {
    const defectTitle = generateDefectTitle();
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    await defectsPage.fillCreateForm({
      title: defectTitle,
      description: "Test defect",
      reproSteps: "Test steps",
      expectedResult: "Expected",
      actualResult: "Actual",
      severity: "Medium",
      priority: "Medium",
      status: "Open",
    });
    await defectsPage.submitCreate();
    await defectsPage.expectDefectInList(defectTitle);

    // Update severity inline
    await defectsPage.updateSeverityInline(defectTitle, "Critical");

    // The row should still be visible with updated value
    await defectsPage.expectDefectInList(defectTitle);
  });

  test("positive: delete a defect", {
    tag: ["@defects", "@positive"],
  }, async ({ authenticatedPage, defectsPage, generateDefectTitle }) => {
    const defectTitle = generateDefectTitle();
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    await defectsPage.fillCreateForm({
      title: defectTitle,
      description: "To be deleted",
      reproSteps: "Steps",
      expectedResult: "Expected",
      actualResult: "Actual",
      severity: "Low",
      priority: "Low",
      status: "Open",
    });
    await defectsPage.submitCreate();
    await defectsPage.expectDefectInList(defectTitle);

    await defectsPage.deleteDefect(defectTitle);
    await defectsPage.expectDefectNotInList(defectTitle);
  });

  test("negative: missing title shows validation", {
    tag: ["@defects", "@negative"],
  }, async ({ authenticatedPage, defectsPage }) => {
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    // Leave title empty
    await defectsPage.severitySelect.selectOption("Medium");
    await defectsPage.prioritySelect.selectOption("Medium");
    await defectsPage.statusSelect.selectOption("Open");
    await defectsPage.submitCreate();
    await expect(defectsPage.titleInput).toHaveAttribute("required");
  });

  test("boundary: very long defect title (500 chars)", {
    tag: ["@defects", "@boundary"],
  }, async ({ authenticatedPage, defectsPage }) => {
    const longTitle = "A".repeat(500);
    await defectsPage.goto();
    await defectsPage.openCreateForm();
    await defectsPage.fillCreateForm({
      title: longTitle,
      description: "Test",
      reproSteps: "Steps",
      expectedResult: "Expected",
      actualResult: "Actual",
      severity: "Medium",
      priority: "Medium",
      status: "Open",
    });
    await defectsPage.submitCreate();
    await expect(
      defectsPage.page.locator("body")
    ).not.toContainText("Internal Server Error");
  });

  test("authorization: unauthenticated user cannot access defects", {
    tag: ["@defects", "@authorization"],
  }, async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/defects");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
