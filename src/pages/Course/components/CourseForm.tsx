import { useState, type ReactElement } from "react";
import { Alert, Button, Form, Input, Select } from "antd";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import type { CourseInput } from "../../../types/model/course";
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_LABELS,
} from "../../../types/model/course";

type Props = {
  initial?: CourseInput;
  disabled?: boolean;
  onSave: (input: CourseInput) => Promise<void>;
};
export default function CourseForm({
  initial,
  disabled,
  onSave,
}: Props): ReactElement {
  const [saving, setSaving] = useState(false);
  const submit = async (input: CourseInput): Promise<void> => {
    setSaving(true);
    try {
      await onSave(input);
    } catch {
      /* The API service displays the error. */
    } finally {
      setSaving(false);
    }
  };
  return (
    <Form<CourseInput>
      layout="vertical"
      initialValues={
        initial ?? {
          title: "",
          summary: "",
          description: "",
          minimum_level: 0,
          status: "draft",
        }
      }
      onFinish={(values) => void submit(values)}
      disabled={disabled || saving}
      style={{ maxWidth: 880 }}
    >
      {initial?.status === "published" && (
        <Alert
          type="info"
          showIcon
          title="Perubahan yang disimpan langsung terlihat oleh peserta."
          description="Ubah status menjadi Draf sebelum menyiapkan perubahan yang belum siap ditayangkan."
          style={{ marginBottom: 20 }}
        />
      )}
      <Form.Item
        name="title"
        label="Judul kelas"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Masukkan judul kelas.",
          },
          { max: 255 },
        ]}
      >
        <Input maxLength={255} />
      </Form.Item>
      <Form.Item name="summary" label="Ringkasan" rules={[{ max: 2000 }]}>
        <Input.TextArea rows={3} maxLength={2000} showCount />
      </Form.Item>
      <Form.Item name="description" label="Deskripsi kelas">
        <RichTextEditor
          disabled={disabled || saving}
          placeholder="Jelaskan isi dan tujuan kelas."
        />
      </Form.Item>
      <Form.Item
        name="minimum_level"
        label="Jenjang minimum"
        rules={[{ required: true }]}
      >
        <Select options={COURSE_LEVEL_OPTIONS} />
      </Form.Item>
      <Form.Item
        name="status"
        label="Status"
        hidden={!initial}
        extra={
          initial
            ? "Kelas dapat ditayangkan setelah memiliki materi dengan video YouTube yang valid."
            : undefined
        }
      >
        <Select
          options={Object.entries(COURSE_STATUS_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
        />
      </Form.Item>
      {!disabled && (
        <Button type="primary" htmlType="submit" loading={saving}>
          {initial ? "Simpan kelas" : "Buat draf kelas"}
        </Button>
      )}
    </Form>
  );
}
