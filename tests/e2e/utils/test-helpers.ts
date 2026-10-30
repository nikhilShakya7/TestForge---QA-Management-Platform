/**
 * Utility functions for TestForge E2E tests.
 */

/**
 * Generate a unique test case ID with timestamp to avoid conflicts.
 */
export function generateUniqueTestCaseId(prefix: string = "TC"): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Generate a unique defect title.
 */
export function generateUniqueDefectTitle(prefix: string = "Defect"): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Generate a unique test run name.
 */
export function generateUniqueTestRunName(prefix: string = "Run"): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Wait for a condition with a timeout, polling every 500ms.
 * Useful for eventual consistency after API calls.
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: { timeout?: number; interval?: number } = {}
) {
  const { timeout = 10000, interval = 500 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Condition not met within timeout");
}

/**
 * Format a date string for input fields.
 */
export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
