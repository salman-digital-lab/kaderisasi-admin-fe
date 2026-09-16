import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const roles = JSON.parse(
  readFileSync(
    new URL(
      "../../../kaderisasi-admin-be-go/internal/auth/roles.json",
      import.meta.url,
    ),
  ),
);
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/activity-permissions/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    for (const withClubs of [false, true]) {
      const selected = roles.filter((r) =>
        ["activity_manager", ...(withClubs ? ["club_manager"] : [])].includes(
          r.code,
        ),
      );
      const permissions = [...new Set(selected.flatMap((r) => r.permissions))];
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        baseURL: "http://127.0.0.1:3005",
      });
      const calls = [];
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (!url.pathname.includes("/v2/"))
          return url.hostname === "127.0.0.1"
            ? route.continue()
            : route.abort();
        const path = url.pathname.split("/v2")[1];
        calls.push(path);
        let data = [];
        if (path.startsWith("/auth/"))
          data = {
            access_token: "fixture",
            access_token_expires_in: 900,
            permissions,
            user: {
              id: 1,
              display_name: "Panitia Uji",
              email: "test@example.test",
              roles: selected,
              role: selected[0],
              is_active: true,
            },
            authentication_methods: ["password"],
            is_super_admin: false,
          };
        else if (path === "/clubs") {
          if (!withClubs)
            return route.fulfill({
              status: 403,
              json: { message: "FORBIDDEN" },
            });
          data = {
            data: [{ id: 1, name: "Klub Uji", club_type: "community" }],
            meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
          };
        } else if (path === "/activities")
          data = {
            data: [],
            meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
          };
        return route.fulfill({ json: { message: "SUCCESS", data } });
      });
      await page.goto("/activity");
      await expect(
        page.getByRole("button", { name: "Buat Kegiatan" }),
      ).toBeVisible();
      await expect(
        page.getByText("Belum ada data aktivitas yang tersedia"),
      ).toBeVisible();
      if (width === 390)
        await page.getByRole("button", { name: /Filter/ }).click();
      if (withClubs)
        await expect(
          page.getByText("Semua Klub", { exact: true }),
        ).toBeVisible();
      else
        await expect(page.getByText("Semua Klub", { exact: true })).toHaveCount(
          0,
        );
      assert.equal(calls.includes("/clubs"), withClubs);
      assert.ok(calls.includes("/activities"));
      assert.deepEqual(errors, []);
      await expect(page.locator(".ant-notification-notice-error")).toHaveCount(
        0,
      );
      await expect(page.locator(".ant-spin-spinning")).toHaveCount(0);
      await page.waitForTimeout(400);
      await page.screenshot({
        animations: "disabled",
        path: new URL(
          `${width}-${withClubs ? "combined" : "activity-only"}.png`,
          output,
        ).pathname,
        fullPage: true,
      });
      console.log(
        JSON.stringify({ width, withClubs, status: "passed", calls }),
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
}
