import { expect, test, type Page } from "@playwright/test";
import { apiFetch, credentialsAreMissing, findTableRowByText, loginAsConfiguredUser, openAdminNavigationPage } from "./admin-helpers";

const expectedThemeCodes = ["STANDARD", "MODERN", "DARK", "CORPORATE", "MINIMAL"];

function sitePath(siteCode: string, suffix = "") {
  return `/api/admin/sites/${encodeURIComponent(siteCode)}${suffix}`;
}

async function createBlockingPage(page: Page, siteCode: string, suffix: string) {
  return apiFetch<{ id: number }>(page, sitePath(siteCode, "/pages"), {
    method: "POST",
    body: {
      title: `E2E Site blocker ${suffix}`,
      slug: `e2e-site-blocker-${suffix}`,
      content: "<p>Temporary delete blocker</p>",
      status: "DRAFT",
      metaTitle: `E2E blocker ${suffix}`,
      metaDescription: "Temporary delete blocker.",
      homepage: false,
      menuVisible: false,
      templateCode: "",
      pageType: "CONTENT",
    },
  });
}

test.describe("Site management enhancements", () => {
  test.skip(credentialsAreMissing(), "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run authenticated Site tests.");

  test("persists backend themes and safely deletes only an empty selected Site", async ({ page }) => {
    test.setTimeout(60_000);
    const suffix = Date.now().toString();
    const siteCode = `e2e-site-${suffix}`;
    const siteName = `E2E Site ${suffix}`;
    let blockerPageId: number | null = null;
    let siteDeleted = false;

    await loginAsConfiguredUser(page);

    try {
      await openAdminNavigationPage(page, "Sites", "/sites");
      const definitionsResponsePromise = page.waitForResponse((response) =>
        response.url().endsWith("/api/admin/theme-definitions") && response.request().method() === "GET",
      );
      await page.getByRole("link", { name: "New site" }).click();
      const definitionsResponse = await definitionsResponsePromise;
      expect(definitionsResponse.status()).toBeLessThan(400);

      const themeSelect = page.getByLabel("Site theme");
      await expect(themeSelect).toBeVisible();
      await expect(themeSelect.locator("option")).toHaveCount(expectedThemeCodes.length);
      expect(await themeSelect.locator("option").evaluateAll((options) => options.map((option) => option.value))).toEqual(expectedThemeCodes);

      await page.getByLabel("Code").fill(siteCode);
      await page.getByLabel("Name").fill(siteName);
      await themeSelect.selectOption("DARK");
      const createResponse = page.waitForResponse((response) =>
        response.url().endsWith("/api/admin/sites") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Save site" }).click();
      expect((await createResponse).status()).toBeLessThan(400);
      await expect(page).toHaveURL((url) => url.pathname === "/sites");
      await expect(page.getByLabel("Selected", { exact: true })).toHaveValue(siteCode);

      const siteRow = await findTableRowByText(page, siteCode);
      await siteRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByLabel("Site theme")).toHaveValue("DARK");
      await page.getByRole("link", { name: "Back to sites" }).click();

      blockerPageId = (await createBlockingPage(page, siteCode, suffix)).id;
      const blockedRow = await findTableRowByText(page, siteCode);
      const blockedUsageResponse = page.waitForResponse((response) =>
        response.url().endsWith(sitePath(siteCode, "/usage")) && response.request().method() === "GET",
      );
      await blockedRow.getByRole("button", { name: "Delete" }).click();
      expect((await blockedUsageResponse).status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: "Site cannot be deleted" })).toBeVisible();
      await expect(page.getByText("pageCount: 1", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Close" }).click();

      await apiFetch(page, sitePath(siteCode, `/pages/${blockerPageId}`), { method: "DELETE" });
      blockerPageId = null;

      const deletableRow = await findTableRowByText(page, siteCode);
      await deletableRow.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();

      blockerPageId = (await createBlockingPage(page, siteCode, `${suffix}-race`)).id;
      const conflictResponse = page.waitForResponse((response) =>
        response.url().endsWith(sitePath(siteCode)) && response.request().method() === "DELETE",
      );
      await page.getByRole("button", { name: "Delete" }).last().click();
      expect((await conflictResponse).status()).toBe(409);
      await expect(page.getByRole("heading", { name: "Site cannot be deleted" })).toBeVisible();
      await expect(page.getByText("pageCount: 1", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Close" }).click();

      await apiFetch(page, sitePath(siteCode, `/pages/${blockerPageId}`), { method: "DELETE" });
      blockerPageId = null;

      const emptyRow = await findTableRowByText(page, siteCode);
      await emptyRow.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();
      const deleteResponse = page.waitForResponse((response) =>
        response.url().endsWith(sitePath(siteCode)) && response.request().method() === "DELETE",
      );
      await page.getByRole("button", { name: "Delete" }).last().click();
      expect((await deleteResponse).status()).toBeLessThan(400);
      siteDeleted = true;
      await expect(page.getByRole("row").filter({ hasText: siteCode })).toHaveCount(0);
      await expect(page.getByLabel("Selected", { exact: true })).not.toHaveValue(siteCode);
    } finally {
      if (blockerPageId !== null) {
        await apiFetch(page, sitePath(siteCode, `/pages/${blockerPageId}`), { method: "DELETE" });
      }
      if (!siteDeleted) {
        await apiFetch(page, sitePath(siteCode), { method: "DELETE" });
      }
    }
  });
});
