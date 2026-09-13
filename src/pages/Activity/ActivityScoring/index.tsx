import { useState, type Key, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  getScoringEntries,
  getScoringRubric,
  downloadScoring,
  publishScoring,
} from "../../../api/services/scoring";
import type {
  ScoringEntry,
  ScoringState,
} from "../../../types/services/scoring";
import { usePermissions } from "../../../stores/authStore";
import { actionError } from "../../../utils/action-error";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import RubricEditor from "./RubricEditor";
import ScoreEditor from "./ScoreEditor";
import ExcelImport from "./ExcelImport";
import styles from "./scoring.module.css";

const stateLabels: Record<ScoringState, string> = {
  unscored: "Belum dinilai",
  incomplete: "Belum lengkap",
  complete: "Siap terbit",
  published: "Terbit",
  changed: "Perubahan belum terbit",
};
export default function ActivityScoring({
  activityId,
}: {
  activityId: number;
}): ReactElement {
  const permissions = usePermissions();
  const canManage = permissions.includes("activities.manage");
  const canEdit = permissions.includes("activities.registration.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [selected, setSelected] = useState<Key[]>([]);
  const [editor, setEditor] = useState<ScoringEntry>();
  const [dirty, setDirty] = useState(false);
  const [scoreDirty, setScoreDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmation, setConfirmation] = useState<{
    entries: ScoringEntry[];
    withdraw: boolean;
  }>();
  const { data, error, loading, refresh } = useRequest(
    async () => {
      const [rubric, results] = await Promise.all([
        getScoringRubric(activityId),
        getScoringEntries(activityId, { page, per_page: 20, search, state }),
      ]);
      return { rubric, results };
    },
    { refreshDeps: [activityId, page, search, state] },
  );
  const updated = (message: string): void => {
    setSuccess(message);
    setFailure("");
    setSelected([]);
    refresh();
  };
  const publish = async (): Promise<void> => {
    if (!confirmation || !data?.rubric) return;
    setBusy(true);
    setFailure("");
    try {
      await publishScoring(
        activityId,
        {
          rubric_revision: data.rubric.revision,
          selections: confirmation.entries.map((entry) => ({
            registration_id: entry.registration_id,
            revision: entry.scoring_data?.revision ?? 0,
          })),
        },
        confirmation.withdraw,
      );
      updated(
        confirmation.withdraw
          ? "Hasil ditarik dari tampilan peserta."
          : "Hasil penilaian diterbitkan.",
      );
    } catch (error) {
      setFailure(actionError(error));
    } finally {
      setBusy(false);
      setConfirmation(undefined);
    }
  };
  const download = async (
    mode: "template" | "draft" | "published",
  ): Promise<void> => {
    setBusy(true);
    setFailure("");
    try {
      await downloadScoring(activityId, mode);
    } catch (error) {
      setFailure(
        actionError(
          error,
          "Unduhan gagal. Coba lagi setelah koneksi tersedia.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  if (!data && loading) return <Skeleton active />;
  if (!data)
    return (
      <Alert
        type="error"
        title="Penilaian gagal dimuat"
        action={<Button onClick={refresh}>Coba lagi</Button>}
      />
    );
  const rubric = data.rubric;
  const selectedEntries = data.results.entries.filter((entry) =>
    selected.includes(entry.registration_id),
  );
  return (
    <div className={styles.page}>
      <UnsavedChangesGuard dirty={dirty || scoreDirty} includeSearchChanges />
      <Typography.Title level={4}>Penilaian kegiatan</Typography.Title>
      {error && (
        <Alert
          type="error"
          title="Pembaruan data gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      {failure && <Alert type="error" title={failure} role="alert" />}
      {success && (
        <Alert type="success" title={success} role="status" closable />
      )}
      <Tabs
        defaultActiveKey={rubric ? "scores" : "rubric"}
        items={[
          {
            key: "rubric",
            label: "Rubrik penilaian",
            children: (
              <RubricEditor
                key={rubric?.revision ?? 0}
                activityId={activityId}
                rubric={rubric}
                canManage={canManage}
                onDirty={setDirty}
                onSaved={() => updated("Rubrik tersimpan.")}
              />
            ),
          },
          {
            key: "scores",
            label: "Nilai peserta",
            disabled: !rubric,
            children: rubric && (
              <div className={styles.stack}>
                <Typography.Paragraph>
                  Hasil hanya terlihat oleh peserta setelah diterbitkan. Hasil
                  peserta tamu tersedia untuk admin dan ekspor.
                </Typography.Paragraph>
                <div className={styles.actions}>
                  <Input.Search
                    aria-label="Cari peserta penilaian"
                    placeholder="Cari peserta"
                    allowClear
                    onSearch={(value) => {
                      setPage(1);
                      setSelected([]);
                      setSearch(value);
                    }}
                    style={{ width: 260 }}
                  />
                  <Select
                    aria-label="Status penilaian"
                    value={state}
                    style={{ minWidth: 220 }}
                    onChange={(value) => {
                      setState(value);
                      setPage(1);
                      setSelected([]);
                    }}
                    options={[
                      { value: "", label: "Semua status" },
                      ...Object.entries(stateLabels).map(([value, label]) => ({
                        value,
                        label,
                      })),
                    ]}
                  />
                </div>
                <div className={styles.actions}>
                  {canEdit && (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() => void download("template")}
                      >
                        Unduh templat Excel
                      </Button>
                      <ExcelImport
                        activityId={activityId}
                        rubric={rubric}
                        onSaved={() => updated("Impor tersimpan sebagai draf.")}
                      />
                    </>
                  )}
                  <Button
                    disabled={busy}
                    onClick={() => void download("draft")}
                  >
                    Ekspor draf
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void download("published")}
                  >
                    Ekspor hasil terbit
                  </Button>
                </div>
                {canEdit && (
                  <div className={styles.actions}>
                    <Button
                      type="primary"
                      disabled={
                        !selectedEntries.length ||
                        busy ||
                        selectedEntries.some((entry) => !entry.result?.complete)
                      }
                      onClick={() =>
                        setConfirmation({
                          entries: selectedEntries,
                          withdraw: false,
                        })
                      }
                    >
                      Terbitkan pilihan ({selected.length})
                    </Button>
                    <Typography.Text type="secondary">
                      Pilih peserta dengan nilai lengkap pada halaman ini.
                    </Typography.Text>
                  </div>
                )}
                <Table<ScoringEntry>
                  rowKey="registration_id"
                  loading={loading}
                  dataSource={data.results.entries}
                  scroll={{ x: 700 }}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: data.results.total,
                    showSizeChanger: false,
                    onChange: (value) => {
                      setPage(value);
                      setSelected([]);
                    },
                  }}
                  rowSelection={
                    canEdit
                      ? {
                          selectedRowKeys: selected,
                          onChange: setSelected,
                          getCheckboxProps: (entry) => ({
                            disabled: !entry.result?.complete,
                          }),
                        }
                      : undefined
                  }
                  columns={[
                    { title: "Peserta", dataIndex: "name", width: 200 },
                    {
                      title: "Status",
                      render: (_, entry) => (
                        <Tag
                          color={
                            entry.scoring_data?.state === "published"
                              ? "green"
                              : "default"
                          }
                        >
                          {stateLabels[entry.scoring_data?.state ?? "unscored"]}
                        </Tag>
                      ),
                    },
                    {
                      title: "Total draf",
                      render: (_, entry) =>
                        entry.result?.total?.toLocaleString("id-ID") ??
                        "Belum lengkap",
                    },
                    {
                      title: "Indeks",
                      render: (_, entry) => entry.result?.grade ?? "Tidak ada",
                    },
                    {
                      title: "Tindakan",
                      render: (_, entry) => (
                        <Space wrap>
                          <Button onClick={() => setEditor(entry)}>
                            {canEdit ? "Isi nilai" : "Lihat nilai"}
                          </Button>
                          {canEdit && entry.result?.complete && (
                            <Button
                              onClick={() =>
                                setConfirmation({
                                  entries: [entry],
                                  withdraw: false,
                                })
                              }
                            >
                              {entry.scoring_data?.published
                                ? "Terbitkan ulang"
                                : "Terbitkan"}
                            </Button>
                          )}
                          {canEdit && entry.scoring_data?.published && (
                            <Button
                              danger
                              onClick={() =>
                                setConfirmation({
                                  entries: [entry],
                                  withdraw: true,
                                })
                              }
                            >
                              Tarik hasil
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                  locale={{ emptyText: "Tidak ada peserta yang sesuai" }}
                />
              </div>
            ),
          },
        ]}
      />
      {editor && rubric && (
        <ScoreEditor
          key={editor.registration_id}
          activityId={activityId}
          entry={editor}
          rubric={rubric}
          canEdit={canEdit}
          onDirty={setScoreDirty}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            updated("Draf nilai tersimpan. Terbitkan jika sudah siap.");
          }}
        />
      )}
      <Modal
        open={!!confirmation}
        title={
          confirmation?.withdraw
            ? "Tarik hasil penilaian?"
            : "Terbitkan hasil penilaian?"
        }
        confirmLoading={busy}
        onOk={() => void publish()}
        onCancel={() => {
          if (!busy) setConfirmation(undefined);
        }}
        okText={confirmation?.withdraw ? "Tarik hasil" : "Terbitkan"}
        cancelText="Batal"
      >
        <p>
          {confirmation?.withdraw
            ? "Hasil tidak lagi terlihat oleh peserta. Riwayat penerbitan tetap disimpan."
            : "Peserta dengan akun dapat melihat hasil berikut. Perubahan draf berikutnya perlu diterbitkan ulang."}
        </p>
        <ul>
          {confirmation?.entries.map((entry) => (
            <li key={entry.registration_id}>
              {entry.name}: {entry.result?.total?.toLocaleString("id-ID")}{" "}
              {entry.result?.grade}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
