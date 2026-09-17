import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/form-density/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1280, 1440, 1920, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/v2/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (!path.includes("/auth/"))
        assert.equal(route.request().method(), "GET");
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
              is_active: true,
              form_schema: {
                version: 2,
                fields: [
                  { id: "profile", section_name: "profile_data", fields: [] },
                  {
                    id: "section",
                    section_name: "Bagian 1",
                    fields: [
                      "Ceritakan pengalaman Anda mengikuti kegiatan organisasi.",
                      "Kegiatan apa yang ingin Anda ikuti?",
                      "Sampaikan informasi tambahan yang diperlukan panitia.",
                      "Jelaskan komitmen Anda dalam mengikuti rangkaian kegiatan.",
                    ].map((label, i) => ({
                      key: `q${i}`,
                      label,
                      type: "text",
                      required: true,
                    })),
                  },
                ],
              },
            }
          : [];
      await route.fulfill({ json: { message: "SUCCESS", data } });
    });
    await page.goto(
      width === 1920
        ? "http://localhost:3005/activity/9998/form/9999/edit?tab=schema"
        : "http://localhost:3005/custom-form/9999/edit?tab=schema",
    );
    const section = page.locator("#builder-section-section");
    await expect(section).toBeVisible();
    await expect(section.locator(".builder-question")).toHaveCount(4);
    if (width > 900) {
      const workspace = await page.locator(".form-builder-page").boundingBox();
      assert.ok(
        width - workspace.x - workspace.width <= 24,
        "No wide unused right margin",
      );
      const title = await section.locator("h3").boundingBox();
      const edit = await section
        .getByRole("button", { name: "Edit bagian", exact: true })
        .boundingBox();
      assert.ok(
        Math.abs(title.y - edit.y) < 8,
        "Section title and edit action share a row",
      );
      assert.ok(
        (await section.boundingBox()).height < 620,
        "Four-question section stays compact",
      );
    }
    await page.screenshot({
      path: new URL(`questions-${width}.png`, output).pathname,
      fullPage: true,
    });
    await section
      .getByRole("button", { name: "Edit bagian", exact: true })
      .click();
    await expect(
      section.getByLabel("Nama bagian", { exact: true }),
    ).toBeVisible();
    await section
      .getByRole("button", { name: "Selesai mengedit bagian", exact: true })
      .click();
    await expect(
      section.getByRole("button", { name: "Edit bagian", exact: true }),
    ).toBeVisible();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(`Question layout ${width}px: passed`);
    await page.close();
  }
} finally {
  await browser.close();
}
