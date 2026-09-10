import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ResponsiveTable } from "../../components/common/Responsive/ResponsiveTable";
import { usePermissions } from "../../stores/authStore";
import { createCourse, getCourses } from "../../api/services/course";
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_LABELS,
  type Course,
} from "../../types/model/course";
import CourseForm from "./components/CourseForm";

export default function CourseList(): ReactElement {
  const [params, setParams] = useState({
    search: "",
    status: "",
    page: 1,
    per_page: 12,
  });
  const [creating, setCreating] = useState(false);
  const canManage = usePermissions().includes("courses.manage");
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useRequest(
    () => getCourses(params),
    { refreshDeps: [params] },
  );
  return (
    <main style={{ padding: 12, minWidth: 0 }}>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Kelas
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Kelola materi pembelajaran sesuai jenjang dan pantau progres peserta.
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          aria-label="Cari kelas"
          placeholder="Cari judul kelas"
          allowClear
          maxLength={200}
          onSearch={(search) =>
            setParams((old) => ({ ...old, search, page: 1 }))
          }
          style={{ width: 260, maxWidth: "100%" }}
        />
        <Select
          aria-label="Status kelas"
          value={params.status}
          style={{ width: 170 }}
          onChange={(status: string) =>
            setParams((old) => ({ ...old, status, page: 1 }))
          }
          options={[
            { value: "", label: "Semua status" },
            ...Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <Button onClick={refresh} loading={loading}>
          Muat ulang
        </Button>
        {canManage && (
          <Button type="primary" onClick={() => setCreating(true)}>
            Buat kelas
          </Button>
        )}
      </Space>
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Daftar kelas gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : (
        <ResponsiveTable<Course>
          listId="courses"
          rowKey="id"
          loading={loading}
          dataSource={data?.data ?? []}
          locale={{
            emptyText: <Empty description="Belum ada kelas yang sesuai." />,
          }}
          pagination={{
            current: params.page,
            pageSize: params.per_page,
            total: data?.meta.total ?? 0,
            onChange: (page, per_page) =>
              setParams((old) => ({ ...old, page, per_page })),
          }}
          columns={[
            {
              title: "Kelas",
              dataIndex: "title",
              render: (title: string, row) => (
                <Link to={`/courses/${row.id}`}>{title}</Link>
              ),
            },
            {
              title: "Jenjang minimum",
              dataIndex: "minimum_level",
              render: (level: number) =>
                COURSE_LEVEL_OPTIONS.find((option) => option.value === level)
                  ?.label,
            },
            { title: "Materi", dataIndex: "lesson_count" },
            {
              title: "Status",
              dataIndex: "status",
              render: (status: Course["status"]) => (
                <Tag color={status === "published" ? "success" : "default"}>
                  {COURSE_STATUS_LABELS[status]}
                </Tag>
              ),
            },
          ]}
        />
      )}
      <Modal
        title="Buat kelas"
        open={creating}
        onCancel={() => setCreating(false)}
        footer={null}
        destroyOnHidden
        width={760}
      >
        <CourseForm
          onSave={async (input) => {
            const course = await createCourse(input);
            navigate(`/courses/${course.id}?section=lessons`);
          }}
        />
      </Modal>
    </main>
  );
}
