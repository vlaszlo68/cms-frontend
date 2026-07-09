import { expect, type Locator, type Page } from "@playwright/test";

export const credentials = {
  loginName: process.env.PLAYWRIGHT_LOGIN_NAME ?? "",
  password: process.env.PLAYWRIGHT_PASSWORD ?? "",
};

export function credentialsAreMissing() {
  return credentials.loginName === "" || credentials.password === "";
}

export async function loginAsConfiguredUser(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("cms.language", "en");
    window.localStorage.setItem("cms.tablePageSize", "100");
  });

  await page.goto("/login");
  await page.getByLabel("Login name").fill(credentials.loginName);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
}

export async function openAdminNavigationPage(page: Page, name: string, path: string) {
  const navigation = page.getByRole("navigation", { name: "Main navigation" });

  await expect(navigation).toBeVisible();

  const link = navigation.getByRole("link", { name, exact: true });

  if ((await link.count()) === 0) {
    return false;
  }

  await link.click();
  await expect(page).toHaveURL((url) => url.pathname === path);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.locator(".error-message")).toHaveCount(0);

  return true;
}

export async function findTableRowByText(page: Page, text: string): Promise<Locator> {
  const nextPageButton = page.getByRole("button", { name: "Next", exact: true });
  const timeoutAt = Date.now() + 10_000;

  for (;;) {
    const row = page.getByRole("row").filter({ hasText: text });

    if ((await row.count()) > 0 && (await row.first().isVisible())) {
      return row.first();
    }

    if ((await nextPageButton.count()) === 0 || (await nextPageButton.isDisabled())) {
      if (Date.now() < timeoutAt) {
        await page.waitForTimeout(250);
        continue;
      }

      throw new Error(`Table row was not found: ${text}`);
    }

    await nextPageButton.click();
  }
}

export async function expectNoFormErrors(page: Page) {
  await expect(page.locator(".error-message")).toHaveCount(0);
}
