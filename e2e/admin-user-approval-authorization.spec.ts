import { expect, test, type Page } from "@playwright/test";
import {
  credentialsAreMissing,
  expectNoFormErrors,
  findTableRowByText,
  loginAsConfiguredUser,
  logout,
  openAdminNavigationPage,
} from "./admin-helpers";

const password = "Pw1!abcd";

async function registerAccount(page: Page, loginName: string) {
  await page.goto("/register");
  await page.getByLabel("Login name").fill(loginName);
  await page.getByLabel("User name").fill(`E2E Registered ${loginName}`);
  await page.getByLabel("Email").fill(`${loginName}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByRole("heading", { name: "Registration received" })).toBeVisible();
  await expect(page.locator(".success-message")).toContainText("Registration successful");
}

test.describe("admin user approval and role authorization", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run user approval tests.",
  );

  test("approves and rejects registered users and enforces non-admin routing", async ({ page }) => {
    const suffix = Date.now().toString();
    const approvedLogin = `e2eapproved${suffix}`;
    const rejectedLogin = `e2erejected${suffix}`;

    await page.addInitScript(() => {
      window.localStorage.setItem("cms.language", "en");
      window.localStorage.setItem("cms.tablePageSize", "100");
    });

    await registerAccount(page, approvedLogin);
    await page.getByRole("link", { name: "Back to login" }).click();
    await registerAccount(page, rejectedLogin);

    await page.getByRole("link", { name: "Back to login" }).click();
    await loginAsConfiguredUser(page);

    if (!(await openAdminNavigationPage(page, "Users", "/users"))) {
      test.skip(true, "User approval E2E requires an ADMIN account.");
    }

    const approvedRow = await findTableRowByText(page, approvedLogin);
    await expect(approvedRow).toContainText("PENDING");
    await approvedRow.getByRole("button", { name: "Approve" }).click();
    await expect(await findTableRowByText(page, approvedLogin)).toContainText("COMPLETED");

    const rejectedRow = await findTableRowByText(page, rejectedLogin);
    await expect(rejectedRow).toContainText("PENDING");
    await rejectedRow.getByRole("button", { name: "Reject" }).click();
    await expect(await findTableRowByText(page, rejectedLogin)).toContainText("REJECTED");
    await expectNoFormErrors(page);

    await logout(page);
    await page.getByLabel("Login name").fill(approvedLogin);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", {
      name: "Users",
    })).toHaveCount(0);

    await page.goto("/users");
    await expect(page).toHaveURL((url) => url.pathname === "/");

    await logout(page);
    await loginAsConfiguredUser(page);
    await openAdminNavigationPage(page, "Users", "/users");

    const cleanupRow = await findTableRowByText(page, approvedLogin);
    await cleanupRow.getByRole("button", { name: "Deactivate" }).click();
    await page.getByRole("button", { name: "Deactivate" }).last().click();
    await expect(await findTableRowByText(page, approvedLogin)).toContainText("No");
  });
});
