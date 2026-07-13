import { expect, test } from "@playwright/test";
import {
  credentials,
  credentialsAreMissing,
  openAdminNavigationPage,
} from "./admin-helpers";

test.describe("preferences, i18n, and table behavior", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run preferences tests.",
  );

  test("persists design and appearance preferences, switches language, and toggles table sorting", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cms.language", "en");
    });
    await page.goto("/login");
    await page.getByLabel("Login name").fill(credentials.loginName);
    await page.getByLabel("Password").fill(credentials.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/");

    await page.goto("/settings");
    await expect(page).toHaveURL((url) => url.pathname === "/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await page.getByLabel("Design").selectOption("blueprint");
    await page.getByLabel("Colour theme").selectOption("aurora");
    await page.getByLabel("MenuSidebarTop menu").selectOption("horizontal");
    await page.getByLabel("Menu behavior").selectOption("floating");
    await page.getByLabel("Display density").selectOption("compact");
    await page.getByLabel("Content width").selectOption("centered");
    await page.getByLabel("Rows per page").selectOption("10");
    await page.getByLabel("Striped table rows").check();
    await page.getByLabel("Reduce motion").check();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "aurora");
    await expect(page.evaluate(() => window.localStorage.getItem("cms.design"))).resolves.toBe("blueprint");
    await expect(page.evaluate(() => window.localStorage.getItem("cms.tablePageSize"))).resolves.toBe("10");
    await expect(page.evaluate(() => window.localStorage.getItem("cms.navigationLayout"))).resolves.toBe("horizontal");

    await page.reload();
    await expect(page.getByLabel("Design")).toHaveValue("blueprint");
    await expect(page.getByLabel("Colour theme")).toHaveValue("aurora");
    await expect(page.getByLabel("Rows per page")).toHaveValue("10");
    await expect(page.getByLabel("Striped table rows")).toBeChecked();

    await page.getByLabel("Language").selectOption("hu");
    await expect(page.locator("html")).toHaveAttribute("lang", "hu");
    await expect(page.getByRole("heading", { name: "Beállítások" })).toBeVisible();

    await page.getByLabel("Nyelv").selectOption("en");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await openAdminNavigationPage(page, "Users", "/users");
    const loginNameHeader = page.getByRole("columnheader", { name: /Login name/ });
    await expect(loginNameHeader).toHaveAttribute("aria-sort", "none");
    await loginNameHeader.getByRole("button", { name: /Login name/ }).click();
    await expect(loginNameHeader).toHaveAttribute("aria-sort", "ascending");
    await loginNameHeader.getByRole("button", { name: /Login name/ }).click();
    await expect(loginNameHeader).toHaveAttribute("aria-sort", "descending");

    await page.goto("/settings");
    await page.getByLabel("Design").selectOption("original");
    await page.getByLabel("Colour theme").selectOption("classic");
    await page.getByLabel("MenuSidebarTop menu").selectOption("sidebar");
    await page.getByLabel("Menu behavior").selectOption("fixed");
    await page.getByLabel("Display density").selectOption("normal");
    await page.getByLabel("Content width").selectOption("full");
    await page.getByLabel("Rows per page").selectOption("100");
    await page.getByLabel("Striped table rows").uncheck();
    await page.getByLabel("Reduce motion").uncheck();
  });
});
