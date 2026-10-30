import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Login page.
 *
 * Encapsulates all selectors and actions for the login page so that
 * tests don't need to know about DOM structure. If the login UI changes,
 * only this file needs to be updated.
 *
 * Uses stable locators: input name attributes and button role/text.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use name attributes - stable and not dependent on label association
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.getByRole("button", { name: /sign in/i });
    this.errorMessage = page.getByText(/invalid email or password/i);
    this.registerLink = page.getByRole("link", { name: /create one/i });
  }

  /**
   * Navigate to the login page.
   */
  async goto() {
    await this.page.goto("/auth/login");
    // Wait for the form to be ready
    await this.emailInput.waitFor({ state: "visible" });
  }

  /**
   * Fill in email and password, then submit.
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Expect the login form to be visible.
   */
  async expectLoginForm() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Expect an error message to be visible.
   */
  async expectErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
  }
}
