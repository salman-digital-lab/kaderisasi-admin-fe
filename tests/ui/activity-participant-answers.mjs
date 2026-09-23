import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const browser = await chromium.launch();
const form = {
  id: 701,
  is_active: false,
  form_schema: {
    fields: [
      {
        section_name: "profile_data",
        fields: [{ key: "name", label: "Nama", type: "text" }],
      },
      {
        section_name: "Motivasi",
        fields: [
          { key: "reason", label: "Alasan mengikuti", type: "textarea" },
          {
            key: "attendance",
            label: "Kesediaan hadir",
            type: "select",
            options: [{ value: "yes", label: "Bersedia" }],
          },
        ],
      },
    ],
  },
};
const participant = {
  id: 702,
  user_id: 703,
  activity_id: 700,
  name: "Peserta Uji",
  email: "peserta@example.test",
  status: "TERDAFTAR",
  questionnaire_answer: {
    reason: "Ingin belajar bersama peserta lain.",
    attendance: "yes",
  },
  created_at: "2026-09-22T06:14:00Z",
};

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!["xhr", "fetch"].includes(request.resourceType())) {
        if (
          ["localhost", "127.0.0.1"].includes(url.hostname) &&
          url.port === "3005"
        )
          return route.continue();
        return route.abort();
      }
      const path = url.pathname.replace(/^\/v2/, "");
      let data = [];
      if (path.startsWith("/auth/"))
        data = {
          access_token: "ui-fixture",
          access_token_expires_in: 900,
          user: {
            id: 1,
            display_name: "Admin Uji",
            email: "admin@example.test",
            is_active: true,
            role: { code: "super_admin", name: "Super Admin" },
          },
          permissions: [
            "activities.read",
            "activities.manage",
            "activity_registrations.read",
            "custom_forms.read",
          ],
          authentication_methods: ["password"],
          is_super_admin: true,
        };
      else if (path === "/activities/700")
        data = { id: 700, name: "Kegiatan Uji", additional_config: {} };
      else if (path === "/custom-forms/by-feature") data = form;
      else if (path === "/activities/700/registrations")
        data = {
          data: [participant],
          meta: { current_page: 1, per_page: 50, total: 1 },
        };
      else if (request.method() !== "GET")
        throw new Error(`Unexpected write: ${path}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "GET_DATA_SUCCESS", data }),
      });
    });
    await page.goto("http://127.0.0.1:3005/activity/700/participants");
    const list = page.locator(
      '[data-list-id="pages/Activity/ActivityParticipants/index:1"]',
    );
    if (width === 390)
      await list.locator(".mobile-record-details summary").click();
    await expect(
      list.getByText("Ingin belajar bersama peserta lain."),
    ).toBeVisible();
    await expect(list.getByText("Bersedia")).toBeVisible();
    await page.getByRole("button", { name: "Atur Kolom" }).click();
    const manager = page.getByRole("dialog", { name: "Pengaturan Kolom" });
    await expect(
      manager.getByRole("button", { name: "Seret kolom Alasan mengikuti" }),
    ).toBeVisible();
    const moveUp = manager.getByRole("button", {
      name: "Naikkan kolom Kesediaan hadir",
    });
    await moveUp.focus();
    await expect(moveUp).toBeFocused();
    await page.keyboard.press("Enter");
    const labels = await manager.locator("label").allTextContents();
    assert.ok(
      labels.indexOf("Kesediaan hadir") < labels.indexOf("Alasan mengikuti"),
    );
    await manager.getByRole("checkbox", { name: "Alasan mengikuti" }).uncheck();
    await manager.getByRole("button", { name: "Simpan" }).click();
    await expect(
      list.getByText("Ingin belajar bersama peserta lain."),
    ).toHaveCount(0);
    await page.reload();
    if (width === 390)
      await list.locator(".mobile-record-details summary").click();
    await expect(
      list.getByText("Ingin belajar bersama peserta lain."),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Atur Kolom" }).click();
    await manager.getByRole("button", { name: "Reset Default" }).click();
    await manager.getByRole("button", { name: "Simpan" }).click();
    await expect(
      list.getByText("Ingin belajar bersama peserta lain."),
    ).toBeVisible();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      `${width}px: activity question columns, choice labels, hide/reload/reset passed`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
