import { Button, Typography } from "antd";
import type { ReactElement } from "react";
import { WHATSAPP_SUPPORT_GROUP } from "../../../constants/support";

export default function PublicationHelp({
  id,
  name,
}: {
  id: number;
  name: string;
}): ReactElement {
  const url = `${window.location.origin}/activity/${id}/setup?step=3`;
  const help = `Halo, mohon bantuan Admin Operasional atau Super Admin untuk memeriksa kegiatan "${name}" dan membantu penayangan/pembukaan pendaftaran setelah siap. Tautan admin: ${url}`;
  return (
    <aside className="guided-help">
      <Typography.Title level={3}>Minta bantuan penayangan</Typography.Title>
      <p>
        Panitia Kegiatan dapat menyiapkan kegiatan, mengubah informasi, dan
        mengelola peserta. Penayangan serta pembukaan atau penutupan pendaftaran
        dilakukan oleh Admin Operasional atau Super Admin.
      </p>
      <p>
        Kirim tautan kegiatan kepada admin yang berwenang. Jika belum tahu siapa
        yang dapat membantu, gunakan grup WhatsApp pengguna.
      </p>
      <Typography.Paragraph
        copyable={{
          text: help,
          tooltips: ["Salin pesan bantuan", "Pesan disalin"],
        }}
      >
        {help}
      </Typography.Paragraph>
      <Button
        href={WHATSAPP_SUPPORT_GROUP}
        target="_blank"
        rel="noopener noreferrer"
      >
        Buka grup WhatsApp
      </Button>
      <p>
        Membuka grup belum mengirim pesan. Tempel pesan yang disalin dan kirim
        sendiri di WhatsApp.
      </p>
    </aside>
  );
}
