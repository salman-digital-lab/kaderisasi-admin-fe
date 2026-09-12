import { useState, type ReactElement } from "react";
import { Button, Dropdown, Input, Modal, Radio } from "antd";
import { CopyOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import type {
  FormField,
  FormSection,
} from "../../../../types/model/customForm";
import { FIELD_TYPES } from "../constants";
import { duplicateQuestion } from "../utils/builder-state";
import { QuestionEditor } from "./QuestionEditor";
import { SortableItem } from "./SortableItem";
import { ResponsiveDialog } from "../../../../components/common/Responsive/ResponsiveDialog";

interface Props {
  field: FormField;
  index: number;
  section: FormSection;
  sections: FormSection[];
  selected: boolean;
  onSelect: (key?: string, reveal?: boolean) => void;
  onFieldsChange: (fields: FormField[]) => void;
  onMove: (key: string, sectionId: string, index?: number) => void;
}

export function QuestionCard({
  field,
  index,
  section,
  sections,
  selected,
  onSelect,
  onFieldsChange,
  onMove,
}: Props): ReactElement {
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>();
  const [moveSearch, setMoveSearch] = useState("");
  const destinations = sections.filter(
    (item) =>
      item.id !== section.id &&
      item.section_name
        .toLocaleLowerCase("id")
        .includes(moveSearch.trim().toLocaleLowerCase("id")),
  );
  const typeLabel =
    FIELD_TYPES.find((type) => type.value === field.type)?.label ?? field.type;
  return (
    <SortableItem
      id={field.key}
      kind="question"
      label={`pertanyaan ${index + 1}`}
    >
      {(handle) => (
        <article
          id={`builder-question-${field.key}`}
          tabIndex={-1}
          className={`builder-question ${selected ? "builder-question-selected" : ""}`}
        >
          <div className="builder-question-heading">
            {handle}
            <Button
              type="text"
              className="builder-question-title"
              onClick={() => onSelect(selected ? undefined : field.key)}
              aria-expanded={selected}
              aria-controls={`builder-editor-${field.key}`}
            >
              <span className="builder-question-number">{index + 1}</span>
              <span className="builder-question-copy">
                <strong>
                  {selected
                    ? `Pertanyaan ${index + 1}`
                    : field.label || "Pertanyaan tanpa judul"}
                </strong>
                {!selected && (
                  <small>
                    {typeLabel}
                    {field.options?.length
                      ? ` · ${field.options.length} pilihan`
                      : ""}
                    {field.required ? " · Wajib" : ""}
                    {section.navigation?.questionKey === field.key
                      ? " · Penentu alur"
                      : ""}
                  </small>
                )}
              </span>
              <span className="builder-question-edit">
                {selected ? "Tutup" : "Edit"}
              </span>
            </Button>
            <Dropdown
              trigger={["click"]}
              menu={{
                triggerSubMenuAction: "click",
                items: [
                  {
                    key: "up",
                    label: "Pindah ke atas",
                    disabled: index === 0,
                    onClick: () => onMove(field.key, section.id!, index - 1),
                  },
                  {
                    key: "down",
                    label: "Pindah ke bawah",
                    disabled: index === section.fields.length - 1,
                    onClick: () => onMove(field.key, section.id!, index + 1),
                  },
                  {
                    key: "section",
                    label: "Pindah ke bagian",
                    disabled: sections.length < 2,
                    onClick: () => {
                      setMoveTarget(undefined);
                      setMoveSearch("");
                      setMoveOpen(true);
                    },
                  },
                  { type: "divider" },
                  {
                    key: "copy",
                    label: "Duplikat pertanyaan",
                    icon: <CopyOutlined aria-hidden />,
                    onClick: () => {
                      const copy = duplicateQuestion(field);
                      const fields = [...section.fields];
                      fields.splice(index + 1, 0, copy);
                      onFieldsChange(fields);
                      onSelect(copy.key, true);
                    },
                  },
                  {
                    key: "delete",
                    label: "Hapus pertanyaan",
                    danger: true,
                    icon: <DeleteOutlined aria-hidden />,
                    onClick: () =>
                      Modal.confirm({
                        title: "Hapus pertanyaan?",
                        okText: "Hapus",
                        cancelText: "Batal",
                        okButtonProps: { danger: true },
                        onOk: () =>
                          onFieldsChange(
                            section.fields.filter(
                              (item) => item.key !== field.key,
                            ),
                          ),
                      }),
                  },
                ],
              }}
            >
              <Button
                type="text"
                aria-label={`Menu pertanyaan ${index + 1}`}
                icon={<MoreOutlined />}
              />
            </Dropdown>
          </div>
          {selected && (
            <div id={`builder-editor-${field.key}`}>
              <QuestionEditor
                field={field}
                onChange={(updated) =>
                  onFieldsChange(
                    section.fields.map((item) =>
                      item.key === field.key ? updated : item,
                    ),
                  )
                }
              />
            </div>
          )}
          <ResponsiveDialog
            className="builder-move-dialog"
            title="Pindahkan pertanyaan"
            open={moveOpen}
            onCancel={() => setMoveOpen(false)}
            okText="Pindahkan"
            cancelText="Batal"
            okButtonProps={{ disabled: !moveTarget }}
            onOk={() => {
              if (!moveTarget) return;
              setMoveOpen(false);
              onMove(field.key, moveTarget);
            }}
          >
            <p>{field.label || "Pertanyaan tanpa judul"}</p>
            <label className="builder-control">
              Bagian tujuan
              <Input
                aria-label="Cari bagian tujuan"
                placeholder="Cari bagian tujuan"
                value={moveSearch}
                onChange={(event) => setMoveSearch(event.target.value)}
                allowClear
              />
            </label>
            <Radio.Group
              aria-label="Bagian tujuan"
              value={moveTarget}
              onChange={(event) => setMoveTarget(event.target.value)}
              className="builder-move-options"
            >
              {destinations.map((item) => (
                <Radio key={item.id} value={item.id}>
                  {item.section_name || "Bagian tanpa nama"}
                </Radio>
              ))}
            </Radio.Group>
            {!destinations.length && (
              <p role="status">Tidak ada bagian yang cocok.</p>
            )}
          </ResponsiveDialog>
        </article>
      )}
    </SortableItem>
  );
}
