import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Input, InputNumber, Select, Space } from "antd";
import axios from "../../../../api/axios";

export function PreviewLocation({
  fieldKey,
  label,
  value,
  province,
  change,
}: {
  fieldKey: string;
  label: string;
  value: unknown;
  province: unknown;
  change: (value: unknown) => void;
}): ReactElement {
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const city = fieldKey.endsWith("city_id");
  useEffect(() => {
    let active = true;
    setOptions([]);
    if (city && !province) return;
    setLoading(true);
    setError(false);
    const path = city
      ? `/provinces/${String(province)}/cities`
      : fieldKey === "country"
        ? "/countries"
        : "/provinces";
    void axios
      .get<{ data: { id: number; name: string }[] }>(path)
      .then(({ data }) => {
        if (active)
          setOptions(
            data.data.map((row) => ({
              label: row.name,
              value: fieldKey === "country" ? row.name : String(row.id),
            })),
          );
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fieldKey, province, city, attempt]);
  return (
    <>
      <Select
        id={`preview-${fieldKey}`}
        aria-label={label}
        value={typeof value === "string" ? value : undefined}
        options={options}
        loading={loading}
        disabled={city && !province}
        showSearch={{ optionFilterProp: "label" }}
        onChange={change}
        allowClear
        style={{ width: "100%" }}
      />
      {error && (
        <Alert
          type="error"
          title="Pilihan belum dapat dimuat"
          action={
            <Button onClick={() => setAttempt(attempt + 1)}>Coba lagi</Button>
          }
        />
      )}
    </>
  );
}

type Education = {
  degree?: string;
  institution?: string;
  faculty?: string;
  major?: string;
  intake_year?: number | null;
};
export function PreviewEducation({
  multiple,
  value,
  change,
}: {
  multiple: boolean;
  value: unknown;
  change: (value: unknown) => void;
}): ReactElement {
  const entries: Education[] = multiple
    ? Array.isArray(value)
      ? value
      : []
    : [typeof value === "object" && value !== null ? value : {}];
  const update = (index: number, patch: Education): void => {
    const next = entries.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry,
    );
    change(multiple ? next : next[0]);
  };
  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      {entries.map((entry, index) => (
        <fieldset
          key={index}
          style={{ border: "1px solid #d9d9d9", padding: 16 }}
        >
          <legend>Pendidikan {multiple ? index + 1 : "sekarang"}</legend>
          <Space orientation="vertical" style={{ width: "100%" }}>
            <Select
              aria-label="Jenjang"
              placeholder="Jenjang"
              style={{ width: "100%" }}
              value={entry.degree}
              onChange={(degree) => update(index, { degree })}
              options={[
                { value: "high_school", label: "SMA/SMK" },
                { value: "diploma", label: "D3" },
                { value: "bachelor", label: "S1" },
                { value: "master", label: "S2" },
                { value: "doctoral", label: "S3" },
              ]}
            />
            {(
              [
                ["institution", "Institusi"],
                ["faculty", "Fakultas"],
                ["major", "Jurusan"],
              ] as const
            ).map(([key, label]) => (
              <Input
                key={key}
                aria-label={label}
                placeholder={label}
                value={entry[key] ?? ""}
                onChange={(event) =>
                  update(index, { [key]: event.target.value })
                }
              />
            ))}
            <InputNumber
              aria-label="Tahun masuk"
              placeholder="Tahun masuk"
              value={entry.intake_year}
              onChange={(intake_year) => update(index, { intake_year })}
            />
            {multiple && (
              <Button
                onClick={() => change(entries.filter((_, i) => i !== index))}
              >
                Hapus pendidikan
              </Button>
            )}
          </Space>
        </fieldset>
      ))}
      {multiple && (
        <Button onClick={() => change([...entries, { degree: "bachelor" }])}>
          Tambah pendidikan
        </Button>
      )}
    </Space>
  );
}
