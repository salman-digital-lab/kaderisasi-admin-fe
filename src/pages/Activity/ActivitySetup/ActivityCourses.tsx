import { useEffect, useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Select, Space, Typography } from "antd";
import {
  getActivityCourses,
  getActivityCourseOptions,
  saveActivityCourses,
} from "../../../api/services/activity-course";
import type { ActivityCourse } from "../../../types/model/activity-course";
import { COURSE_STATUS_LABELS } from "../../../types/model/course";
import { actionError } from "../../../utils/action-error";

export default function ActivityCourses({
  activityId,
  onDirtyChange,
  onBusyChange,
}: {
  activityId: number;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}): ReactElement {
  const [selected, setSelected] = useState<number[]>([]);
  const [known, setKnown] = useState<Map<number, ActivityCourse>>(new Map());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [optionRows, setOptionRows] = useState<ActivityCourse[]>([]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const {
    data: saved,
    loading,
    error,
    refresh,
    mutate,
  } = useRequest(() => getActivityCourses(activityId), {
    refreshDeps: [activityId],
    onSuccess: (rows) => {
      setSelected(rows.map((row) => row.id));
      setKnown(
        (old) =>
          new Map([
            ...old,
            ...rows.map((row): [number, ActivityCourse] => [row.id, row]),
          ]),
      );
    },
  });
  const {
    data: optionResponse,
    loading: optionsLoading,
    error: optionsError,
    refresh: refreshOptions,
  } = useRequest(
    async () => ({
      result: await getActivityCourseOptions(search, page),
      search,
      page,
    }),
    {
      refreshDeps: [search, page],
      debounceWait: 250,
      onSuccess: ({ result, search: completedSearch, page: completedPage }) => {
        if (completedSearch !== search || completedPage !== page) return;
        setOptionRows((old) =>
          page === 1 ? result.data : [...old, ...result.data],
        );
        setKnown(
          (old) =>
            new Map([
              ...old,
              ...result.data.map((row): [number, ActivityCourse] => [
                row.id,
                row,
              ]),
            ]),
        );
      },
    },
  );
  const options =
    optionResponse?.search === search && optionResponse.page === page
      ? optionResponse.result
      : undefined;
  const dirty =
    saved !== undefined &&
    JSON.stringify(selected) !== JSON.stringify(saved.map((row) => row.id));
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(saving);
  }, [saving, onBusyChange]);
  const save = async (): Promise<void> => {
    setSaving(true);
    setFailure("");
    setSavedMessage("");
    try {
      const rows = await saveActivityCourses(activityId, selected);
      mutate(rows);
      setSavedMessage("Kelas terkait tersimpan");
    } catch (cause) {
      setFailure(actionError(cause));
    } finally {
      setSaving(false);
    }
  };
  const visibleOptions = new Map(optionRows.map((row) => [row.id, row]));
  return (
    <section
      aria-labelledby="activity-courses-title"
      style={{ marginBlock: 24 }}
    >
      <Typography.Title level={4} id="activity-courses-title">
        Kelas online terkait
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Pilih kelas untuk memantau progres pendaftar. Pilihan ini tidak
        membatasi pendaftaran. Progres mengikuti materi yang masih tersedia dan
        dapat berubah ketika materi diperbarui.
      </Typography.Paragraph>
      {error ? (
        <Alert
          type="error"
          title="Kelas terkait gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : (
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Select<number[]>
            mode="multiple"
            aria-label="Kelas online terkait"
            style={{ width: "100%" }}
            placeholder="Cari dan pilih kelas (opsional)"
            value={selected}
            labelRender={({ value }) => {
              const row = known.get(Number(value));
              return row
                ? `${row.title} (#${row.id}) · ${COURSE_STATUS_LABELS[row.status]}`
                : String(value);
            }}
            disabled={loading || saving || saved === undefined}
            loading={loading || optionsLoading}
            allowClear
            showSearch={{
              filterOption: false,
              onSearch: (value) => {
                setSearch(value);
                setPage(1);
                setOptionRows([]);
              },
            }}
            options={[...visibleOptions.values()].map((row) => ({
              value: row.id,
              label: `${row.title} (#${row.id}) · ${COURSE_STATUS_LABELS[row.status]}`,
            }))}
            onChange={(ids) => {
              setSelected(ids);
              setSavedMessage("");
            }}
            notFoundContent={
              optionsLoading
                ? "Memuat kelas…"
                : optionsError
                  ? "Kelas gagal dimuat"
                  : "Tidak ada kelas yang sesuai"
            }
          />
          {optionsError && (
            <Alert
              type="error"
              title="Daftar pilihan kelas gagal dimuat"
              action={<Button onClick={refreshOptions}>Coba lagi</Button>}
            />
          )}
          {options && page < options.meta.last_page && (
            <Button
              disabled={optionsLoading || Boolean(optionsError)}
              onClick={() => setPage((value) => value + 1)}
            >
              Muat pilihan kelas berikutnya
            </Button>
          )}
          {!loading && saved?.length === 0 && !dirty && (
            <Typography.Text type="secondary">
              Belum ada kelas terkait.
            </Typography.Text>
          )}
          {failure && <Alert type="error" title={failure} />}
          {savedMessage && <Alert type="success" title={savedMessage} />}
          <Button
            aria-label="Simpan kelas terkait"
            onClick={() => void save()}
            loading={saving}
            disabled={!dirty || loading}
          >
            Simpan kelas terkait
          </Button>
        </Space>
      )}
    </section>
  );
}
