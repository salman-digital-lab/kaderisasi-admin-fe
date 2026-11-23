import { useEffect, useState } from "react";
import { Select } from "antd";
import type { SelectProps } from "antd";
import { getUniversities } from "../../../api/services/university";

type UniversityNameSelectProps = Omit<
  SelectProps,
  "options" | "filterOption"
> & {
  value?: string;
  onChange?: (value: string) => void;
};

type Option = { label: string; value: string };

async function loadOptions(
  search: string,
  keep: string | undefined,
): Promise<Option[] | undefined> {
  const data = await getUniversities({ per_page: "20", page: "1", search });
  if (!data) return undefined;
  const fetched = data.data.map((u) => ({ label: u.name, value: u.name }));
  // Keep current value in list even if not returned by search
  return keep && !fetched.some((o) => o.value === keep)
    ? [{ label: keep, value: keep }, ...fetched]
    : fetched;
}

/**
 * Ant Design searchable Select that stores the university NAME as its value.
 * Integrates with Ant Design Form via value/onChange props. Only names from
 * the universities list can be picked; a name the profile already holds stays
 * selectable so older entries still display.
 */
export default function UniversityNameSelect({
  value,
  onChange,
  ...props
}: UniversityNameSelectProps) {
  const [options, setOptions] = useState<Option[]>(
    value ? [{ label: value, value }] : [],
  );
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [initialValue] = useState(value ?? "");

  useEffect(() => {
    void loadOptions(initialValue, initialValue).then(
      (loaded) => loaded && setOptions(loaded),
    );
  }, [initialValue]);

  const search = async (text: string) => {
    const loaded = await loadOptions(text, value);
    if (loaded) setOptions(loaded);
  };

  const handleSearch = (text: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => void search(text), 300));
  };

  return (
    <Select
      {...props}
      showSearch
      value={value}
      onChange={onChange}
      options={options}
      filterOption={false}
      onSearch={handleSearch}
      notFoundContent="Institusi tidak ditemukan. Pilih dari daftar yang tersedia."
      style={{ width: "100%", ...props.style }}
    />
  );
}
