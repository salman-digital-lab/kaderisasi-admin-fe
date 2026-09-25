import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
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
    const canManage = true;
    let uploads = 0;
    let failUpload = true;
    const formWrites = [];
    const forms = [
      {
        id: 40,
        form_name: "Form tersedia",
        feature_id: null,
        feature_type: "activity_registration",
        form_schema: { fields: [] },
        is_active: false,
      },
    ];
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
            "custom_forms.read",
            "custom_forms.manage",
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
      } else if (path.endsWith("/images") && request.method() === "POST") {
        if (failUpload)
          return route.fulfill({
            status: 500,
            json: { message: "UPLOAD_FAILED" },
          });
        uploads++;
        const row = activities.find(
          (activity) => activity.id === Number(path.split("/")[2]),
        );
        row.additional_config.images = ["poster.png"];
        data = { image: "poster.png", images: ["poster.png"] };
      } else if (path.startsWith("/custom-forms")) {
        if (request.method() === "POST") {
          const body = request.postDataJSON();
          formWrites.push(body);
          data = {
            id: 41,
            form_name: body.formName,
            feature_id: body.featureId,
            feature_type: body.featureType,
            form_schema: body.formSchema,
            is_active: body.isActive,
          };
          forms.push(data);
        } else if (request.method() === "PUT") {
          const body = request.postDataJSON();
          formWrites.push(body);
          data = forms.find((form) => form.id === Number(path.split("/")[2]));
          data.feature_id = body.activityId;
        } else if (/^\/custom-forms\/\d+$/.test(path)) {
          data = forms.find((form) => form.id === Number(path.split("/")[2]));
        } else
          data = {
            data: forms.filter((form) =>
              path.endsWith("/unattached")
                ? !form.feature_id
                : form.feature_id ===
                  Number(url.searchParams.get("feature_id")),
            ),
            meta: { current_page: 1, per_page: 100, total: 0, last_page: 1 },
          };
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

    const next = () =>
      page.getByRole("button", { name: "Lanjut", exact: true }).click();
    const saveButton = () =>
      page.getByRole("button", { name: "Simpan & Lanjutkan", exact: true });
    const prepare = async (name) => {
      await page.goto("/activity/new");
      await page.getByLabel("Nama kegiatan", { exact: true }).fill(name);
      await next();
      await page
        .getByLabel("Deskripsi kegiatan (wajib sebelum tayang)")
        .fill("Deskripsi kegiatan uji");
      await next();
      await expect(
        page.getByRole("button", { name: "Buat atau Pilih Form" }),
      ).toHaveCount(0);
      await next();
    };
    await page.goto("/activity/new");
    await next();
    await expect(
      page.getByText("Isi nama kegiatan untuk melanjutkan"),
    ).toBeVisible();
    assert.equal(writes.length, 0);
    await page
      .getByLabel("Nama kegiatan", { exact: true })
      .fill("Draf sementara");
    await screenshot("new");
    await next();
    await screenshot("description");
    await page
      .getByLabel("Deskripsi kegiatan (wajib sebelum tayang)")
      .fill("Isian tetap tersedia");
    await next();
    await screenshot("registration");
    await page.getByRole("button", { name: "Kembali", exact: true }).click();
    await expect(
      page.getByLabel("Deskripsi kegiatan (wajib sebelum tayang)"),
    ).toHaveText("Isian tetap tersedia");
    await next();
    await next();
    await screenshot("review");
    assert.equal(writes.length, 0, "Lanjut and Kembali must never save");
    assert.equal(uploads, 0);
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    const leave = page.getByRole("dialog", {
      name: "Perubahan belum disimpan",
    });
    await expect(leave).toBeVisible();
    await leave.getByRole("button", { name: "Lanjutkan mengisi" }).click();
    await expect(saveButton()).toBeVisible();
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await leave.getByRole("button", { name: "Keluar tanpa menyimpan" }).click();
    await expect(page).toHaveURL(/\/activity$/);
    assert.equal(writes.length, 0);
    await expect(
      page.getByRole("link", { name: "Detail" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Lanjutkan draf" }),
    ).toHaveCount(0);
    await screenshot("list");
    await page.getByRole("link", { name: "Detail" }).first().click();
    await expect(
      page.getByRole("tab", { name: "Ringkasan", exact: true }),
    ).toBeVisible();

    await prepare("Kegiatan Baru Unik");
    failLookup = true;
    await saveButton().click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Perubahan belum tersimpan" }),
    ).toBeVisible();
    assert.equal(writes.length, 0);
    failLookup = false;
    failSave = true;
    await saveButton().click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Perubahan belum tersimpan" }),
    ).toBeVisible();
    await expect(saveButton()).toBeVisible();
    failSave = false;
    await saveButton().dblclick();
    await expect(page).toHaveURL(/\/activity\/8\/setup\?step=poster/);
    assert.equal(
      writes.length,
      2,
      "One failed request and one successful create",
    );
    assert.equal(
      writes.at(-1).body.description,
      "<p>Deskripsi kegiatan uji</p>",
    );
    assert.equal(writes.at(-1).body.is_published, 0);
    await expect(
      page.getByText("Informasi kegiatan sudah tersimpan sebagai draf", {
        exact: true,
      }),
    ).toBeVisible();
    await screenshot("poster");
    await page.locator('input[type="file"]').setInputFiles({
      name: "poster.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9V8AAAAASUVORK5CYII=",
        "base64",
      ),
    });
    assert.equal(uploads, 0, "Selecting a poster must not upload it");
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(leave).toBeVisible();
    await leave.getByRole("button", { name: "Lanjutkan mengisi" }).click();
    await saveButton().click();
    await expect(
      page.getByRole("alert").filter({ hasText: "poster belum tersimpan" }),
    ).toBeVisible();
    assert.equal(uploads, 0);
    for (const close of await page
      .locator(".ant-notification-notice-close")
      .all())
      await close.click();
    failUpload = false;
    await saveButton().click();
    await expect(page).toHaveURL(/\/activity\/8\/setup\?step=form/);
    assert.equal(uploads, 1);
    await expect(
      page.getByRole("heading", { name: "6. Formulir pendaftaran" }),
    ).toBeVisible();
    await screenshot("form");
    await page.getByRole("radio", { name: "Buat formulir baru" }).check();
    await page
      .getByLabel("Nama formulir", { exact: true })
      .fill("Form belum disimpan");
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await leave.getByRole("button", { name: "Keluar tanpa menyimpan" }).click();
    await expect(page).toHaveURL(/\/activity$/);
    assert.equal(formWrites.length, 0, "Exit must not create or attach a form");
    await page.goto("/activity/8/setup?step=form");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "6. Formulir pendaftaran" }),
    ).toBeVisible();
    assert.equal(writes.length, 2, "Reload must not create a second activity");
    await page.getByRole("button", { name: "Selesai", exact: true }).click();
    await expect(page).toHaveURL(/\/activity\/8$/);
    await page.goto("/activity/8/setup?step=form");
    await page
      .getByRole("radio", { name: "Pilih formulir yang sudah ada" })
      .check();
    await page.getByRole("combobox").click();
    await page.getByText("Form tersedia", { exact: true }).click();
    assert.equal(formWrites.length, 0);
    await page
      .getByRole("button", { name: "Simpan & Selesai", exact: true })
      .click();
    await expect(page).toHaveURL(/\/activity\/8$/);
    assert.equal(formWrites.length, 1);
    assert.equal(forms[0].feature_id, 8);

    await prepare("Pembinaan Oktober");
    await saveButton().click();
    const duplicate = page.getByRole("dialog", {
      name: "Kegiatan serupa sudah ada",
    });
    await expect(duplicate).toBeVisible();
    assert.equal(writes.length, 2);
    await duplicate
      .getByRole("button", { name: "Kembali ke formulir" })
      .click();
    await saveButton().click();
    await duplicate
      .getByRole("button", { name: "Tetap buat kegiatan berbeda" })
      .click();
    await expect(page).toHaveURL(/\/activity\/9\/setup\?step=poster/);
    assert.equal(writes.length, 3);
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/activity$/);
    await expect(leave).toHaveCount(0);
    await page.goto("/activity/9/setup?step=form");
    await page.getByRole("radio", { name: "Buat formulir baru" }).check();
    await page
      .getByLabel("Nama formulir", { exact: true })
      .fill("Form kegiatan baru");
    assert.equal(formWrites.length, 1);
    await page
      .getByRole("button", { name: "Simpan & Atur Pertanyaan", exact: true })
      .click();
    await expect(page).toHaveURL(/\/activity\/9\/form\/41\/edit\?setup=1/);
    assert.equal(formWrites.length, 2);
    assert.equal(formWrites[1].formName, "Form kegiatan baru");
    assert.equal(formWrites[1].featureId, 9);
    await page.goto("/activity/1/setup?step=resume");
    await expect(page).toHaveURL(/\/activity\/1$/);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        width,
        status: "passed",
        creationRequests: writes.length,
        uploads,
      }),
    );
    await page.close();
  }
} catch (error) {
  for (const context of browser.contexts())
    for (const page of context.pages())
      console.error(
        await page.locator("body").innerText(),
        await page
          .locator("footer")
          .evaluateAll((nodes) => nodes.map((node) => node.outerHTML)),
      );
  throw error;
} finally {
  await browser.close();
}
