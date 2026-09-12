import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import {
  removeCourseLesson,
  reorderCourseLessons,
} from "../../../api/services/course";
import type { CourseDetail, CourseLesson } from "../../../types/model/course";
import { lessonsWithoutVideo, moveLessonIds } from "../utils/course-editor";
import LessonEditor from "./LessonEditor";

type Props = {
  course: CourseDetail;
  canManage: boolean;
  onUpdated: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};

export default function CourseLessons({
  course,
  canManage,
  onUpdated,
  onDirtyChange,
  onBusyChange,
}: Props): ReactElement {
  const [editing, setEditing] = useState<CourseLesson | "new" | null>(null);
  const [preview, setPreview] = useState<CourseLesson | null>(null);
  const [operation, setOperation] = useState<
    | { kind: "move"; id: number; direction: -1 | 1 }
    | { kind: "remove"; id: number }
    | null
  >(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [failure, setFailure] = useState("");
  const [messageApi, messageContext] = message.useMessage();
  const [modal, modalContext] = Modal.useModal();
  const running = useRef(false);
  const editorTrigger = useRef<HTMLElement | null>(null);
  const busy = operation !== null;
  const missing = lessonsWithoutVideo(course.lessons);
  const missingIds = new Set(missing.map((lesson) => lesson.id));
  const filtered = course.lessons.filter(
    (lesson) =>
      lesson.title
        .toLocaleLowerCase("id")
        .includes(search.trim().toLocaleLowerCase("id")) &&
      (!onlyMissing || missingIds.has(lesson.id)),
  );
  useEffect(() => {
    onBusyChange(busy || editorBusy);
  }, [busy, editorBusy, onBusyChange]);
  useEffect(() => () => onBusyChange(false), [onBusyChange]);
  useEffect(() => {
    if (editing === null) editorTrigger.current?.focus();
  }, [editing]);
  const edit = (lesson: CourseLesson | "new"): void => {
    editorTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setEditing(lesson);
  };

  const mutate = async (
    next: NonNullable<typeof operation>,
    action: () => Promise<unknown>,
    success: string,
  ): Promise<void> => {
    if (running.current) return;
    running.current = true;
    setOperation(next);
    setFailure("");
    try {
      await action();
      messageApi.success(success);
      await onUpdated();
    } catch {
      setFailure(
        "Perubahan belum tersimpan. Coba tindakan ini kembali setelah memeriksa koneksi.",
      );
    } finally {
      running.current = false;
      setOperation(null);
    }
  };
  const move = (lesson: CourseLesson, direction: -1 | 1): void => {
    const ids = moveLessonIds(course.lessons, lesson.id, direction);
    if (ids)
      void mutate(
        { kind: "move", id: lesson.id, direction },
        () => reorderCourseLessons(course.id, ids),
        `Urutan ${lesson.title} diperbarui.`,
      );
  };
  const remove = (lesson: CourseLesson): void => {
    modal.confirm({
      title: "Hapus materi dari kelas?",
      content: (
        <>
          <p>
            <strong>{lesson.title}</strong>
          </p>
          <p>
            Materi dan PDF pendampingnya tidak lagi dapat diakses peserta.
            Riwayat progres tetap tersimpan.
          </p>
        </>
      ),
      okText: "Hapus materi",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () =>
        mutate(
          { kind: "remove", id: lesson.id },
          () => removeCourseLesson(course.id, lesson.id),
          "Materi dihapus dari kelas.",
        ),
    });
  };

  return (
    <section className="course-panel" aria-labelledby="course-lessons-title">
      {messageContext}
      {modalContext}
      <header className="course-section-header">
        <div>
          <Typography.Title
            level={3}
            id="course-lessons-title"
            style={{ fontSize: 20 }}
          >
            Materi kelas
          </Typography.Title>
          <p>
            Susun urutan belajar, lalu buka materi untuk mengelola video,
            deskripsi, dan PDF.
          </p>
        </div>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden />}
            onClick={() => edit("new")}
            disabled={busy}
          >
            Tambah materi
          </Button>
        )}
      </header>
      {failure && (
        <Alert
          type="error"
          showIcon
          title={failure}
          className="course-feedback"
        />
      )}
      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="course-feedback"
          title={`${missing.length} materi belum memiliki video`}
          description="Lengkapi video pada setiap materi sebelum menayangkan kelas. Deskripsi dan PDF bersifat opsional."
        />
      )}
      {course.lessons.length > 0 && (
        <div className="course-filters">
          <Input
            className="course-search"
            aria-label="Cari materi"
            placeholder="Cari judul materi"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
          />
          {(missing.length > 0 || onlyMissing) && (
            <Checkbox
              checked={onlyMissing}
              onChange={(event) => setOnlyMissing(event.target.checked)}
            >
              Belum ada video
            </Checkbox>
          )}
          <Typography.Text type="secondary" role="status">
            {filtered.length} dari {course.lessons.length} materi
          </Typography.Text>
        </div>
      )}
      {!course.lessons.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Belum ada materi. Mulai dengan judul dan video pertama."
        />
      ) : !filtered.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Tidak ada materi yang sesuai."
        >
          <Button
            onClick={() => {
              setSearch("");
              setOnlyMissing(false);
            }}
          >
            Hapus filter
          </Button>
        </Empty>
      ) : (
        <ol className="course-lesson-list" aria-label="Urutan materi kelas">
          {filtered.map((lesson) => {
            const index = course.lessons.findIndex(
              (item) => item.id === lesson.id,
            );
            return (
              <li
                key={lesson.id}
                className="course-lesson-row"
                value={index + 1}
              >
                <div>
                  <h4 className="course-lesson-title">
                    <Button
                      type="link"
                      onClick={() => edit(lesson)}
                      disabled={busy}
                    >
                      {index + 1}. {lesson.title}
                    </Button>
                  </h4>
                  <div className="course-metadata">
                    <span>
                      {missingIds.has(lesson.id)
                        ? "Video belum ditambahkan"
                        : "Video ditambahkan"}
                    </span>
                    <span>{lesson.documents.length} PDF pendamping</span>
                  </div>
                </div>
                <div className="course-lesson-actions">
                  {lesson.youtube_video_id && (
                    <Tooltip title={`Pratinjau ${lesson.title}`}>
                      <Button
                        icon={<PlayCircleOutlined aria-hidden />}
                        onClick={() => setPreview(lesson)}
                      >
                        Pratinjau video
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    icon={canManage ? <EditOutlined aria-hidden /> : undefined}
                    onClick={() => edit(lesson)}
                    disabled={busy}
                  >
                    {canManage ? "Edit materi" : "Lihat materi"}
                  </Button>
                  {canManage && (
                    <>
                      <Tooltip title="Pindahkan ke atas">
                        <Button
                          icon={<ArrowUpOutlined aria-hidden />}
                          aria-label={`Pindahkan ${lesson.title} ke atas`}
                          disabled={busy || index === 0}
                          onClick={() => move(lesson, -1)}
                          loading={
                            operation?.kind === "move" &&
                            operation.id === lesson.id &&
                            operation.direction === -1
                          }
                        />
                      </Tooltip>
                      <Tooltip title="Pindahkan ke bawah">
                        <Button
                          icon={<ArrowDownOutlined aria-hidden />}
                          aria-label={`Pindahkan ${lesson.title} ke bawah`}
                          disabled={busy || index === course.lessons.length - 1}
                          onClick={() => move(lesson, 1)}
                          loading={
                            operation?.kind === "move" &&
                            operation.id === lesson.id &&
                            operation.direction === 1
                          }
                        />
                      </Tooltip>
                      <Tooltip title="Hapus materi">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined aria-hidden />}
                          aria-label={`Hapus materi ${lesson.title}`}
                          disabled={busy}
                          onClick={() => remove(lesson)}
                          loading={
                            operation?.kind === "remove" &&
                            operation.id === lesson.id
                          }
                        />
                      </Tooltip>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {course.lessons.length > 0 && (
        <Typography.Paragraph type="secondary" style={{ margin: "16px 0 0" }}>
          Urutan tersimpan setiap kali dipindahkan. Peserta tetap dapat membuka
          materi dalam urutan apa pun.
        </Typography.Paragraph>
      )}
      {editing !== null && (
        <LessonEditor
          courseId={course.id}
          courseStatus={course.status}
          lesson={editing === "new" ? undefined : editing}
          canManage={canManage}
          onClose={() => setEditing(null)}
          onUpdated={onUpdated}
          onDirtyChange={onDirtyChange}
          onBusyChange={setEditorBusy}
        />
      )}
      <ResponsiveDialog
        title={preview?.title}
        open={preview !== null}
        onCancel={() => setPreview(null)}
        footer={null}
        width={900}
        destroyOnHidden
        className="course-editor"
      >
        {preview && (
          <iframe
            className="course-video"
            src={`https://www.youtube.com/embed/${preview.youtube_video_id}?playsinline=1`}
            title={`Pratinjau ${preview.title}`}
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </ResponsiveDialog>
    </section>
  );
}
