import { describe, expect, it } from "vitest";
import { statusUpdateError } from "./status-update-error";

function apiError(status: number, data: unknown): unknown {
  return { isAxiosError: true, response: { status, data } };
}

describe("statusUpdateError", () => {
  it("identifies every rejected email using the server's zero-based field index", () => {
    const result = statusUpdateError(
      apiError(422, {
        errors: [
          { field: "emails.1", rule: "email" },
          { field: "emails.2", rule: "email" },
        ],
      }),
      ["valid@example.com", "invalid", "also-invalid"],
    );
    expect(result).toContain("Email ke-2 (invalid): format email tidak valid.");
    expect(result).toContain(
      "Email ke-3 (also-invalid): format email tidak valid.",
    );
    expect(result).not.toContain("valid@example.com");
  });

  it("describes missing status and malformed validation responses", () => {
    expect(
      statusUpdateError(
        apiError(422, { errors: [{ field: "status", rule: "required" }] }),
      ),
    ).toContain("Pilih status peserta yang valid.");
    expect(statusUpdateError(apiError(422, {}))).toContain("Data tidak valid.");
  });

  it("distinguishes missing accounts from missing registrations", () => {
    expect(
      statusUpdateError(apiError(404, { message: "NO_USERS_FOUND" })),
    ).toContain("Tidak ada akun");
    expect(
      statusUpdateError(apiError(404, { message: "NO_REGISTRATIONS_FOUND" })),
    ).toContain("tidak terdaftar dalam kegiatan ini");
  });

  it("uses safe server and network fallbacks", () => {
    expect(
      statusUpdateError(apiError(500, { message: "SQL secret" })),
    ).not.toContain("SQL secret");
    expect(statusUpdateError({ isAxiosError: true })).toContain(
      "Periksa koneksi internet",
    );
    expect(
      statusUpdateError(apiError(403, { message: "FORBIDDEN" })),
    ).toContain("Akses Anda");
  });
});
