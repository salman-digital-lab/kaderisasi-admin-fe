import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/club-registration-details/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const optionID = "06e119d1-e88e-4e57-8211-6b10a480d13d";
const fields = [
  ["name", "Nama Lengkap", "text"],
  ["gender", "Jenis Kelamin", "select"],
  ["birth_date", "Tanggal Lahir", "date"],
  ["origin_province_id", "Provinsi Asal", "select"],
  ["origin_city_id", "Kota Asal", "select"],
  ["province_id", "Provinsi Domisili", "select"],
  ["whatsapp", "WhatsApp", "text"],
  ["current_education", "Pendidikan Sekarang", "current_education"],
].map(([key, label, type]) => ({ key, label, type, required: true }));
const form = {
  id: 9999,
  form_name: "Form klub uji",
  is_active: true,
  feature_type: "club_registration",
  feature_id: 9999,
  form_schema: {
    fields: [
      { section_name: "profile_data", fields },
      {
        section_name: "Registrasi",
        fields: [
          {
            key: "attendance",
            label: "Kesediaan hadir",
            type: "checkbox",
            options: [{ value: optionID, label: "Bersedia" }],
            required: true,
          },
          {
            key: "reason",
            label: "Motivasi bergabung",
            type: "textarea",
            required: false,
          },
        ],
      },
    ],
  },
};
const club = {
  id: 9999,
  name: "Klub Uji Pendaftaran",
  club_type: "UNIT",
  media: { items: [] },
  is_show: true,
  is_registration_open: true,
  attachedCustomForm: form,
};
const registration = {
  id: 9999,
  club_id: 9999,
  member_id: 9999,
  status: "PENDING",
  roles: [],
  additional_data: {
    attendance: [optionID],
    reason: "Belajar bersama anggota klub.",
  },
  created_at: "2026-09-22T06:14:00Z",
  updated_at: "2026-09-22T06:14:00Z",
  member: {
    id: 9999,
    email: "pendaftar@example.test",
    profile: {
      id: 9999,
      name: "Pendaftar Uji",
      gender: "F",
      birth_date: "2003-04-05",
      origin_province_id: 1,
      origin_city_id: 1,
      province_id: 1,
      whatsapp: "081234567890",
      education_history: [
        { degree: "high_school", institution: "Sekolah Sebelumnya" },
        {
          degree: "bachelor",
          institution: "Kampus Uji",
          faculty: "Teknik",
          major: "Informatika",
          intake_year: 2024,
        },
      ],
    },
  },
};
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      timezoneId: "Asia/Jakarta",
    });
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
            id: 9999,
            display_name: "Admin Uji",
            email: "admin@example.test",
            is_active: true,
            role: { code: "super_admin", name: "Super Admin" },
          },
          permissions: [
            "clubs.read",
            "clubs.manage",
            "club_registrations.read",
            "club_registrations.manage",
            "custom_forms.read",
          ],
          authentication_methods: ["password"],
          is_super_admin: true,
        };
      else if (path === "/clubs/9999") data = club;
      else if (path === "/clubs/9999/registrations")
        data = {
          data: [registration],
          meta: { current_page: 1, per_page: 20, total: 1 },
        };
      else if (path === "/provinces") data = [{ id: 1, name: "Jawa Barat" }];
      else if (path === "/cities")
        data = [{ id: 1, province_id: 1, name: "Bandung" }];
      else if (request.method() !== "GET")
        throw new Error(`Unexpected write: ${path}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "GET_DATA_SUCCESS", data }),
      });
    });
    await page.goto("http://127.0.0.1:3005/club/9999?section=people");
    const open = page.getByRole("button", {
      name: "Lihat jawaban pendaftaran Pendaftar Uji",
    });
    await open.click();
    const drawer = page.getByRole("dialog", { name: "Detail Pendaftaran" });
    await expect(drawer).toBeVisible();
    for (const field of fields)
      await expect(
        drawer.getByText(field.label, { exact: true }),
      ).toBeVisible();
    await expect(
      drawer.getByText("S1 - Kampus Uji, Teknik, Informatika (2024)", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(drawer.getByText("Bandung", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Jawa Barat", { exact: true })).toHaveCount(
      2,
    );
    await expect(drawer.getByText("Bersedia", { exact: true })).toBeVisible();
    await expect(drawer.getByText(optionID, { exact: true })).toHaveCount(0);
    await drawer
      .getByText("Motivasi bergabung", { exact: true })
      .scrollIntoViewIfNeeded();
    assert.equal(
      await drawer.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
      true,
    );
    await page.screenshot({
      path: new URL(`drawer-${width}.png`, output).pathname,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await open.click();
    await drawer.getByRole("button", { name: "Tutup", exact: true }).click();
    await expect(drawer).toBeHidden();
    assert.deepEqual(errors, []);
    console.log(
      `${width}px: all eight profile fields, current education, location names, choice labels, and drawer close controls passed`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
