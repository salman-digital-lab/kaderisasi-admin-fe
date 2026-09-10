import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ResponsiveTable } from "./ResponsiveTable";

afterEach(() => vi.unstubAllGlobals());

describe("responsive list selection", () => {
  it.each(["cards", "table"])(
    "retains cross-page selection and disabled records in %s view",
    (view) => {
      vi.stubGlobal("window", {
        sessionStorage: { getItem: () => view },
        matchMedia: (query: string) => ({ matches: query.includes("width <") }),
      });
      const onChange = vi.fn();
      const html = renderToStaticMarkup(
        <ResponsiveTable
          listId="selection-test"
          rowKey="id"
          columns={[{ title: "Nama", dataIndex: "name" }]}
          dataSource={[
            { id: 6, name: "Terpilih" },
            { id: 7, name: "Tidak memenuhi syarat" },
          ]}
          rowSelection={{
            selectedRowKeys: [1, 6],
            preserveSelectedRowKeys: true,
            onChange,
            getCheckboxProps: (row) => ({
              disabled: row.id === 7,
              "aria-label": `Pilih ${row.name}`,
            }),
          }}
          pagination={{
            current: 2,
            pageSize: 2,
            total: 6,
            showSizeChanger: false,
          }}
        />,
      );
      expect(html).toContain("2 dipilih");
      expect(html).toContain("Terpilih");
      expect(html).toContain("Tidak memenuhi syarat");
      expect(html).toMatch(/aria-label="Pilih Terpilih"[^>]*checked=""/);
      expect(html).toMatch(
        /aria-label="Pilih Tidak memenuhi syarat"[^>]*disabled=""/,
      );
      expect(html.includes("mobile-record-card")).toBe(view === "cards");
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});
