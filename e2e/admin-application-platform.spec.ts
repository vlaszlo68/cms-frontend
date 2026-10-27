import { expect, test } from "@playwright/test";
import {
  credentialsAreMissing,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin application platform foundation", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run Application admin tests.",
  );

  test("loads the selected Site Applications and surfaces unsupported-code validation", async ({ page }) => {
    const unsupportedCode = `E2E_UNSUPPORTED_${Date.now()}`;

    await loginAsConfiguredUser(page);

    if (!(await openAdminNavigationPage(page, "Applications", "/applications"))) {
      test.skip(true, "Application administration E2E requires an ADMIN account.");
    }

    const selectedSiteCode = await page.getByLabel("Selected", { exact: true }).inputValue();
    const applicationsResponse = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname.endsWith(`/api/admin/sites/${selectedSiteCode}/applications`) &&
        response.request().method() === "GET";
    });
    await page.getByRole("button", { name: "Refresh" }).click();
    expect((await applicationsResponse).status()).toBe(200);

    await page.getByRole("link", { name: "New application" }).click();
    await page.getByLabel("Name").fill(`Unsupported application ${unsupportedCode}`);
    await page.getByLabel("Code").fill(unsupportedCode);
    const createResponse = page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());
      return requestUrl.pathname.endsWith(`/api/admin/sites/${selectedSiteCode}/applications`) &&
        response.request().method() === "POST";
    });
    await page.getByRole("button", { name: "Create application" }).click();

    expect((await createResponse).status()).toBe(400);
    await expect(page.locator(".error-message")).toContainText("Application code is not supported.");
    await expect(page).toHaveURL(/\/applications\/new$/);
  });
});
