import { useState, type ReactElement } from "react";
import { Button, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { FormSection } from "../../../../types/model/customForm";

export function SectionDetails({
  section,
  onChange,
}: {
  section: FormSection;
  onChange: (patch: Partial<FormSection>) => void;
}): ReactElement {
  const [editing, setEditing] = useState(
    !section.fields.length && !section.description,
  );
  return (
    <div className="builder-section-details">
      {editing ? (
        <div id={`builder-details-${section.id}`}>
          <label className="builder-control builder-section-name">
            Nama bagian
            <Input
              value={section.section_name}
              onChange={(event) =>
                onChange({ section_name: event.target.value })
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
                onChange({ description: event.target.value })
              }
            />
          </label>
        </div>
      ) : (
        <div>
          <h3>{section.section_name || "Bagian tanpa nama"}</h3>
          {section.description && <p>{section.description}</p>}
        </div>
      )}
      <Button
        type="text"
        icon={<EditOutlined aria-hidden />}
        aria-expanded={editing}
        aria-controls={`builder-details-${section.id}`}
        onClick={() => setEditing(!editing)}
      >
        {editing ? "Selesai mengedit bagian" : "Edit bagian"}
      </Button>
    </div>
  );
}
