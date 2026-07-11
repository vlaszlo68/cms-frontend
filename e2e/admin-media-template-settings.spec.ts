import { expect, test, type Page } from "@playwright/test";
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

type SiteSettings = {
  siteName: string;
  logoMediaId: number | null;
  footerText: string | null;
  contactEmail: string | null;
  phone: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
};

async function uploadFile(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
  description: string,
) {
  await openAdminNavigationPage(page, "Media", "/media");
  await page.getByRole("button", { name: "Upload media" }).click();
  await expect(page.getByRole("heading", { name: "Upload media" })).toBeVisible();
  await page.getByLabel("File").setInputFiles(file);
  await page.getByLabel("Description").fill(description);
  await page.getByRole("dialog").getByRole("button", { name: "Upload media" }).click();
  await expect(page.getByRole("heading", { name: "Upload media" })).toHaveCount(0);
  await expect(page.getByText("Loading media...")).toHaveCount(0);

  const row = await findTableRowByText(page, file.name);
  await expect(row).toContainText(file.mimeType);

  return row;
}

test.describe("admin media, template, and site settings flows", () => {
  test.skip(
    credentialsAreMissing(),
    "Set PLAYWRIGHT_LOGIN_NAME and PLAYWRIGHT_PASSWORD to run media/template/settings tests.",
  );

  test("uploads, previews, inspects, and deletes a media item", async ({ page }) => {
    const suffix = Date.now().toString();
    const fileName = `e2e-media-${suffix}.txt`;
    let mediaId: number | null = null;

    await loginAsConfiguredUser(page);

    try {
      const row = await uploadFile(
        page,
        {
          name: fileName,
          mimeType: "text/plain",
          buffer: Buffer.from(`E2E media body ${suffix}`, "utf8"),
        },
        `E2E media description ${suffix}`,
      );

      await row.getByRole("button", { name: "Details" }).click();
      await expect(page.getByRole("heading", { name: fileName })).toBeVisible();
      await expect(page.getByText(`E2E media description ${suffix}`)).toBeVisible();
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(page.getByText("Preview is not available for this file type.")).toBeVisible();
      const contentHref = await page.getByRole("link", { name: "Open content" }).last().getAttribute("href");
      mediaId = idFromPath(contentHref ?? "", /\/api\/media\/(\d+)\/content/);
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await page.getByRole("button", { name: "Cancel" }).last().click();

      const uploadedRow = await findTableRowByText(page, fileName);
      await uploadedRow.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByRole("heading", { name: "Confirm deletion" })).toBeVisible();
      await page.getByRole("button", { name: "Delete" }).last().click();
      await expect(page.getByRole("row").filter({ hasText: fileName })).toHaveCount(0);
      mediaId = null;
      await expectNoFormErrors(page);
    } finally {
      if (mediaId !== null) {
        await deleteIfPresent(page, `/api/media/${mediaId}`);
      }
    }
  });

  test("creates, edits, and deletes a template with a preview image", async ({ page }) => {
    const suffix = Date.now().toString();
    const imageName = `e2e-template-preview-${suffix}.png`;
    const code = `E2E_TEMPLATE_${suffix}`;
    const updatedCode = `E2E_TEMPLATE_${suffix}_UPDATED`;
    const name = `E2E Template ${suffix}`;
    const updatedName = `E2E Updated Template ${suffix}`;
    let mediaId: number | null = null;
    let templateId: number | null = null;

    await loginAsConfiguredUser(page);

    try {
      const mediaRow = await uploadFile(
        page,
        {
          name: imageName,
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
            "base64",
          ),
        },
        `E2E template preview ${suffix}`,
      );
      await mediaRow.getByRole("button", { name: "Details" }).click();
      await page.getByRole("button", { name: "Preview" }).click();
      const contentHref = await page.getByRole("link", { name: "Open content" }).last().getAttribute("href");
      mediaId = idFromPath(contentHref ?? "", /\/api\/media\/(\d+)\/content/);
      await page.getByRole("button", { name: "Cancel" }).last().click();
      await page.getByRole("button", { name: "Cancel" }).last().click();

      await openAdminNavigationPage(page, "Templates", "/templates");
      await page.getByRole("link", { name: "New template" }).click();
      await page.getByLabel("Code").fill(code);
      await page.getByLabel("Name").fill(name);
      await page.getByLabel("Description").fill(`E2E template description ${suffix}`);
      await page.getByLabel("Preview image").selectOption({ label: imageName });
      await page.getByRole("button", { name: "Create template" }).click();

      const createdRow = await findTableRowByText(page, code);
      templateId = idFromPath(await getRowLinkPath(createdRow, "Edit"), /\/templates\/(\d+)\/edit/);
      await expect(createdRow).toContainText(name);
      await expect(createdRow).toContainText("Yes");

      await createdRow.getByRole("link", { name: "Edit" }).click();
      await expect(page.getByRole("heading", { name: "Edit template" })).toBeVisible();
      await expect(page.getByLabel("Preview image")).toHaveValue(String(mediaId));
      await page.getByLabel("Code").fill(updatedCode);
      await page.getByLabel("Name").fill(updatedName);
      await page.getByLabel("Description").fill(`E2E template updated ${suffix}`);
      await page.getByLabel("Active").uncheck();
      await page.getByRole("button", { name: "Save changes" }).click();

      const updatedRow = await findTableRowByText(page, updatedCode);
      await expect(updatedRow).toContainText(updatedName);
      await expect(updatedRow).toContainText("No");

      await updatedRow.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Delete" }).last().click();
      await expect(page.getByRole("row").filter({ hasText: updatedCode })).toHaveCount(0);
      templateId = null;
      await expectNoFormErrors(page);
    } finally {
      if (templateId !== null) {
        await deleteIfPresent(page, `/api/templates/${templateId}`);
      }
      if (mediaId !== null) {
        await deleteIfPresent(page, `/api/media/${mediaId}`);
      }
    }
  });

  test("saves site settings and restores the original singleton values", async ({ page }) => {
    const suffix = Date.now().toString();
    let originalSettings: SiteSettings | null = null;

    await loginAsConfiguredUser(page);

    try {
      originalSettings = await apiFetch<SiteSettings>(page, "/api/site-settings");
      await openAdminNavigationPage(page, "Site Settings", "/site-settings");

      await page.getByLabel("Site name").fill(`E2E CMS ${suffix}`);
      await page.getByLabel("Logo").selectOption("");
      await page.getByLabel("Footer text").fill(`E2E footer ${suffix}`);
      await page.getByLabel("Contact email").fill(`site-${suffix}@example.com`);
      await page.getByLabel("Phone").fill("+36 1 234 5678");
      await page.getByLabel("Facebook URL").fill("https://facebook.com/e2e");
      await page.getByLabel("LinkedIn URL").fill("https://linkedin.com/company/e2e");
      await page.getByRole("button", { name: "Save settings" }).click();

      await expect(page.locator(".success-message")).toContainText("Site settings saved.");
      await expect(page.getByLabel("Site name")).toHaveValue(`E2E CMS ${suffix}`);
      await expectNoFormErrors(page);
    } finally {
      if (originalSettings !== null) {
        await apiFetch(page, "/api/site-settings", {
          method: "PUT",
          body: originalSettings,
        });
      }
    }
  });
});
