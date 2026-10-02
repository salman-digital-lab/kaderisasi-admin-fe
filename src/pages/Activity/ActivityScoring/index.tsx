import { useState, type Key, type ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  getScoringEntries,
  getScoringRubric,
  downloadScoring,
  publishScoring,
} from "../../../api/services/scoring";
import type {
  ScoringEntry,
  ScoringRubric,
  ScoringState,
} from "../../../types/services/scoring";
import { usePermissions } from "../../../stores/authStore";
import { actionError } from "../../../utils/action-error";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";
import { ResponsiveTable } from "../../../components/common/Responsive/ResponsiveTable";
import { DIALOG_WIDTH, EMPTY_VALUE } from "../../../theme/tokens";
import RubricEditor from "./RubricEditor";
import ScoreEditor from "./ScoreEditor";
import ExcelImport from "./ExcelImport";
import styles from "./scoring.module.css";

const STATE_META: Record<ScoringState, { label: string; color: string }> = {
  unscored: { label: "Belum dinilai", color: "default" },
  incomplete: { label: "Belum lengkap", color: "gold" },
  complete: { label: "Siap terbit", color: "blue" },
  published: { label: "Terbit", color: "green" },
  changed: { label: "Perubahan belum terbit", color: "orange" },
};

const formatScore = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? EMPTY_VALUE
    : value.toLocaleString("id-ID");

function RubricSummary({ rubric }: { rubric: ScoringRubric }): ReactElement {
  const criteria = rubric.groups.flatMap((group) => group.criteria);
  return (
    <Descriptions
      size="small"
      column={{ xs: 1, md: 3 }}
      items={[
        {
          key: "groups",
          label: "Kelompok",
          children: rubric.groups.map((group) => group.name).join(", "),
        },
        { key: "criteria", label: "Aspek", children: criteria.length },
        {
          key: "grades",
          label: "Indeks",
          children: rubric.grades.length
            ? [...rubric.grades]
                .sort((a, b) => b.minimum - a.minimum)
                .map((grade) => `${grade.label} ≥ ${grade.minimum}`)
                .join(" · ")
            : "Tidak digunakan",
        },
      ]}
    />
  );
}

export default function ActivityScoring({
  activityId,
}: {
  activityId: number;
}): ReactElement {
  const { message } = App.useApp();
  const permissions = usePermissions();
  const canManage = permissions.includes("activities.manage");
  const canEdit = permissions.includes("activity_registrations.manage");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [selected, setSelected] = useState<Key[]>([]);
  const [editor, setEditor] = useState<ScoringEntry>();
  const [rubricOpen, setRubricOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [scoreDirty, setScoreDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
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
  const updated = (text: string): void => {
    message.success(text);
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
    } catch (cause) {
      setFailure(actionError(cause));
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
    } catch (cause) {
      setFailure(
        actionError(
          cause,
          "Unduhan gagal. Coba lagi setelah koneksi tersedia.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!data && loading) return <Skeleton active />;
  if (!data)
    return <LoadErrorAlert title="Penilaian gagal dimuat" onRetry={refresh} />;

  const rubric = data.rubric;
  const selectedEntries = data.results.entries.filter((entry) =>
    selected.includes(entry.registration_id),
  );
  const canPublishSelection =
    selectedEntries.length > 0 &&
    selectedEntries.every((entry) => entry.result?.complete);

  const downloadItems: MenuProps["items"] = [
    ...(canEdit
      ? [
          {
            key: "template",
            label: "Templat Excel untuk impor",
          },
          { type: "divider" as const },
        ]
      : []),
    { key: "draft", label: "Ekspor nilai draf" },
    { key: "published", label: "Ekspor hasil terbit" },
  ];

  const rowActions = (entry: ScoringEntry): MenuProps["items"] => [
    ...(entry.result?.complete
      ? [
          {
            key: "publish",
            label: entry.scoring_data?.published
              ? "Terbitkan ulang"
              : "Terbitkan",
            onClick: () =>
              setConfirmation({ entries: [entry], withdraw: false }),
          },
        ]
      : []),
    ...(entry.scoring_data?.published
      ? [
          {
            key: "withdraw",
            danger: true,
            label: "Tarik hasil",
            onClick: () =>
              setConfirmation({ entries: [entry], withdraw: true }),
          },
        ]
      : []),
  ];

  return (
    <div className={styles.page}>
      <UnsavedChangesGuard dirty={dirty || scoreDirty} includeSearchChanges />
      {error && (
        <Alert
          type="warning"
          showIcon
          title="Data terbaru belum dapat dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      {failure && (
        <Alert type="error" showIcon title={failure} role="alert" closable />
      )}

      {!rubric ? (
        <Card title="Langkah 1 · Susun rubrik penilaian">
          {canManage ? (
            <RubricEditor
              activityId={activityId}
              rubric={null}
              canManage={canManage}
              onDirty={setDirty}
              onSaved={() =>
                updated("Rubrik tersimpan. Anda dapat mulai mengisi nilai.")
              }
            />
          ) : (
            <Empty description="Rubrik belum disusun oleh pengelola kegiatan." />
          )}
        </Card>
      ) : (
        <>
          <Card
            size="small"
            title="Rubrik penilaian"
            extra={
              <Button
                icon={<EditOutlined />}
                onClick={() => setRubricOpen(true)}
              >
                {canManage && !rubric.locked ? "Ubah rubrik" : "Lihat rubrik"}
              </Button>
            }
          >
            <RubricSummary rubric={rubric} />
            {rubric.locked && (
              <Typography.Text type="secondary">
                Rubrik terkunci karena nilai sudah diisi.
              </Typography.Text>
            )}
          </Card>

          <Card
            title="Nilai peserta"
            extra={
              <Space wrap>
                {canEdit && (
                  <ExcelImport
                    activityId={activityId}
                    rubric={rubric}
                    onSaved={() => updated("Impor tersimpan sebagai draf.")}
                  />
                )}
                <Dropdown
                  trigger={["click"]}
                  disabled={busy}
                  menu={{
                    items: downloadItems,
                    onClick: ({ key }) =>
                      void download(key as "template" | "draft" | "published"),
                  }}
                >
                  <Button icon={<DownloadOutlined />} loading={busy}>
                    Unduh
                  </Button>
                </Dropdown>
              </Space>
            }
          >
            <div className={styles.stack}>
              <Typography.Text type="secondary">
                Hasil hanya terlihat oleh peserta setelah diterbitkan. Hasil
                peserta tamu tersedia untuk admin dan ekspor.
              </Typography.Text>
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
                  style={{ width: 260, maxWidth: "100%" }}
                />
                <Select
                  aria-label="Status penilaian"
                  value={state}
                  style={{ minWidth: 220, maxWidth: "100%" }}
                  onChange={(value) => {
                    setState(value);
                    setPage(1);
                    setSelected([]);
                  }}
                  options={[
                    { value: "", label: "Semua status" },
                    ...Object.entries(STATE_META).map(([value, meta]) => ({
                      value,
                      label: meta.label,
                    })),
                  ]}
                />
              </div>
              {canEdit && selected.length > 0 && (
                <Alert
                  type="info"
                  title={
                    <Space wrap>
                      <span>{selected.length} peserta dipilih</span>
                      <Button
                        type="primary"
                        size="small"
                        disabled={!canPublishSelection || busy}
                        onClick={() =>
                          setConfirmation({
                            entries: selectedEntries,
                            withdraw: false,
                          })
                        }
                      >
                        Terbitkan hasil
                      </Button>
                      <Button size="small" onClick={() => setSelected([])}>
                        Batalkan pilihan
                      </Button>
                    </Space>
                  }
                />
              )}
              <ResponsiveTable<ScoringEntry>
                listId={`activity-scoring-${activityId}`}
                rowKey="registration_id"
                loading={loading}
                dataSource={data.results.entries}
                scroll={{ x: 700 }}
                pagination={{
                  current: page,
                  pageSize: 20,
                  total: data.results.total,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} peserta`,
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
                          "aria-label": `Pilih ${entry.name}`,
                        }),
                      }
                    : undefined
                }
                columns={[
                  { title: "Peserta", dataIndex: "name", width: 220 },
                  {
                    title: "Status",
                    width: 190,
                    render: (_, entry) => {
                      const meta =
                        STATE_META[entry.scoring_data?.state ?? "unscored"];
                      return <Tag color={meta.color}>{meta.label}</Tag>;
                    },
                  },
                  {
                    title: "Total",
                    align: "right",
                    width: 100,
                    render: (_, entry) => formatScore(entry.result?.total),
                  },
                  {
                    title: "Indeks",
                    width: 90,
                    render: (_, entry) => entry.result?.grade ?? EMPTY_VALUE,
                  },
                  {
                    title: "Aksi",
                    width: 170,
                    render: (_, entry) => {
                      const extra = canEdit ? rowActions(entry) : [];
                      return (
                        <Space>
                          <Button size="small" onClick={() => setEditor(entry)}>
                            {canEdit ? "Isi nilai" : "Lihat nilai"}
                          </Button>
                          {extra && extra.length > 0 && (
                            <Dropdown
                              trigger={["click"]}
                              menu={{ items: extra }}
                            >
                              <Button
                                size="small"
                                icon={<MoreOutlined />}
                                aria-label={`Tindakan lain untuk ${entry.name}`}
                              />
                            </Dropdown>
                          )}
                        </Space>
                      );
                    },
                  },
                ]}
                locale={{ emptyText: "Tidak ada peserta yang sesuai" }}
              />
            </div>
          </Card>
        </>
      )}

      {rubric && (
        <Drawer
          title="Rubrik penilaian"
          open={rubricOpen}
          size={DIALOG_WIDTH.medium}
          styles={{ wrapper: { maxWidth: "100vw" } }}
          onClose={() => setRubricOpen(false)}
          destroyOnHidden
          rootClassName={styles.rubric}
        >
          <RubricEditor
            key={rubric.revision}
            activityId={activityId}
            rubric={rubric}
            canManage={canManage}
            onDirty={setDirty}
            onSaved={() => {
              setRubricOpen(false);
              updated("Rubrik tersimpan.");
            }}
          />
        </Drawer>
      )}

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
        okButtonProps={{ danger: confirmation?.withdraw }}
        cancelText="Batal"
      >
        <Typography.Paragraph>
          {confirmation?.withdraw
            ? "Hasil tidak lagi terlihat oleh peserta. Riwayat penerbitan tetap disimpan."
            : "Peserta dengan akun dapat melihat hasil berikut. Perubahan draf berikutnya perlu diterbitkan ulang."}
        </Typography.Paragraph>
        <ul>
          {confirmation?.entries.map((entry) => (
            <li key={entry.registration_id}>
              {entry.name}: {formatScore(entry.result?.total)}{" "}
              {entry.result?.grade}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
