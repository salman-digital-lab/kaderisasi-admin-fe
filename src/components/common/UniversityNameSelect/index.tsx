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

/**
 * Ant Design searchable Select that stores the university NAME as its value.
 * Integrates with Ant Design Form via value/onChange props.
 */
export default function UniversityNameSelect({
  value,
  onChange,
  ...props
}: UniversityNameSelectProps) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    value ? [{ label: value, value }] : [],
  );
  const [searchValue, setSearchValue] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const fetchUniversities = async (search?: string) => {
    const data = await getUniversities({ per_page: "20", page: "1", search });
    if (!data) return;
    const fetched = data.data.map((u) => ({ label: u.name, value: u.name }));
    // Keep current value in list even if not returned by search
    if (value && !fetched.some((o) => o.value === value)) {
      setOptions([{ label: value, value }, ...fetched]);
    } else {
      setOptions(fetched);
    }
  };

  useEffect(() => {
    fetchUniversities(value || "");
  }, []);

  const handleSearch = (search: string) => {
    setSearchValue(search);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => fetchUniversities(search), 300));
  };

  const institutionName = searchValue.trim();
  const institutionOptions =
    institutionName &&
    !options.some((option) => option.value === institutionName)
      ? [{ label: institutionName, value: institutionName }, ...options]
      : options;

  return (
    <Select
      {...props}
      showSearch
      value={value}
      onChange={onChange}
      options={institutionOptions}
      filterOption={false}
      onSearch={handleSearch}
      notFoundContent="Ketik nama sekolah atau perguruan tinggi"
      style={{ width: "100%", ...props.style }}
    />
  );
}
