import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/form-settings/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [width, featureType] of [
    [1280, "activity_registration"],
    [1440, "activity_registration"],
    [390, "activity_registration"],
    [1440, "club_registration"],
    [1440, "independent_form"],
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    let active = false;
    let failToggle = false;
    let toggles = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/v2/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/toggle-active")) {
        assert.equal(route.request().method(), "PUT");
        toggles++;
        if (failToggle) {
          await route.fulfill({
            status: 400,
            json: { message: "CLOSE_REGISTRATION_BEFORE_FORM_CHANGE" },
          });
          return;
        }
        active = !active;
      }
      const data = path.includes("/auth/")
        ? {
            access_token: "ui-fixture",
            user: {
              id: 9999,
              display_name: "Admin Uji",
              email: "admin@example.test",
              is_active: true,
              role: { code: "super_admin", name: "Super Admin" },
            },
            permissions: ["custom_forms.read", "custom_forms.manage"],
            authentication_methods: ["password"],
            is_super_admin: true,
          }
        : path.endsWith("/custom-forms/9999") || path.endsWith("/toggle-active")
          ? {
              id: 9999,
              form_name: "Pendaftaran kegiatan",
              feature_type: featureType,
              feature_id: null,
              is_active: active,
              form_description:
                "Informasi kegiatan dan petunjuk pendaftaran.\n\nSilakan lengkapi pertanyaan sesuai kondisi Anda.",
              post_submission_info:
                "<p>Terima kasih. Pendaftaran Anda sudah diterima.</p><p>Informasi selanjutnya akan disampaikan oleh panitia.</p>",
              created_at: "2026-09-17T05:02:00Z",
              updated_at: "2026-09-17T12:46:00Z",
              form_schema: {
                version: 2,
                fields: [
                  { id: "profile", section_name: "profile_data", fields: [] },
                ],
              },
            }
          : [];
      await route.fulfill({ json: { message: "SUCCESS", data } });
    });
    await page.goto("http://localhost:3005/custom-form/9999/edit?tab=basic");
    const settings = page.locator(".builder-basic-settings");
    await expect(
      settings.getByLabel("Nama Form", { exact: true }),
    ).toBeVisible();
    const openName =
      featureType === "independent_form"
        ? "Buka penerimaan respons"
        : "Aktifkan formulir";
    const closeName =
      featureType === "independent_form"
        ? "Tutup penerimaan respons"
        : "Nonaktifkan formulir";
    await page.getByRole("button", { name: openName, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: closeName, exact: true }),
    ).toBeVisible();
    await expect(
      settings
        .locator(".builder-form-metadata")
        .getByText("Aktif", { exact: true }),
    ).toBeVisible();
    failToggle = true;
    await page.getByRole("button", { name: closeName, exact: true }).click();
    await expect(page.locator(".ant-alert-error")).toBeVisible();
    await expect(
      page.getByRole("button", { name: closeName, exact: true }),
    ).toBeVisible();
    failToggle = false;
    await page.getByRole("button", { name: closeName, exact: true }).click();
    await expect(
      page.getByRole("button", { name: openName, exact: true }),
    ).toBeVisible();
    assert.equal(toggles, 3);
    const intro = settings.locator("textarea");
    const editor = settings.locator(".ProseMirror");
    await intro.fill("Petunjuk yang diperbarui.");
    await editor.fill("Pesan setelah mengirim yang diperbarui.");
    await expect(
      page.getByRole("button", { name: openName, exact: true }),
    ).toBeDisabled();
    const left = await intro.boundingBox();
    const right = await editor.boundingBox();
    if (width >= 992)
      assert.ok(right.x > left.x + left.width, "Editors share a desktop row");
    else
      assert.ok(
        right.y > left.y + left.height,
        "Editors stack on narrow screens",
      );
    await settings.getByRole("button", { name: "Pengaturan Tambahan" }).focus();
    await page.keyboard.press("Enter");
    await expect(settings.getByLabel("Tipe Form")).toBeVisible();
    await page.keyboard.press("Enter");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: new URL(`settings-${featureType}-${width}.png`, output).pathname,
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Settings ${featureType} ${width}px: passed`);
  }
} finally {
  await browser.close();
}
