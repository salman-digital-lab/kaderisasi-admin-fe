import assert from "node:assert/strict";
import process from "node:process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(
  new URL("../../../kaderisasi-admin-be-go/package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const output = new URL(
  "../../../kaderisasi-admin-be-go/.artifacts/form-builder-refinement/",
  import.meta.url,
);
mkdirSync(output, { recursive: true });
const names = [
  "Motivasi bergabung",
  "Pengalaman organisasi",
  "Ketersediaan waktu",
  "Minat kegiatan",
  "Keterampilan",
  "Pengalaman relawan",
  "Kerja sama tim",
  "Komunikasi",
  "Kebutuhan peserta",
  "Informasi tambahan",
  "Komitmen",
  "Penutup",
];
function makeForm() {
  const sections = names.map((name, i) => ({
    id: `section-${i}`,
    section_name: name,
    description: "Lengkapi pertanyaan berikut sesuai pengalaman Anda.",
    fields: Array.from({ length: 8 }, (_, j) => ({
      key: `q${i}_${j}`,
      label:
        i === 11 && j === 7
          ? "Pengalaman mengelola donasi"
          : [
              "Apa yang mendorong Anda mengikuti program ini?",
              "Bidang apa yang paling Anda minati?",
              "Ceritakan pengalaman Anda dalam kegiatan sosial.",
              "Kapan Anda dapat mengikuti kegiatan?",
            ][j % 4],
      type: j % 3 ? "text" : "radio",
      required: false,
      ...(j % 3
        ? {}
        : {
            options: [
              "Pendidikan",
              "Sosial kemasyarakatan",
              "Pengembangan diri",
              "Kepemimpinan",
              "Lainnya",
            ].map((label) => ({ label, value: label })),
          }),
    })),
  }));
  sections[0].navigation = {
    defaultTarget: { type: "next" },
    questionKey: "q0_0",
    routes: [
      { optionValue: "Lainnya", target: { type: "submit" } },
      {
        optionValue: "Pendidikan",
        target: { type: "section", sectionId: "section-9" },
      },
    ],
  };
  return {
    id: 9999,
    form_name: "Pendaftaran relawan BMKA",
    form_description: "Formulir pendaftaran program relawan.",
    post_submission_info: "",
    feature_type: "activity_registration",
    feature_id: null,
    is_active: true,
    updated_at: "2026-09-12T00:00:00Z",
    form_schema: {
      version: 2,
      fields: [
        {
          id: "profile",
          section_name: "profile_data",
          fields: [
            {
              key: "name",
              label: "Nama Lengkap",
              type: "text",
              required: true,
            },
            {
              key: "gender",
              label: "Jenis Kelamin",
              type: "select",
              required: true,
            },
            ...[
              "whatsapp",
              "birth_date",
              "personal_id",
              "instagram",
              "city_id",
              "province_id",
              "country",
            ].map((key) => ({
              key,
              label: key,
              type: "text",
              required: false,
            })),
          ],
        },
        ...sections,
      ],
    },
  };
}

const browser = await chromium.launch();
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      baseURL: "http://localhost:3005",
      viewport: { width, height: 1000 },
      reducedMotion:
        process.env.FORM_BUILDER_REDUCED_MOTION === "1"
          ? "reduce"
          : "no-preference",
    });
    const errors = [];
    const writes = [];
    let form = makeForm();
    let failSave = false;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/v2/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      let data = [];
      if (path.includes("/auth/"))
        data = {
          access_token: "ui-fixture",
          user: {
            id: 9999,
            display_name: "Admin Uji",
            email: "admin@example.test",
            is_active: true,
            role: { code: "super_admin", name: "Super Admin" },
          },
          permissions: [
            "custom_forms.read",
            "custom_forms.manage",
            "activities.read",
            "activities.create",
            "activities.manage",
            "courses.read",
          ],
          authentication_methods: ["password"],
          is_super_admin: true,
        };
      else if (path.endsWith("/custom-forms/9999")) {
        if (request.method() === "PUT") {
          if (failSave) {
            await route.fulfill({
              status: 500,
              json: {
                message: "GENERAL_ERROR",
                error: "Synthetic save failure",
              },
            });
            return;
          }
          const values = request.postDataJSON();
          writes.push(values);
          form = {
            ...form,
            form_schema: values.formSchema,
            form_name: values.formName,
            form_description: values.formDescription,
            updated_at: new Date().toISOString(),
          };
        }
        data = form;
      } else
        assert.equal(request.method(), "GET", `Unexpected mutation: ${path}`);
      await route.fulfill({ json: { message: "SUCCESS", data } });
    });
    const status = page.getByRole("status", { name: "Status penyimpanan" });
    const save = async () => {
      await page
        .getByRole("button", { name: "Simpan Perubahan", exact: true })
        .click();
      await expect(status).toHaveText("Semua perubahan tersimpan");
    };
    const outline = async () => {
      if (
        width < 768 &&
        !(await page
          .getByRole("navigation", { name: "Daftar bagian formulir" })
          .isVisible())
      )
        await page.locator(".builder-mobile-outline button").click();
      return page.getByRole("navigation", { name: "Daftar bagian formulir" });
    };
    const select = async (name) => {
      const nav = await outline();
      await nav
        .getByRole("textbox", { name: "Cari bagian atau pertanyaan" })
        .fill("");
      await nav
        .locator(".builder-outline-link")
        .filter({ hasText: name })
        .click();
      if (width < 768) await expect(page.getByRole("dialog")).toBeHidden();
    };
    const capture = async (name) => {
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        "Horizontal overflow",
      );
      await page.screenshot({
        path: new URL(`${name}-${width}.png`, output).pathname,
        fullPage: false,
        animations: "disabled",
      });
    };
    await page.goto("http://localhost:3005/custom-form/9999/edit?tab=schema");
    await expect(status).toHaveText("Semua perubahan tersimpan");
    await expect(page.locator(".builder-question")).toHaveCount(8);
    await expect(
      page.getByRole("textbox", { name: "Nama bagian", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", {
        name: "Pertanyaan penentu alur",
        exact: true,
      }),
    ).toBeHidden();
    await capture("refined-overview");
    const initialHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    assert.ok(initialHeight < 1800, "Large form should render one section");
    await page.evaluate(() => window.scrollTo(0, 600));
    const sectionPicker =
      width < 768
        ? page.locator(".builder-mobile-outline-control")
        : page.locator(".builder-outline-heading");
    await expect
      .poll(async () => {
        const picker = await sectionPicker.boundingBox();
        const toolbar = await page.locator(".builder-toolbar").boundingBox();
        return (
          picker.y >= toolbar.y + toolbar.height - 1 &&
          picker.y < toolbar.y + toolbar.height + 32
        );
      })
      .toBe(true);
    await capture("refined-scrolled");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .getByRole("button", { name: "Bagian berikutnya", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pengalaman organisasi", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Bagian sebelumnya", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Motivasi bergabung", exact: true }),
    ).toBeVisible();

    let nav = await outline();
    await nav
      .getByRole("textbox", { name: "Cari bagian atau pertanyaan" })
      .fill("donasi");
    await expect(nav.locator(".builder-outline-row")).toHaveCount(1);
    await capture("refined-search");
    await nav
      .getByRole("button", { name: "Pengalaman mengelola donasi", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Judul pertanyaan", exact: true }),
    ).toHaveValue("Pengalaman mengelola donasi");
    await expect(page.locator("#builder-question-q11_7")).toBeFocused();
    await page
      .getByRole("textbox", { name: "Judul pertanyaan", exact: true })
      .fill("Pengalaman mengelola donasi peserta");
    await select("Motivasi bergabung");
    await expect(page.locator("#builder-section-section-0")).toBeVisible();
    await select("Penutup");
    await expect(page.locator("#builder-question-q11_7")).toContainText(
      "Pengalaman mengelola donasi peserta",
    );
    await select("Data diri");
    await expect(page.locator(".builder-profile-row")).toHaveCount(9);
    await page
      .getByRole("button", { name: "Menu data diri: Nama Lengkap" })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Hapus isian" }),
    ).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await page.getByRole("switch", { name: /Wajib diisi:.*WhatsApp/i }).click();
    await capture("refined-profile");
    await select("Motivasi bergabung");
    await page
      .getByRole("button", { name: "Edit bagian", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Nama bagian", exact: true })
      .fill("Motivasi peserta");
    await page
      .getByRole("textbox", { name: "Deskripsi bagian", exact: true })
      .fill("Ceritakan motivasi dan minat Anda.");
    await page
      .getByRole("button", { name: "Selesai mengedit bagian", exact: true })
      .click();
    await page
      .locator("#builder-question-q0_0 .builder-question-title")
      .click();
    await page
      .getByRole("textbox", { name: "Pilihan 1", exact: true })
      .fill("Bidang pendidikan");
    await page
      .getByRole("button", { name: "Menu pilihan 2", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Pindah ke atas", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Pilihan 1", exact: true }),
    ).toHaveValue("Sosial kemasyarakatan");
    const optionHandle = page.getByRole("button", {
      name: "Geser pilihan 2",
      exact: true,
    });
    await optionHandle.focus();
    await page.keyboard.press("Space");
    await expect(optionHandle).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .locator('[id^="DndLiveRegion"]')
        .filter({ hasText: "over droppable area q0_0:option:Pendidikan:1." }),
    ).toHaveCount(1);
    await page.keyboard.press("ArrowUp");
    await expect(
      page.locator('[id^="DndLiveRegion"]').filter({
        hasText: "over droppable area q0_0:option:Sosial kemasyarakatan:0.",
      }),
    ).toHaveCount(1);
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("textbox", { name: "Pilihan 1", exact: true }),
    ).toHaveValue("Bidang pendidikan");
    await capture("refined-question");
    await page.getByRole("button", { name: /Alur setelah bagian/ }).click();
    await expect(
      page.getByRole("combobox", {
        name: "Pertanyaan penentu alur",
        exact: true,
      }),
    ).toBeVisible();
    await capture("refined-routing");
    await save();
    assert.equal(
      writes.at(-1).formSchema.fields[1].fields[0].options[0].value,
      "Pendidikan",
    );
    assert.equal(
      writes
        .at(-1)
        .formSchema.fields[0].fields.find((field) => field.key === "whatsapp")
        .required,
      true,
    );
    assert.equal(writes.at(-1).formSchema.fields.length, 13);

    await page.getByRole("button", { name: "Pratinjau", exact: true }).click();
    const preview = page.getByRole("dialog");
    await preview
      .getByRole("button", { name: "Lanjutkan", exact: true })
      .click();
    await preview
      .getByRole("radio", { name: "Bidang pendidikan", exact: true })
      .first()
      .check();
    await preview
      .getByRole("button", { name: "Lanjutkan", exact: true })
      .click();
    await expect(
      preview.getByRole("heading", { name: "Informasi tambahan", exact: true }),
    ).toBeVisible();
    await preview.getByRole("button", { name: "Kembali", exact: true }).click();
    await preview
      .getByRole("radio", { name: "Lainnya", exact: true })
      .first()
      .check();
    await preview
      .getByRole("button", { name: "Kirim (simulasi)", exact: true })
      .click();
    await expect(
      preview.getByText("Simulasi selesai", { exact: true }),
    ).toBeVisible();
    await preview.getByRole("button", { name: "Close", exact: true }).click();
    assert.equal(writes.length, 1, "Preview must never save");

    await page
      .getByRole("button", { name: "Menu pertanyaan 2", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Duplikat pertanyaan", exact: true })
      .click();
    await expect(page.locator(".builder-question")).toHaveCount(9);
    await page
      .getByRole("button", { name: "Menu pertanyaan 3", exact: true })
      .click();
    await page.getByRole("menuitem", { name: /^Pindah ke bagian/ }).click();
    await page
      .getByRole("textbox", { name: "Cari bagian tujuan", exact: true })
      .fill("tidakditemukan");
    await expect(
      page.getByText("Tidak ada bagian yang cocok.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Batal", exact: true }).click();
    await page
      .getByRole("button", { name: "Menu pertanyaan 3", exact: true })
      .click();
    await page.getByRole("menuitem", { name: /^Pindah ke bagian/ }).click();
    await page
      .getByRole("textbox", { name: "Cari bagian tujuan", exact: true })
      .fill("Keterampilan");
    await page
      .getByRole("radio", { name: "Keterampilan", exact: true })
      .check();
    await expect(
      page.getByRole("button", { name: "Pindahkan", exact: true }),
    ).toBeEnabled();
    await capture("refined-move");
    await page.getByRole("button", { name: "Pindahkan", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Keterampilan", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Judul pertanyaan", exact: true }),
    ).toHaveValue(/salinan/);
    await page
      .getByRole("button", { name: "Menu bagian 5", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Duplikat bagian", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Keterampilan (salinan)",
        exact: true,
      }),
    ).toBeVisible();
    await save();
    const copy = writes
      .at(-1)
      .formSchema.fields.find(
        (section) => section.section_name === "Keterampilan (salinan)",
      );
    assert.equal(copy.navigation, undefined);
    assert.equal(
      new Set(
        writes
          .at(-1)
          .formSchema.fields.flatMap((section) =>
            section.fields.map((field) => field.key),
          ),
      ).size,
      115,
    );
    await page
      .getByRole("button", { name: "Menu bagian 6", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Hapus bagian", exact: true })
      .click();
    await page.getByRole("button", { name: "Hapus", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Pengalaman relawan", exact: true }),
    ).toBeVisible();

    await select("Motivasi peserta");
    await page
      .locator("#builder-question-q0_1 .builder-question-title")
      .click();
    await page
      .getByRole("button", { name: "Teks bantuan dan validasi" })
      .click();
    await page
      .getByRole("spinbutton", { name: "minLength", exact: true })
      .fill("10");
    await page
      .getByRole("spinbutton", { name: "maxLength", exact: true })
      .fill("2");
    await select("Penutup");
    const count = writes.length;
    await page
      .getByRole("button", { name: "Simpan Perubahan", exact: true })
      .click();
    await expect(page.locator("#builder-section-section-0")).toBeVisible();
    await expect(
      page.getByText(/batas minimum melebihi maksimum/).last(),
    ).toBeVisible();
    assert.equal(writes.length, count, "Invalid hidden section blocks saving");
    await page
      .locator("#builder-question-q0_1 .builder-question-title")
      .click();
    await page
      .getByRole("button", { name: "Teks bantuan dan validasi" })
      .click();
    await page
      .getByRole("spinbutton", { name: "maxLength", exact: true })
      .fill("20");
    failSave = true;
    await page
      .getByRole("button", { name: "Simpan Perubahan", exact: true })
      .click();
    await expect(
      page.getByText("Perubahan belum disimpan", { exact: true }),
    ).toBeVisible();
    await expect(status).toHaveText("Draf tersimpan di perangkat ini");
    page.once("dialog", (dialog) => dialog.accept());
    await page.reload();
    await page
      .getByRole("button", { name: "Pulihkan draf", exact: true })
      .click();
    failSave = false;
    await save();
    assert.equal(
      writes
        .at(-1)
        .formSchema.fields[1].fields.find((field) => field.key === "q0_1")
        .validation.maxLength,
      20,
    );
    await expect(
      page.getByRole("textbox", { name: "Judul pertanyaan", exact: true }),
    ).toHaveCount(0);

    nav = await outline();
    await nav
      .getByRole("textbox", { name: "Cari bagian atau pertanyaan" })
      .fill("tidakditemukan");
    await expect(
      nav.getByText("Tidak ada bagian atau pertanyaan yang cocok."),
    ).toBeVisible();
    await nav
      .getByRole("textbox", { name: "Cari bagian atau pertanyaan" })
      .fill("");
    const sectionHandle = nav.getByRole("button", {
      name: "Geser bagian 3",
      exact: true,
    });
    await sectionHandle.focus();
    await page.keyboard.press("Space");
    await expect(sectionHandle).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .locator('[id^="DndLiveRegion"]')
        .filter({ hasText: "over droppable area section-2." }),
    ).toHaveCount(1);
    await page.keyboard.press("ArrowDown");
    await expect(
      page
        .locator('[id^="DndLiveRegion"]')
        .filter({ hasText: "over droppable area section-3." }),
    ).toHaveCount(1);
    await page.keyboard.press("Space");
    await expect(nav.locator(".builder-outline-link").nth(4)).toContainText(
      "Ketersediaan waktu",
    );
    if (width < 768) await page.keyboard.press("Escape");
    await save();
    await page.goto("/activity/new");
    await expect(
      page.getByRole("heading", { name: "Buat kegiatan", exact: true }),
    ).toBeVisible();
    await capture("analogous-activity");
    assert.deepEqual(errors, []);
    results.push({
      width,
      status: "passed",
      reducedMotion: process.env.FORM_BUILDER_REDUCED_MOTION === "1",
      initialHeight,
      initialQuestionsRendered: 8,
      totalQuestions: 96,
      successfulSaves: writes.length,
    });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  writeFileSync(
    new URL("ui-results.json", output),
    JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
  );
} catch (error) {
  const page = browser
    .contexts()
    .flatMap((context) => context.pages())
    .at(-1);
  if (page) {
    writeFileSync(
      new URL("failure-details.json", output),
      JSON.stringify(
        await page
          .locator(".ant-dropdown, .ant-select-dropdown")
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              className: node.className,
              style: node.getAttribute("style"),
              text: node.textContent,
              transform: getComputedStyle(node).transform,
              transition: getComputedStyle(node).transition,
              animation: getComputedStyle(node).animation,
              rect: node.getBoundingClientRect().toJSON(),
            })),
          ),
        null,
        2,
      ),
    );
    await page.screenshot({
      path: new URL("failure.png", output).pathname,
      fullPage: false,
    });
  }
  throw error;
} finally {
  await browser.close();
}
