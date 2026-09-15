import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const catalog = JSON.parse(
  readFileSync(
    new URL(
      "../../../kaderisasi-admin-be-go/internal/auth/roles.json",
      import.meta.url,
    ),
  ),
);
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/rbac-frontend/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const roleNames = (codes) =>
  codes.map((code) => {
    const role = catalog.find((r) => r.code === code);
    return { code, name: role.name };
  });
const permissions = (codes) => [
  ...new Set(
    catalog.filter((r) => codes.includes(r.code)).flatMap((r) => r.permissions),
  ),
];
function account(codes, id = 2) {
  return {
    id,
    display_name: "Admin Uji",
    email: `admin${id}@example.test`,
    role: roleNames(codes)[0] ?? null,
    roles: roleNames(codes),
    role_codes: codes,
    is_active: true,
    effective_permissions: permissions(codes),
    authentication_methods: ["password"],
    is_super_admin: codes.includes("super_admin"),
    google_linked: false,
    created_at: "2026-09-15T00:00:00Z",
    updated_at: "2026-09-15T00:00:00Z",
  };
}
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      baseURL: "http://127.0.0.1:3005",
      reducedMotion: "reduce",
    });
    const errors = [];
    page.setDefaultTimeout(10000);
    const writes = [];
    let codes = ["konselor", "super_admin"];
    let currentId = 1;
    let target = account(["activity_manager", "konselor"]);
    let failSave = false;
    let failRoles = false;
    let ticket = {
      id: 11,
      number: "AKS-0011",
      status: "open",
      resolution: null,
      reason: "Mengelola kegiatan komunitas kampus",
      rejection_reason: null,
      requester_admin_user_id: 2,
      requester_name: "Admin Uji",
      requested_role_code: "club_manager",
      role_name: "Pengelola Komunitas",
      created_at: "2026-09-15T00:00:00Z",
    };
    let tickets = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.includes("/v2/")) {
        if (url.hostname === "127.0.0.1" || url.hostname === "localhost")
          return route.continue();
        return route.abort();
      }
      const path = url.pathname.split("/v2")[1];
      const method = request.method();
      let data = [];
      if (path.startsWith("/auth/")) {
        const user = account(codes, currentId);
        data = {
          access_token: "fixture-token",
          access_token_expires_in: 900,
          user,
          permissions: user.effective_permissions,
          authentication_methods: ["password"],
          is_super_admin: user.is_super_admin,
        };
      } else if (
        path === "/rbac/roles" ||
        path === "/rbac/requestable-targets"
      ) {
        if (failRoles)
          return route.fulfill({
            status: 500,
            json: { message: "GENERAL_ERROR" },
          });
        data = path.endsWith("targets")
          ? { roles: catalog.filter((r) => r.is_requestable) }
          : catalog;
      } else if (path.startsWith("/admin-users")) {
        if (method === "PUT" || method === "POST") {
          const body = request.postDataJSON();
          writes.push({ path, body });
          assert.ok(Array.isArray(body.role_codes));
          assert.equal("role_code" in body, false);
          if (failSave)
            return route.fulfill({
              status: 409,
              json: { message: "LAST_SUPER_ADMIN_REQUIRED" },
            });
          target = account(body.role_codes, method === "POST" ? 3 : 2);
          target.display_name = body.displayName;
          target.is_active = body.isActive ?? true;
          data = target;
        } else if (/\/admin-users\/\d+$/.test(path)) data = target;
        else
          data = {
            data: [target],
            meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
          };
      } else if (path === "/access-requests" && method === "POST") {
        const body = request.postDataJSON();
        writes.push({ path, body });
        ticket = {
          ...ticket,
          requested_role_code: body.role_code,
          role_name: catalog.find((r) => r.code === body.role_code).name,
          reason: body.reason,
        };
        tickets = [ticket];
        data = ticket;
      } else if (path === "/access-requests") data = tickets;
      else if (path === "/access-requests/11") data = ticket;
      else if (path === "/tickets/review/11") data = ticket;
      else if (path === "/tickets/review/11/approve") {
        writes.push({ path });
        target = account([
          ...new Set([...target.role_codes, ticket.requested_role_code]),
        ]);
        ticket = { ...ticket, status: "resolved", resolution: "approved" };
        data = ticket;
      } else if (method !== "GET") throw Error("Unexpected mutation " + path);
      return route.fulfill({ json: { message: "SUCCESS", data } });
    });
    const capture = async (name) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(350);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        )
        .toBe(true);
      await page.screenshot({
        animations: "disabled",
        path: new URL(`${name}-${width}.png`, output).pathname,
        fullPage: true,
      });
    };
    await page.goto("/admin-users");
    await expect(
      page.getByText("Panitia Program/Kegiatan", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Konselor", { exact: true })).toBeVisible();
    await capture("admin-list");
    await page.getByRole("button", { name: "Ubah Akun", exact: true }).click();
    let dialog = page.getByRole("dialog");
    const select = dialog.getByRole("combobox", { name: "Peran", exact: true });
    await select.fill("Pengelola Komunitas");
    await select.press("Enter");
    await select.press("Escape");
    await expect(
      dialog.getByText("Pengelola Komunitas", { exact: true }),
    ).toBeVisible();
    await dialog.getByText(/Gabungan hak akses/).click();
    await capture("admin-edit");
    failSave = true;
    await dialog.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Minimal satu Super Admin aktif",
    );
    await expect(
      dialog.getByText("Pengelola Komunitas", { exact: true }),
    ).toBeVisible();
    failSave = false;
    await dialog.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(dialog).toBeHidden();
    assert.deepEqual(target.role_codes, [
      "activity_manager",
      "konselor",
      "club_manager",
    ]);
    await page.getByRole("button", { name: "Ubah Akun", exact: true }).click();
    dialog = page.getByRole("dialog");
    const clearInput = dialog.getByRole("combobox", {
      name: "Peran",
      exact: true,
    });
    await clearInput.focus();
    await clearInput.press("Backspace");
    await clearInput.press("Backspace");
    await clearInput.press("Backspace");
    await expect(
      dialog.getByText("Tanpa peran, akun tidak memiliki akses fitur"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(dialog).toBeHidden();
    assert.deepEqual(target.role_codes, []);
    await capture("admin-cleared");
    await page.getByRole("button", { name: /Tambah$/ }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /Nama$/ }).fill("Admin Baru");
    await dialog
      .getByRole("textbox", { name: /Email$/ })
      .fill("baru@example.test");
    await dialog.getByLabel(/Password$/).fill("Fixture-password-2026!");
    const addSelect = dialog.getByRole("combobox", {
      name: "Peran",
      exact: true,
    });
    for (const name of ["Konselor", "Panitia Program/Kegiatan"]) {
      await addSelect.fill(name);
      await addSelect.press("Enter");
    }
    await addSelect.press("Escape");
    await capture("admin-create");
    await dialog
      .getByRole("button", { name: "Tambah akun", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    assert.deepEqual(target.role_codes, ["konselor", "activity_manager"]);
    codes = ["activity_manager", "konselor"];
    currentId = 2;
    target = account(codes);
    tickets = [];
    await page.goto("/my-requests");
    await expect(
      page.getByText("Panitia Program/Kegiatan", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Konselor", { exact: true })).toBeVisible();
    await capture("my-access");
    await page.getByRole("button", { name: "Ajukan peran tambahan" }).click();
    await expect(
      page.getByRole("radio", { name: /Menangani layanan konseling/ }),
    ).toBeDisabled();
    await page
      .getByRole("radio", { name: /Mengelola komunitas, klub, dan kelas/ })
      .check();
    await page
      .getByRole("textbox", { name: /Untuk tugas apa/ })
      .fill("Mengelola komunitas mahasiswa dan peserta kelas");
    await capture("request-additional");
    await page.getByRole("button", { name: "Kirim pengajuan akses" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Pengajuan terkirim, menunggu tinjauan",
      }),
    ).toBeVisible();
    await page.goto("/my-requests/new");
    await page
      .getByRole("radio", { name: /Mengelola komunitas, klub, dan kelas/ })
      .check();
    await expect(
      page.getByText("Pengajuan peran ini masih menunggu"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Kirim pengajuan akses" }),
    ).toHaveCount(0);
    codes = ["super_admin"];
    currentId = 1;
    await page.goto("/ticket-review/11");
    await expect(page.getByText("Peran pemohon saat ini")).toBeVisible();
    await expect(page.getByText("Konselor", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Setujui Permintaan$/ }).click();
    dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("tidak melepas peran lain");
    await capture("review-approval");
    await dialog.getByRole("button", { name: "Ya, Setujui" }).click();
    await expect(dialog).toBeHidden();
    assert.deepEqual(target.role_codes, [
      "activity_manager",
      "konselor",
      "club_manager",
    ]);
    codes = target.role_codes;
    currentId = 2;
    await page.goto("/my-requests/11");
    await expect(
      page.getByRole("heading", { name: "Pengajuan disetujui" }),
    ).toBeVisible();
    await expect(page.getByText("Konselor", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Buka komunitas" }),
    ).toBeVisible();
    await capture("request-approved");
    codes = ["activity_manager", "konselor"];
    await page.getByRole("button", { name: "Perbarui status" }).click();
    await expect(
      page.getByText(/perannya tidak ada pada akses Anda saat ini/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Buka komunitas" }),
    ).toHaveCount(0);
    codes = ["super_admin"];
    currentId = 1;
    failRoles = true;
    await page.goto("/admin-users");
    await page.getByRole("button", { name: "Ubah Akun", exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText("Daftar peran belum berhasil dimuat"),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Simpan perubahan" }),
    ).toBeDisabled();
    failRoles = false;
    await dialog.getByRole("button", { name: "Coba lagi" }).click();
    await expect(
      dialog.getByRole("button", { name: "Simpan perubahan" }),
    ).toBeEnabled();
    await dialog.getByRole("button", { name: "Batal", exact: true }).click();
    assert.deepEqual(errors, []);
    results.push({
      width,
      status: "passed",
      writes: writes.length,
      consoleErrors: errors.length,
    });
    await page.close();
  }
  writeFileSync(
    new URL("results.json", output),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results));
} catch (error) {
  for (const context of browser.contexts())
    for (const page of context.pages()) {
      await page.screenshot({
        path: new URL("failure.png", output).pathname,
        fullPage: true,
      });
      writeFileSync(new URL("failure.html", output), await page.content());
      writeFileSync(
        new URL("failure-aria.txt", output),
        await page.locator("body").ariaSnapshot(),
      );
    }
  throw error;
} finally {
  await browser.close();
}
