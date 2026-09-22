import { useEffect, useState, type ReactElement } from "react";
import { Select } from "antd";
import axios from "../../api/axios";
const EMPTY_IDS: number[] = [];

export default function AudienceSelect({
  kind,
  value = EMPTY_IDS,
  onChange,
  id,
}: {
  kind: string;
  value?: number[];
  onChange?: (value: number[]) => void;
  id?: string;
}): ReactElement {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setFailed(false);
      void axios
        .get<{ data: { id: number; label: string }[] }>(
          "/announcements/options",
          {
            params: { kind, search, selected: value?.join(",") },
            signal: controller.signal,
          },
        )
        .then(({ data }) => {
          if (!controller.signal.aborted)
            setOptions((old) => {
              const entries = new Map(
                old
                  .filter((entry) => value?.includes(entry.value))
                  .map((entry) => [entry.value, entry]),
              );
              for (const row of data.data)
                entries.set(row.id, { value: row.id, label: row.label });
              return [...entries.values()];
            });
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, search, value]);
  return (
    <>
      <Select
        id={id}
        mode="multiple"
        value={value || []}
        onChange={onChange}
        showSearch={{ filterOption: false, onSearch: setSearch }}
        options={options}
        loading={loading}
        placeholder="Ketik untuk mencari"
        style={{ width: "100%" }}
        notFoundContent={
          loading
            ? "Memuat pilihan…"
            : failed
              ? "Gagal memuat. Ketik ulang untuk mencoba lagi."
              : "Tidak ada hasil"
        }
      />
    </>
  );
}
