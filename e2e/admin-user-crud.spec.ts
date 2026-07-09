import { expect, test } from "@playwright/test";
import {
  credentialsAreMissing,
  expectNoFormErrors,
  findTableRowByText,
  loginAsConfiguredUser,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("admin user CRUD", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run admin user CRUD tests.",
  );

  test("creates, edits, and deactivates a user", async ({ page }) => {
    const suffix = Date.now().toString();
    const loginName = `e2euser${suffix}`;
    const initialUserName = `E2E Test User ${suffix}`;
    const updatedUserName = `E2E Updated User ${suffix}`;
    const initialEmail = `${loginName}@example.com`;
    const updatedEmail = `${loginName}.updated@example.com`;

    await loginAsConfiguredUser(page);

    if (!(await openAdminNavigationPage(page, "Users", "/users"))) {
      test.skip(true, "User CRUD E2E requires an ADMIN account.");
    }

    await expect(page.getByText("Loading users...")).toHaveCount(0);

    await page.getByRole("link", { name: "New user" }).click();
    await expect(page.getByRole("heading", { name: "Create user" })).toBeVisible();
    await expect(page.getByLabel("Login name")).toBeVisible();

    await page.getByLabel("Login name").fill(loginName);
    await page.getByLabel("User name").fill(initialUserName);
    await page.getByLabel("Email", { exact: true }).fill(initialEmail);
    await page.getByLabel("Password", { exact: true }).fill("pw");
    await page.getByLabel("Role").selectOption("USER");
    await page.getByLabel("Registration status").selectOption("COMPLETED");

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/users") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create user" }).click();
    expect((await createResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/users");
    await expect(page.getByText("Loading users...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const createdRow = await findTableRowByText(page, loginName);
    await expect(createdRow).toContainText(initialUserName);
    await expect(createdRow).toContainText(initialEmail);
    await expect(createdRow).toContainText("USER");
    await expect(createdRow).toContainText("Yes");
    await expect(createdRow).toContainText("COMPLETED");

    await createdRow.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit user" })).toBeVisible();
    await expect(page.getByLabel("Login name")).toHaveValue(loginName);

    await page.getByLabel("User name").fill(updatedUserName);
    await page.getByLabel("Email", { exact: true }).fill(updatedEmail);

    const updateResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/users/") && response.request().method() === "PUT",
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    expect((await updateResponsePromise).status()).toBeLessThan(400);

    await expect(page).toHaveURL((url) => url.pathname === "/users");
    await expect(page.getByText("Loading users...")).toHaveCount(0);
    await expectNoFormErrors(page);

    const updatedRow = await findTableRowByText(page, loginName);
    await expect(updatedRow).toContainText(updatedUserName);
    await expect(updatedRow).toContainText(updatedEmail);

    await updatedRow.getByRole("button", { name: "Deactivate" }).click();
    await expect(page.getByRole("heading", { name: "Confirm deactivation" })).toBeVisible();
    await expect(page.getByText(`Deactivate ${loginName}?`)).toBeVisible();

    const deleteResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/users/") && response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Deactivate" }).last().click();
    expect((await deleteResponsePromise).status()).toBeLessThan(400);

    const deactivatedRow = await findTableRowByText(page, loginName);
    await expect(deactivatedRow).toContainText("No");
    await expect(deactivatedRow.getByRole("button", { name: "Deactivate" })).toBeDisabled();
  });
});
