import {
  LockOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Divider,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  assignCertificateTemplate,
  getTemplateLock,
  getTemplateSummaries,
  setTemplateLock,
} from "../../../../api/services/certificateWorkflow";
import type {
  TemplateLockState,
  TemplateSummary,
} from "../../../../types/services/certificateWorkflow";
import { formatDateTime } from "../../../../utils/date-format";
import { CertificateSettingsSummary } from "../../ActivityCertificates/CertificateSettingsSummary";

const ERRORS: Record<string, string> = {
  CERTIFICATE_TEMPLATE_LOCK_IN_USE:
    "Template tidak dapat dibuka karena sertifikat sudah diterbitkan.",
  CERTIFICATE_TEMPLATE_LOCKED:
    "Template sudah dikunci. Muat ulang halaman untuk melihat pilihan terbaru.",
  CERTIFICATE_TEMPLATE_NOT_READY:
    "Template belum siap. Publikasikan desain yang lengkap terlebih dahulu.",
  NO_CERTIFICATE_TEMPLATE: "Pilih template sebelum mengunci.",
};

function errorMessage(cause: unknown, fallback: string): string {
  const code = isAxiosError(cause)
    ? (cause.response?.data as { message?: string } | undefined)?.message
    : undefined;
  return ERRORS[code ?? ""] ?? fallback;
}

type Props = {
  activityId: number;
  canManage: boolean;
};

const CertificateTemplateCard = ({ activityId, canManage }: Props) => {
  const navigate = useNavigate();
  const [state, setState] = useState<TemplateLockState>();
  const [loadError, setLoadError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<TemplateSummary[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    getTemplateLock(activityId, controller.signal)
      .then((data) => {
        setState(data);
        setSelectedId(data.template?.id ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [activityId, refresh]);

  const locked = state?.locked === true;
  useEffect(() => {
    if (!state || locked || !canManage) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setOptionsLoading(true);
      getTemplateSummaries(
        { page: 1, search: search.trim() || undefined },
        controller.signal,
      )
        .then((data) => setOptions(data.data))
        .catch(() => {
          if (!controller.signal.aborted)
            message.error("Daftar template tidak dapat dimuat.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setOptionsLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [state, locked, canManage, search]);

  // Keep the saved template visible even when it is not on the first page.
  const choices =
    state?.template && !options.some((item) => item.id === state.template?.id)
      ? [state.template, ...options]
      : options;
  const selected = choices.find((item) => item.id === selectedId);
  const selectedReady =
    selected?.status === "published" && selected.readiness?.ready === true;

  async function lock(): Promise<void> {
    if (!selectedId) return;
    setBusy(true);
    try {
      if (selectedId !== state?.template?.id)
        await assignCertificateTemplate(activityId, selectedId);
      setState(await setTemplateLock(activityId, true));
      message.success("Template sertifikat dikunci.");
    } catch (cause) {
      message.error(errorMessage(cause, "Template belum berhasil dikunci."));
      setRefresh((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  async function unlock(): Promise<void> {
    setBusy(true);
    try {
      setState(await setTemplateLock(activityId, false));
      message.success("Kunci template dibuka.");
    } catch (cause) {
      message.error(
        errorMessage(cause, "Kunci template belum berhasil dibuka."),
      );
      setRefresh((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  let body: React.ReactNode;
  if (loadError) {
    body = (
      <Alert
        type="error"
        showIcon
        title="Template sertifikat tidak dapat dimuat."
        action={
          <Button onClick={() => setRefresh((value) => value + 1)}>
            Coba lagi
          </Button>
        }
      />
    );
  } else if (!state) {
    body = <Skeleton active paragraph={{ rows: 2 }} />;
  } else if (locked) {
    const published = state.published_count;
    body = (
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Space wrap>
          <Typography.Text strong>
            {state.template?.name ?? "Template tidak ditemukan"}
          </Typography.Text>
          <Tag icon={<LockOutlined />} color="blue">
            Terkunci
          </Tag>
        </Space>
        <Typography.Text type="secondary">
          {published > 0
            ? `${published} sertifikat sudah terbit, sehingga template tidak dapat diganti.`
            : `Dikunci pada ${formatDateTime(state.locked_at)}. Kunci dapat dibuka selama belum ada sertifikat yang terbit.`}
        </Typography.Text>
        <Space wrap>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={() =>
              navigate(
                `/activity/${activityId}/participants?publish=certificates`,
              )
            }
          >
            Terbitkan sertifikat
          </Button>
          {canManage && (
            <Popconfirm
              title="Buka kunci template?"
              description="Template dapat diganti dan sertifikat tidak dapat diterbitkan sampai dikunci kembali."
              okText="Buka kunci"
              cancelText="Batal"
              disabled={published > 0}
              onConfirm={unlock}
            >
              <Button
                icon={<UnlockOutlined />}
                disabled={published > 0}
                loading={busy}
              >
                Buka kunci
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Space>
    );
  } else {
    body = (
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          Pilih template, lalu kunci sebelum menerbitkan sertifikat. Setelah
          sertifikat terbit, template tidak dapat diganti.
        </Typography.Text>
        <Space wrap style={{ width: "100%" }}>
          <Select
            aria-label="Template sertifikat"
            placeholder="Pilih template sertifikat"
            style={{ width: 360, maxWidth: "100%" }}
            showSearch={{ filterOption: false, onSearch: setSearch }}
            allowClear
            disabled={!canManage || busy}
            loading={optionsLoading}
            value={selectedId ?? undefined}
            onChange={(value?: number) => setSelectedId(value ?? null)}
            notFoundContent={
              optionsLoading ? null : "Belum ada desain yang dipublikasikan."
            }
            options={choices.map((item) => ({
              value: item.id,
              label: item.name,
              disabled:
                item.status !== "published" || item.readiness?.ready !== true,
            }))}
          />
          {canManage && (
            <Popconfirm
              title="Kunci template ini?"
              description="Kunci tidak dapat dibuka lagi setelah ada sertifikat yang terbit."
              okText="Kunci"
              cancelText="Batal"
              disabled={!selectedReady}
              onConfirm={lock}
            >
              <Button
                type="primary"
                icon={<LockOutlined />}
                disabled={!selectedReady}
                loading={busy}
              >
                Kunci template
              </Button>
            </Popconfirm>
          )}
        </Space>
        {!canManage && (
          <Typography.Text type="secondary">
            Pemilihan template memerlukan akses pengelolaan template.
          </Typography.Text>
        )}
      </Space>
    );
  }

  return (
    <Card style={{ marginBottom: 24 }} title="Sertifikat kegiatan">
      {body}
      {state && !loadError && (
        <>
          <Divider />
          <CertificateSettingsSummary
            activityId={activityId}
            canManage={canManage}
          />
        </>
      )}
    </Card>
  );
};

export default CertificateTemplateCard;
