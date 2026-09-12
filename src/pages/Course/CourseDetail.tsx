import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Skeleton,
  Modal,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCourse, saveCourse } from "../../api/services/course";
import { usePermissions } from "../../stores/authStore";
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_LABELS,
} from "../../types/model/course";
import UnsavedChangesGuard from "../../components/common/UnsavedChangesGuard";
import CourseForm from "./components/CourseForm";
import CourseLessons from "./components/CourseLessons";
import CourseLearners from "./components/CourseLearners";
import "./course-detail.css";

export default function CourseDetail(): ReactElement {
  const { id = "" } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const canManage = usePermissions().includes("courses.manage");
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContext] = Modal.useModal();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const {
    data: course,
    loading,
    error,
    refreshAsync,
    mutate,
  } = useRequest(() => getCourse(Number(id)), { refreshDeps: [id] });
  const refresh = async (): Promise<void> => {
    try {
      await refreshAsync();
    } catch {
      // Retain the current editor and show the retry banner below.
    }
  };
  const discardBefore = (action: () => void): void => {
    if (busy) return;
    if (!dirty) {
      action();
      return;
    }
    modal.confirm({
      title: "Perubahan kelas belum disimpan",
      content:
        "Simpan perubahan terlebih dahulu, atau lanjutkan dengan membuang perubahan yang belum disimpan.",
      okText: "Buang perubahan",
      cancelText: "Lanjutkan mengedit",
      okButtonProps: { danger: true },
      onOk: () => {
        setDirty(false);
        setFormVersion((version) => version + 1);
        action();
      },
    });
  };
  const openSection = (section: string): void => {
    if (busy) return;
    const next = new URLSearchParams(params);
    next.set("section", section);
    setParams(next);
  };
  if (loading && (!course || course.id !== Number(id)))
    return (
      <main style={{ padding: 12 }}>
        <Skeleton active />
      </main>
    );
  if (!course || course.id !== Number(id))
    return (
      <main style={{ padding: 12 }}>
        <Alert
          showIcon
          type="error"
          title="Kelas tidak tersedia atau gagal dimuat"
          action={
            <Button
              onClick={() => {
                void refresh().catch(() => undefined);
              }}
            >
              Coba lagi
            </Button>
          }
        />
        <Link to="/courses">Kembali ke daftar kelas</Link>
      </main>
    );
  const section = params.get("section") ?? "overview";
  return (
    <main className="course-workspace">
      {contextHolder}
      {modalContext}
      <UnsavedChangesGuard dirty={dirty || busy} includeSearchChanges />
      <Link to="/courses">Kembali ke daftar kelas</Link>
      <header className="course-header">
        <div className="course-header-copy">
          <div className="course-header-title">
            <Typography.Title
              level={2}
              style={{ margin: 0, overflowWrap: "anywhere" }}
            >
              {course.title}
            </Typography.Title>
            <Tag color={course.status === "published" ? "success" : "default"}>
              {COURSE_STATUS_LABELS[course.status]}
            </Tag>
          </div>
          <div className="course-metadata">
            <span>
              Mulai jenjang{" "}
              {
                COURSE_LEVEL_OPTIONS.find(
                  (option) => option.value === course.minimum_level,
                )?.label
              }
            </span>
            <span>{course.lessons.length} materi</span>
            <span>
              {course.lessons.reduce(
                (total, lesson) => total + lesson.documents.length,
                0,
              )}{" "}
              PDF pendamping
            </span>
          </div>
        </div>
        <Button
          onClick={() => {
            discardBefore(() => void refresh());
          }}
          loading={loading}
          disabled={busy}
          icon={<ReloadOutlined aria-hidden />}
        >
          Muat ulang
        </Button>
      </header>
      {error && (
        <Alert
          className="course-feedback"
          type="error"
          showIcon
          title="Data terbaru belum dapat dimuat. Data terakhir tetap ditampilkan."
          action={
            <Button
              disabled={busy}
              onClick={() => discardBefore(() => void refresh())}
            >
              Coba lagi
            </Button>
          }
        />
      )}
      {course.status === "published" && canManage && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
          Perubahan yang disimpan langsung terlihat oleh peserta. Ubah status
          menjadi Draf di Ringkasan untuk menyiapkan perubahan sebelum tayang.
        </Typography.Paragraph>
      )}
      <Tabs
        activeKey={
          ["overview", "lessons", "learners"].includes(section)
            ? section
            : "overview"
        }
        onChange={openSection}
        destroyOnHidden
        items={[
          {
            key: "overview",
            label: "Ringkasan",
            children: (
              <CourseForm
                key={`${course.id}-${course.updated_at}-${formVersion}`}
                initial={{
                  title: course.title,
                  summary: course.summary,
                  description: course.description,
                  minimum_level: course.minimum_level,
                  status: course.status,
                }}
                disabled={!canManage}
                lessons={course.lessons}
                onDirtyChange={setDirty}
                onBusyChange={setBusy}
                onOpenLessons={() => openSection("lessons")}
                onSave={async (input) => {
                  const updated = await saveCourse(course.id, input);
                  mutate({ ...course, ...updated });
                  messageApi.success("Kelas tersimpan.");
                }}
              />
            ),
          },
          {
            key: "lessons",
            label: "Materi",
            children: (
              <CourseLessons
                course={course}
                canManage={canManage}
                onUpdated={refresh}
                onDirtyChange={setDirty}
                onBusyChange={setBusy}
              />
            ),
          },
          {
            key: "learners",
            label: "Progres Peserta",
            children: <CourseLearners courseId={course.id} />,
          },
        ]}
      />
    </main>
  );
}
