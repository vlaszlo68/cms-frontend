import { expect, test } from "@playwright/test";

test.describe("auth pages when CAPTCHA is disabled", () => {
  test("render login and registration without CAPTCHA controls", async ({ page, request }) => {
    const authConfigResponse = await request.get("/api/auth/config");

    await expect(authConfigResponse).toBeOK();
    await expect(await authConfigResponse.json()).toMatchObject({
      success: true,
      data: {
        loginCaptchaEnabled: false,
        registrationCaptchaEnabled: false,
      },
    });

    const captchaRequests: string[] = [];
    page.on("request", (nextRequest) => {
      if (nextRequest.url().includes("/api/auth/captcha")) {
        captchaRequests.push(nextRequest.url());
      }
    });

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "CMS Login" })).toBeVisible();
    await expect(page.getByLabel("Login name")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
    await expect(page.getByText("Captcha answer")).toHaveCount(0);

    await page.getByRole("link", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByLabel("Login name")).toBeVisible();
    await expect(page.getByLabel("User name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toBeEnabled();
    await expect(page.getByText("Captcha answer")).toHaveCount(0);

    expect(captchaRequests).toEqual([]);
  });
});
