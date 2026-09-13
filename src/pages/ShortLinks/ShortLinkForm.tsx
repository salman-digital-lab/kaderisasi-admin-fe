import { useState, type ReactElement } from "react";
import { Alert, Button, Form, Input, Space } from "antd";
import { isAxiosError } from "axios";
import { handleError } from "../../api/errorHandling";
import {
  createShortLink,
  updateShortLink,
} from "../../api/services/short-link";
import type { ShortLink, ShortLinkInput } from "../../types/model/short-link";

interface Props {
  baseURL: string;
  link?: ShortLink;
  onSaved: (link: ShortLink) => void;
  onCancel: () => void;
}

export default function ShortLinkForm({
  baseURL,
  link,
  onSaved,
  onCancel,
}: Props): ReactElement {
  const [form] = Form.useForm<ShortLinkInput>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = async (input: ShortLinkInput): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      const saved = link
        ? await updateShortLink(link.code, input.original_url)
        : await createShortLink(input);
      onSaved(saved);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        form.setFields([
          { name: "code", errors: ["Kode sudah digunakan. Pilih kode lain."] },
        ]);
      } else if (isAxiosError(error) && error.response?.status === 422) {
        setFailed(true);
      } else {
        setFailed(true);
        handleError(error);
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <Form<ShortLinkInput>
      form={form}
      layout="vertical"
      initialValues={{
        original_url: link?.original_url ?? "",
        code: link?.code,
      }}
      onFinish={(input) => void submit(input)}
      disabled={saving}
    >
      {failed && (
        <Alert
          type="error"
          showIcon
          title="Tautan belum tersimpan"
          description="Periksa alamat tujuan dan coba lagi. Alamat harus berupa URL HTTP atau HTTPS yang valid."
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.Item
        name="original_url"
        label="Alamat tujuan"
        rules={[
          { required: true, message: "Masukkan alamat tujuan." },
          {
            validator: async (_, value: string): Promise<void> => {
              if (!value) return;
              try {
                const parsed = new URL(value);
                const own = new URL(baseURL);
                if (
                  !/^https?:\/\//.test(value) ||
                  /[\s\\]/.test(value) ||
                  [...value].some(
                    (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
                  ) ||
                  parsed.username ||
                  parsed.password ||
                  value.split("://")[1]?.split(/[/?#]/)[0]?.includes("@") ||
                  parsed.hostname.replace(/\.$/, "") ===
                    own.hostname.replace(/\.$/, "")
                )
                  throw new Error();
              } catch {
                throw new Error(
                  "Gunakan URL HTTP/HTTPS, tanpa kredensial, dan bukan domain tautan pendek.",
                );
              }
            },
          },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 5 }}
          placeholder="https://salmanitb.com/..."
          autoFocus
        />
      </Form.Item>
      <Form.Item
        name="code"
        label={link ? "Kode tautan" : "Kode khusus (opsional)"}
        extra={
          link
            ? "Kode tetap sama saat alamat tujuan diubah."
            : `${baseURL}/ · Kosongkan untuk kode acak. Huruf besar dan kecil dibedakan.`
        }
        rules={[
          {
            pattern: /^[A-Za-z0-9_-]{3,10}$/,
            message:
              "Gunakan 3–10 huruf, angka, tanda hubung, atau garis bawah.",
          },
          {
            validator: async (_, value: string): Promise<void> => {
              if (value === "health")
                throw new Error("Kode health tidak tersedia.");
            },
          },
        ]}
      >
        <Input
          maxLength={10}
          disabled={Boolean(link) || saving}
          placeholder="Contoh: kajian-26"
        />
      </Form.Item>
      <Space wrap>
        <Button type="primary" htmlType="submit" loading={saving}>
          {link ? "Simpan perubahan" : "Buat tautan"}
        </Button>
        <Button onClick={onCancel} disabled={saving}>
          Batal
        </Button>
      </Space>
    </Form>
  );
}
