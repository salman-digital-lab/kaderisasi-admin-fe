import { useEffect, useRef, useState, type ReactElement } from "react";
import { Alert, Button, Form, Input, Modal, Typography, message } from "antd";
import { PlayCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import { saveCourseLesson } from "../../../api/services/course";
import type {
  CourseLesson,
  CourseStatus,
  LessonInput,
} from "../../../types/model/course";
import {
  hasLessonChanges,
  lessonInput,
  mergeSavedLesson,
  youtubeVideoId,
} from "../utils/course-editor";
import LessonDocuments from "./LessonDocuments";

type Props = {
  courseId: number;
  courseStatus: CourseStatus;
  lesson?: CourseLesson;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

export default function LessonEditor({
  courseId,
  courseStatus,
  lesson,
  canManage,
  onClose,
  onUpdated,
  onDirtyChange,
  onBusyChange,
}: Props): ReactElement {
  const [form] = Form.useForm<LessonInput>();
  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [savedValues, setSavedValues] = useState(() => lessonInput(lesson));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentsBusy, setDocumentsBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [modal, modalContext] = Modal.useModal();
  const [messageApi, messageContext] = message.useMessage();
  const running = useRef(false);
  const videoUrl = Form.useWatch("youtube_url", form) as string | undefined;
  const videoId = youtubeVideoId(videoUrl ?? savedValues.youtube_url);
  const busy = saving || documentsBusy;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(
    () => () => {
      onDirtyChange(false);
      onBusyChange(false);
    },
    [onDirtyChange, onBusyChange],
  );

  const close = (): void => {
    if (busy) return;
    if (!dirty) {
      onClose();
      return;
    }
    modal.confirm({
      title: "Tutup tanpa menyimpan perubahan materi?",
      content:
        "Perubahan judul, video, dan deskripsi akan dibuang. PDF yang sudah diunggah atau dihapus tetap tersimpan.",
      okText: "Buang perubahan",
      cancelText: "Lanjutkan mengedit",
      okButtonProps: { danger: true },
      onOk: onClose,
    });
  };

  const submit = async (values: LessonInput): Promise<void> => {
    if (running.current || documentsBusy || !canManage) return;
    running.current = true;
    setSaving(true);
    setFailure("");
    try {
      const updated = await saveCourseLesson(
        courseId,
        currentLesson?.id,
        values,
      );
      const normalized = lessonInput(updated);
      setCurrentLesson((previous) => mergeSavedLesson(updated, previous));
      setSavedValues(normalized);
      form.setFieldsValue(normalized);
      setDirty(false);
      messageApi.success(
        currentLesson
          ? "Materi tersimpan."
          : "Materi dibuat. Anda dapat menambahkan PDF pendamping.",
      );
      await onUpdated();
    } catch {
      setFailure(
        "Materi belum tersimpan. Isian Anda tetap tersedia. Periksa koneksi dan coba simpan kembali.",
      );
    } finally {
      running.current = false;
      setSaving(false);
    }
  };

  return (
    <ResponsiveDialog
      title={
        !canManage
          ? "Detail materi"
          : currentLesson
            ? "Edit materi"
            : "Tambah materi"
      }
      open
      width={1040}
      className="course-editor"
      onCancel={close}
      maskClosable={false}
      closable={!busy}
      keyboard={!busy}
      footer={
        <>
          <Button onClick={close} disabled={busy}>
            {dirty ? "Batal" : "Selesai"}
          </Button>
          {canManage && (
            <Button
              type="primary"
              icon={<SaveOutlined aria-hidden />}
              form={`course-lesson-${courseId}`}
              htmlType="submit"
              onClick={(event) => {
                event.preventDefault();
                form.submit();
              }}
              loading={saving}
              disabled={documentsBusy || (Boolean(currentLesson) && !dirty)}
            >
              {currentLesson ? "Simpan materi" : "Buat materi & lanjutkan"}
            </Button>
          )}
        </>
      }
    >
      {modalContext}
      {messageContext}
      {courseStatus === "published" && canManage && (
        <Alert
          showIcon
          type="info"
          title="Kelas sedang tayang. Perubahan yang disimpan langsung terlihat oleh peserta."
          className="course-feedback"
        />
      )}
      {failure && (
        <Alert
          showIcon
          type="error"
          title={failure}
          className="course-feedback"
        />
      )}
      <div className="course-editor-grid">
        <Form<LessonInput>
          name={`course-lesson-${courseId}`}
          id={`course-lesson-${courseId}`}
          className="course-editor-form"
          form={form}
          layout="vertical"
          initialValues={savedValues}
          onValuesChange={(_, values: LessonInput) =>
            setDirty(hasLessonChanges(values, savedValues))
          }
          onFinish={(values) => void submit(values)}
          scrollToFirstError={{ focus: true }}
          disabled={!canManage || busy}
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
              { max: 255, message: "Judul maksimal 255 karakter." },
            ]}
          >
            <Input maxLength={255} autoFocus />
          </Form.Item>
          <Form.Item
            name="youtube_url"
            label="Tautan video YouTube"
            validateTrigger="onBlur"
            extra="Tempel tautan YouTube. Atur video sebagai Unlisted dan izinkan penyematan di YouTube."
            rules={[
              {
                required: courseStatus === "published",
                whitespace: true,
                message: "Video wajib diisi untuk kelas yang tayang.",
              },
              {
                validator: (_, value: string | undefined) =>
                  youtubeVideoId(value ?? "") === null
                    ? Promise.reject(
                        new Error(
                          "Masukkan tautan video YouTube yang valid, bukan tautan kanal atau playlist.",
                        ),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <Input placeholder="https://www.youtube.com/watch?v=..." />
          </Form.Item>
          <Button
            icon={<PlayCircleOutlined aria-hidden />}
            disabled={!videoId || busy}
            onClick={() =>
              setPreview(preview === videoId ? null : videoId || null)
            }
          >
            {preview && preview === videoId
              ? "Tutup pratinjau"
              : "Pratinjau video"}
          </Button>
          <div className="course-video-preview">
            {preview && preview === videoId && (
              <iframe
                className="course-video"
                src={`https://www.youtube.com/embed/${preview}?playsinline=1`}
                title="Pratinjau video materi"
                allow="encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
          <Form.Item name="description" label="Deskripsi materi (opsional)">
            <RichTextEditor
              ariaLabel="Deskripsi materi"
              disabled={!canManage || busy}
              minHeight="180px"
              placeholder="Tambahkan rangkuman atau petunjuk untuk peserta."
            />
          </Form.Item>
        </Form>
        <section
          className="course-editor-documents"
          aria-labelledby="course-lesson-documents-title"
        >
          <Typography.Title
            level={3}
            id="course-lesson-documents-title"
            style={{ fontSize: 18 }}
          >
            Dokumen pendamping
          </Typography.Title>
          {currentLesson ? (
            <LessonDocuments
              key={currentLesson.id}
              courseId={courseId}
              lessonId={currentLesson.id}
              initialDocuments={currentLesson.documents}
              canManage={canManage}
              disabled={saving}
              onBusyChange={setDocumentsBusy}
              onUpdated={onUpdated}
            />
          ) : (
            <Typography.Paragraph type="secondary">
              Buat materi terlebih dahulu. Setelah itu, Anda dapat mengunggah
              PDF di sini tanpa menutup editor.
            </Typography.Paragraph>
          )}
        </section>
      </div>
    </ResponsiveDialog>
  );
}
