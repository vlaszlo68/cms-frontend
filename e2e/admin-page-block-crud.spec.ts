import { expect, test } from "@playwright/test";
import {
  apiFetch,
  credentialsAreMissing,
  deleteIfPresent,
  expectNoFormErrors,
  findTableRowByText,
  getRowLinkPath,
  idFromPath,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin page block CRUD", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run page block CRUD tests.",
  );

  test("creates, edits, and deletes a block on a BLOCK page", async ({ page }) => {
    const suffix = Date.now().toString();
    const pageTitle = `E2E Block Page ${suffix}`;
    const pageSlug = `e2e-block-page-${suffix}`;
    const blockTitle = `E2E Hero Block ${suffix}`;
    const updatedBlockTitle = `E2E Banner Block ${suffix}`;
    let createdPageId: number | null = null;
    let createdBlockId: number | null = null;

    await loginAsConfiguredUser(page);

    try {
      if (!(await openAdminNavigationPage(page, "Pages", "/pages"))) {
        test.skip(true, "PageBlock CRUD E2E requires an ADMIN account.");
      }

      await page.getByRole("link", { name: "New page" }).click();
      await page.getByLabel("Title", { exact: true }).fill(pageTitle);
      await page.getByLabel("Slug").fill(pageSlug);
      await page.getByLabel("Status").selectOption("DRAFT");
      await page.getByLabel("Page type").selectOption("BLOCK");
      await expect(page.getByText("This BLOCK page is composed from page blocks.")).toBeVisible();
      await page.getByRole("button", { name: "Create page" }).click();

      await expect(page).toHaveURL((url) => url.pathname === "/pages");
      const pageRow = await findTableRowByText(page, pageSlug);
      createdPageId = idFromPath(await getRowLinkPath(pageRow, "Edit"), /\/pages\/(\d+)\/edit/);
      await expect(pageRow).toContainText("BLOCK");

      await pageRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByRole("heading", { name: "Edit page" })).toBeVisible();
      await expect(page.getByLabel("Title", { exact: true })).toHaveValue(pageTitle);
      await expect(page.getByLabel("Slug")).toHaveValue(pageSlug);
      await expect(page.getByLabel("Status")).toHaveValue("DRAFT");
      await expect(page.getByLabel("Page type")).toHaveValue("BLOCK");
      await expect(page.getByText("This BLOCK page is composed from page blocks.")).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Content" })).toHaveCount(0);

      await page.getByRole("link", { name: "Cancel" }).click();
      const blockPageRow = await findTableRowByText(page, pageSlug);

      await blockPageRow.getByRole("link", { name: "Blocks" }).click();
      await expect(page.getByRole("heading", { name: /Page blocks/ })).toBeVisible();
      await page.getByRole("link", { name: "New page block" }).click();

      await page.getByLabel("Title").fill(blockTitle);
      await page.getByLabel("Block type").fill("HERO");
      await page.getByLabel("Sort order").fill("5");
      await page.getByLabel("Config JSON").fill('{"headline":"Hello","theme":"primary"}');

      const createResponse = page.waitForResponse(
        (response) => response.url().includes("/api/page-blocks") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Create page block" }).click();
      const createdBlockResponse = await createResponse;
      expect(createdBlockResponse.status()).toBeLessThan(400);
      const createdBlockPayload = (await createdBlockResponse.json()) as { data?: { id?: unknown } };

      if (typeof createdBlockPayload.data?.id !== "number") {
        throw new Error("Created PageBlock response did not contain a numeric ID.");
      }

      createdBlockId = createdBlockPayload.data.id;

      const createdBlockRow = await findTableRowByText(page, blockTitle);
      await expect(createdBlockRow).toContainText("HERO");
      await expect(createdBlockRow).toContainText("5");
      await expect(createdBlockRow).toContainText("Yes");

      await createdBlockRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByRole("heading", { name: "Edit page block" })).toBeVisible();
      await expect(page.getByLabel("Config JSON")).toHaveValue('{"headline":"Hello","theme":"primary"}');
      await page.getByLabel("Title").fill(updatedBlockTitle);
      await page.getByLabel("Block type").fill("BANNER");
      await page.getByLabel("Sort order").fill("9");
      await page.getByLabel("Visible").uncheck();
      await page.getByLabel("Config JSON").fill('{"headline":"Updated","theme":"secondary"}');

      const updateResponse = page.waitForResponse(
        (response) => response.url().includes("/api/page-blocks/") && response.request().method() === "PUT",
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      expect((await updateResponse).status()).toBeLessThan(400);

      const updatedBlockRow = await findTableRowByText(page, updatedBlockTitle);
      await expect(updatedBlockRow).toContainText("BANNER");
      await expect(updatedBlockRow).toContainText("9");
      await expect(updatedBlockRow).toContainText("No");

      await updatedBlockRow.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();
      const deleteResponse = page.waitForResponse(
        (response) => response.url().includes("/api/page-blocks/") && response.request().method() === "DELETE",
      );
      await page.getByRole("button", { name: "Delete" }).last().click();
      expect((await deleteResponse).status()).toBeLessThan(400);
      createdBlockId = null;
      await expect(page.getByRole("row").filter({ hasText: updatedBlockTitle })).toHaveCount(0);
      await expectNoFormErrors(page);
    } finally {
      try {
        if (createdBlockId !== null) {
          await apiFetch(page, `/api/page-blocks/${createdBlockId}`, { method: "DELETE" });
          createdBlockId = null;
        }
      } finally {
        if (createdPageId !== null) {
          await deleteIfPresent(page, `/api/pages/${createdPageId}`);
          createdPageId = null;
        }
      }
    }
  });
});
