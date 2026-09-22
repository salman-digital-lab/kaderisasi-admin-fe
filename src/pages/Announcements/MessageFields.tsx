import { useState, type ReactElement } from "react";
import { Button, Form, Input } from "antd";
import type { AnnouncementInput } from "./types";

export default function MessageFields({
  onChange,
}: {
  onChange: () => void;
}): ReactElement {
  const form = Form.useFormInstance<AnnouncementInput>();
  const [link, setLink] = useState(Boolean(form.getFieldValue("link_url")));
  return (
    <>
      <Form.Item
        name="title"
        label="Judul"
        rules={[
          {
            required: true,
            whitespace: true,
            max: 160,
            message: "Isi judul, maksimal 160 karakter.",
          },
        ]}
      >
        <Input maxLength={160} autoFocus />
      </Form.Item>
      <Form.Item
        name="body"
        label="Pesan"
        rules={[
          {
            required: true,
            whitespace: true,
            max: 10000,
            message: "Isi pesan, maksimal 10.000 karakter.",
          },
        ]}
      >
        <Input.TextArea
          autoSize={{ minRows: 5, maxRows: 8 }}
          maxLength={10000}
          showCount
        />
      </Form.Item>
      <Button
        type="link"
        style={{ paddingInline: 0 }}
        aria-expanded={link}
        onClick={() => {
          if (link) {
            form.setFieldsValue({ link_label: null, link_url: null });
            onChange();
          }
          setLink(!link);
        }}
      >
        {link ? "Hapus tautan" : "Tambahkan tautan (opsional)"}
      </Button>
      {link && (
        <>
          <Form.Item
            name="link_label"
            label="Teks tombol"
            dependencies={["link_url"]}
            rules={[
              {
                required: true,
                whitespace: true,
                max: 100,
                message: "Isi teks tombol, maksimal 100 karakter.",
              },
            ]}
          >
            <Input maxLength={100} placeholder="Contoh: Lihat jadwal" />
          </Form.Item>
          <Form.Item
            name="link_url"
            label="Tautan HTTPS"
            rules={[
              {
                validator: async (_, value: string | null): Promise<void> => {
                  try {
                    const url = new URL(value?.trim() || "");
                    if (
                      url.protocol !== "https:" ||
                      url.username ||
                      url.password
                    )
                      throw new Error();
                  } catch {
                    throw new Error("Gunakan URL HTTPS yang lengkap.");
                  }
                },
              },
            ]}
          >
            <Input placeholder="https://" maxLength={2048} />
          </Form.Item>
        </>
      )}
    </>
  );
}
