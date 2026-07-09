import { expect, test } from "@playwright/test";
import {
  credentialsAreMissing,
  expectNoFormErrors,
  findTableRowByText,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin menu CRUD", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run admin menu CRUD tests.",
  );

  test("creates, edits, and deletes a menu", async ({ page }) => {
    const suffix = Date.now().toString();
    const name = `E2E Menu ${suffix}`;
    const updatedName = `E2E Updated Menu ${suffix}`;
    const code = `E2E_MENU_${suffix}`;
    const updatedCode = `E2E_MENU_${suffix}_UPDATED`;

    await loginAsConfiguredUser(page);

    if (!(await openAdminNavigationPage(page, "Menus", "/menus"))) {
      test.skip(true, "Menu CRUD E2E requires an ADMIN account.");
    }

    await expect(page.getByText("Loading menus...")).toHaveCount(0);

    await page.getByRole("link", { name: "New menu" }).click();
    await expect(page.getByRole("heading", { name: "Create menu" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();

    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Code").fill(code);

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/menus") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create menu" }).click();
    expect((await createResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/menus");
    await expect(page.getByText("Loading menus...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const createdRow = await findTableRowByText(page, code);
    await expect(createdRow).toContainText(name);
    await expect(createdRow).toContainText("Yes");

    await createdRow.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit menu" })).toBeVisible();
    await expect(page.getByLabel("Code")).toHaveValue(code);

    await page.getByLabel("Name").fill(updatedName);
    await page.getByLabel("Code").fill(updatedCode);
    await page.getByLabel("Active").uncheck();

    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/menus/") && response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    expect((await updateResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/menus");
    await expect(page.getByText("Loading menus...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const updatedRow = await findTableRowByText(page, updatedCode);
    await expect(updatedRow).toContainText(updatedName);
    await expect(updatedRow).toContainText("No");

    await updatedRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();
    await expect(page.getByText(`Delete ${updatedName}?`)).toBeVisible();

    const deleteResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/menus/") && response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Delete" }).last().click();
    expect((await deleteResponsePromise).status()).toBeLessThan(400);

    await expect(page.getByRole("row").filter({ hasText: updatedCode })).toHaveCount(0);
    await expectNoFormErrors(page);
  });
});
