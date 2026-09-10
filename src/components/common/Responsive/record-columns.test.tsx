import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ColumnsType } from "antd/es/table";
import {
  flattenColumns,
  columnKey,
  readListView,
  recordValue,
} from "./record-columns";
import { MobileRecordCard } from "./MobileRecordCard";

describe("responsive record presentation", () => {
  it("preserves nested values, renderers, and all existing actions in a card", () => {
    const row = {
      id: 42,
      name: "Nama panjang",
      profile: { email: "a@example.invalid" },
    };
    const action = vi.fn();
    const render = vi.fn(
      (_value: unknown, record: typeof row, index: number) => (
        <button onClick={action}>
          Edit {record.id} · {index}
        </button>
      ),
    );
    const columns: ColumnsType<typeof row> = [
      { title: "ID", dataIndex: "id" },
      { title: "Nama", dataIndex: "name" },
      {
        title: "Akun",
        children: [{ title: "Email", dataIndex: ["profile", "email"] }],
      },
      { title: "Status", render: () => <strong>Aktif</strong> },
      { title: "Detail", render: () => <a href="/member/42">Rincian</a> },
      { title: "Internal", hidden: true, render: () => "invisible" },
      { title: "Aksi", key: "actions", render },
      {
        title: "Langkah Berikutnya",
        key: "next-action",
        render: () => <button>Kelola Klub</button>,
      },
    ];
    const html = renderToStaticMarkup(
      <MobileRecordCard
        record={row}
        index={3}
        columns={flattenColumns(columns)}
      />,
    );
    expect(html).toContain("Nama panjang");
    expect(html).toContain("a@example.invalid");
    expect(html).toContain("<strong>Aktif</strong>");
    expect(html).toContain('<a href="/member/42">Rincian</a>');
    expect(html).toContain("Edit 42 · 3");
    expect(html.split('class="mobile-record-actions"')[1]).toContain(
      "Kelola Klub",
    );
    expect(html).toContain("<details");
    expect(html).not.toContain("invisible");
    expect(render).toHaveBeenCalledWith(undefined, row, 3);
    expect(action).not.toHaveBeenCalled();
  });
  it("keeps column keys stable when presentations change", () => {
    expect(columnKey({ dataIndex: ["profile", "email"] }, 0)).toBe(
      "profile.email",
    );
    expect(columnKey({ key: "primary", dataIndex: "name" }, 5)).toBe("primary");
    expect(
      recordValue({ profile: null }, ["profile", "email"]),
    ).toBeUndefined();
  });
  it("stores the view separately per list and falls back when storage is unavailable", () => {
    const storage = {
      getItem: (key: string) => (key === "members" ? "table" : null),
    };
    expect(readListView(storage, "members")).toBe("table");
    expect(readListView(storage, "activities")).toBe("cards");
    expect(
      readListView(
        {
          getItem: () => {
            throw new Error("blocked");
          },
        },
        "members",
      ),
    ).toBe("cards");
    expect(readListView({ getItem: () => "corrupted" }, "members")).toBe(
      "cards",
    );
  });
});
