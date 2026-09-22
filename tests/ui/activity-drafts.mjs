import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/activity-drafts/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });

const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      baseURL: "http://127.0.0.1:3005",
    });
    page.setDefaultTimeout(10000);
    const errors = [];
    const writes = [];
    let failLookup = false;
    let failSave = false;
    let canManage = true;
    const activities = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      name: index === 0 ? "Pembinaan Oktober" : `Kegiatan Uji ${index + 1}`,
      description: "",
      activity_type: 1,
      activity_category: 0,
      minimum_level: 1,
      is_published: index === 6 ? 1 : 0,
      is_registration_open: false,
      additional_config: {},
      images: [],
    }));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.includes("/v2/"))
        return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
      const path = url.pathname.split("/v2")[1];
      let data = [];
      if (path.startsWith("/auth/")) {
        data = {
          access_token: "fixture",
          access_token_expires_in: 900,
          permissions: [
            "activities.read",
            ...(canManage ? ["activities.manage"] : []),
          ],
          user: {
            id: 1,
            display_name: "Panitia Uji",
            email: "test@example.test",
            roles: [],
            role: null,
            is_active: true,
          },
          authentication_methods: ["password"],
          is_super_admin: false,
        };
      } else if (path === "/activities" && request.method() === "GET") {
        if (failLookup)
          return route.fulfill({
            status: 500,
            json: { message: "LOOKUP_FAILED" },
          });
        const rows = activities.filter(
          (row) =>
            (!url.searchParams.has("is_published") ||
              String(row.is_published) ===
                url.searchParams.get("is_published")) &&
            row.name
              .toLowerCase()
              .includes((url.searchParams.get("search") ?? "").toLowerCase()),
        );
        const current = Number(url.searchParams.get("page") ?? 1);
        const size = Number(url.searchParams.get("per_page") ?? 10);
        data = {
          data: rows.slice((current - 1) * size, current * size),
          meta: {
            current_page: current,
            per_page: size,
            total: rows.length,
            last_page: Math.ceil(rows.length / size),
            first_page: 1,
          },
        };
      } else if (path === "/activities" && request.method() === "POST") {
        writes.push({ method: "POST", body: request.postDataJSON() });
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (failSave)
          return route.fulfill({
            status: 500,
            json: { message: "SAVE_FAILED" },
          });
        data = {
          ...activities[0],
          ...request.postDataJSON(),
          id: activities.length + 1,
        };
        activities.push(data);
      } else if (/^\/activities\/\d+$/.test(path)) {
        const row = activities.find(
          (activity) => activity.id === Number(path.split("/")[2]),
        );
        if (request.method() === "PUT") {
          writes.push({
            method: "PUT",
            id: row.id,
            body: request.postDataJSON(),
          });
          Object.assign(row, request.postDataJSON());
        }
        data = row;
      } else if (path.endsWith("/readiness")) {
        data = {
          can_publish: false,
          can_open_registration: false,
          issues: [
            {
              code: "description",
              message: "Lengkapi deskripsi",
              step: 1,
              scope: "publication",
            },
          ],
          actions: {
            can_edit: true,
            can_publish: false,
            can_manage_registration: false,
          },
        };
      }
      return route.fulfill({ json: { message: "SUCCESS", data } });
    });
    const screenshot = async (name) => {
      await page.screenshot({
        path: new URL(`${width}-${name}.png`, output).pathname,
        fullPage: true,
        animations: "disabled",
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${name} should not overflow`,
      );
    };

    await page.goto("/activity/new");
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await expect(
      page.getByText("Isi nama kegiatan untuk menyimpan draf"),
    ).toBeVisible();
    assert.equal(writes.length, 0);

    await page.goto("/activity");
    await expect(
      page.getByRole("link", { name: "Lanjutkan draf" }).first(),
    ).toBeVisible();
    await screenshot("list");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Kegiatan yang belum selesai" }),
    ).toBeVisible();
    if (width === 390)
      await page.getByRole("button", { name: /Filter/ }).click();
    await page.getByLabel("Tampilkan kegiatan").focus();
    await page.getByLabel("Tampilkan kegiatan").press("ArrowDown");
    await page.getByText("Draf / belum tayang", { exact: true }).click();
    await page
      .getByRole("button", { name: "Terapkan filter kegiatan", exact: true })
      .click();
    await expect(page.getByText("Kegiatan Uji 7", { exact: true })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: /Buat Kegiatan/ }).click();
    await expect(
      page.getByRole("heading", { name: "Lanjutkan draf yang sudah ada" }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Nama kegiatan", { exact: true }),
    ).toBeVisible();
    await screenshot("new");
    for (const label of ["Tipe kegiatan", "Jenjang minimum peserta"]) {
      const select = page.getByRole("combobox", { name: label, exact: true });
      await select.focus();
      await select.press("ArrowDown");
      await expect(page.locator(".ant-select-dropdown:visible")).toBeVisible();
      await page.locator(".ant-select-dropdown:visible").screenshot({
        path: new URL(
          `${width}-${label === "Tipe kegiatan" ? "types" : "levels"}.png`,
          output,
        ).pathname,
        animations: "disabled",
      });
      await select.press("Escape");
      await expect(page.locator(".ant-select-dropdown:visible")).toHaveCount(0);
    }
    await page
      .getByRole("button", { name: "Daftar kegiatan", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Lanjutkan draf", exact: false })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "2. Deskripsi & poster" }),
    ).toBeVisible();
    await expect(
      page.getByText("Draf tersimpan, belum tayang", { exact: true }),
    ).toBeVisible();
    await screenshot("resume");
    await page
      .getByRole("button", { name: "Simpan & keluar", exact: true })
      .click();
    await expect(page).toHaveURL(/\/activity$/);
    assert.equal(writes.filter((write) => write.method === "POST").length, 0);
    assert.equal(writes.at(-1).id, 1);

    await page.getByRole("button", { name: /Buat Kegiatan/ }).click();
    await page
      .getByLabel("Nama kegiatan", { exact: true })
      .fill("Pembinaan Oktober");
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    const duplicate = page.getByRole("dialog", {
      name: "Kegiatan serupa sudah ada",
    });
    await expect(duplicate).toBeVisible();
    await duplicate
      .getByRole("button", { name: "Kembali ke formulir" })
      .hover();
    assert.equal(writes.filter((write) => write.method === "POST").length, 0);
    await duplicate.screenshot({
      path: new URL(`${width}-duplicate.png`, output).pathname,
      animations: "disabled",
    });
    await duplicate
      .getByRole("link", { name: "Lanjutkan draf", exact: true })
      .click();
    const leave = page.getByRole("dialog", {
      name: "Perubahan belum disimpan",
    });
    await expect(leave).toBeVisible();
    await leave.getByRole("button", { name: "Keluar tanpa menyimpan" }).click();
    await expect(page).toHaveURL(/\/activity\/1\/setup\?step=resume/);

    await page.goto("/activity/new");
    await page
      .getByLabel("Nama kegiatan", { exact: true })
      .fill("Pembinaan Oktober");
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await duplicate
      .getByRole("button", { name: "Kembali ke formulir" })
      .click();
    await expect(page.getByLabel("Nama kegiatan", { exact: true })).toHaveValue(
      "Pembinaan Oktober",
    );
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await duplicate
      .getByRole("button", { name: "Tetap buat kegiatan berbeda" })
      .click();
    await expect(page).toHaveURL(/\/activity\/8\/setup\?step=1/);
    assert.equal(writes.filter((write) => write.method === "POST").length, 1);
    assert.equal(writes.at(-1).body.is_published, 0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "2. Deskripsi & poster" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Simpan & keluar", exact: true })
      .click();
    await expect(page).toHaveURL(/\/activity$/);
    assert.equal(writes.at(-1).id, 8);

    await page.goto("/activity/new");
    await page
      .getByLabel("Nama kegiatan", { exact: true })
      .fill("Kegiatan Uji 7");
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await expect(
      duplicate.getByRole("link", { name: "Buka kegiatan" }),
    ).toHaveAttribute("href", "/activity/7");
    await duplicate
      .getByRole("button", { name: "Kembali ke formulir" })
      .click();
    await page
      .getByLabel("Nama kegiatan", { exact: true })
      .fill("Kegiatan Baru Unik");
    failLookup = true;
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Perubahan belum tersimpan" }),
    ).toBeVisible();
    assert.equal(writes.filter((write) => write.method === "POST").length, 1);
    failLookup = false;
    failSave = true;
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Perubahan belum tersimpan" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nama kegiatan", { exact: true })).toHaveValue(
      "Kegiatan Baru Unik",
    );
    failSave = false;
    await page.getByRole("button", { name: /Simpan & lanjutkan/ }).dblclick();
    await expect(page).toHaveURL(/\/activity\/9\/setup\?step=1/);
    assert.equal(writes.filter((write) => write.method === "POST").length, 3);
    canManage = false;
    await page.goto("/activity");
    await expect(
      page.getByRole("link", { name: /Detail/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Lanjutkan draf/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Buat Kegiatan/ }),
    ).toHaveCount(0);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        status: "passed",
        writes: writes.map(({ method, id }) => ({ method, id })),
      }),
    );
    await page.close();
  }
} catch (error) {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      console.error(await page.locator("body").innerText());
      console.error(
        await page
          .locator('[aria-hidden="true"], [inert]')
          .evaluateAll((elements) =>
            elements.map((element) => ({
              tag: element.tagName,
              id: element.id,
              className: element.className,
            })),
          ),
      );
      await page.screenshot({
        path: new URL("failure.png", output).pathname,
        fullPage: true,
      });
    }
  }
  throw error;
} finally {
  await browser.close();
}
