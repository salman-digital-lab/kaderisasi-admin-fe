import { useRef, useState, type ReactElement } from "react";
import { Alert, Button, Input, Modal, Typography, notification } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { useRole } from "../../stores/authStore";
import { actionError } from "../../utils/action-error";

interface Props {
  kind: "activity" | "club";
  id: number;
  name: string;
  disabled?: boolean;
  onDeleted?: () => void;
}

export default function DeleteFeatureButton({
  kind,
  id,
  name,
  disabled = false,
  onDeleted,
}: Props): ReactElement | null {
  const role = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const allowed = role?.code === "super_admin" || role?.code === "admin";
  const label = kind === "activity" ? "Kegiatan" : "Klub";

  const remove = async (): Promise<void> => {
    if (
      !allowed ||
      disabled ||
      inFlight.current ||
      !name ||
      confirmation !== name
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await axios.delete(
        `/${kind === "activity" ? "activities" : "clubs"}/${id}`,
        {
          data: { confirmation },
        },
      );
      setOpen(false);
      notification.success({ title: `${label} berhasil dihapus` });
      onDeleted?.();
      navigate(`/${kind}`, { replace: true });
    } catch (cause) {
      setError(
        actionError(
          cause,
          "Penghapusan gagal. Periksa koneksi lalu coba lagi.",
        ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (!allowed) return null;

  return (
    <>
      <Button
        danger
        disabled={disabled || !name}
        onClick={() => {
          setConfirmation("");
          setError("");
          setOpen(true);
        }}
      >
        Hapus {label}
      </Button>
      <Modal
        open={open}
        title={`Hapus ${label}?`}
        okText={`Hapus ${label} Permanen`}
        cancelText="Batal"
        okButtonProps={{
          type: "default",
          danger: true,
          disabled: disabled || !name || confirmation !== name,
        }}
        confirmLoading={busy}
        cancelButtonProps={{ disabled: busy }}
        closable={!busy}
        keyboard={!busy}
        maskClosable={false}
        onCancel={() => {
          if (!inFlight.current) setOpen(false);
        }}
        onOk={() => void remove()}
      >
        <Typography.Paragraph>
          <strong>{name}</strong> akan dihapus permanen. Tindakan ini tidak
          dapat dibatalkan.
        </Typography.Paragraph>
        <Typography.Paragraph>
          {kind === "activity"
            ? "Data pendaftaran dan jawaban peserta ikut dihapus. Kegiatan dengan riwayat sertifikat tidak dapat dihapus."
            : "Data pendaftaran, keanggotaan klub, dan peran anggota ikut dihapus. Akun anggota dan kegiatan tetap tersimpan; hubungan kegiatan dengan klub dilepas."}{" "}
          Formulir pendaftaran dilepas dan dinonaktifkan.
        </Typography.Paragraph>
        <Typography.Paragraph>
          Ketik nama persis <Typography.Text strong>{name}</Typography.Text>{" "}
          untuk mengonfirmasi.
        </Typography.Paragraph>
        <label htmlFor={`delete-${kind}-confirmation`}>
          Nama {label.toLowerCase()}
        </label>
        <Input
          id={`delete-${kind}-confirmation`}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={busy}
          autoComplete="off"
          status={error ? "error" : undefined}
        />
        {error && (
          <Alert
            type="error"
            showIcon
            title={error}
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </>
  );
}
