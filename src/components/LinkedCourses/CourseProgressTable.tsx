import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Input, Select, Space, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { ResponsiveTable } from "../common/Responsive/ResponsiveTable";
import {
  getCoursePeople,
  exportCoursePeople,
  type CourseOwner,
  type CoursePerson,
  type ProgressFilters,
} from "../../api/services/linked-course";
import { COURSE_PROGRESS_LABELS } from "../../types/model/activity-course";
import {
  ACTIVITY_REGISTRANT_STATUS_OPTIONS,
  CLUB_REGISTRATION_STATUS_OPTIONS,
} from "../../constants/options";
import { actionError } from "../../utils/action-error";

export default function CourseProgressTable({
  kind,
  ownerId,
  revision,
  canExport,
}: {
  kind: CourseOwner;
  ownerId: number;
  revision: number;
  canExport: boolean;
}): ReactElement {
  const [filters, setFilters] = useState<ProgressFilters>({
    page: 1,
    per_page: 20,
  });
  const preferenceKey = `course-progress-columns:${kind}:${ownerId}`;
  const [hiddenColumns, setHiddenColumns] = useState<number[]>(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(preferenceKey) ?? "[]",
      );
      return Array.isArray(value)
        ? value.filter((id): id is number => typeof id === "number")
        : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, refresh } = useRequest(
    () => getCoursePeople(kind, ownerId, filters),
    { refreshDeps: [kind, ownerId, filters, revision] },
  );
  const filter = (next: Partial<ProgressFilters>): void =>
    setFilters((old) => ({ ...old, ...next, page: 1 }));
  const download = async (): Promise<void> => {
    setExporting(true);
    try {
      const blob = await exportCoursePeople(kind, ownerId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Progres-kelas-${kind}-${ownerId}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      void message.error(actionError(cause));
    } finally {
      setExporting(false);
    }
  };
  const columns: ColumnsType<CoursePerson> = [
    {
      title: "Nama Lengkap",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (name: string, row) => name || row.email || "Tanpa nama",
    },
    { title: "Email", dataIndex: "email", key: "email", width: 240 },
    {
      title: "Status Pendaftaran",
      dataIndex: "registration_status",
      render: (status: string) =>
        (kind === "activity"
          ? ACTIVITY_REGISTRANT_STATUS_OPTIONS
          : CLUB_REGISTRATION_STATUS_OPTIONS
        ).find((option) => option.value === status)?.label ?? status,
      key: "registration_status",
      width: 180,
    },
    ...(data?.courses ?? [])
      .filter((course) => !hiddenColumns.includes(course.id))
      .map((course) => ({
        title: `${course.title} (#${course.id})`,
        key: `course_${course.id}`,
        width: 260,
        render: (_: unknown, row: CoursePerson): ReactElement => {
          const progress = row.course_progress.find(
            (item) => item.course_id === course.id,
          );
          return (
            <Typography.Text>
              {progress
                ? `${COURSE_PROGRESS_LABELS[progress.status]}${progress.status === "unverifiable" ? "" : ` · ${progress.completed_lessons}/${progress.total_lessons} materi`}`
                : "Progres tidak tersedia"}
            </Typography.Text>
          );
        },
      })),
  ];
  return (
    <section
      aria-labelledby="course-progress-title"
      style={{ marginBlock: 24 }}
    >
      <Typography.Title level={4} id="course-progress-title">
        Progres kelas pendaftar
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {kind === "club"
          ? "Mencakup seluruh pendaftar, termasuk anggota yang disetujui. "
          : ""}
        Progres mengikuti materi yang masih tersedia. Penambahan atau
        penghapusan materi dan perubahan tanda selesai dapat mengubah status.
        Filter semua kelas memeriksa penyelesaian seluruh kelas terkait.
      </Typography.Paragraph>
      <Space wrap style={{ marginBottom: 16, width: "100%" }}>
        <Button
          icon={<ReloadOutlined />}
          aria-label="Muat ulang progres"
          loading={loading}
          onClick={refresh}
        >
          Muat ulang
        </Button>
        {canExport && Boolean(data?.courses.length) && (
          <Button
            aria-label="Ekspor semua peserta"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={() => void download()}
          >
            Ekspor semua peserta
          </Button>
        )}
      </Space>
      {error ? (
        <Alert
          type="error"
          title="Progres kelas gagal dimuat"
          description={actionError(error)}
          action={
            <Space wrap>
              <Button onClick={refresh}>Coba lagi</Button>
              <Button
                onClick={() => {
                  setSearch("");
                  setFilters({ page: 1, per_page: 20 });
                }}
              >
                Reset filter
              </Button>
            </Space>
          }
        />
      ) : (
        <>
          {data?.courses.length === 0 ? (
            <Alert
              type="info"
              title="Belum ada kelas terkait"
              description="Pilih kelas di atas untuk melihat progres pendaftar."
            />
          ) : (
            <>
              <Space wrap style={{ marginBottom: 16, width: "100%" }}>
                <Input.Search
                  aria-label="Cari pendaftar kelas"
                  placeholder="Cari nama atau email"
                  value={search}
                  allowClear
                  onChange={(event) => setSearch(event.target.value)}
                  onSearch={(value) => filter({ search: value })}
                  style={{ width: 240, maxWidth: "100%" }}
                />
                <Select
                  aria-label="Status pendaftaran untuk progres"
                  placeholder="Semua status pendaftaran"
                  allowClear
                  value={filters.status}
                  onChange={(value) => filter({ status: value })}
                  options={
                    kind === "activity"
                      ? ACTIVITY_REGISTRANT_STATUS_OPTIONS
                      : CLUB_REGISTRATION_STATUS_OPTIONS
                  }
                  style={{ width: 220, maxWidth: "100%" }}
                />
                <Select
                  aria-label="Kelas untuk filter progres"
                  placeholder="Semua kelas terkait"
                  allowClear
                  value={filters.course_id}
                  onChange={(value) => filter({ course_id: value })}
                  options={data?.courses.map((course) => ({
                    value: course.id,
                    label: `${course.title} (#${course.id})`,
                  }))}
                  style={{ width: 260, maxWidth: "100%" }}
                />
                <Select
                  aria-label="Penyelesaian kelas"
                  placeholder="Semua progres"
                  allowClear
                  value={filters.course_completion}
                  onChange={(value) => filter({ course_completion: value })}
                  options={[
                    { value: "completed", label: "Selesai" },
                    { value: "incomplete", label: "Belum selesai" },
                    {
                      value: "unverifiable",
                      label: "Tidak dapat diverifikasi",
                    },
                  ]}
                  style={{ width: 240, maxWidth: "100%" }}
                />
              </Space>
              <Typography.Paragraph style={{ marginBottom: 4 }}>
                Kolom kelas yang ditampilkan
              </Typography.Paragraph>
              <Select
                mode="multiple"
                aria-label="Kolom kelas yang ditampilkan"
                placeholder="Pilih kolom kelas"
                maxTagCount="responsive"
                style={{ width: "100%", maxWidth: 520, marginBottom: 16 }}
                value={(data?.courses ?? [])
                  .filter((course) => !hiddenColumns.includes(course.id))
                  .map((course) => course.id)}
                options={data?.courses.map((course) => ({
                  value: course.id,
                  label: `${course.title} (#${course.id})`,
                }))}
                onChange={(ids: number[]) => {
                  const hidden = (data?.courses ?? [])
                    .filter((course) => !ids.includes(course.id))
                    .map((course) => course.id);
                  setHiddenColumns(hidden);
                  try {
                    localStorage.setItem(preferenceKey, JSON.stringify(hidden));
                  } catch {
                    /* Optional column preference. */
                  }
                }}
              />
              <Typography.Paragraph type="secondary">
                Ekspor mencakup semua peserta, terlepas dari filter di layar.
              </Typography.Paragraph>
              <ResponsiveTable<CoursePerson>
                listId={`course-progress-${kind}-${ownerId}`}
                rowKey="id"
                columns={columns}
                dataSource={data?.data ?? []}
                loading={loading}
                scroll={{ x: "max-content" }}
                pagination={{
                  current: filters.page,
                  pageSize: filters.per_page,
                  total: data?.meta.total ?? 0,
                  showSizeChanger: true,
                  onChange: (page, per_page) =>
                    setFilters((old) => ({ ...old, page, per_page })),
                }}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
