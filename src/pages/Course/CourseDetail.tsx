import type { ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCourse, saveCourse } from "../../api/services/course";
import { usePermissions } from "../../stores/authStore";
import { COURSE_STATUS_LABELS } from "../../types/model/course";
import CourseForm from "./components/CourseForm";
import CourseLessons from "./components/CourseLessons";
import CourseLearners from "./components/CourseLearners";

export default function CourseDetail(): ReactElement {
  const { id = "" } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const canManage = usePermissions().includes("courses.manage");
  const [messageApi, contextHolder] = message.useMessage();
  const {
    data: course,
    loading,
    error,
    refreshAsync,
  } = useRequest(() => getCourse(Number(id)), { refreshDeps: [id] });
  const refresh = async (): Promise<void> => {
    await refreshAsync();
  };
  if (loading && !course)
    return (
      <main style={{ padding: 12 }}>
        <Skeleton active />
      </main>
    );
  if (error || !course)
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
    <main style={{ padding: 12, minWidth: 0 }}>
      {contextHolder}
      <Link to="/courses">Kembali ke daftar kelas</Link>
      <Space
        align="center"
        wrap
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "16px 0",
        }}
      >
        <div>
          <Typography.Title
            level={2}
            style={{ margin: "0 0 8px", overflowWrap: "anywhere" }}
          >
            {course.title}
          </Typography.Title>
          <Tag color={course.status === "published" ? "success" : "default"}>
            {COURSE_STATUS_LABELS[course.status]}
          </Tag>
          <Typography.Text type="secondary">
            {course.lessons.length} materi
          </Typography.Text>
        </div>
        <Button
          onClick={() => {
            void refresh().catch(() => undefined);
          }}
          loading={loading}
        >
          Muat ulang
        </Button>
      </Space>
      <Tabs
        activeKey={
          ["overview", "lessons", "learners"].includes(section)
            ? section
            : "overview"
        }
        onChange={(value) => setParams({ section: value })}
        items={[
          {
            key: "overview",
            label: "Ringkasan",
            children: (
              <CourseForm
                key={course.updated_at}
                initial={{
                  title: course.title,
                  summary: course.summary,
                  description: course.description,
                  minimum_level: course.minimum_level,
                  status: course.status,
                }}
                disabled={!canManage}
                onSave={async (input) => {
                  await saveCourse(course.id, input);
                  await refresh();
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
