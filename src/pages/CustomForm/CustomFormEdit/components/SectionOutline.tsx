import { useState, type ReactElement } from "react";
import { Button, Input } from "antd";
import { LockOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FormSection } from "../../../../types/model/customForm";
import { SortableItem } from "./SortableItem";

interface Props {
  sections: FormSection[];
  activeId: string | null;
  profileCount: number;
  issueSectionIds: Set<string | undefined>;
  onSelect: (id: string | null, questionKey?: string) => void;
  onAdd: () => void;
}

export function SectionOutline({
  sections,
  activeId,
  profileCount,
  issueSectionIds,
  onSelect,
  onAdd,
}: Props): ReactElement {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("id");
  const matches = sections
    .map((section, index) => ({
      section,
      index,
      fields: query
        ? section.fields.filter((field) =>
            field.label.toLocaleLowerCase("id").includes(query),
          )
        : [],
    }))
    .filter(
      ({ section, fields }) =>
        !query ||
        section.section_name.toLocaleLowerCase("id").includes(query) ||
        fields.length,
    );
  return (
    <nav aria-label="Daftar bagian formulir" className="builder-outline-links">
      <div className="builder-outline-heading">
        <strong>Isi formulir</strong>
        <span className="builder-hint">
          {sections.length} bagian ·{" "}
          {sections.reduce(
            (count, section) => count + section.fields.length,
            0,
          )}{" "}
          pertanyaan
        </span>
      </div>
      <Input
        prefix={<SearchOutlined aria-hidden />}
        aria-label="Cari bagian atau pertanyaan"
        placeholder="Cari bagian atau pertanyaan"
        allowClear
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="builder-outline-list">
        <button
          type="button"
          className="builder-outline-link builder-outline-profile"
          aria-current={activeId === null ? "step" : undefined}
          onClick={() => onSelect(null)}
        >
          <LockOutlined aria-hidden />
          <span>
            <strong>Data diri</strong>
            <small>{profileCount} isian · Selalu di awal</small>
          </span>
        </button>
        <SortableContext
          items={sections.map((section) => section.id!)}
          strategy={verticalListSortingStrategy}
        >
          {matches.map(({ section, index, fields }) => (
            <SortableItem
              key={section.id}
              id={section.id!}
              kind="section"
              label={`bagian ${index + 1}`}
            >
              {(handle) => (
                <div className="builder-outline-item">
                  <div
                    className="builder-outline-row"
                    data-active={section.id === activeId}
                    data-section-id={section.id}
                  >
                    {handle}
                    <button
                      type="button"
                      className="builder-outline-link"
                      aria-current={
                        section.id === activeId ? "step" : undefined
                      }
                      onClick={() => onSelect(section.id!)}
                    >
                      <span>
                        <strong>
                          {index + 1}.{" "}
                          {section.section_name || "Bagian tanpa nama"}
                        </strong>
                        <small>
                          {section.fields.length} pertanyaan
                          {section.navigation?.questionKey
                            ? " · Bercabang"
                            : ""}
                        </small>
                        {issueSectionIds.has(section.id) && (
                          <small className="builder-issue-text">
                            Perlu diperbaiki
                          </small>
                        )}
                      </span>
                    </button>
                  </div>
                  {fields.length > 0 && (
                    <ul className="builder-search-results">
                      {fields.map((field) => (
                        <li key={field.key}>
                          <button
                            type="button"
                            onClick={() => onSelect(section.id!, field.key)}
                          >
                            {field.label || "Pertanyaan tanpa judul"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
        {!matches.length && (
          <p className="builder-hint" role="status">
            Tidak ada bagian atau pertanyaan yang cocok.
          </p>
        )}
      </div>
      <Button icon={<PlusOutlined aria-hidden />} onClick={onAdd}>
        Tambah bagian
      </Button>
    </nav>
  );
}
