import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/form-errors/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1280, 1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const title =
      "Apakah Anda bersedia hadir pada kegiatan penganugerahan bagi peserta terbaik dalam kategori akademik, kompetisi, dan organisasi yang diselenggarakan oleh panitia?";
    const form = {
      id: 9999,
      form_name: "Pendaftaran kegiatan",
      feature_type: "activity_registration",
      feature_id: null,
      is_active: true,
      form_schema: {
        version: 2,
        fields: [
          { id: "profile", section_name: "profile_data", fields: [] },
          {
            id: "attendance",
            section_name: "Kehadiran",
            fields: [
              {
                key: "attendance",
                label: title,
                type: "radio",
                required: true,
                options: [],
              },
              {
                key: "reason",
                label: "Alasan",
                type: "text",
                required: false,
                validation: { minLength: 5, maxLength: 2, pattern: "[" },
              },
            ],
          },
        ],
      },
    };
    await page.route("**/v2/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (!path.includes("/auth/"))
        assert.equal(
          route.request().method(),
          "GET",
          "Error checks must not save",
        );
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
          ? form
          : [];
      await route.fulfill({ json: { message: "SUCCESS", data } });
    });
    await page.goto("http://localhost:3005/custom-form/9999/edit?tab=schema");
    const panel = page.locator(".builder-section-errors");
    await expect(
      panel.getByText("Ada yang perlu diperbaiki", { exact: true }),
    ).toBeVisible();
    await expect(panel.locator(".builder-issue-group")).toHaveCount(2);
    await expect(panel.getByText(title, { exact: true })).toBeVisible();
    await expect(
      panel.getByText("Tambahkan minimal satu pilihan jawaban.", {
        exact: true,
      }),
    ).toHaveCount(1);
    assert.equal(
      await panel.locator("li").first().textContent(),
      "Tambahkan minimal satu pilihan jawaban.",
    );
    await page.screenshot({
      path: new URL(`question-errors-${width}.png`, output).pathname,
      fullPage: true,
    });
    await panel
      .getByRole("button", { name: "Perbaiki pertanyaan 1", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#builder-question-attendance")).toBeFocused();
    await page
      .getByRole("button", { name: "Tambah pilihan", exact: true })
      .click();
    await expect(
      panel.getByText("Tambahkan minimal satu pilihan jawaban.", {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      panel.getByText(
        "Isi teks pada setiap pilihan jawaban atau hapus pilihan yang kosong.",
        { exact: true },
      ),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Pilihan 1", exact: true })
      .fill("Ya, bersedia hadir");
    await page
      .getByRole("textbox", { name: "Pilihan 1", exact: true })
      .press("Tab");
    await expect(panel.locator(".builder-issue-group")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Simpan Perubahan", exact: true })
      .click();
    await expect(
      page.getByText(
        "Periksa daftar perbaikan pada bagian yang ditandai. Perubahan belum disimpan.",
        { exact: true },
      ),
    ).toBeVisible();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        status: "passed",
        groupedErrors: 2,
        keyboardRepair: true,
        saves: 0,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
