import { expect, test } from "@playwright/test";
import {
  credentialsAreMissing,
  loginAsConfiguredUser,
} from "./admin-helpers";

test.describe("visible API error handling", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run API error tests.",
  );

  test("surfaces backend envelope error messages from protected list screens", async ({ page }) => {
    await loginAsConfiguredUser(page);

    await page.route("**/api/pages", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 500,
        body: JSON.stringify({
          success: false,
          error: {
            code: "E2E_FORCED_ERROR",
            message: "E2E forced pages failure",
          },
        }),
      });
    });

    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", {
      name: "Pages",
      exact: true,
    }).click();

    await expect(page).toHaveURL((url) => url.pathname === "/pages");
    await expect(page.locator(".error-message")).toContainText("E2E forced pages failure");
  });

  test("shows a fallback error when an API request cannot reach the backend", async ({ page }) => {
    await loginAsConfiguredUser(page);

    await page.route("**/api/templates", async (route) => {
      await route.abort("failed");
    });

    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    const templatesLink = navigation.getByRole("link", { name: "Templates", exact: true });

    await expect(templatesLink).toBeVisible();
    await templatesLink.click();
    await expect(page).toHaveURL((url) => url.pathname === "/templates");
    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();

    await expect(page.locator(".error-message")).toContainText("Templates could not be loaded.");
  });
});
