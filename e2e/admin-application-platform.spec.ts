import { expect, test } from "@playwright/test";
import {
  apiFetch,
  credentialsAreMissing,
  findTableRowByText,
  getRowLinkPath,
  idFromPath,
  loginAsConfiguredUser,
  openAdminNavigationPage,
  selectSiteByCode,
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

  test("configures Weather Explorer independently per disposable Site and retains its menu target", async ({ page }) => {
    const suffix = Date.now().toString();
    const siteACode = `e2e-weather-a-${suffix}`;
    const siteBCode = `e2e-weather-b-${suffix}`;
    const siteAName = `E2E Weather Site A ${suffix}`;
    const siteBName = `E2E Weather Site B ${suffix}`;
    const weatherName = `Weather Explorer ${suffix}`;
    const menuName = `E2E Weather Menu ${suffix}`;
    const menuCode = `E2E_WEATHER_MENU_${suffix}`;
    const itemTitle = `Weather ${suffix}`;
    let applicationAId: number | null = null;
    let menuAId: number | null = null;
    let menuItemAId: number | null = null;
    const defaultSiteMutationPaths: string[] = [];

    page.on("request", (request) => {
      if (!["POST", "PUT", "DELETE"].includes(request.method())) return;
      const pathname = new URL(request.url()).pathname;
      if (pathname.includes("/api/admin/sites/default")) defaultSiteMutationPaths.push(pathname);
    });

    await loginAsConfiguredUser(page);

    try {
      await openAdminNavigationPage(page, "Sites", "/sites");
      await expect(page.getByRole("row").filter({ hasText: "default" })).toBeVisible();

      for (const [code, name] of [[siteACode, siteAName], [siteBCode, siteBName]] as const) {
        await page.getByRole("link", { name: "New site" }).click();
        await page.getByLabel("Code").fill(code);
        await page.getByLabel("Name").fill(name);
        await page.getByRole("button", { name: "Save site" }).click();
        await expect(page).toHaveURL(/\/sites$/);
        await expect(page.getByRole("row").filter({ hasText: code })).toBeVisible();
      }

      await selectSiteByCode(page, siteACode);
      if (!(await openAdminNavigationPage(page, "Applications", "/applications"))) {
        test.skip(true, "Weather application administration requires an ADMIN account.");
      }

      await page.getByRole("link", { name: "New application" }).click();
      await page.getByLabel("Name").fill(weatherName);
      await page.getByLabel("Code").fill("WEATHER_EXPLORER");
      await page.getByRole("button", { name: "Create application" }).click();
      await expect(page).toHaveURL(/\/applications$/);
      const applicationARow = await findTableRowByText(page, "WEATHER_EXPLORER");
      await expect(applicationARow).toContainText(weatherName);
      await expect(applicationARow).toContainText("Yes");
      applicationAId = idFromPath(await getRowLinkPath(applicationARow, "Edit"), /\/applications\/(\d+)\/edit/);

      await openAdminNavigationPage(page, "Menus", "/menus");
      await page.getByRole("link", { name: "New menu" }).click();
      await page.getByLabel("Name").fill(menuName);
      await page.getByLabel("Code").fill(menuCode);
      await page.getByRole("button", { name: "Create menu" }).click();
      const menuARow = await findTableRowByText(page, menuCode);
      menuAId = idFromPath(await getRowLinkPath(menuARow, "Menu items"), /\/menus\/(\d+)\/items/);
      await menuARow.getByRole("link", { name: "Menu items" }).click();

      await page.getByLabel("Target type").selectOption("APPLICATION");
      await page.getByLabel("Title").fill(itemTitle);
      await page.locator('select[name="applicationId"]').selectOption(String(applicationAId));
      await page.getByRole("button", { name: "Create menu item" }).click();
      const menuItemRow = await findTableRowByText(page, itemTitle);
      await expect(menuItemRow).toContainText("APPLICATION");
      await expect(menuItemRow).toContainText(weatherName);

      const menuItems = await apiFetch<Array<{ id: number; title: string; applicationId: number | null }>>(
        page,
        `/api/admin/sites/${siteACode}/menus/${menuAId}/items`,
      );
      menuItemAId = menuItems.find((item) => item.title === itemTitle)?.id ?? null;
      expect(menuItems.find((item) => item.id === menuItemAId)?.applicationId).toBe(applicationAId);
      await menuItemRow.getByRole("button", { name: "Edit" }).click();
      await expect(page.locator('select[name="applicationId"]')).toHaveValue(String(applicationAId));

      await selectSiteByCode(page, siteBCode);
      await openAdminNavigationPage(page, "Applications", "/applications");
      await expect(page.getByRole("row").filter({ hasText: weatherName })).toHaveCount(0);
      await page.getByRole("link", { name: "New application" }).click();
      await page.getByLabel("Name").fill(weatherName);
      await page.getByLabel("Code").fill("WEATHER_EXPLORER");
      await page.getByRole("button", { name: "Create application" }).click();
      await expect(page.getByRole("row").filter({ hasText: weatherName })).toBeVisible();

      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Applications", "/applications");
      await page.getByRole("row").filter({ hasText: "WEATHER_EXPLORER" }).getByRole("link", { name: "Edit" }).click();
      await page.getByLabel("Active").uncheck();
      await page.getByRole("button", { name: "Save changes" }).click();
      const inactiveApplicationRow = await findTableRowByText(page, "WEATHER_EXPLORER");
      await expect(inactiveApplicationRow).toContainText("No");
      await inactiveApplicationRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByLabel("Active")).not.toBeChecked();

      await openAdminNavigationPage(page, "Menus", "/menus");
      await menuARow.getByRole("link", { name: "Menu items" }).click();
      await page.getByLabel("Target type").selectOption("PAGE");
      await expect(page.locator('select[name="pageId"]')).toBeVisible();
      await page.getByLabel("Target type").selectOption("URL");
      await expect(page.getByLabel("Target URL")).toBeVisible();
      await page.getByLabel("Target type").selectOption("APPLICATION");
      await expect(page.locator('select[name="applicationId"]')).toBeVisible();
    } finally {
      const cleanupErrors: string[] = [];
      const remove = async (path: string) => {
        try { await apiFetch(page, path, { method: "DELETE" }); }
        catch (error) { cleanupErrors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`); }
      };

      if (menuItemAId !== null && menuAId !== null) await remove(`/api/admin/sites/${siteACode}/menus/${menuAId}/items/${menuItemAId}`);
      if (menuAId !== null) await remove(`/api/admin/sites/${siteACode}/menus/${menuAId}`);
      await remove(`/api/admin/sites/${siteACode}`);
      await remove(`/api/admin/sites/${siteBCode}`);
      expect(defaultSiteMutationPaths).toEqual([]);
      expect(cleanupErrors).toEqual([]);
    }
  });
});
