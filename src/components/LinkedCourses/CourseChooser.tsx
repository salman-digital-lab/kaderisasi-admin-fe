import { useEffect, useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  List,
  Pagination,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ResponsiveDialog } from "../common/Responsive/ResponsiveDialog";
import {
  getLinkedCourseOptions,
  saveLinkedCourses,
  type CourseOwner,
} from "../../api/services/linked-course";
import type { ActivityCourse } from "../../types/model/activity-course";
import {
  COURSE_LEVEL_OPTIONS,
  COURSE_STATUS_LABELS,
} from "../../types/model/course";
import { actionError } from "../../utils/action-error";

export function CourseDetails({
  course,
}: {
  course: ActivityCourse;
}): ReactElement {
  return (
    <Space orientation="vertical" size={4} style={{ width: "100%" }}>
      <Typography.Text strong style={{ overflowWrap: "anywhere" }}>
        {course.title} (#{course.id})
      </Typography.Text>
      <Space wrap size="small">
        <Tag>{COURSE_STATUS_LABELS[course.status]}</Tag>
        <Typography.Text type="secondary">
          {course.lesson_count} materi
        </Typography.Text>
        <Typography.Text type="secondary">
          Jenjang minimum:{" "}
          {COURSE_LEVEL_OPTIONS.find(
            (level) => level.value === course.minimum_level,
          )?.label ?? "—"}
        </Typography.Text>
      </Space>
      <Typography.Paragraph
        type="secondary"
        style={{ marginBottom: 0, overflowWrap: "anywhere" }}
      >
        {course.summary || "Belum ada ringkasan kelas."}
      </Typography.Paragraph>
    </Space>
  );
}
export default function CourseChooser({
  kind,
  ownerId,
  initial,
  onClose,
  onSaved,
  onDirtyChange,
  onBusyChange,
}: {
  kind: CourseOwner;
  ownerId: number;
  initial: ActivityCourse[];
  onClose: () => void;
  onSaved: (rows: ActivityCourse[]) => void;
  onDirtyChange: (value: boolean) => void;
  onBusyChange: (value: boolean) => void;
}): ReactElement {
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const dirty =
    JSON.stringify(selected.map((row) => row.id)) !==
    JSON.stringify(initial.map((row) => row.id));
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(saving);
    return () => onBusyChange(false);
  }, [saving, onBusyChange]);
  const { data, loading, error, refresh } = useRequest(
    async () => ({
      result: await getLinkedCourseOptions(kind, search, page),
      search,
      page,
    }),
    { refreshDeps: [kind, search, page], debounceWait: 250 },
  );
  const current =
    data?.search === search && data.page === page ? data.result : undefined;
  const save = async (): Promise<void> => {
    setSaving(true);
    setFailure("");
    try {
      const rows = await saveLinkedCourses(
        kind,
        ownerId,
        selected.map((row) => row.id),
      );
      onSaved(rows);
    } catch (cause) {
      setFailure(actionError(cause));
    } finally {
      setSaving(false);
    }
  };
  return (
    <ResponsiveDialog
      open
      title="Pilih kelas online terkait"
      width={800}
      onCancel={() => {
        if (!saving) onClose();
      }}
      maskClosable={false}
      closable={!saving}
      footer={
        <Space wrap>
          <Typography.Text>{selected.length} kelas dipilih</Typography.Text>
          <Button onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            type="primary"
            aria-label="Simpan kelas terkait"
            loading={saving}
            disabled={!dirty || loading}
            onClick={() => void save()}
          >
            Simpan kelas terkait
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph>
        Pilih kelas untuk dipantau. Urutan pilihan menjadi urutan kolom progres.
        Menghapus pilihan tidak menghapus riwayat belajar.
      </Typography.Paragraph>
      <Input.Search
        aria-label="Cari kelas online"
        placeholder="Cari judul kelas"
        allowClear
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        style={{ marginBottom: 16 }}
      />
      {failure && (
        <Alert type="error" title={failure} style={{ marginBottom: 12 }} />
      )}
      {error ? (
        <Alert
          type="error"
          title="Daftar kelas gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : loading || !current ? (
        <Spin aria-label="Memuat kelas" />
      ) : (
        <>
          <List
            dataSource={current.data}
            locale={{ emptyText: "Tidak ada kelas yang sesuai" }}
            renderItem={(course) => (
              <List.Item key={course.id}>
                <Space align="start" size="middle" style={{ width: "100%" }}>
                  <Checkbox
                    aria-label={`Pilih ${course.title} (#${course.id})`}
                    checked={selected.some((row) => row.id === course.id)}
                    disabled={saving}
                    onChange={(event) =>
                      setSelected((rows) =>
                        event.target.checked
                          ? [...rows, course]
                          : rows.filter((row) => row.id !== course.id),
                      )
                    }
                  />
                  <CourseDetails course={course} />
                </Space>
              </List.Item>
            )}
          />
          <Pagination
            current={page}
            pageSize={10}
            total={current.meta.total}
            showSizeChanger={false}
            onChange={setPage}
            simple
            style={{ marginBlock: 16 }}
          />
        </>
      )}
      {selected.length > 0 && (
        <>
          <Typography.Title level={5}>
            Kelas dipilih ({selected.length})
          </Typography.Title>
          <List
            size="small"
            dataSource={selected}
            renderItem={(course, index) => (
              <List.Item key={course.id}>
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Typography.Text style={{ overflowWrap: "anywhere" }}>
                    {index + 1}. {course.title} (#{course.id})
                  </Typography.Text>
                  <Space wrap>
                    <Button
                      size="small"
                      disabled={saving || index === 0}
                      aria-label={`Naikkan ${course.title}`}
                      onClick={() =>
                        setSelected((rows) => {
                          const next = [...rows];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          return next;
                        })
                      }
                    >
                      Naik
                    </Button>
                    <Button
                      size="small"
                      disabled={saving || index === selected.length - 1}
                      aria-label={`Turunkan ${course.title}`}
                      onClick={() =>
                        setSelected((rows) => {
                          const next = [...rows];
                          [next[index + 1], next[index]] = [
                            next[index],
                            next[index + 1],
                          ];
                          return next;
                        })
                      }
                    >
                      Turun
                    </Button>
                    <Button
                      size="small"
                      disabled={saving}
                      onClick={() =>
                        setSelected((rows) =>
                          rows.filter((row) => row.id !== course.id),
                        )
                      }
                    >
                      Hapus pilihan
                    </Button>
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </>
      )}
    </ResponsiveDialog>
  );
}
