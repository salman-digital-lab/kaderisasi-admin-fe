import { useState, type ReactElement } from "react";
import { Alert, Button, Empty, Typography } from "antd";
import type { FormSection } from "../../../../types/model/customForm";
import {
  optionValue,
  type FormDestination,
} from "../../../../utils/form-routing";
import { SectionRouting } from "./SectionRouting";

export function FlowWorkspace({
  sections,
  onChange,
  onEdit,
  selectedSectionId,
}: {
  sections: FormSection[];
  onChange: (sections: FormSection[]) => void;
  onEdit: (id: string) => void;
  selectedSectionId?: string | null;
}): ReactElement {
  const [selected, setSelected] = useState<string | undefined>(
    selectedSectionId ?? undefined,
  );
  const current =
    sections.find((section) => section.id === selected) ?? sections[0];
  if (!current)
    return (
      <Empty description="Tambahkan bagian dan pertanyaan pada tab Pertanyaan untuk membuat alur." />
    );
  const targetId = (
    target: FormDestination,
    index: number,
  ): string | undefined =>
    target.type === "submit"
      ? undefined
      : target.type === "section"
        ? target.sectionId
        : sections[index + 1]?.id;
  const targetName = (target: FormDestination, index: number): string => {
    const id = targetId(target, index);
    return id
      ? (sections.find((section) => section.id === id)?.section_name ??
          "Tujuan tidak tersedia")
      : "Kirim formulir";
  };
  const reachable = new Set([sections[0].id]);
  sections.forEach((section, index) => {
    if (!reachable.has(section.id)) return;
    const question = section.fields.find(
      (field) => field.key === section.navigation?.questionKey,
    );
    const fallback = section.navigation?.defaultTarget ?? {
      type: "next" as const,
    };
    const targets = [
      ...(!question || !question.required ? [fallback] : []),
      ...(question?.options ?? [])
        .filter((option) => !option.disabled)
        .map(
          (option) =>
            section.navigation?.routes?.find(
              (route) => route.optionValue === optionValue(option),
            )?.target ?? fallback,
        ),
    ];
    targets.forEach((target) => {
      const id = targetId(target, index);
      if (id) reachable.add(id);
    });
  });
  return (
    <div className="builder-flow-workspace">
      <div>
        <Typography.Title level={3}>Alur pengisian</Typography.Title>
        <p>
          Pilih bagian untuk mengatur tujuan setiap jawaban. Percabangan dapat
          dilanjutkan di bagian lain.
        </p>
        {sections.some((section) => !reachable.has(section.id)) && (
          <Alert
            type="warning"
            showIcon
            title="Ada bagian yang tidak terjangkau"
            description="Periksa tujuan percabangan agar bagian yang diperlukan dapat dibuka."
          />
        )}
        <p className="builder-hint">Mulai pengisian</p>
        <ol className="builder-flow-map">
          {sections.map((section, index) => {
            const navigation = section.navigation;
            const question = section.fields.find(
              (field) => field.key === navigation?.questionKey,
            );
            return (
              <li
                key={section.id}
                className={current.id === section.id ? "is-selected" : ""}
              >
                <Button
                  type="text"
                  onClick={() => setSelected(section.id)}
                  aria-pressed={current.id === section.id}
                >
                  {index + 1}. {section.section_name}
                </Button>
                {!reachable.has(section.id) && (
                  <p role="status">Tidak terjangkau dari awal</p>
                )}
                {question && (
                  <p>
                    <strong>{question.label}</strong>
                  </p>
                )}
                <ul>
                  {question?.options
                    ?.filter((option) => !option.disabled)
                    .map((option) => (
                      <li key={optionValue(option)}>
                        Jika {option.label}:{" "}
                        {targetName(
                          navigation?.routes?.find(
                            (route) =>
                              route.optionValue === optionValue(option),
                          )?.target ??
                            navigation?.defaultTarget ?? { type: "next" },
                          index,
                        )}
                      </li>
                    ))}
                </ul>
                <p className="builder-hint">
                  {question ? "Jawaban lainnya" : "Lanjut ke"}:{" "}
                  {targetName(
                    navigation?.defaultTarget ?? { type: "next" },
                    index,
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
      <aside className="builder-flow-rules">
        <Typography.Title level={4}>{current.section_name}</Typography.Title>
        <Button onClick={() => onEdit(current.id!)}>
          Edit pertanyaan bagian ini
        </Button>
        {!current.fields.some(
          (field) =>
            ["radio", "select"].includes(field.type) &&
            !field.hidden &&
            !field.disabled,
        ) && (
          <Alert
            type="info"
            title="Tambahkan pilihan ganda atau dropdown untuk membuat percabangan."
          />
        )}
        <SectionRouting
          section={current}
          sections={sections}
          onChange={(navigation) =>
            onChange(
              sections.map((section) =>
                section.id === current.id
                  ? { ...section, navigation }
                  : section,
              ),
            )
          }
        />
      </aside>
    </div>
  );
}
