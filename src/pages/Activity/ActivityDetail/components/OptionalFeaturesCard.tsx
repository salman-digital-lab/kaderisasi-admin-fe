import { useState, type ReactElement, type ReactNode } from "react";
import { App, Button, Card, List, Switch, Tag, Typography } from "antd";
import { ReadOutlined, TrophyOutlined } from "@ant-design/icons";
import type { ActivityOptionalFeature } from "../../../../types/model/activity";
import type { OptionalFeatures } from "../hooks/useOptionalFeatures";
import { actionError } from "../../../../utils/action-error";

type Definition = {
  key: ActivityOptionalFeature;
  tab: string;
  icon: ReactNode;
  title: string;
  description: string;
  disableWarning: string;
};

const DEFINITIONS: Definition[] = [
  {
    key: "scoring",
    tab: "scoring",
    icon: <TrophyOutlined />,
    title: "Penilaian",
    description:
      "Susun rubrik, isi nilai peserta, lalu terbitkan hasil. Nilai terbit dapat dicantumkan pada sertifikat.",
    disableWarning:
      "Hasil yang sudah terbit tetap terlihat oleh peserta dan tetap dapat dicantumkan pada sertifikat. Tarik hasil terlebih dahulu bila tidak ingin ditampilkan.",
  },
  {
    key: "courses",
    tab: "courses",
    icon: <ReadOutlined />,
    title: "Kelas online",
    description:
      "Hubungkan kelas online untuk memantau progres belajar peserta. Tidak membatasi pendaftaran.",
    disableWarning:
      "Kelas yang sudah terhubung dan riwayat belajar peserta tetap tersimpan.",
  },
];

/** Lets admins choose which optional workspaces an activity uses. */
export default function OptionalFeaturesCard({
  features,
  onOpen,
}: {
  features: OptionalFeatures;
  onOpen: (tab: string) => void;
}): ReactElement | null {
  const { message, modal } = App.useApp();
  const [saving, setSaving] = useState<ActivityOptionalFeature>();
  const items = DEFINITIONS.filter((item) => features[item.key].available);
  if (!items.length) return null;

  const change = async (item: Definition, enabled: boolean): Promise<void> => {
    setSaving(item.key);
    try {
      await features.setEnabled(item.key, enabled);
      if (enabled) {
        message.success(`${item.title} diaktifkan`);
        onOpen(item.tab);
      } else {
        message.success(`${item.title} dinonaktifkan`);
      }
    } catch (cause) {
      message.error(actionError(cause));
    } finally {
      setSaving(undefined);
    }
  };

  const toggle = (item: Definition, enabled: boolean): void => {
    if (enabled) {
      void change(item, true);
      return;
    }
    modal.confirm({
      title: `Nonaktifkan ${item.title.toLowerCase()}?`,
      content: (
        <>
          <Typography.Paragraph>
            Tab {item.title} disembunyikan dari halaman kegiatan ini. Data tidak
            dihapus dan fitur dapat diaktifkan kembali kapan saja.
          </Typography.Paragraph>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {item.disableWarning}
          </Typography.Paragraph>
        </>
      ),
      okText: "Nonaktifkan",
      cancelText: "Batal",
      onOk: () => change(item, false),
    });
  };

  return (
    <Card
      title="Fitur tambahan"
      extra={<Typography.Text type="secondary">Opsional</Typography.Text>}
    >
      <Typography.Paragraph type="secondary">
        Aktifkan hanya fitur yang dibutuhkan kegiatan ini. Fitur yang aktif
        muncul sebagai tab di halaman kegiatan.
      </Typography.Paragraph>
      <List
        dataSource={items}
        renderItem={(item) => {
          const state = features[item.key];
          const switchId = `feature-${item.key}`;
          return (
            <List.Item
              actions={[
                state.enabled && (
                  <Button
                    key="open"
                    type="link"
                    onClick={() => onOpen(item.tab)}
                  >
                    Buka
                  </Button>
                ),
                features.canManage ? (
                  <Switch
                    key="toggle"
                    id={switchId}
                    aria-label={`Aktifkan ${item.title.toLowerCase()}`}
                    checked={state.enabled}
                    loading={saving === item.key || features.loading}
                    disabled={Boolean(saving) || features.loading}
                    onChange={(checked) => toggle(item, checked)}
                  />
                ) : (
                  <Tag
                    key="status"
                    color={state.enabled ? "success" : "default"}
                  >
                    {state.enabled ? "Aktif" : "Nonaktif"}
                  </Tag>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <span
                    aria-hidden
                    style={{
                      fontSize: 20,
                      color: state.enabled
                        ? "var(--app-color-primary)"
                        : "var(--app-color-text-secondary)",
                    }}
                  >
                    {item.icon}
                  </span>
                }
                title={
                  features.canManage ? (
                    <label htmlFor={switchId}>{item.title}</label>
                  ) : (
                    item.title
                  )
                }
                description={
                  <>
                    {item.description}
                    {state.enabled && state.summary && (
                      <div>
                        <Typography.Text type="secondary">
                          Status: {state.summary}
                        </Typography.Text>
                      </div>
                    )}
                  </>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
