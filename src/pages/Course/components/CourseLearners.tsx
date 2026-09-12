import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Empty, Input, Progress, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getCourseLearners } from "../../../api/services/course";
import { ResponsiveTable } from "../../../components/common/Responsive/ResponsiveTable";
import type { CourseLearner } from "../../../types/model/course";

export default function CourseLearners({
  courseId,
}: {
  courseId: number;
}): ReactElement {
  const [params, setParams] = useState({ search: "", page: 1, per_page: 12 });
  const { data, loading, error, refresh } = useRequest(
    () => getCourseLearners(courseId, params),
    { refreshDeps: [courseId, params] },
  );
  return (
    <section className="course-panel" aria-labelledby="course-learners-title">
      <header className="course-section-header">
        <div>
          <Typography.Title
            id="course-learners-title"
            level={3}
            style={{ fontSize: 20 }}
          >
            Progres peserta
          </Typography.Title>
          <p>
            {data
              ? `${data.meta.total} peserta${params.search ? " sesuai pencarian" : " sudah mulai belajar"}`
              : "Lihat perkembangan belajar peserta kelas ini."}
          </p>
        </div>
        <Button
          icon={<ReloadOutlined aria-hidden />}
          onClick={refresh}
          loading={loading}
        >
          Muat ulang progres
        </Button>
      </header>
      <Typography.Paragraph type="secondary">
        Peserta muncul setelah membuka materi. Progres dihitung dari materi yang
        masih tersedia.
      </Typography.Paragraph>
      <div className="course-filters">
        <Input.Search
          aria-label="Cari peserta kelas"
          placeholder="Nama atau nomor anggota"
          allowClear
          maxLength={200}
          className="course-search"
          onSearch={(search) =>
            setParams((old) => ({ ...old, search, page: 1 }))
          }
        />
      </div>
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Progres peserta gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : (
        <ResponsiveTable<CourseLearner>
          listId="course-learners"
          rowKey="user_id"
          loading={loading}
          dataSource={data?.data ?? []}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  params.search
                    ? "Tidak ada peserta yang sesuai pencarian."
                    : "Belum ada peserta yang membuka materi."
                }
              />
            ),
          }}
          pagination={{
            current: params.page,
            pageSize: params.per_page,
            total: data?.meta.total ?? 0,
            showTotal: (total) => `${total} peserta`,
            showSizeChanger: true,
            pageSizeOptions: [12, 24, 48],
            onChange: (page, per_page) =>
              setParams((old) => ({ ...old, page, per_page })),
          }}
          columns={[
            { title: "Nama", dataIndex: "name" },
            {
              title: "Nomor anggota",
              dataIndex: "member_id",
              render: (value: string | null) => value ?? "Belum tersedia",
            },
            {
              title: "Progres",
              key: "progress",
              render: (_, row) => (
                <div style={{ minWidth: 150 }}>
                  <Typography.Text>
                    {row.completed_lessons} / {row.total_lessons} materi
                  </Typography.Text>
                  <Progress
                    percent={
                      row.total_lessons
                        ? Math.round(
                            (row.completed_lessons / row.total_lessons) * 100,
                          )
                        : 0
                    }
                  />
                </div>
              ),
            },
            {
              title: "Mulai belajar",
              dataIndex: "started_at",
              render: (value: string) =>
                dayjs(value).format("DD MMM YYYY HH:mm"),
            },
            {
              title: "Aktivitas terakhir",
              dataIndex: "last_activity_at",
              render: (value: string) =>
                dayjs(value).format("DD MMM YYYY HH:mm"),
            },
          ]}
        />
      )}
    </section>
  );
}
