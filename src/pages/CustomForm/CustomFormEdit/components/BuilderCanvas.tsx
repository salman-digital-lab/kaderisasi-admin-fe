import {
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Affix,
  Alert,
  Button,
  Collapse,
  Drawer,
  Dropdown,
  Grid,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
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
  duplicateSection,
  moveQuestion,
  newId,
} from "../utils/builder-state";
import { SectionOutline } from "./SectionOutline";
import { QuestionCard } from "./QuestionCard";
import { SectionRouting } from "./SectionRouting";
import { SectionDetails } from "./SectionDetails";

interface Props {
  toolbarBottom: number;
  sections: FormSection[];
  onChange: (sections: FormSection[]) => void;
  profile: ReactNode;
  profileCount: number;
  activeSectionId: string | null | undefined;
  onSelectSection: (id: string | null) => void;
}

export function BuilderCanvas({
  toolbarBottom,
  sections,
  onChange,
  profile,
  profileCount,
  activeSectionId,
  onSelectSection,
}: Props): ReactElement {
  const [selected, setSelected] = useState<string>();
  const [outlineOpen, setOutlineOpen] = useState(false);
  const pendingFocus = useRef<string | null>(null);
  const screens = Grid.useBreakpoint();
  const activeId =
    activeSectionId === null
      ? null
      : (sections.find((section) => section.id === activeSectionId)?.id ??
        sections[0]?.id ??
        null);
  const section = sections.find((item) => item.id === activeId);
  const index = sections.findIndex((item) => item.id === activeId);
  const issues = builderIssues({ fields: sections });
  const sectionIssues = issues.filter((issue) => issue.sectionId === activeId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      scrollBehavior: "auto",
    }),
  );
  const updateSection = (id: string, patch: Partial<FormSection>): void =>
    onChange(
      sections.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const focusContent = (): void => {
    const target = document.getElementById(
      pendingFocus.current ?? "builder-active-content",
    );
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const selectSection = (id: string | null, questionKey?: string): void => {
    onSelectSection(id);
    setSelected(questionKey);
    pendingFocus.current = questionKey
      ? `builder-question-${questionKey}`
      : "builder-active-content";
    setOutlineOpen(false);
    requestAnimationFrame(focusContent);
  };
  const selectQuestion = (key?: string, reveal = false): void => {
    setSelected(key);
    if (key && reveal) {
      pendingFocus.current = `builder-question-${key}`;
      requestAnimationFrame(focusContent);
    }
  };
  const addSection = (): void => {
    const id = newId();
    onChange([
      ...sections,
      { id, section_name: `Bagian ${sections.length + 1}`, fields: [] },
    ]);
    selectSection(id);
  };
  const addQuestion = (): void => {
    if (!section) return;
    const field: FormField = {
      key: `custom_${newId()}`,
      label: "",
      type: "text",
      required: false,
    };
    updateSection(section.id!, { fields: [...section.fields, field] });
    selectQuestion(field.key, true);
    requestAnimationFrame(() =>
      document
        .getElementById(`builder-question-${field.key}`)
        ?.querySelector("textarea")
        ?.focus(),
    );
  };
  const moveSection = (from: number, to: number): void =>
    onChange(arrayMove(sections, from, to));
  const moveField = (
    key: string,
    targetId: string,
    targetIndex?: number,
  ): void => {
    onChange(moveQuestion(sections, key, targetId, targetIndex));
    if (targetId !== activeId) selectSection(targetId, key);
  };
  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return;
    const target = sections.find(
      (item) =>
        item.id === over.id ||
        item.fields.some((field) => field.key === over.id),
    );
    if (!target) return;
    if (active.data.current?.kind === "section") {
      const from = sections.findIndex((item) => item.id === active.id);
      if (from >= 0) moveSection(from, sections.indexOf(target));
    } else if (active.data.current?.kind === "question") {
      const targetIndex = target.fields.findIndex(
        (field) => field.key === over.id,
      );
      moveField(
        String(active.id),
        target.id!,
        targetIndex < 0 ? undefined : targetIndex,
      );
    }
  };
  const outline = (
    <SectionOutline
      sections={sections}
      activeId={activeId}
      profileCount={profileCount}
      issueSectionIds={new Set(issues.map((issue) => issue.sectionId))}
      onSelect={selectSection}
      onAdd={addSection}
    />
  );
  const navigation = section?.navigation;
  const destination = navigation?.defaultTarget;
  const routeSummary = navigation?.questionKey
    ? `Berdasarkan jawaban · ${navigation.routes?.length ?? 0} aturan`
    : destination?.type === "submit" ||
        ((!destination || destination.type === "next") &&
          index === sections.length - 1)
      ? "Kirim formulir"
      : destination?.type === "section"
        ? (sections.find((item) => item.id === destination.sectionId)
            ?.section_name ?? "Tujuan perlu diperbaiki")
        : "Lanjut ke bagian berikutnya";
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div
        className="builder-layout"
        style={
          {
            "--builder-outline-offset": `${toolbarBottom + 16}px`,
            "--builder-content-offset": `${toolbarBottom + (screens.md ? 16 : 68)}px`,
          } as CSSProperties
        }
      >
        {screens.md && (
          <aside className="builder-outline">
            <Affix offsetTop={toolbarBottom + 16}>{outline}</Affix>
          </aside>
        )}
        {!screens.md && (
          <Affix offsetTop={toolbarBottom} className="builder-mobile-outline">
            <div className="builder-mobile-outline-control">
              <Button
                block
                icon={<UnorderedListOutlined aria-hidden />}
                onClick={() => setOutlineOpen(true)}
              >
                <span>
                  {section
                    ? `Bagian ${index + 1} dari ${sections.length}`
                    : "Data diri"}
                </span>
                <span className="builder-hint">Ganti bagian</span>
              </Button>
            </div>
          </Affix>
        )}
        {!screens.md && (
          <Drawer
            title="Isi formulir"
            open={outlineOpen}
            onClose={() => {
              pendingFocus.current = null;
              setOutlineOpen(false);
            }}
            destroyOnHidden
            afterOpenChange={(open) => {
              if (!open && pendingFocus.current) focusContent();
            }}
          >
            {outline}
          </Drawer>
        )}
        <div
          className="builder-canvas"
          id="builder-active-content"
          tabIndex={-1}
        >
          {section ? (
            <section
              key={section.id}
              className="builder-section"
              id={`builder-section-${section.id}`}
              tabIndex={-1}
              aria-label={section.section_name}
            >
              <div className="builder-section-heading">
                <span className="builder-hint">
                  Bagian {index + 1} · {section.fields.length} pertanyaan
                </span>
                <Dropdown
                  trigger={["click"]}
                  menu={{
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
                      { type: "divider" },
                      {
                        key: "copy",
                        label: "Duplikat bagian",
                        icon: <CopyOutlined aria-hidden />,
                        onClick: () => {
                          const copy = duplicateSection(section);
                          const updated = [...sections];
                          updated.splice(index + 1, 0, copy);
                          onChange(updated);
                          selectSection(copy.id!);
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
                            onOk: () => {
                              onChange(
                                sections.filter(
                                  (item) => item.id !== section.id,
                                ),
                              );
                              selectSection(
                                sections[index + 1]?.id ??
                                  sections[index - 1]?.id ??
                                  null,
                              );
                            },
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
              <SectionDetails
                section={section}
                onChange={(patch) => updateSection(section.id!, patch)}
              />
              {sectionIssues.length > 0 && (
                <Alert
                  className="builder-section-errors"
                  type="error"
                  showIcon
                  title="Periksa bagian ini"
                  description={
                    <ul>
                      {sectionIssues.map((issue, i) => (
                        <li key={i}>{issue.message}</li>
                      ))}
                    </ul>
                  }
                />
              )}
              <div className="builder-question-list">
                <SortableContext
                  items={section.fields.map((field) => field.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.fields.map((field, fieldIndex) => (
                    <QuestionCard
                      key={field.key}
                      field={field}
                      index={fieldIndex}
                      section={section}
                      sections={sections}
                      selected={selected === field.key}
                      onSelect={selectQuestion}
                      onFieldsChange={(fields) =>
                        updateSection(section.id!, { fields })
                      }
                      onMove={moveField}
                    />
                  ))}
                </SortableContext>
                {!section.fields.length && (
                  <p className="builder-empty">
                    Belum ada pertanyaan. Tambahkan pertanyaan atau gunakan
                    bagian ini untuk petunjuk saja.
                  </p>
                )}
              </div>
              <Button
                className="builder-add-question"
                block
                icon={<PlusOutlined aria-hidden />}
                onClick={addQuestion}
              >
                Tambah pertanyaan
              </Button>
              <Collapse
                className="builder-routing-panel"
                ghost
                items={[
                  {
                    key: "routing",
                    label: (
                      <span className="builder-routing-label">
                        <strong>Alur setelah bagian</strong>
                        <span className="builder-hint">{routeSummary}</span>
                      </span>
                    ),
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
            </section>
          ) : (
            <section
              className="builder-profile"
              id="builder-profile-content"
              tabIndex={-1}
            >
              {profile}
            </section>
          )}
          <div className="builder-section-navigation">
            <Button
              icon={<ArrowLeftOutlined aria-hidden />}
              disabled={index < 0}
              onClick={() => selectSection(sections[index - 1]?.id ?? null)}
            >
              {index === 0 ? "Data diri" : "Bagian sebelumnya"}
            </Button>
            {index < sections.length - 1 ? (
              <Button onClick={() => selectSection(sections[index + 1].id!)}>
                Bagian berikutnya <ArrowRightOutlined aria-hidden />
              </Button>
            ) : (
              <Button icon={<PlusOutlined aria-hidden />} onClick={addSection}>
                Tambah bagian
              </Button>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
