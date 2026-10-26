import { expect, test, type Page } from "@playwright/test";
import {
  apiFetch,
  credentialsAreMissing,
  findTableRowByText,
  loginAsConfiguredUser,
  openAdminNavigationPage,
  selectSiteByCode,
} from "./admin-helpers";

type SiteSettings = {
  siteName: string;
  logoMediaId?: number | null;
  footerText?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
};

const siteACode = process.env.PLAYWRIGHT_SITE_A_CODE ?? "e2e-feature05-a";
const siteBCode = process.env.PLAYWRIGHT_SITE_B_CODE ?? "";

function sitePath(siteCode: string, suffix: string) {
  return `/api/admin/sites/${encodeURIComponent(siteCode)}${suffix}`;
}

async function createPage(page: Page, siteCode: string, title: string, suffix: string) {
  await selectSiteByCode(page, siteCode);
  await openAdminNavigationPage(page, "Pages", "/pages");
  await page.getByRole("link", { name: "New page" }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Slug").fill("about");
  await page.getByLabel("Status").selectOption("DRAFT");
  await page.getByLabel("Page type").selectOption("CONTENT");
  await page.getByLabel("Meta title").fill(`${title} ${suffix}`);
  await page.getByLabel("Meta description").fill(`Multi-site test ${suffix}`);
  await page.getByRole("textbox", { name: "Content" }).fill(`<p>${title}</p>`);

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(sitePath(siteCode, "/pages")) && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create page" }).click();
  const response = await responsePromise;
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  const pageId = payload.data.id as number;
  await expect(page).toHaveURL((url) => url.pathname === "/pages");
  const row = await findTableRowByText(page, "about");
  await expect(row).toContainText(title);
  return pageId;
}

async function createBlockPageAndBlock(page: Page, siteCode: string, suffix: string) {
  const title = `E2E Block Page ${suffix}`;
  await selectSiteByCode(page, siteCode);
  await openAdminNavigationPage(page, "Pages", "/pages");
  await page.getByRole("link", { name: "New page" }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Slug").fill(`e2e-block-${suffix}`);
  await page.getByLabel("Status").selectOption("DRAFT");
  await page.getByLabel("Page type").selectOption("BLOCK");
  await page.getByLabel("Meta title").fill(title);
  await page.getByLabel("Meta description").fill(title);

  const pageResponsePromise = page.waitForResponse((response) =>
    response.url().includes(sitePath(siteCode, "/pages")) && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create page" }).click();
  const pageResponse = await pageResponsePromise;
  expect(pageResponse.status()).toBeLessThan(400);
  const pageId = (await pageResponse.json()).data.id as number;
  const row = await findTableRowByText(page, `e2e-block-${suffix}`);
  await row.getByRole("link", { name: "Blocks" }).click();
  await page.getByRole("link", { name: "New page block" }).click();
  await page.getByLabel("Title", { exact: true }).fill(`E2E block ${suffix}`);
  await page.getByLabel("Block type").fill("TEXT");
  await page.getByLabel("Sort order").fill("1");
  await page.getByLabel("Config JSON").fill('{"text":"site scoped"}');

  const blockResponsePromise = page.waitForResponse((response) =>
    response.url().includes(sitePath(siteCode, `/pages/${pageId}/blocks`)) && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create page block" }).click();
  const blockResponse = await blockResponsePromise;
  expect(blockResponse.status()).toBeLessThan(400);
  const blockId = (await blockResponse.json()).data.id as number;
  await expect(page.getByRole("row").filter({ hasText: `E2E block ${suffix}` })).toBeVisible();
  return { pageId, blockId };
}

async function createMainMenu(page: Page, siteCode: string, suffix: string) {
  await selectSiteByCode(page, siteCode);
  await openAdminNavigationPage(page, "Menus", "/menus");
  await page.getByRole("link", { name: "New menu" }).click();
  await page.getByLabel("Name").fill(`E2E Main ${suffix}`);
  await page.getByLabel("Code").fill("MAIN");

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(sitePath(siteCode, "/menus")) && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create menu" }).click();
  const response = await responsePromise;
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  const menuId = payload.data.id as number;
  await expect(page).toHaveURL((url) => url.pathname === "/menus");
  const row = await findTableRowByText(page, "MAIN");
  await expect(row).toContainText(`E2E Main ${suffix}`);
  return menuId;
}

async function uploadTestMedia(page: Page, siteCode: string, fileName: string) {
  await selectSiteByCode(page, siteCode);
  await openAdminNavigationPage(page, "Media", "/media");
  await page.getByRole("button", { name: "Upload media" }).click();
  await page.getByLabel("File").setInputFiles({
    name: fileName,
    mimeType: "text/plain",
    buffer: Buffer.from(`isolated media ${fileName}`, "utf8"),
  });
  await page.getByLabel("Description").fill(`Multi-site media ${fileName}`);

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(sitePath(siteCode, "/media")) && response.request().method() === "POST",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Upload media" }).click();
  const response = await responsePromise;
  expect(response.status()).toBeLessThan(400);
  const payload = await response.json();
  await expect(page.getByRole("heading", { name: "Upload media" })).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: fileName })).toBeVisible();
  return payload.data.id as number;
}

test.describe("multi-site administration", () => {
  test.skip(
    credentialsAreMissing() || !siteBCode,
    "Set admin credentials and PLAYWRIGHT_SITE_B_CODE to an existing clean Site.",
  );

  test("isolates Pages, Menus, Settings, and Media across Sites", async ({ page }) => {
    test.setTimeout(60_000);
    const suffix = Date.now().toString();
    const siteAName = "E2E Feature 05 Site A";
    const siteBName = `E2E Site B ${suffix}`;
    const mediaAName = `e2e-site-a-${suffix}.txt`;
    const mediaBName = `e2e-site-b-${suffix}.txt`;
    const pageATitle = `E2E About A ${suffix}`;
    const pageBTitle = `E2E About B ${suffix}`;
    const testFooterA = `E2E footer A ${suffix}`;
    const testFooterB = `E2E footer B ${suffix}`;

    let pageAId: number | null = null;
    let pageBId: number | null = null;
    let blockPageId: number | null = null;
    let pageBlockId: number | null = null;
    let menuAId: number | null = null;
    let menuBId: number | null = null;
    let menuItemAId: number | null = null;
    let originalSettingsA: SiteSettings | null = null;
    let originalSettingsB: SiteSettings | null = null;
    let originalSite: { name: string; active: boolean } | null = null;

    await loginAsConfiguredUser(page);

    try {
      // Site creation and inactive Site editing are tested through the admin UI.
      const configuredSites = await apiFetch<Array<{ code: string; name: string; active: boolean }>>(
        page,
        "/api/admin/sites",
      );
      const existingSite = configuredSites.find((site) => site.code === siteACode);
      if (existingSite) {
        originalSite = { name: existingSite.name, active: existingSite.active };
        await selectSiteByCode(page, siteACode);
        await openAdminNavigationPage(page, "Sites", "/sites");
        const existingSiteRow = await findTableRowByText(page, siteACode);
        await existingSiteRow.getByRole("link", { name: "Edit" }).click();
      } else {
        await openAdminNavigationPage(page, "Sites", "/sites");
        await page.getByRole("link", { name: "New site" }).click();
        await page.getByLabel("Code").fill(siteACode);
        await page.getByLabel("Name").fill(siteAName);
        const siteCreateResponse = page.waitForResponse((response) =>
          response.url().endsWith("/api/admin/sites") && response.request().method() === "POST",
        );
        await page.getByRole("button", { name: "Save site" }).click();
        expect((await siteCreateResponse).status()).toBeLessThan(400);
        originalSite = { name: siteAName, active: true };
        await expect(page.getByRole("combobox", { name: "Selected" })).toHaveValue(siteACode);
        const createdSiteRow = await findTableRowByText(page, siteACode);
        await createdSiteRow.getByRole("link", { name: "Edit" }).click();
      }

      await expect(page.getByRole("heading", { name: "Edit site" })).toBeVisible();
      await page.getByLabel("Name").fill(`${siteAName} inactive`);
      await page.getByLabel("Active").uncheck();
      const siteUpdateResponse = page.waitForResponse((response) =>
        response.url().includes(`/api/admin/sites/${siteACode}`) && response.request().method() === "PUT",
      );
      await page.getByRole("button", { name: "Save site" }).click();
      expect((await siteUpdateResponse).status()).toBeLessThan(400);
      await expect(page.getByText("Inactive", { exact: true })).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Selected" }).locator(`option[value="${siteACode}"]`)).toContainText("Inactive");

      const inactiveSiteRow = await findTableRowByText(page, siteACode);
      await inactiveSiteRow.getByRole("link", { name: "Edit" }).click();
      await page.getByLabel("Name").fill(siteAName);
      await page.getByLabel("Active").check();
      await page.getByRole("button", { name: "Save site" }).click();
      await expect(page.getByRole("combobox", { name: "Selected" })).toContainText(siteAName);

      originalSettingsA = await apiFetch<SiteSettings>(page, sitePath(siteACode, "/site-settings"));
      originalSettingsB = await apiFetch<SiteSettings>(page, sitePath(siteBCode, "/site-settings"));

      // Same slug is created independently in both Sites.
      pageAId = await createPage(page, siteACode, pageATitle, suffix);
      pageBId = await createPage(page, siteBCode, pageBTitle, suffix);
      ({ pageId: blockPageId, blockId: pageBlockId } = await createBlockPageAndBlock(page, siteACode, suffix));
      await selectSiteByCode(page, siteBCode);
      await expect(page).toHaveURL((url) => url.pathname === "/pages");
      await expect(page.getByRole("row").filter({ hasText: pageATitle })).toHaveCount(0);
      await expect(page.getByRole("row").filter({ hasText: pageBTitle })).toHaveCount(1);

      // Switching during an edit returns to the list and does not submit Site A state under Site B.
      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Pages", "/pages");
      const pageARow = await findTableRowByText(page, "about");
      await pageARow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByRole("heading", { name: "Edit page" })).toBeVisible();
      await page.getByLabel("Title", { exact: true }).fill(`Must not submit ${suffix}`);
      const siteBPageDetailResponse = page.waitForResponse((response) => {
        const requestUrl = new URL(response.url());
        return requestUrl.pathname.endsWith(sitePath(siteBCode, `/pages/${pageAId}`)) &&
          response.request().method() === "GET";
      });
      const siteBPageListResponse = page.waitForResponse((response) => {
        const requestUrl = new URL(response.url());
        return requestUrl.pathname.endsWith(sitePath(siteBCode, "/pages")) &&
          response.request().method() === "GET";
      });
      await selectSiteByCode(page, siteBCode);
      await expect(page).toHaveURL((url) => url.pathname === "/pages");
      expect((await siteBPageListResponse).status()).toBeLessThan(400);
      expect((await siteBPageDetailResponse).status()).toBe(404);
      await expect(page.getByRole("row").filter({ hasText: pageATitle })).toHaveCount(0);
      await expect(page.getByRole("row").filter({ hasText: pageBTitle })).toHaveCount(1);

      // MAIN menu codes may repeat, and PAGE targets only expose current-Site pages.
      menuAId = await createMainMenu(page, siteACode, `A ${suffix}`);
      menuBId = await createMainMenu(page, siteBCode, `B ${suffix}`);
      await selectSiteByCode(page, siteACode);
      const menuARow = await findTableRowByText(page, "MAIN");
      await menuARow.getByRole("link", { name: "Menu items" }).click();
      await expect(
        page.locator('select[name="pageId"] option').filter({ hasText: pageATitle }),
      ).toHaveCount(1);
      const pageTargetOptions = await page.locator('select[name="pageId"] option').allTextContents();
      expect(pageTargetOptions).toContain(pageATitle);
      expect(pageTargetOptions).not.toContain(pageBTitle);
      await page.getByLabel("Title", { exact: true }).fill(`E2E linked A ${suffix}`);
      await page.locator('select[name="pageId"]').selectOption({ label: pageATitle });
      const menuItemResponse = page.waitForResponse((response) =>
        response.url().includes(sitePath(siteACode, `/menus/${menuAId}/items`)) && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Create menu item" }).click();
      expect((await menuItemResponse).status()).toBeLessThan(400);
      const loadedItems = await apiFetch<Array<{ id: number }>>(page, sitePath(siteACode, `/menus/${menuAId}/items`));
      menuItemAId = loadedItems[0]?.id ?? null;
      expect(menuItemAId).not.toBeNull();

      // Site Settings saves independently and restore both original records in finally.
      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");
      await page.getByLabel("Site name").fill(siteAName);
      await page.getByLabel("Footer text").fill(testFooterA);
      await expect(page.getByLabel("Site name")).toHaveValue(siteAName);
      await expect(page.getByLabel("Footer text")).toHaveValue(testFooterA);
      const invalidSettingsFields = await page.locator("form").evaluate((form) =>
        Array.from(form.elements)
          .filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
            element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement,
          )
          .filter((element) => !element.checkValidity())
          .map((element) => ({ name: element.name, value: element.value, type: element.type })),
      );
      expect(invalidSettingsFields).toEqual([]);
      const settingsSaveA = page.waitForResponse(
        (response) =>
          response.url().endsWith(sitePath(siteACode, "/site-settings")) &&
          response.request().method() === "PUT",
        { timeout: 7_000 },
      );
      await page.getByRole("button", { name: "Save settings" }).click();
      expect((await settingsSaveA).status()).toBeLessThan(400);
      await expect(page.locator(".success-message")).toContainText("Site settings saved.");

      await selectSiteByCode(page, siteBCode);
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");
      await expect(page.getByLabel("Footer text")).not.toHaveValue(testFooterA);
      await page.getByLabel("Site name").fill(siteBName);
      await page.getByLabel("Footer text").fill(testFooterB);
      const settingsSaveB = page.waitForResponse(
        (response) =>
          response.url().endsWith(sitePath(siteBCode, "/site-settings")) &&
          response.request().method() === "PUT",
        { timeout: 7_000 },
      );
      await page.getByRole("button", { name: "Save settings" }).click();
      expect((await settingsSaveB).status()).toBeLessThan(400);
      await expect(page.locator(".success-message")).toContainText("Site settings saved.");

      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");
      await expect(page.getByLabel("Footer text")).toHaveValue(testFooterA);

      // Uploaded media stays inside the Site that received it.
      const mediaAId = await uploadTestMedia(page, siteACode, mediaAName);
      await uploadTestMedia(page, siteBCode, mediaBName);
      await expect(page.getByRole("row").filter({ hasText: mediaAName })).toHaveCount(0);
      await expect(page.getByRole("row").filter({ hasText: mediaBName })).toHaveCount(1);
      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Media", "/media");
      await expect(page.getByRole("row").filter({ hasText: mediaAName })).toHaveCount(1);
      await expect(page.getByRole("row").filter({ hasText: mediaBName })).toHaveCount(0);
      const mediaARow = await findTableRowByText(page, mediaAName);
      await mediaARow.getByRole("button", { name: "Details" }).click();
      await page.getByRole("button", { name: "Preview" }).click();
      const contentLink = page.getByRole("link", { name: "Open content" }).last();
      await expect(contentLink).toHaveAttribute(
        "href",
        sitePath(siteACode, `/media/${mediaAId}/content`),
      );
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await page.getByRole("button", { name: "Cancel" }).last().click();

      await selectSiteByCode(page, siteACode);
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");
      await expect(
        page.locator('select[name="logoMediaId"] option').filter({ hasText: mediaAName }),
      ).toHaveCount(1);
      await expect(
        page.locator('select[name="logoMediaId"] option').filter({ hasText: mediaBName }),
      ).toHaveCount(0);
      await selectSiteByCode(page, siteBCode);
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");
      await expect(
        page.locator('select[name="logoMediaId"] option').filter({ hasText: mediaBName }),
      ).toHaveCount(1);
      await expect(
        page.locator('select[name="logoMediaId"] option').filter({ hasText: mediaAName }),
      ).toHaveCount(0);

      // The global Template registry remains available and unchanged across Site selection.
      const templatesResponse = page.waitForResponse((response) =>
        response.url().endsWith("/api/templates") && response.request().method() === "GET",
      );
      await openAdminNavigationPage(page, "Templates", "/templates");
      expect((await templatesResponse).status()).toBeLessThan(400);
      const templateCodesA = await apiFetch<Array<{ code: string }>>(page, "/api/templates");
      await selectSiteByCode(page, siteBCode);
      await expect(page).toHaveURL((url) => url.pathname === "/templates");
      const templateCodesB = await apiFetch<Array<{ code: string }>>(page, "/api/templates");
      expect(templateCodesB.map((template) => template.code)).toEqual(
        templateCodesA.map((template) => template.code),
      );
    } finally {
      if (originalSettingsA) {
        await apiFetch(page, sitePath(siteACode, "/site-settings"), { method: "PUT", body: originalSettingsA });
      }
      if (originalSettingsB) {
        await apiFetch(page, sitePath(siteBCode, "/site-settings"), { method: "PUT", body: originalSettingsB });
      }
      if (originalSite) {
        await apiFetch(page, sitePath(siteACode, ""), {
          method: "PUT",
          body: { code: siteACode, ...originalSite },
        });
      }
      if (menuItemAId !== null && menuAId !== null) {
        await apiFetch(page, sitePath(siteACode, `/menus/${menuAId}/items/${menuItemAId}`), { method: "DELETE" });
      }
      if (menuAId !== null) {
        await apiFetch(page, sitePath(siteACode, `/menus/${menuAId}`), { method: "DELETE" });
      }
      if (menuBId !== null) {
        await apiFetch(page, sitePath(siteBCode, `/menus/${menuBId}`), { method: "DELETE" });
      }
      if (blockPageId !== null && pageBlockId !== null) {
        await apiFetch(page, sitePath(siteACode, `/pages/${blockPageId}/blocks/${pageBlockId}`), { method: "DELETE" });
      }
      if (blockPageId !== null) {
        await apiFetch(page, sitePath(siteACode, `/pages/${blockPageId}`), { method: "DELETE" });
      }
      if (pageAId !== null) {
        await apiFetch(page, sitePath(siteACode, `/pages/${pageAId}`), { method: "DELETE" });
      }
      if (pageBId !== null) {
        await apiFetch(page, sitePath(siteBCode, `/pages/${pageBId}`), { method: "DELETE" });
      }
      for (const [code, fileName] of [[siteACode, mediaAName], [siteBCode, mediaBName]] as const) {
        const siteMedia = await apiFetch<Array<{ id: number; originalFileName: string }>>(
          page,
          sitePath(code, "/media?activeOnly=false"),
        );
        for (const item of siteMedia.filter((candidate) => candidate.originalFileName === fileName)) {
          await apiFetch(page, sitePath(code, `/media/${item.id}`), { method: "DELETE" });
        }
      }
    }
  });
});

test("unauthenticated visitors cannot open Site management or site-owned pages", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("cms.language", "en"));
  await page.goto("/sites");
  await expect(page).toHaveURL((url) => url.pathname === "/login");
  await page.goto("/pages");
  await expect(page).toHaveURL((url) => url.pathname === "/login");
});
