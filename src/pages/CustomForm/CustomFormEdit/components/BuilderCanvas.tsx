import { useState, type ReactElement, type ReactNode } from "react";
import {
  Alert,
  Button,
  Collapse,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Typography,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  FormField,
  FormSection,
} from "../../../../types/model/customForm";
import {
  builderIssues,
  duplicateQuestion,
  duplicateSection,
  moveQuestion,
  newId,
} from "../utils/builder-state";
import { FIELD_TYPES } from "../constants";
import { SortableItem } from "./SortableItem";
import { QuestionEditor } from "./QuestionEditor";
import { SectionRouting } from "./SectionRouting";

interface Props {
  sections: FormSection[];
  onChange: (sections: FormSection[]) => void;
  profile: ReactNode;
}
export function BuilderCanvas({
  sections,
  onChange,
  profile,
}: Props): ReactElement {
  const [selected, setSelected] = useState<string>();
  const [outlineOpen, setOutlineOpen] = useState(false);
  let profileAnchorId = "profile";
  while (sections.some((section) => section.id === profileAnchorId))
    profileAnchorId += "_";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: "auto",
    }),
  );
  const issues = builderIssues({ fields: sections });
  const updateSection = (id: string, patch: Partial<FormSection>): void =>
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );
  const updateQuestion = (id: string, field: FormField): void => {
    const section = sections.find((item) => item.id === id)!;
    updateSection(id, {
      fields: section.fields.map((item) =>
        item.key === field.key ? field : item,
      ),
    });
  };
  const focusSection = (id: string): void => {
    setOutlineOpen(false);
    requestAnimationFrame(() =>
      document.getElementById(`builder-section-${id}`)?.focus(),
    );
  };
  const addQuestion = (section: FormSection): void => {
    const field: FormField = {
      key: `custom_${newId()}`,
      label: "",
      type: "text",
      required: false,
    };
    updateSection(section.id!, { fields: [...section.fields, field] });
    setSelected(field.key);
  };
  const addSection = (): void => {
    const id = newId();
    onChange([
      ...sections,
      { id, section_name: `Bagian ${sections.length + 1}`, fields: [] },
    ]);
    requestAnimationFrame(() => focusSection(id));
  };
  const moveSection = (index: number, target: number): void =>
    onChange(arrayMove(sections, index, target));
  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return;
    if (active.data.current?.kind === "section") {
      const from = sections.findIndex((section) => section.id === active.id);
      const to = sections.findIndex(
        (section) =>
          section.id === over.id ||
          section.fields.some((field) => field.key === over.id),
      );
      if (from >= 0 && to >= 0) moveSection(from, to);
    } else if (active.data.current?.kind === "question") {
      const target = sections.find(
        (section) =>
          section.id === over.id ||
          section.fields.some((field) => field.key === over.id),
      );
      if (target) {
        const index = target.fields.findIndex((field) => field.key === over.id);
        onChange(
          moveQuestion(
            sections,
            String(active.id),
            target.id!,
            index < 0 ? undefined : index,
          ),
        );
      }
    }
  };
  const outline = (
    <nav aria-label="Daftar bagian formulir" className="builder-outline-links">
      <Typography.Text strong>Bagian formulir</Typography.Text>
      <Button type="text" onClick={() => focusSection(profileAnchorId)}>
        Data diri
      </Button>
      {sections.map((section, index) => (
        <Button
          type="text"
          key={section.id}
          onClick={() => focusSection(section.id!)}
        >
          {index + 1}. {section.section_name || "Bagian tanpa nama"}
          <span className="builder-hint">
            {section.fields.length} pertanyaan
          </span>
        </Button>
      ))}
      <Button icon={<PlusOutlined />} onClick={addSection}>
        Tambah bagian
      </Button>
    </nav>
  );
  return (
    <div className="builder-layout">
      <aside className="builder-outline">{outline}</aside>
      <div className="builder-mobile-outline">
        <Button
          icon={<UnorderedListOutlined />}
          onClick={() => setOutlineOpen(true)}
        >
          Daftar bagian
        </Button>
      </div>
      <Drawer
        title="Bagian formulir"
        open={outlineOpen}
        onClose={() => setOutlineOpen(false)}
      >
        {outline}
      </Drawer>
      <div className="builder-canvas">
        <section
          id={`builder-section-${profileAnchorId}`}
          tabIndex={-1}
          className="builder-profile"
        >
          {profile}
        </section>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={sections.map((section) => section.id!)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section, index) => (
              <SortableItem
                key={section.id}
                id={section.id!}
                kind="section"
                label={`bagian ${index + 1}`}
              >
                {(handle) => (
                  <section
                    className="builder-section"
                    id={`builder-section-${section.id}`}
                    tabIndex={-1}
                    aria-label={section.section_name}
                  >
                    <div className="builder-section-heading">
                      {handle}
                      <Typography.Text type="secondary">
                        Bagian {index + 1}
                      </Typography.Text>
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          triggerSubMenuAction: "click",
                          items: [
                            {
                              key: "up",
                              label: "Pindah ke atas",
                              disabled: index === 0,
                              onClick: () => moveSection(index, index - 1),
                            },
                            {
                              key: "down",
                              label: "Pindah ke bawah",
                              disabled: index === sections.length - 1,
                              onClick: () => moveSection(index, index + 1),
                            },
                            {
                              key: "copy",
                              label: "Duplikat bagian",
                              icon: <CopyOutlined aria-hidden />,
                              onClick: () => {
                                const updated = [...sections];
                                updated.splice(
                                  index + 1,
                                  0,
                                  duplicateSection(section),
                                );
                                onChange(updated);
                              },
                            },
                            {
                              key: "delete",
                              label: "Hapus bagian",
                              danger: true,
                              icon: <DeleteOutlined aria-hidden />,
                              onClick: () =>
                                Modal.confirm({
                                  title: "Hapus bagian ini?",
                                  content:
                                    "Pertanyaan di dalamnya akan dihapus. Aturan yang menuju bagian ini perlu diperbaiki sebelum menyimpan.",
                                  okText: "Hapus",
                                  cancelText: "Batal",
                                  okButtonProps: { danger: true },
                                  onOk: () =>
                                    onChange(
                                      sections.filter(
                                        (item) => item.id !== section.id,
                                      ),
                                    ),
                                }),
                            },
                          ],
                        }}
                      >
                        <Button
                          type="text"
                          aria-label={`Menu bagian ${index + 1}`}
                          icon={<MoreOutlined />}
                        />
                      </Dropdown>
                    </div>
                    <label className="builder-control">
                      Nama bagian
                      <Input
                        value={section.section_name}
                        onChange={(event) =>
                          updateSection(section.id!, {
                            section_name: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="builder-control">
                      Deskripsi bagian
                      <Input.TextArea
                        autoSize={{ minRows: 1, maxRows: 5 }}
                        value={section.description}
                        placeholder="Petunjuk untuk bagian ini (opsional)"
                        onChange={(event) =>
                          updateSection(section.id!, {
                            description: event.target.value,
                          })
                        }
                      />
                    </label>
                    <SortableContext
                      items={section.fields.map((field) => field.key)}
                      strategy={verticalListSortingStrategy}
                    >
                      {section.fields.map((field, fieldIndex) => (
                        <SortableItem
                          key={field.key}
                          id={field.key}
                          kind="question"
                          label={`pertanyaan ${fieldIndex + 1}`}
                        >
                          {(questionHandle) => (
                            <article
                              className={`builder-question ${selected === field.key ? "builder-question-selected" : ""}`}
                            >
                              <div className="builder-question-heading">
                                {questionHandle}
                                <Button
                                  type="text"
                                  className="builder-question-title"
                                  onClick={() =>
                                    setSelected(
                                      selected === field.key
                                        ? undefined
                                        : field.key,
                                    )
                                  }
                                  aria-expanded={selected === field.key}
                                >
                                  {field.label || "Pertanyaan tanpa judul"}
                                  {field.required && (
                                    <span aria-label="wajib"> *</span>
                                  )}
                                </Button>
                                <Dropdown
                                  trigger={["click"]}
                                  menu={{
                                    triggerSubMenuAction: "click",
                                    items: [
                                      {
                                        key: "up",
                                        label: "Pindah ke atas",
                                        disabled: fieldIndex === 0,
                                        onClick: () =>
                                          onChange(
                                            moveQuestion(
                                              sections,
                                              field.key,
                                              section.id!,
                                              fieldIndex - 1,
                                            ),
                                          ),
                                      },
                                      {
                                        key: "down",
                                        label: "Pindah ke bawah",
                                        disabled:
                                          fieldIndex ===
                                          section.fields.length - 1,
                                        onClick: () =>
                                          onChange(
                                            moveQuestion(
                                              sections,
                                              field.key,
                                              section.id!,
                                              fieldIndex + 1,
                                            ),
                                          ),
                                      },
                                      {
                                        key: "section",
                                        label: "Pindah ke bagian",
                                        disabled: sections.length < 2,
                                        children: sections
                                          .filter(
                                            (item) => item.id !== section.id,
                                          )
                                          .map((item) => ({
                                            key: item.id!,
                                            label: item.section_name,
                                            onClick: () =>
                                              onChange(
                                                moveQuestion(
                                                  sections,
                                                  field.key,
                                                  item.id!,
                                                ),
                                              ),
                                          })),
                                      },
                                      {
                                        key: "copy",
                                        label: "Duplikat pertanyaan",
                                        icon: <CopyOutlined aria-hidden />,
                                        onClick: () => {
                                          const copy = duplicateQuestion(field);
                                          const fields = [...section.fields];
                                          fields.splice(
                                            fieldIndex + 1,
                                            0,
                                            copy,
                                          );
                                          updateSection(section.id!, {
                                            fields,
                                          });
                                          setSelected(copy.key);
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
                                            onOk: () =>
                                              updateSection(section.id!, {
                                                fields: section.fields.filter(
                                                  (item) =>
                                                    item.key !== field.key,
                                                ),
                                              }),
                                          }),
                                      },
                                    ],
                                  }}
                                >
                                  <Button
                                    type="text"
                                    aria-label={`Menu pertanyaan ${fieldIndex + 1}`}
                                    icon={<MoreOutlined />}
                                  />
                                </Dropdown>
                              </div>
                              {selected === field.key ? (
                                <QuestionEditor
                                  field={field}
                                  onChange={(updated) =>
                                    updateQuestion(section.id!, updated)
                                  }
                                />
                              ) : (
                                <p className="builder-question-summary">
                                  {FIELD_TYPES.find(
                                    (type) => type.value === field.type,
                                  )?.label ?? field.type}
                                  {field.options?.length
                                    ? ` · ${field.options.map((option) => option.label).join(", ")}`
                                    : ""}
                                </p>
                              )}
                            </article>
                          )}
                        </SortableItem>
                      ))}
                    </SortableContext>
                    {!section.fields.length && (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Belum ada pertanyaan. Bagian berisi petunjuk saja juga dapat digunakan."
                      />
                    )}
                    <Button
                      block
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addQuestion(section)}
                    >
                      Tambah pertanyaan
                    </Button>
                    <Collapse
                      ghost
                      defaultActiveKey={section.navigation ? ["routing"] : []}
                      items={[
                        {
                          key: "routing",
                          label: "Alur setelah bagian",
                          children: (
                            <SectionRouting
                              section={section}
                              sections={sections}
                              onChange={(navigation) =>
                                updateSection(section.id!, { navigation })
                              }
                            />
                          ),
                        },
                      ]}
                    />
                    {issues
                      .filter((issue) => issue.sectionId === section.id)
                      .map((issue, i) => (
                        <Alert
                          key={i}
                          type="error"
                          title={issue.message}
                          showIcon
                        />
                      ))}
                  </section>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        <Button block icon={<PlusOutlined />} onClick={addSection}>
          Tambah bagian
        </Button>
      </div>
    </div>
  );
}
