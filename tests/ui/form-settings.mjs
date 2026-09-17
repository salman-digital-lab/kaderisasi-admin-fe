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
  for (const width of [1280, 1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/v2/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
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
        : path.endsWith("/custom-forms/9999")
          ? {
              id: 9999,
              form_name: "Pendaftaran kegiatan",
              feature_type: "activity_registration",
              feature_id: null,
              is_active: false,
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
    const intro = settings.locator("textarea");
    const editor = settings.locator(".ProseMirror");
    await intro.fill("Petunjuk yang diperbarui.");
    await editor.fill("Pesan setelah mengirim yang diperbarui.");
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
      path: new URL(`settings-${width}.png`, output).pathname,
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
    console.log(`Settings ${width}px: passed`);
  }
} finally {
  await browser.close();
}
