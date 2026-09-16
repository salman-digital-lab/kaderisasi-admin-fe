import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
import { readFileSync, writeFileSync } from "node:fs";
const roles = JSON.parse(
  readFileSync(
    new URL(
      "../../../kaderisasi-admin-be-go/internal/auth/roles.json",
      import.meta.url,
    ),
  ),
);
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    for (const code of [
      "club_manager",
      "activity_manager",
      "achievement_manager",
      "admin",
      "super_admin",
      "konselor",
      "club_manager+activity_manager",
    ]) {
      const assigned = roles.filter((r) => code.split("+").includes(r.code));
      const role = {
        ...assigned[0],
        permissions: [...new Set(assigned.flatMap((r) => r.permissions))],
      };
      for (const screen of ["club", "member", "member-no-account"]) {
        if (
          !role.permissions.includes(
            screen === "club" ? "clubs.read" : "members.read",
          )
        )
          continue;
        const denied = [];
        const errors = [];
        const page = await browser.newPage({
          baseURL: "http://127.0.0.1:3005",
          viewport: { width, height: 1000 },
        });
        page.on("pageerror", (e) => errors.push(e.message));
        await page.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (!url.pathname.includes("/v2/"))
            return url.hostname === "127.0.0.1"
              ? route.continue()
              : route.abort();
          const p = url.pathname.split("/v2")[1];
          const required =
            p === "/activities"
              ? "activities.read"
              : p.startsWith("/activity-registrations/user/")
                ? "activity_registrations.read"
                : null;
          if (required && !role.permissions.includes(required)) {
            denied.push({ path: p, required });
            return route.fulfill({
              status: 403,
              json: { message: "FORBIDDEN", permission: required },
            });
          }
          let data = [];
          if (p.startsWith("/auth/"))
            data = {
              access_token: "fixture",
              access_token_expires_in: 900,
              user: {
                id: 1,
                display_name: role.name,
                email: "test@example.test",
                role,
                roles: assigned,
                is_active: true,
              },
              permissions: role.permissions,
              authentication_methods: ["password"],
              is_super_admin: code === "super_admin",
            };
          else if (p === "/clubs/1")
            data = {
              id: 1,
              name: "Audit Club",
              description: "Test",
              club_type: "community",
              is_show: true,
              is_registration_open: false,
              media: [],
            };
          else if (p === "/profiles/1")
            data = {
              profile: [
                {
                  id: 1,
                  user_id: 7,
                  name: "Audit Member",
                  gender: "male",
                  badges: [],
                  extra_data: {},
                  education_history: [],
                  work_history: [],
                  publicUser: {
                    id: 7,
                    email: "member@example.test",
                    account_status:
                      screen === "member-no-account" ? "no_account" : "active",
                  },
                },
              ],
            };
          else if (p === "/activities")
            data = {
              data: [],
              meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
            };
          await route.fulfill({ json: { message: "SUCCESS", data } });
        });
        await page.goto(
          screen === "club" ? "/club/1?section=activities" : "/member/1",
        );
        if (screen === "club") {
          await expect(
            page.getByRole("heading", { name: "Audit Club", exact: true }),
          ).toBeVisible();
          if (role.permissions.includes("activities.read"))
            await expect(
              page.getByRole("heading", { name: "Kegiatan Klub" }),
            ).toBeVisible();
          else {
            await expect(
              page.getByRole("tab", { name: "Kegiatan", exact: true }),
            ).toHaveCount(0);
            await expect(
              page.getByRole("tab", { name: "Ringkasan", exact: true }),
            ).toHaveAttribute("aria-selected", "true");
          }
        } else {
          await expect(
            page.getByRole("textbox", { name: "Nama Lengkap", exact: true }),
          ).toHaveValue("Audit Member");
          const edit = page.getByRole("button", { name: /^(edit )?Ubah$/ });
          if (role.permissions.includes("members.manage"))
            await expect(edit).toBeVisible();
          else {
            await expect(edit).toHaveCount(0);
            await expect(
              page.getByRole("textbox", { name: "Nama Lengkap", exact: true }),
            ).toBeDisabled();
          }
          const credentials = page.getByRole("button", {
            name:
              screen === "member-no-account"
                ? "Buat Akun"
                : "Ubah Email dan Password",
            exact: true,
          });
          if (role.permissions.includes("members.credentials.manage"))
            await expect(credentials).toBeVisible();
          else await expect(credentials).toHaveCount(0);
          if (!role.permissions.includes("activity_registrations.read"))
            await expect(
              page.getByText("Kegiatan yang Diikuti", { exact: true }),
            ).toHaveCount(0);
        }
        await page.waitForTimeout(400);
        await expect(
          page.locator(".ant-notification-notice-error"),
        ).toHaveCount(0);
        if (denied.length || errors.length)
          throw new Error(JSON.stringify({ code, screen, denied, errors }));
        const result = { role: code, screen, width, status: "passed" };
        results.push(result);
        console.log(JSON.stringify(result));
        await page.close();
      }
    }
  }
  writeFileSync(
    new URL(
      "../../../kaderisasi-admin-be-go/.artifacts/rbac-page-audit/fixed-results.json",
      import.meta.url,
    ),
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
