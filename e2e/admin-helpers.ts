import { expect, type Locator, type Page, type Request, type Response } from "@playwright/test";

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

export async function clickAndWaitForSettledResponses(
  page: Page,
  click: () => Promise<void>,
  matchesRequest: (request: Request) => boolean,
) {
  const pendingRequests = new Set<Request>();
  const responses: Response[] = [];
  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  let settle: (value: Response[]) => void;

  const cleanup = () => {
    if (quietTimer) {
      clearTimeout(quietTimer);
    }

    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }

    page.off("request", handleRequest);
    page.off("response", handleResponse);
    page.off("requestfailed", handleRequestDone);
    page.off("requestfinished", handleRequestDone);
  };

  const maybeSettle = () => {
    if (responses.length === 0 || pendingRequests.size > 0) {
      return;
    }

    if (quietTimer) {
      clearTimeout(quietTimer);
    }

    quietTimer = setTimeout(() => {
      if (pendingRequests.size === 0) {
        cleanup();
        settle(responses);
      }
    }, 100);
  };

  function handleRequest(request: Request) {
    if (!matchesRequest(request)) {
      return;
    }

    if (quietTimer) {
      clearTimeout(quietTimer);
    }

    pendingRequests.add(request);
  }

  function handleResponse(response: Response) {
    if (matchesRequest(response.request())) {
      responses.push(response);
    }
  }

  function handleRequestDone(request: Request) {
    if (pendingRequests.delete(request)) {
      maybeSettle();
    }
  }

  const settledResponses = new Promise<Response[]>((resolve, reject) => {
    settle = resolve;
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for matching responses to settle."));
    }, 10_000);
  });

  page.on("request", handleRequest);
  page.on("response", handleResponse);
  page.on("requestfailed", handleRequestDone);
  page.on("requestfinished", handleRequestDone);

  try {
    await click();
    return await settledResponses;
  } catch (error) {
    cleanup();
    throw error;
  }
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
