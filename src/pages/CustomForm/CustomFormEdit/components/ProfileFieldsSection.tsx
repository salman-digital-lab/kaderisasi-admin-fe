import type { ReactElement } from "react";
import { Button, Dropdown, Switch } from "antd";
import {
  DeleteOutlined,
  LockOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";

interface ProfileFieldsSectionProps {
  selectedBasicFields: string[];
  profileDataTemplates: readonly {
    name: string;
    field: { key: string; type: string; required: boolean };
  }[];
  fieldTypes: readonly { value: string; label: string }[];
  profileFieldRequiredOverrides?: Record<string, boolean>;
  onRemoveProfileField: (fieldKey: string) => void;
  onMoveProfileField: (fieldKey: string, direction: "up" | "down") => void;
  onToggleRequiredField?: (fieldKey: string, required: boolean) => void;
  onOpenAddModal: () => void;
}

const IMMUTABLE_FIELD_KEYS = ["name", "gender"];

export function ProfileFieldsSection({
  selectedBasicFields,
  profileDataTemplates,
  fieldTypes,
  profileFieldRequiredOverrides = {},
  onRemoveProfileField,
  onMoveProfileField,
  onToggleRequiredField,
  onOpenAddModal,
}: ProfileFieldsSectionProps): ReactElement {
  return (
    <div className="builder-section">
      <div className="builder-profile-heading">
        <div>
          <h3>Data diri</h3>
          <p>Selalu ditampilkan sebelum pertanyaan formulir.</p>
        </div>
        <Button icon={<PlusOutlined aria-hidden />} onClick={onOpenAddModal}>
          Tambah data diri
        </Button>
      </div>
      <ul className="builder-profile-list">
        {selectedBasicFields.map((fieldKey, index) => {
          const template = profileDataTemplates.find(
            (item) => item.field.key === fieldKey,
          );
          if (!template) return null;
          const immutable = IMMUTABLE_FIELD_KEYS.includes(fieldKey);
          const required = immutable
            ? template.field.required
            : (profileFieldRequiredOverrides[fieldKey] ??
              template.field.required);
          return (
            <li className="builder-profile-row" key={fieldKey}>
              <div className="builder-profile-copy">
                <strong>{template.name}</strong>
                <small>
                  {
                    fieldTypes.find(
                      (type) => type.value === template.field.type,
                    )?.label
                  }
                </small>
              </div>
              {immutable ? (
                <span className="builder-hint builder-profile-required">
                  <LockOutlined aria-hidden /> Wajib
                </span>
              ) : (
                <label className="builder-required">
                  <Switch
                    aria-label={`Wajib diisi: ${template.name}`}
                    size="small"
                    checked={required}
                    onChange={(checked) =>
                      onToggleRequiredField?.(fieldKey, checked)
                    }
                  />{" "}
                  Wajib
                </label>
              )}
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    {
                      key: "up",
                      label: "Pindah ke atas",
                      disabled: index === 0,
                      onClick: () => onMoveProfileField(fieldKey, "up"),
                    },
                    {
                      key: "down",
                      label: "Pindah ke bawah",
                      disabled: index === selectedBasicFields.length - 1,
                      onClick: () => onMoveProfileField(fieldKey, "down"),
                    },
                    { type: "divider" },
                    {
                      key: "delete",
                      label: "Hapus isian",
                      icon: <DeleteOutlined aria-hidden />,
                      danger: true,
                      disabled: immutable,
                      onClick: () => onRemoveProfileField(fieldKey),
                    },
                  ],
                }}
              >
                <Button
                  type="text"
                  aria-label={`Menu data diri: ${template.name}`}
                  icon={<MoreOutlined />}
                />
              </Dropdown>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
