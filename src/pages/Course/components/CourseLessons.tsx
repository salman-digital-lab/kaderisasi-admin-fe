import { useState, type ReactElement } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import {
  downloadCourseDocument,
  removeCourseDocument,
  removeCourseLesson,
  reorderCourseLessons,
  saveCourseLesson,
  uploadCourseDocument,
} from "../../../api/services/course";
import type {
  CourseDetail,
  CourseLesson,
  LessonInput,
} from "../../../types/model/course";

type Props = {
  course: CourseDetail;
  canManage: boolean;
  onUpdated: () => Promise<void>;
};
export default function CourseLessons({
  course,
  canManage,
  onUpdated,
}: Props): ReactElement {
  const [editing, setEditing] = useState<CourseLesson | "new" | null>(null);
  const [preview, setPreview] = useState<CourseLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm<LessonInput>();
  const [messageApi, contextHolder] = message.useMessage();
  const mutate = async (operation: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    try {
      await operation();
      await onUpdated();
      messageApi.success("Perubahan materi tersimpan.");
    } catch {
      /* The API service displays the error. */
    } finally {
      setBusy(false);
    }
  };
  const edit = (lesson: CourseLesson | "new"): void => {
    form.setFieldsValue(
      lesson === "new"
        ? { title: "", description: "", youtube_url: "" }
        : {
            title: lesson.title,
            description: lesson.description,
            youtube_url: lesson.youtube_video_id
              ? `https://www.youtube.com/watch?v=${lesson.youtube_video_id}`
              : "",
          },
    );
    setEditing(lesson);
  };
  const move = (index: number, direction: number): void => {
    const ids = course.lessons.map((lesson) => lesson.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    void mutate(() => reorderCourseLessons(course.id, ids));
  };
  const submit = async (values: LessonInput): Promise<void> => {
    setBusy(true);
    try {
      await saveCourseLesson(
        course.id,
        editing && editing !== "new" ? editing.id : undefined,
        values,
      );
      setEditing(null);
      await onUpdated();
      messageApi.success("Materi tersimpan.");
    } catch {
      /* The API service displays the error. */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      {contextHolder}
      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Text type="secondary">
          Urutan membantu peserta belajar. Semua materi dapat dibuka tanpa
          menyelesaikan materi sebelumnya.
        </Typography.Text>
        {canManage && (
          <Button type="primary" onClick={() => edit("new")} disabled={busy}>
            Tambah materi
          </Button>
        )}
      </Space>
      {!course.lessons.length && (
        <Empty description="Belum ada materi. Tambahkan materi pertama sebelum menayangkan kelas." />
      )}
      <div style={{ display: "grid", gap: 16 }}>
        {course.lessons.map((lesson, index) => (
          <Card
            key={lesson.id}
            title={
              <span style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
                {index + 1}. {lesson.title}
              </span>
            }
          >
            <Space wrap style={{ marginBottom: 12 }}>
              {lesson.youtube_video_id ? (
                <Button onClick={() => setPreview(lesson)}>
                  Pratinjau video
                </Button>
              ) : (
                <Typography.Text type="warning">
                  Video belum ditambahkan
                </Typography.Text>
              )}
              {canManage && (
                <>
                  <Button onClick={() => edit(lesson)} disabled={busy}>
                    Edit materi
                  </Button>
                  <Button
                    icon={<ArrowUpOutlined />}
                    aria-label={`Pindahkan ${lesson.title} ke atas`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  />
                  <Button
                    icon={<ArrowDownOutlined />}
                    aria-label={`Pindahkan ${lesson.title} ke bawah`}
                    disabled={busy || index === course.lessons.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  <Popconfirm
                    title="Hapus materi dari kelas?"
                    description="Riwayat progres tetap tersimpan. Materi ini tidak lagi tersedia untuk peserta."
                    onConfirm={() =>
                      mutate(() => removeCourseLesson(course.id, lesson.id))
                    }
                    okText="Hapus materi"
                    cancelText="Batal"
                  >
                    <Button danger disabled={busy}>
                      Hapus materi
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
            <Typography.Title level={5}>Dokumen PDF</Typography.Title>
            {lesson.documents.length ? (
              <ul style={{ paddingLeft: 20 }}>
                {lesson.documents.map((document) => (
                  <li key={document.id} style={{ marginBottom: 8 }}>
                    <Space wrap>
                      <Button
                        type="link"
                        style={{
                          height: "auto",
                          whiteSpace: "normal",
                          textAlign: "left",
                        }}
                        onClick={() => {
                          void downloadCourseDocument(
                            course.id,
                            lesson.id,
                            document,
                          ).catch(() => undefined);
                        }}
                      >
                        {document.filename}
                      </Button>
                      <Typography.Text type="secondary">
                        {(document.size_bytes / 1024 / 1024).toFixed(1)} MB
                      </Typography.Text>
                      {canManage && (
                        <Popconfirm
                          title="Hapus dokumen ini dari materi?"
                          onConfirm={() =>
                            mutate(() =>
                              removeCourseDocument(
                                course.id,
                                lesson.id,
                                document.id,
                              ),
                            )
                          }
                          okText="Hapus"
                          cancelText="Batal"
                        >
                          <Button danger size="small" disabled={busy}>
                            Hapus PDF
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </li>
                ))}
              </ul>
            ) : (
              <Typography.Paragraph type="secondary">
                Belum ada dokumen tambahan.
              </Typography.Paragraph>
            )}
            {canManage && (
              <Upload
                accept=".pdf,application/pdf"
                showUploadList={false}
                disabled={busy}
                beforeUpload={(file) => {
                  if (
                    !file.name.toLowerCase().endsWith(".pdf") ||
                    file.size > 20 * 1024 * 1024
                  ) {
                    messageApi.error("Pilih PDF dengan ukuran maksimal 20 MB.");
                    return Upload.LIST_IGNORE;
                  }
                  void mutate(() =>
                    uploadCourseDocument(course.id, lesson.id, file),
                  );
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={busy}>
                  Unggah PDF (maks. 20 MB)
                </Button>
              </Upload>
            )}
          </Card>
        ))}
      </div>
      <Modal
        title={editing === "new" ? "Tambah materi" : "Edit materi"}
        open={editing !== null}
        onCancel={() => {
          if (!busy) setEditing(null);
        }}
        footer={null}
        width={800}
      >
        <Form<LessonInput>
          form={form}
          layout="vertical"
          onFinish={(values) => void submit(values)}
          disabled={busy}
        >
          <Form.Item
            name="title"
            label="Judul materi"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Masukkan judul materi.",
              },
              { max: 255 },
            ]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name="youtube_url"
            label="Tautan video YouTube"
            extra="Unggah video sebagai Unlisted di YouTube dan izinkan penyematan. Tautannya tetap dapat dibagikan di luar website."
            rules={[
              {
                required: course.status === "published",
                message: "Video wajib diisi untuk kelas yang tayang.",
              },
            ]}
          >
            <Input placeholder="https://www.youtube.com/watch?v=..." />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi materi">
            <RichTextEditor
              disabled={busy}
              placeholder="Catatan dan penjelasan pendamping video."
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Simpan materi
          </Button>
        </Form>
      </Modal>
      <Modal
        title={preview?.title}
        open={preview !== null}
        onCancel={() => setPreview(null)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {preview && (
          <iframe
            src={`https://www.youtube.com/embed/${preview.youtube_video_id}?playsinline=1`}
            title={`Pratinjau ${preview.title}`}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              minHeight: 200,
              border: 0,
            }}
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </Modal>
    </section>
  );
}
