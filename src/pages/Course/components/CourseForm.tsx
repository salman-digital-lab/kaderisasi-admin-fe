import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Form, Input, Select, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import type { CourseInput, CourseLesson } from "../../../types/model/course";
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_LABELS,
} from "../../../types/model/course";
import { lessonsWithoutVideo } from "../utils/course-editor";

type Props = {
  initial?: CourseInput;
  lessons?: CourseLesson[];
  disabled?: boolean;
  onSave: (input: CourseInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
  onOpenLessons?: () => void;
};
const EMPTY_COURSE: CourseInput = {
  title: "",
  summary: "",
  description: "",
  minimum_level: 0,
  status: "draft",
};

export default function CourseForm({
  initial,
  lessons = [],
  disabled,
  onSave,
  onDirtyChange,
  onBusyChange,
  onOpenLessons,
}: Props): ReactElement {
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState("");
  const [savedValues, setSavedValues] = useState(initial ?? EMPTY_COURSE);
  const [form] = Form.useForm<CourseInput>();
  const missing = lessonsWithoutVideo(lessons);
  const ready = lessons.length > 0 && missing.length === 0;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange?.(saving);
  }, [saving, onBusyChange]);
  useEffect(
    () => () => {
      onDirtyChange?.(false);
      onBusyChange?.(false);
    },
    [onDirtyChange, onBusyChange],
  );

  const submit = async (input: CourseInput): Promise<void> => {
    if (saving || disabled) return;
    setSaving(true);
    setFailure("");
    try {
      await onSave(input);
      setSavedValues(input);
      setDirty(false);
    } catch {
      setFailure(
        "Kelas belum tersimpan. Isian Anda tetap tersedia. Periksa koneksi dan coba simpan kembali.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Form<CourseInput>
      name={initial ? "course-details" : "course-create"}
      form={form}
      layout="vertical"
      initialValues={savedValues}
      onValuesChange={(_, values: CourseInput) =>
        setDirty(
          (Object.keys(EMPTY_COURSE) as (keyof CourseInput)[]).some(
            (key) => values[key] !== savedValues[key],
          ),
        )
      }
      onFinish={(values) => void submit(values)}
      scrollToFirstError={{ focus: true }}
      disabled={disabled || saving}
    >
      {failure && (
        <Alert
          type="error"
          showIcon
          title={failure}
          className="course-feedback"
        />
      )}
      <div className={initial ? "course-form-grid" : undefined}>
        <section
          className={initial ? "course-panel" : undefined}
          aria-label="Informasi kelas"
        >
          {initial && (
            <Typography.Title level={3} style={{ fontSize: 20 }}>
              Informasi kelas
            </Typography.Title>
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
              { max: 255, message: "Judul maksimal 255 karakter." },
            ]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name="summary"
            label="Ringkasan"
            extra="Tampil di daftar kelas. Jelaskan topik dan manfaat belajar secara singkat."
            rules={[{ max: 2000 }]}
          >
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi kelas (opsional)">
            <RichTextEditor
              ariaLabel="Deskripsi kelas"
              disabled={disabled || saving}
              placeholder="Jelaskan isi, tujuan, dan persiapan belajar peserta."
            />
          </Form.Item>
        </section>
        <section
          className={initial ? "course-panel" : undefined}
          aria-label="Akses dan penayangan"
        >
          {initial && (
            <Typography.Title level={3} style={{ fontSize: 20 }}>
              Akses dan penayangan
            </Typography.Title>
          )}
          <Form.Item
            name="minimum_level"
            label="Jenjang minimum"
            extra="Kelas dapat diakses oleh peserta pada jenjang ini dan jenjang di atasnya."
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
                ? "Perubahan status berlaku setelah menekan Simpan kelas."
                : undefined
            }
          >
            <Select
              options={Object.entries(COURSE_STATUS_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                  disabled: value === "published" && !ready,
                }),
              )}
            />
          </Form.Item>
          {initial && (
            <>
              <Alert
                showIcon
                type={ready ? "success" : "info"}
                title={
                  ready
                    ? "Materi siap ditayangkan"
                    : "Lengkapi materi sebelum tayang"
                }
                description={
                  ready
                    ? `${lessons.length} materi memiliki video. Deskripsi dan PDF dapat ditambahkan sesuai kebutuhan.`
                    : lessons.length
                      ? `${missing.length} materi belum memiliki video. Lengkapi melalui tab Materi.`
                      : "Tambahkan setidaknya satu materi dengan video YouTube yang valid."
                }
              />
              {onOpenLessons && (
                <Button
                  type="link"
                  onClick={onOpenLessons}
                  style={{ paddingInline: 0, marginTop: 8 }}
                >
                  {ready ? "Kelola materi" : "Lengkapi materi"}
                </Button>
              )}
              <Typography.Paragraph
                type="secondary"
                style={{ margin: "12px 0 0" }}
              >
                Draf dan kelas yang diarsipkan tidak terlihat oleh peserta.
                Riwayat progres tetap tersimpan.
              </Typography.Paragraph>
            </>
          )}
        </section>
      </div>
      {!disabled && (
        <footer className={initial ? "course-save-bar" : undefined}>
          {initial && (
            <Typography.Text type="secondary" role="status">
              {saving
                ? "Menyimpan perubahan…"
                : dirty
                  ? "Ada perubahan yang belum disimpan"
                  : "Semua perubahan tersimpan"}
            </Typography.Text>
          )}
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined aria-hidden />}
            loading={saving}
            disabled={Boolean(initial) && !dirty}
          >
            {initial ? "Simpan kelas" : "Buat draf kelas"}
          </Button>
        </footer>
      )}
    </Form>
  );
}
