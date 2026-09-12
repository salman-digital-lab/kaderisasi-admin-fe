import { useRef, type ReactElement } from "react";
import {
  Button,
  Collapse,
  Dropdown,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import { DeleteOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  FormField,
  FieldValidation,
} from "../../../../types/model/customForm";
import { FIELD_TYPES } from "../constants";
import { newId } from "../utils/builder-state";
import { optionValue } from "../../../../utils/form-routing";
import { SortableItem } from "./SortableItem";

export function QuestionEditor({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (field: FormField) => void;
}): ReactElement {
  const newOptions = useRef(new Set<string>());
  const optionKeyAliases = useRef(new Map<string, string>());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: "auto",
    }),
  );
  const update = (patch: Partial<FormField>): void =>
    onChange({ ...field, ...patch });
  const options = field.options ?? [];
  const setRule = (
    key: keyof FieldValidation,
    value: string | number | null,
  ): void =>
    update({
      validation: {
        ...field.validation,
        [key]: value === null || value === "" ? undefined : value,
      },
    });
  const optionIds = options.map(
    (option, index) =>
      `${field.key}:option:${optionKeyAliases.current.get(optionValue(option)) ?? optionValue(option)}:${index}`,
  );
  const moveOption = (from: number, to: number): void => {
    if (to >= 0 && to < options.length)
      update({ options: arrayMove(options, from, to) });
  };
  return (
    <div className="builder-question-editor">
      <label className="builder-control">
        Pertanyaan
        <Input.TextArea
          aria-label="Judul pertanyaan"
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={field.label}
          onChange={(event) => update({ label: event.target.value })}
        />
      </label>
      <div className="builder-control-row">
        <label className="builder-control">
          Jenis jawaban
          <Select
            virtual={false}
            aria-label="Jenis jawaban"
            value={field.type}
            options={FIELD_TYPES.map((type) => ({
              value: type.value,
              label: type.label,
            }))}
            onChange={(type) =>
              update({
                type,
                options: ["radio", "select", "checkbox"].includes(type)
                  ? options
                  : undefined,
                validation: undefined,
              })
            }
          />
        </label>
        <label className="builder-required">
          <Switch
            checked={field.required}
            onChange={(required) => update({ required })}
            aria-label="Wajib diisi"
          />{" "}
          Wajib diisi
        </label>
      </div>
      {["radio", "select", "checkbox", "multiselect"].includes(field.type) && (
        <div className="builder-options">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (over)
                moveOption(
                  optionIds.indexOf(String(active.id)),
                  optionIds.indexOf(String(over.id)),
                );
            }}
          >
            <SortableContext
              items={optionIds}
              strategy={verticalListSortingStrategy}
            >
              {options.map((option, index) => (
                <SortableItem
                  key={optionIds[index]}
                  id={optionIds[index]}
                  kind="option"
                  label={`pilihan ${index + 1}`}
                >
                  {(handle) => (
                    <div className="builder-option-row">
                      {handle}
                      <Input
                        aria-label={`Pilihan ${index + 1}`}
                        value={option.label}
                        onChange={(event) =>
                          update({
                            options: options.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    value:
                                      item.value == null || item.value === ""
                                        ? optionValue(item)
                                        : item.value,
                                    label: event.target.value,
                                  }
                                : item,
                            ),
                          })
                        }
                        onBlur={() => {
                          const value = optionValue(option);
                          if (
                            newOptions.current.delete(value) &&
                            option.label.trim() &&
                            !options.some(
                              (item, i) =>
                                i !== index &&
                                optionValue(item) === option.label.trim(),
                            )
                          ) {
                            // Keep the menu button mounted during the input's first blur.
                            optionKeyAliases.current.set(
                              option.label.trim(),
                              value,
                            );
                            update({
                              options: options.map((item, i) =>
                                i === index
                                  ? { ...item, value: option.label.trim() }
                                  : item,
                              ),
                            });
                          }
                        }}
                      />
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          items: [
                            {
                              key: "up",
                              label: "Pindah ke atas",
                              disabled: index === 0,
                              onClick: () => moveOption(index, index - 1),
                            },
                            {
                              key: "down",
                              label: "Pindah ke bawah",
                              disabled: index === options.length - 1,
                              onClick: () => moveOption(index, index + 1),
                            },
                            { type: "divider" },
                            {
                              key: "delete",
                              label: "Hapus pilihan",
                              danger: true,
                              icon: <DeleteOutlined aria-hidden />,
                              onClick: () =>
                                update({
                                  options: options.filter(
                                    (_, i) => i !== index,
                                  ),
                                }),
                            },
                          ],
                        }}
                      >
                        <Button
                          type="text"
                          aria-label={`Menu pilihan ${index + 1}`}
                          icon={<MoreOutlined />}
                        />
                      </Dropdown>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
          <Button
            icon={<PlusOutlined aria-hidden />}
            onClick={() => {
              const value = newId();
              newOptions.current.add(value);
              update({ options: [...options, { label: "", value }] });
            }}
          >
            Tambah pilihan
          </Button>
        </div>
      )}
      <Collapse
        ghost
        items={[
          {
            key: "settings",
            label: "Teks bantuan dan validasi",
            children: (
              <div className="builder-settings">
                <label className="builder-control">
                  Teks bantuan
                  <Input.TextArea
                    value={field.helpText}
                    onChange={(event) =>
                      update({ helpText: event.target.value })
                    }
                  />
                </label>
                <label className="builder-control">
                  Contoh jawaban
                  <Input
                    value={field.placeholder}
                    onChange={(event) =>
                      update({ placeholder: event.target.value })
                    }
                  />
                </label>
                {["text", "textarea", "number"].includes(field.type) && (
                  <>
                    <div className="builder-control-row">
                      {(field.type === "number"
                        ? (["min", "max"] as const)
                        : (["minLength", "maxLength"] as const)
                      ).map((key, index) => (
                        <label key={key} className="builder-control">
                          {index === 0 ? "Minimum" : "Maksimum"}
                          {field.type === "number" ? " nilai" : " karakter"}
                          <InputNumber
                            aria-label={key}
                            value={field.validation?.[key]}
                            onChange={(value) => setRule(key, value)}
                            min={field.type === "number" ? undefined : 0}
                            precision={field.type === "number" ? undefined : 0}
                          />
                        </label>
                      ))}
                    </div>
                    {field.type !== "number" && (
                      <label className="builder-control">
                        Pola jawaban (regex)
                        <Input
                          value={field.validation?.pattern}
                          placeholder="Contoh: ^[A-Z0-9]+$"
                          onChange={(event) =>
                            setRule("pattern", event.target.value)
                          }
                        />
                      </label>
                    )}
                    <label className="builder-control">
                      Pesan kesalahan
                      <Input
                        value={field.validation?.customMessage}
                        onChange={(event) =>
                          setRule("customMessage", event.target.value)
                        }
                      />
                    </label>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
