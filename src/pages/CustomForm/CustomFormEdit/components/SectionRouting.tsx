import type { ReactElement } from "react";
import { Select } from "antd";
import type { FormSection } from "../../../../types/model/customForm";
import type {
  FormDestination,
  SectionNavigation,
} from "../../../../utils/form-routing";
import { optionValue } from "../../../../utils/form-routing";

const destinationKey = (destination: FormDestination): string =>
  destination.type === "section"
    ? `section:${destination.sectionId}`
    : destination.type;
const destination = (key: string): FormDestination =>
  key === "next" || key === "submit"
    ? { type: key }
    : { type: "section", sectionId: key.slice("section:".length) };

export function SectionRouting({
  section,
  sections,
  onChange,
}: {
  section: FormSection;
  sections: FormSection[];
  onChange: (navigation: SectionNavigation) => void;
}): ReactElement {
  const navigation = section.navigation ?? {
    defaultTarget: { type: "next" as const },
  };
  const index = sections.findIndex((item) => item.id === section.id);
  const destinations = [
    { value: "next", label: "Bagian berikutnya" },
    ...sections.slice(index + 1).map((item) => ({
      value: `section:${item.id!}`,
      label: item.section_name || "Bagian tanpa nama",
    })),
    { value: "submit", label: "Kirim formulir" },
  ];
  const questions = section.fields.filter(
    (field) =>
      ["radio", "select"].includes(field.type) &&
      !field.hidden &&
      !field.disabled,
  );
  const question = section.fields.find(
    (field) => field.key === navigation.questionKey,
  );
  const updateRoute = (value: string, key: string | undefined): void =>
    onChange({
      ...navigation,
      routes: [
        ...(navigation.routes ?? []).filter(
          (route) => route.optionValue !== value,
        ),
        ...(key ? [{ optionValue: value, target: destination(key) }] : []),
      ],
    });
  const renderDestination = (
    value: FormDestination,
    label: string,
    change: (value: string) => void,
  ): ReactElement => {
    const key = destinationKey(value);
    const missing = !destinations.some((item) => item.value === key);
    return (
      <Select
        virtual={false}
        aria-label={label}
        value={key}
        status={missing ? "error" : undefined}
        options={
          missing
            ? [
                ...destinations,
                { value: key, label: "Tujuan tidak tersedia, pilih ulang" },
              ]
            : destinations
        }
        onChange={change}
      />
    );
  };
  return (
    <div className="builder-routing">
      <label className="builder-control">
        Setelah bagian ini
        {renderDestination(
          navigation.defaultTarget,
          "Tujuan setelah bagian",
          (key) => onChange({ ...navigation, defaultTarget: destination(key) }),
        )}
      </label>
      <label className="builder-control">
        Arahkan berdasarkan jawaban
        <Select
          virtual={false}
          aria-label="Pertanyaan penentu alur"
          allowClear
          placeholder="Tanpa percabangan"
          value={navigation.questionKey}
          status={
            navigation.questionKey &&
            !questions.some((field) => field.key === navigation.questionKey)
              ? "error"
              : undefined
          }
          options={[
            ...questions.map((field) => ({
              value: field.key,
              label: field.label || "Pertanyaan tanpa judul",
            })),
            ...(navigation.questionKey &&
            !questions.some((field) => field.key === navigation.questionKey)
              ? [
                  {
                    value: navigation.questionKey,
                    label: "Pertanyaan tidak tersedia, pilih ulang",
                  },
                ]
              : []),
          ]}
          onChange={(questionKey) =>
            onChange({
              defaultTarget: navigation.defaultTarget,
              questionKey,
              routes: [],
            })
          }
        />
      </label>
      {question?.options
        ?.filter((option) => !option.disabled)
        .map((option) => {
          const value = optionValue(option);
          const rule = navigation.routes?.find(
            (item) => item.optionValue === value,
          );
          const target = rule ? destinationKey(rule.target) : undefined;
          const missing =
            target !== undefined &&
            !destinations.some((item) => item.value === target);
          return (
            <label key={value} className="builder-control">
              Jika memilih “{option.label}”
              <Select
                virtual={false}
                aria-label={`Tujuan untuk ${option.label}`}
                allowClear
                placeholder="Ikuti tujuan setelah bagian"
                value={target}
                status={missing ? "error" : undefined}
                options={
                  missing
                    ? [
                        ...destinations,
                        {
                          value: target,
                          label: "Tujuan tidak tersedia, pilih ulang",
                        },
                      ]
                    : destinations
                }
                onChange={(key) => updateRoute(value, key)}
              />
            </label>
          );
        })}
      {(navigation.routes ?? [])
        .filter(
          (route) =>
            !question?.options?.some(
              (option) =>
                optionValue(option) === route.optionValue && !option.disabled,
            ),
        )
        .map((route) => (
          <div key={route.optionValue} className="builder-routing-error">
            Pilihan pada aturan sudah dihapus.{" "}
            <button
              type="button"
              onClick={() => updateRoute(route.optionValue, undefined)}
            >
              Hapus aturan
            </button>
          </div>
        ))}
      <p className="builder-hint">
        Satu pertanyaan pilihan ganda atau dropdown menentukan bagian
        berikutnya. Pilihan tanpa aturan mengikuti tujuan bagian.
      </p>
    </div>
  );
}
