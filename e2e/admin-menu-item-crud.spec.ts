import { expect, test } from "@playwright/test";
import {
  credentialsAreMissing,
  deleteIfPresent,
  expectNoFormErrors,
  findTableRowByText,
  getRowLinkPath,
  idFromPath,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin menu item CRUD", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run menu item CRUD tests.",
  );

  test("validates URL target input and manages PAGE-target menu items", async ({ page }) => {
    const suffix = Date.now().toString();
    const pageTitle = `E2E Menu Item Page ${suffix}`;
    const pageSlug = `e2e-menu-item-page-${suffix}`;
    const menuName = `E2E Menu Items ${suffix}`;
    const menuCode = `E2E_MENU_ITEMS_${suffix}`;
    const parentTitle = `E2E Parent Item ${suffix}`;
    const childTitle = `E2E Child Item ${suffix}`;
    const updatedChildTitle = `E2E Updated Child Item ${suffix}`;
    let createdPageId: number | null = null;
    let createdMenuId: number | null = null;

    await loginAsConfiguredUser(page);

    try {
      if (!(await openAdminNavigationPage(page, "Pages", "/pages"))) {
        test.skip(true, "Menu item CRUD E2E requires an ADMIN account.");
      }

      await page.getByRole("link", { name: "New page" }).click();
      await page.getByLabel("Title", { exact: true }).fill(pageTitle);
      await page.getByLabel("Slug").fill(pageSlug);
      await page.getByLabel("Status").selectOption("PUBLISHED");
      await page.getByLabel("Page type").selectOption("CONTENT");
      await page.getByRole("textbox", { name: "Content" }).fill(`<p>${pageTitle}</p>`);
      await page.getByRole("button", { name: "Create page" }).click();
      const pageRow = await findTableRowByText(page, pageSlug);
      createdPageId = idFromPath(await getRowLinkPath(pageRow, "Edit"), /\/pages\/(\d+)\/edit/);

      await openAdminNavigationPage(page, "Menus", "/menus");
      await page.getByRole("link", { name: "New menu" }).click();
      await page.getByLabel("Name").fill(menuName);
      await page.getByLabel("Code").fill(menuCode);
      await page.getByRole("button", { name: "Create menu" }).click();

      const menuRow = await findTableRowByText(page, menuCode);
      createdMenuId = idFromPath(await getRowLinkPath(menuRow, "Edit"), /\/menus\/(\d+)\/edit/);
      await menuRow.getByRole("link", { name: "Menu items" }).click();

      await expect(page.getByRole("heading", { name: /Menu items/ })).toBeVisible();
      await page.getByLabel("Target type").selectOption("URL");
      await page.getByLabel("Title").fill(`E2E URL Validation ${suffix}`);
      await page.getByRole("button", { name: "Create menu item" }).click();
      const targetUrlValidationMessage = await page
        .getByLabel("Target URL")
        .evaluate((element) => (element as HTMLInputElement).validationMessage);
      expect(targetUrlValidationMessage).not.toBe("");

      await page.getByLabel("Target type").selectOption("PAGE");
      await page.getByLabel("Title").fill(parentTitle);
      await page.locator('select[name="pageId"]').selectOption({ label: pageTitle });
      await page.getByLabel("Sort order").fill("1");
      await page.getByRole("button", { name: "Create menu item" }).click();

      const parentRow = await findTableRowByText(page, parentTitle);
      await expect(parentRow).toContainText("PAGE");
      await expect(parentRow).toContainText(pageTitle);

      await page.getByLabel("Title").fill(childTitle);
      await page.locator('select[name="pageId"]').selectOption({ label: pageTitle });
      await page.getByLabel("Parent item").selectOption({ label: parentTitle });
      await page.getByLabel("Sort order").fill("2");
      await page.getByRole("button", { name: "Create menu item" }).click();

      const childRow = await findTableRowByText(page, childTitle);
      await expect(childRow).toContainText(parentTitle);
      await childRow.getByRole("button", { name: "Edit" }).click();

      await expect(page.getByRole("heading", { name: "Edit menu item" })).toBeVisible();
      await page.getByLabel("Title").fill(updatedChildTitle);
      await page.getByLabel("Sort order").fill("3");
      await page.getByLabel("Visible").uncheck();
      await page.getByRole("button", { name: "Save changes" }).click();

      const updatedChildRow = await findTableRowByText(page, updatedChildTitle);
      await expect(updatedChildRow).toContainText("3");
      await expect(updatedChildRow).toContainText("No");

      await updatedChildRow.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Delete" }).last().click();
      await expect(page.getByRole("row").filter({ hasText: updatedChildTitle })).toHaveCount(0);

      const remainingParentRow = await findTableRowByText(page, parentTitle);
      await remainingParentRow.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Delete" }).last().click();
      await expect(page.getByRole("row").filter({ hasText: parentTitle })).toHaveCount(0);
      await expectNoFormErrors(page);
    } finally {
      if (createdMenuId !== null) {
        await deleteIfPresent(page, `/api/menus/${createdMenuId}`);
      }
      if (createdPageId !== null) {
        await deleteIfPresent(page, `/api/pages/${createdPageId}`);
      }
    }
  });
});
