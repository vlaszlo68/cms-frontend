import { expect, test } from "@playwright/test";
import { credentialsAreMissing, loginAsConfiguredUser, logout } from "./admin-helpers";

test.describe("auth, session, and registration validation", () => {
  test("rejects invalid login and redirects protected pages to login", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cms.language", "en");
    });

    await page.goto("/users");
    await expect(page).toHaveURL((url) => url.pathname === "/login");
    await expect(page.getByRole("heading", { name: "CMS Login" })).toBeVisible();

    await page.getByLabel("Login name").fill(`invalid-${Date.now()}`);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(".error-message")).toContainText(
      "Sign-in failed. Check your credentials or whether your account is active.",
    );
    await expect(page).toHaveURL((url) => url.pathname === "/login");
  });

  test("validates registration password rules and password confirmation", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cms.language", "en");
    });

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

    await page.getByLabel("Login name").fill(`e2eregvalidation${Date.now()}`);
    await page.getByLabel("User name").fill("E2E Registration Validation");
    await page.getByLabel("Email").fill(`e2eregvalidation${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("Password1!");
    await page.getByLabel("Confirm password").fill("Password2!");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.locator(".error-message")).toContainText(
      "Password confirmation does not match.",
    );
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
  });

  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run authenticated session tests.",
  );

  test("restores an existing session and clears it on logout", async ({ page }) => {
    await loginAsConfiguredUser(page);
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

    await logout(page);
    await page.goto("/settings");
    await expect(page).toHaveURL((url) => url.pathname === "/login");
    await expect(page.getByRole("heading", { name: "CMS Login" })).toBeVisible();
  });
});
