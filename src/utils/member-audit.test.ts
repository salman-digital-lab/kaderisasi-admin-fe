import { describe, expect, it } from "vitest";
import { auditFieldLabel, auditLines, auditValue } from "./member-audit";

describe("member audit formatting", () => {
  it("labels fields in Indonesian and keeps unknown keys readable", () => {
    expect(auditFieldLabel("personal_id")).toBe("Nomor Identitas");
    expect(auditFieldLabel("extra_data.alumni_regional_assignment")).toBe(
      "Penugasan Regional Alumni",
    );
    expect(auditFieldLabel("extra_data.some_new_key")).toBe("some_new_key");
  });

  it("renders values with the labels the member page uses", () => {
    expect(auditValue("gender", "F")).toBe("Perempuan");
    expect(auditValue("account_status", "no_account")).toBe("Tanpa Akun");
    expect(
      auditValue("province_id", 3, { provinces: { 3: "Jawa Barat" } }),
    ).toBe("Jawa Barat");
    expect(auditValue("city_id", 12)).toBe("ID 12");
    expect(auditValue("badges", ["LMD", "SSC"])).toBe("LMD; SSC");
    expect(auditValue("whatsapp", null)).toBe("-");
    expect(
      auditValue("education_history", [
        { degree: "bachelor", institution: "ITB", faculty: "", major: "IF" },
      ]),
    ).toBe("S1, ITB, IF");
  });

  it("describes each change and never shows a password value", () => {
    const lines = auditLines({
      name: { before: "Ahmad", after: "Ahmad Fauzi" },
      whatsapp: { before: null, after: "0811" },
      line: { before: "ahmad", after: null },
      password: { changed: true },
    });
    expect(lines).toEqual([
      { field: "line", label: "ID Line", text: "ahmad → dikosongkan" },
      { field: "password", label: "Kata Sandi", text: "diubah" },
      { field: "name", label: "Nama Lengkap", text: "Ahmad → Ahmad Fauzi" },
      { field: "whatsapp", label: "WhatsApp", text: "0811" },
    ]);
  });
});
