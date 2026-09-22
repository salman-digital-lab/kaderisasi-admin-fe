import { useEffect, useRef, useState, type ReactElement } from "react";
import { Alert, Button, Form, Modal, Steps, Typography } from "antd";
import axios from "../../api/axios";
import MessageFields from "./MessageFields";
import AudienceFields from "./AudienceFields";
import AnnouncementMessage from "./AnnouncementMessage";
import {
  emptyAudience,
  type Announcement,
  type AnnouncementInput,
  type Preview,
} from "./types";
import styles from "./Composer.module.css";

const messageFields = ["title", "body", "link_label", "link_url"];

export default function AnnouncementComposer({
  initial,
  onClose,
  onSaved,
  onPublished,
}: {
  initial: Announcement | "new";
  onClose: () => void;
  onSaved: () => void;
  onPublished: (record: Announcement) => void;
}): ReactElement {
  const [form] = Form.useForm<AnnouncementInput>();
  const [modal, context] = Modal.useModal();
  const [record, setRecord] = useState(initial);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const title = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    record: Announcement;
    counts: Preview;
  }>();
  const [values] = useState<AnnouncementInput>(() => {
    if (initial === "new")
      return {
        title: "",
        body: "",
        link_label: null,
        link_url: null,
        version: 1,
        audience: structuredClone(emptyAudience),
      };
    return {
      title: initial.title,
      body: initial.body,
      link_label: initial.link_label,
      link_url: initial.link_url,
      version: initial.version,
      audience: {
        ...initial.audience,
        member_ids: initial.audience.member_ids ?? [],
        activity_ids: initial.audience.activity_ids ?? [],
        activity_statuses: initial.audience.activity_statuses ?? [],
        club_ids: initial.audience.club_ids ?? [],
        club_statuses: initial.audience.club_statuses ?? ["APPROVED"],
        admin_ids: initial.audience.admin_ids ?? [],
        role_codes: initial.audience.role_codes ?? [],
      },
    };
  });
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = (): void => {
    if (busy) return;
    if (!dirty) {
      onClose();
      return;
    }
    modal.confirm({
      title: "Tutup tanpa menyimpan perubahan?",
      content:
        "Perubahan terakhir belum tersimpan. Kembali ke editor untuk menyimpan draf.",
      okText: "Tutup tanpa menyimpan",
      cancelText: "Kembali ke editor",
      okButtonProps: { danger: true },
      onOk: onClose,
    });
  };
  const validateMessage = async (): Promise<boolean> => {
    try {
      await form.validateFields(messageFields);
      return true;
    } catch {
      setStep(0);
      const invalid = form
        .getFieldsError()
        .find((field) => field.errors.length > 0);
      if (invalid)
        requestAnimationFrame(() =>
          form.scrollToField(invalid.name, { focus: true }),
        );
      return false;
    }
  };
  const next = async (): Promise<void> => {
    if (await validateMessage()) {
      setError("");
      setStep(1);
    }
  };
  const save = async (review: boolean): Promise<void> => {
    if (submitting.current) return;
    submitting.current = true;
    let saved = false;
    try {
      if (!(await validateMessage())) return;
      setBusy(true);
      setError("");
      const input = form.getFieldsValue(true) as AnnouncementInput;
      const payload = {
        title: input.title,
        body: input.body,
        audience: input.audience,
        version: record === "new" ? 1 : record.version,
        link_label: input.link_label?.trim() || null,
        link_url: input.link_url?.trim() || null,
      };
      const response =
        record === "new"
          ? await axios.post<{ data: Announcement }>("/announcements", payload)
          : await axios.patch<{ data: Announcement }>(
              `/announcements/${record.id}`,
              payload,
            );
      setRecord(response.data.data);
      setDirty(false);
      onSaved();
      saved = true;
      if (!review) {
        onClose();
        return;
      }
      const count = await axios.post<{ data: Preview }>(
        `/announcements/${response.data.data.id}/preview`,
      );
      setPreview({ record: response.data.data, counts: count.data.data });
      setStep(2);
    } catch {
      setError(
        saved
          ? "Draf tersimpan, tetapi penerima belum dapat dihitung. Coba lagi."
          : "Draf gagal disimpan. Coba lagi. Jika draf telah diubah oleh admin lain, tutup lalu buka kembali draf.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const publish = async (): Promise<void> => {
    if (!preview?.counts.eligible || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await axios.post<{ data: Announcement }>(
        `/announcements/${preview.record.id}/publish`,
        { version: preview.record.version },
      );
      onPublished(response.data.data);
    } catch {
      setError(
        "Pengumuman gagal dikirim. Coba lagi atau kembali untuk memeriksa penerima.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      {context}
      <Modal
        open
        centered
        width={680}
        rootClassName={styles.dialog}
        title={
          <span ref={title} tabIndex={-1}>
            {step === 2 ? "Pratinjau pengumuman" : "Tulis pengumuman"}
          </span>
        }
        onCancel={close}
        closable={{ disabled: busy, "aria-label": "Tutup editor" }}
        footer={
          <div className={styles.footer}>
            <Button
              disabled={busy}
              onClick={() => {
                if (step === 0) close();
                else {
                  setStep(step - 1);
                  setError("");
                }
              }}
            >
              {step === 0 ? "Batal" : step === 2 ? "Ubah penerima" : "Kembali"}
            </Button>
            <div className={styles.footerActions}>
              {step < 2 && (
                <Button disabled={busy} onClick={() => void save(false)}>
                  Simpan draf
                </Button>
              )}
              {step === 0 ? (
                <Button
                  type="primary"
                  disabled={busy}
                  onClick={() => void next()}
                >
                  Pilih penerima
                </Button>
              ) : step === 1 ? (
                <Button
                  type="primary"
                  loading={busy}
                  onClick={() => void save(true)}
                >
                  Pratinjau
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={busy}
                  disabled={!preview?.counts.eligible}
                  onClick={() => void publish()}
                >
                  Kirim sekarang
                </Button>
              )}
            </div>
          </div>
        }
      >
        <Steps
          className={styles.progress}
          size="small"
          responsive={false}
          current={step}
          items={[
            { title: "Pesan" },
            { title: "Penerima" },
            { title: "Periksa" },
          ]}
        />
        {error && (
          <Alert type="error" title={error} style={{ marginBottom: 16 }} />
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={values}
          disabled={busy}
          onValuesChange={() => setDirty(true)}
        >
          <section hidden={step !== 0}>
            <MessageFields onChange={() => setDirty(true)} />
          </section>
          <section hidden={step !== 1}>
            <AudienceFields onChange={() => setDirty(true)} />
          </section>
        </Form>
        {step === 2 && preview && (
          <>
            <div className={styles.reviewCount}>
              <Typography.Text strong>
                {preview.counts.eligible} penerima
              </Typography.Text>
              <Typography.Paragraph
                type="secondary"
                style={{ marginBottom: 0 }}
              >
                {preview.counts.members} anggota dan {preview.counts.admins}{" "}
                admin.{" "}
                {preview.counts.excluded > 0 &&
                  `${preview.counts.excluded} akun tidak aktif/tanpa akses masuk dikecualikan.`}
              </Typography.Paragraph>
            </div>
            <AnnouncementMessage record={preview.record} />
            {preview.counts.eligible ? (
              <Typography.Paragraph
                type="secondary"
                style={{ marginTop: 20, marginBottom: 0 }}
              >
                Jumlah penerima dihitung ulang saat dikirim. Pesan yang sudah
                dikirim tidak dapat diedit.
              </Typography.Paragraph>
            ) : (
              <Alert
                type="warning"
                title="Belum ada penerima yang memenuhi syarat. Ubah pilihan penerima sebelum mengirim."
              />
            )}
          </>
        )}
      </Modal>
    </>
  );
}
