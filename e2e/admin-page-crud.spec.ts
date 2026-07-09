import { expect, test } from "@playwright/test";
import {
  clickAndWaitForSettledResponses,
  credentialsAreMissing,
  expectNoFormErrors,
  findTableRowByText,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin page CRUD", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run admin page CRUD tests.",
  );

  test("creates, edits, and deletes a page", async ({ page }) => {
    const suffix = Date.now().toString();
    const title = `E2E Page ${suffix}`;
    const updatedTitle = `E2E Updated Page ${suffix}`;
    const slug = `e2e-page-${suffix}`;

    await loginAsConfiguredUser(page);

    if (!(await openAdminNavigationPage(page, "Pages", "/pages"))) {
      test.skip(true, "Page CRUD E2E requires an ADMIN account.");
    }

    await expect(page.getByText("Loading pages...")).toHaveCount(0);

    await page.getByRole("link", { name: "New page" }).click();
    await expect(page.getByRole("heading", { name: "Create page" })).toBeVisible();
    await expect(page.getByLabel("Title", { exact: true })).toBeVisible();

    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Status").selectOption("DRAFT");
    await page.getByLabel("Page type").selectOption("CONTENT");
    await page.getByLabel("Meta title").fill(`${title} meta`);
    await page.getByLabel("Meta description").fill(`${title} description`);
    await page.getByRole("textbox", { name: "Content" }).fill(`<p>${title} content</p>`);

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/pages") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create page" }).click();
    expect((await createResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/pages");
    await expect(page.getByText("Loading pages...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const createdRow = await findTableRowByText(page, slug);
    await expect(createdRow).toContainText(title);
    await expect(createdRow).toContainText("DRAFT");
    await expect(createdRow).toContainText("CONTENT");
    await expect(createdRow).toContainText("No");
    await expect(createdRow).toContainText("Yes");

    const pageLoadResponses = await clickAndWaitForSettledResponses(
      page,
      () => createdRow.getByRole("link", { name: "Edit" }).click(),
      (request) => request.method() === "GET" && request.url().includes("/api/pages/"),
    );
    pageLoadResponses.forEach((response) => expect(response.status()).toBeLessThan(400));

    await expect(page.getByRole("heading", { name: "Edit page" })).toBeVisible();
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
    await expect(page.getByLabel("Slug")).toHaveValue(slug);
    await expect(page.getByLabel("Status")).toHaveValue("DRAFT");
    await expect(page.getByLabel("Meta title")).toHaveValue(`${title} meta`);
    await expect(page.getByRole("textbox", { name: "Content" })).toHaveValue(
      `<p>${title} content</p>`,
    );

    await page.getByLabel("Title", { exact: true }).fill(updatedTitle);
    await page.getByLabel("Status").selectOption("PUBLISHED");
    await page.getByLabel("Meta title").fill(`${updatedTitle} meta`);
    await page.getByRole("textbox", { name: "Content" }).fill(`<p>${updatedTitle} content</p>`);

    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/pages/") && response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    expect((await updateResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/pages");
    await expect(page.getByText("Loading pages...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const updatedRow = await findTableRowByText(page, slug);
    await expect(updatedRow).toContainText(updatedTitle);
    await expect(updatedRow).toContainText("PUBLISHED");

    await updatedRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();
    await expect(page.getByText(`Delete ${updatedTitle}?`)).toBeVisible();

    const deleteResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/pages/") && response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Delete" }).last().click();
    expect((await deleteResponsePromise).status()).toBeLessThan(400);

    await expect(page.getByRole("row").filter({ hasText: slug })).toHaveCount(0);
    await expectNoFormErrors(page);
  });
});
