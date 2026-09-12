import { useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Radio,
  Segmented,
  Select,
  Typography,
} from "antd";
import { ResponsiveDialog } from "../../../../components/common/Responsive/ResponsiveDialog";
import type { FormField, FormSchema } from "../../../../types/model/customForm";
import {
  customSections,
  nextSectionId,
  optionValue,
  pruneFormAnswers,
} from "../../../../utils/form-routing";
import { validateCustomFormFields } from "../utils/form-validation";

function PreviewQuestion({
  field,
  value,
  change,
  error,
}: {
  field: FormField;
  value: unknown;
  change: (value: unknown) => void;
  error?: string;
}): ReactElement | null {
  if (field.hidden) return null;
  const options = field.options?.map((option) => ({
    label: option.label,
    value: optionValue(option),
    disabled: option.disabled,
  }));
  const props = {
    disabled: field.disabled,
    "aria-label": field.label,
    id: `preview-${field.key}`,
    "aria-invalid": !!error,
  };
  let input: ReactElement;
  switch (field.type) {
    case "radio":
      input = (
        <Radio.Group
          {...props}
          value={value}
          options={options}
          onChange={(event) => change(event.target.value)}
        />
      );
      break;
    case "select":
    case "multiselect":
      input = (
        <Select
          {...props}
          mode={field.type === "multiselect" ? "multiple" : undefined}
          value={value as string | string[] | undefined}
          options={options}
          allowClear
          onChange={change}
        />
      );
      break;
    case "checkbox":
      input = options?.length ? (
        <Checkbox.Group
          {...props}
          value={Array.isArray(value) ? value : []}
          options={options}
          onChange={change}
        />
      ) : (
        <Checkbox
          {...props}
          checked={value === true}
          onChange={(event) => change(event.target.checked)}
        >
          {field.label}
        </Checkbox>
      );
      break;
    case "number":
      input = (
        <InputNumber
          {...props}
          style={{ width: "100%" }}
          value={typeof value === "number" ? value : null}
          onChange={change}
        />
      );
      break;
    case "textarea":
      input = (
        <Input.TextArea
          {...props}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(event) => change(event.target.value)}
        />
      );
      break;
    default:
      input = (
        <Input
          {...props}
          type={
            ["email", "url", "date", "time"].includes(field.type)
              ? field.type
              : "text"
          }
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(event) => change(event.target.value)}
        />
      );
  }
  return (
    <Form.Item
      label={field.label}
      htmlFor={`preview-${field.key}`}
      required={field.required}
      extra={field.helpText}
      validateStatus={error ? "error" : undefined}
      help={error}
    >
      {input}
    </Form.Item>
  );
}

export function FormPreview({
  schema,
  title,
  description,
  onClose,
}: {
  schema: FormSchema;
  title: string;
  description?: string;
  onClose: () => void;
}): ReactElement {
  const sections = customSections(schema);
  let profileId = "__preview_profile__";
  while (sections.some((item) => item.id === profileId)) profileId += "_";
  let completionId = "__preview_completed__";
  while (sections.some((item) => item.id === completionId)) completionId += "_";
  const defaults = (sectionId?: string): Record<string, unknown> =>
    Object.fromEntries(
      sections
        .filter((item) => !sectionId || item.id === sectionId)
        .flatMap((item) =>
          item.fields
            .filter(
              (field) =>
                !field.hidden &&
                !field.disabled &&
                field.defaultValue !== undefined,
            )
            .map((field) => [field.key, field.defaultValue]),
        ),
    );
  const [currentId, setCurrentId] = useState(profileId);
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mobile, setMobile] = useState(false);
  const section = sections.find((item) => item.id === currentId);
  const profileFields =
    schema.fields.find((item) => item.section_name === "profile_data")
      ?.fields ?? [];
  const completed = currentId === completionId;
  const reset = (): void => {
    setCurrentId(profileId);
    setHistory([]);
    setAnswers(defaults());
    setErrors({});
  };
  const next = (): void => {
    if (currentId === profileId) {
      setHistory([profileId]);
      setCurrentId(sections[0]?.id ?? completionId);
      return;
    }
    if (!section) return;
    const validation = validateCustomFormFields(section.fields, answers);
    setErrors(validation);
    if (Object.keys(validation).length) {
      document.getElementById(`preview-${Object.keys(validation)[0]}`)?.focus();
      return;
    }
    const data = pruneFormAnswers(schema, answers);
    const destination = nextSectionId(schema, currentId, data);
    setAnswers({ ...(destination ? defaults(destination) : {}), ...data });
    setHistory([...history, currentId]);
    setCurrentId(destination ?? completionId);
  };
  return (
    <ResponsiveDialog
      open
      title="Pratinjau formulir"
      width={960}
      footer={null}
      onCancel={onClose}
    >
      <Alert
        type="info"
        showIcon
        title="Mode pratinjau"
        description="Jawaban hanya untuk mencoba alur. Tidak ada pendaftaran atau data profil yang disimpan."
      />
      <div className="builder-toolbar-actions" style={{ marginBlock: 16 }}>
        <Segmented
          value={mobile ? "mobile" : "desktop"}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Ponsel" },
          ]}
          onChange={(value) => setMobile(value === "mobile")}
        />
        <Button onClick={reset}>Mulai ulang</Button>
      </div>
      <div
        className={`builder-preview ${mobile ? "builder-preview-mobile" : ""}`}
      >
        <Typography.Title level={3}>{title}</Typography.Title>
        {description && (
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {description}
          </Typography.Paragraph>
        )}
        {completed ? (
          <Alert
            type="success"
            title="Simulasi selesai"
            description="Jalur formulir berhasil diselesaikan. Tidak ada jawaban yang dikirim."
          />
        ) : (
          <>
            <Typography.Text type="secondary">
              Langkah {history.length + 1}
            </Typography.Text>
            <Typography.Title level={4}>
              {section?.section_name ?? "Data diri"}
            </Typography.Title>
            {currentId === profileId ? (
              <>
                <Typography.Paragraph>
                  Data diri selalu ditampilkan terlebih dahulu. Pada formulir
                  asli, anggota melengkapi profil dan tamu mengisi identitas.
                </Typography.Paragraph>
                <ul>
                  {profileFields.map((field) => (
                    <li key={field.key}>
                      {field.label}
                      {field.required ? " (wajib)" : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                {section?.description && (
                  <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
                    {section.description}
                  </Typography.Paragraph>
                )}
                <Form layout="vertical" onFinish={next}>
                  {section?.fields.map((field) => (
                    <PreviewQuestion
                      key={field.key}
                      field={field}
                      value={answers[field.key]}
                      change={(value) =>
                        setAnswers({ ...answers, [field.key]: value })
                      }
                      error={errors[field.key]}
                    />
                  ))}
                </Form>
              </>
            )}
            <div className="builder-preview-navigation">
              <Button
                disabled={!history.length}
                onClick={() => {
                  setCurrentId(history[history.length - 1]);
                  setHistory(history.slice(0, -1));
                  setErrors({});
                }}
              >
                Kembali
              </Button>
              <Button type="primary" onClick={next}>
                {(section &&
                  nextSectionId(schema, section.id, answers) === null) ||
                !sections.length
                  ? "Kirim (simulasi)"
                  : "Lanjutkan"}
              </Button>
            </div>
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}
