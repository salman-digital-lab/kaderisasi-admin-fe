import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Form, Input, Modal, Select, Space } from "antd";
import { getActivities } from "../../api/services/activity";
import { saveCalendarEvent } from "../../api/services/calendar";
import { handleError } from "../../api/errorHandling";
import type { CalendarEvent } from "../../types/model/calendar";
import { addDays, midnight, wibDate } from "../../utils/calendar";

interface Values {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  activity_id?: number;
}

export default function CalendarForm({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent | "new";
  onClose: () => void;
  onSaved: (event: CalendarEvent) => void;
}): ReactElement {
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<{ value: number; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const current = event === "new" ? null : event;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setSearchError(false);
      void getActivities({ search, page: "1", per_page: "50" })
        .then((result) => {
          if (!result) throw new Error("ACTIVITY_SEARCH_FAILED");
          if (!cancelled)
            setOptions(
              result.data.map((activity) => ({
                value: activity.id,
                label: activity.name,
              })),
            );
        })
        .catch(() => {
          if (!cancelled) setSearchError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, retry]);

  const activityOptions =
    current?.activity &&
    !options.some((option) => option.value === current.activity?.id)
      ? [
          { value: current.activity.id, label: current.activity.name },
          ...options,
        ]
      : options;

  const submit = async (values: Values): Promise<void> => {
    setSaving(true);
    setSaveError(false);
    try {
      const saved = await saveCalendarEvent(current?.id ?? null, {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        location: values.location?.trim() || null,
        all_day: true,
        starts_at: midnight(values.start),
        ends_at: midnight(addDays(values.end, 1)),
        activity_id: values.activity_id ?? null,
      });
      onSaved(saved);
    } catch (error) {
      setSaveError(true);
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={current ? "Ubah acara" : "Tambah acara"}
      onCancel={onClose}
      footer={null}
      maskClosable={!saving}
      closable={!saving}
      keyboard={!saving}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          void submit(values);
        }}
        initialValues={{
          title: current?.title ?? "",
          description: current?.description ?? "",
          location: current?.location ?? "",
          activity_id: current?.activity?.id,
          start: current ? wibDate(current.starts_at) : wibDate(),
          end: current
            ? wibDate(new Date(Date.parse(current.ends_at) - 1))
            : wibDate(),
        }}
      >
        <Alert
          type="info"
          showIcon
          title="Acara langsung terlihat di Kalender BMKA setelah disimpan."
          style={{ marginBottom: 16 }}
        />
        {saveError && (
          <Alert
            type="error"
            showIcon
            title="Acara belum tersimpan. Periksa isian dan coba lagi."
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item
          name="title"
          label="Judul acara"
          rules={[
            { required: true, whitespace: true, message: "Isi judul acara" },
            { max: 255 },
          ]}
        >
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item
          name="start"
          label="Tanggal mulai"
          rules={[{ required: true, message: "Isi tanggal mulai" }]}
        >
          <Input type="date" />
        </Form.Item>
        <Form.Item
          name="end"
          label="Tanggal terakhir (termasuk)"
          dependencies={["start"]}
          rules={[
            { required: true, message: "Isi tanggal terakhir" },
            {
              validator: async (_, value: string): Promise<void> => {
                const start = form.getFieldValue("start") as string;
                if (start && value && value < start)
                  throw new Error(
                    "Tanggal terakhir tidak boleh sebelum tanggal mulai",
                  );
              },
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
        <Form.Item
          name="location"
          label="Lokasi (opsional)"
          rules={[{ max: 500 }]}
        >
          <Input maxLength={500} />
        </Form.Item>
        <Form.Item
          name="description"
          label="Deskripsi (opsional)"
          rules={[{ max: 10000 }]}
        >
          <Input.TextArea rows={4} maxLength={10000} />
        </Form.Item>
        <Form.Item
          name="activity_id"
          label="Kegiatan terkait (opsional)"
          extra="Tautan kegiatan draf baru tampil di web setelah kegiatannya ditayangkan. Jadwal acara tetap terpisah."
        >
          <Select
            allowClear
            showSearch
            filterOption={false}
            onSearch={setSearch}
            options={activityOptions}
            loading={loading}
            placeholder="Cari kegiatan"
            notFoundContent={loading ? "Memuat…" : "Tidak ada kegiatan"}
          />
        </Form.Item>
        {searchError && (
          <Alert
            type="error"
            title="Daftar kegiatan gagal dimuat"
            action={
              <Button onClick={() => setRetry((value) => value + 1)}>
                Coba lagi
              </Button>
            }
          />
        )}
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            Simpan acara
          </Button>
          <Button onClick={onClose} disabled={saving}>
            Batal
          </Button>
        </Space>
      </Form>
    </Modal>
  );
}
