import { expect, test, type Page } from "@playwright/test";

const credentials = {
  loginName: process.env.PLAYWRIGHT_LOGIN_NAME ?? "",
  password: process.env.PLAYWRIGHT_PASSWORD ?? "",
};

type NavigationItem = {
  name: string;
  path: string;
};

async function getVisibleNavigationItems(page: Page) {
  const navigation = page.getByRole("navigation", { name: "Main navigation" });

  return navigation.getByRole("link").evaluateAll((links) =>
    links
      .map((link) => {
        const anchor = link as HTMLAnchorElement;

        return {
          name: anchor.textContent?.trim() ?? "",
          path: new URL(anchor.href).pathname,
        } satisfies NavigationItem;
      })
      .filter((item) => item.name !== "" && item.path !== ""),
  );
}

test.describe("authenticated app smoke", () => {
  test.skip(
    credentials.loginName === "" || credentials.password === "",
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run authenticated smoke tests.",
  );

  test("logs in and opens every visible navigation screen", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cms.language", "en");
    });

    await page.goto("/login");
    await page.getByLabel("Login name").fill(credentials.loginName);
    await page.getByLabel("Password").fill(credentials.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL((url) => url.pathname === "/");
    await expect(page.getByRole("heading", { name: `Welcome ${credentials.loginName}` })).toBeVisible();
    await expect(page.getByRole("banner").getByText(credentials.loginName, { exact: true })).toBeVisible();

    const consoleErrors: string[] = [];
    const unexpectedResponses: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("response", (response) => {
      const url = response.url();
      const status = response.status();

      if (status >= 400 && !url.endsWith("/favicon.ico")) {
        unexpectedResponses.push(`${status} ${url}`);
      }
    });

    const navigationItems = await getVisibleNavigationItems(page);
    expect(navigationItems.map((item) => item.name)).toEqual(expect.arrayContaining(["Dashboard", "Settings"]));

    for (const item of navigationItems) {
      await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", {
        name: item.name,
        exact: true,
      }).click();

      await expect(page).toHaveURL((url) => url.pathname === item.path);
      await expect(page.getByRole("banner").getByText(credentials.loginName, { exact: true })).toBeVisible();
      await expect(page.getByText(/^Loading/)).toHaveCount(0);
      await expect(page.locator(".error-message")).toHaveCount(0);
    }

    expect(consoleErrors).toEqual([]);
    expect(unexpectedResponses).toEqual([]);
  });
});
