import { useEffect, useRef, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Steps,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { Dayjs } from "dayjs";
import {
  findSetupActivities,
  saveSetupActivity,
  setupActivityConfig,
} from "../../../api/services/activity-setup";
import { getClubs } from "../../../api/services/club";
import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  USER_LEVEL_OPTIONS,
} from "../../../constants/options";
import { usePermissions } from "../../../stores/authStore";
import type { Activity } from "../../../types/model/activity";
import { ACTIVITY_TYPE_ENUM } from "../../../types/constants/activity";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { actionError } from "../../../utils/action-error";
import PosterStep from "./PosterStep";
import FormStep from "./FormStep";
import { ACTIVITY_CREATION_STEPS } from "./steps";
import "../../../styles/guided-workflows.css";
import "./setup.css";
type Values = Pick<
  Activity,
  "name" | "activity_type" | "activity_category" | "minimum_level" | "club_id"
> & {
  activity_date?: [Dayjs, Dayjs];
  registration_date?: [Dayjs, Dayjs];
  allow_guest_registration?: boolean;
};
const titles = ACTIVITY_CREATION_STEPS;
export default function ActivitySetup(): ReactElement {
  const { id } = useParams();
  const [params] = useSearchParams();
  if (id && params.get("step") === "poster") return <PosterStep />;
  if (id && params.get("step") === "form") return <FormStep />;
  return id ? (
    <Navigate to={`/activity/${id}`} replace />
  ) : (
    <ActivityCreation />
  );
}
function ActivityCreation(): ReactElement {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [form] = Form.useForm<Values>();
  const activityType = Form.useWatch("activity_type", form);
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const created = useRef<number | undefined>(undefined);
  const saving = useRef(false);
  const [duplicates, setDuplicates] = useState<{
    activities: Activity[];
    total: number;
  }>();
  const { data: clubs } = useRequest(
    () => getClubs({ page: "1", per_page: "100" }),
    { ready: permissions.includes("clubs.read") },
  );
  useEffect(() => {
    document.getElementById("setup-step-title")?.focus();
  }, [step]);
  const nextStep = async (): Promise<void> => {
    try {
      if (step === 0) await form.validateFields(["name"]);
      setStep((current) => Math.min(3, current + 1));
    } catch {
      form.scrollToField("name", { focus: true });
    }
  };
  const save = async (createSeparate = false): Promise<void> => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailure("");
    try {
      const values = await form.validateFields();
      if (!created.current) {
        if (!createSeparate) {
          const existing = await findSetupActivities({
            page: "1",
            per_page: "5",
            search: values.name.trim(),
          });
          if (existing.data.length) {
            setDuplicates({
              activities: existing.data,
              total: existing.meta.total,
            });
            return;
          }
        }
        setDuplicates(undefined);
        const row = await saveSetupActivity(undefined, {
          name: values.name.trim(),
          activity_type: values.activity_type,
          activity_category: values.activity_category,
          minimum_level: values.minimum_level,
          ...(permissions.includes("clubs.read")
            ? { club_id: values.club_id ?? null }
            : {}),
          description,
          activity_start: values.activity_date?.[0]?.format("YYYY-MM-DD"),
          activity_end: values.activity_date?.[1]?.format("YYYY-MM-DD"),
          registration_start:
            values.registration_date?.[0]?.format("YYYY-MM-DD"),
          registration_end: values.registration_date?.[1]?.format("YYYY-MM-DD"),
          additional_config: setupActivityConfig(
            undefined,
            values.activity_type === ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY &&
              !!values.allow_guest_registration,
          ),
        });
        created.current = row.id;
      }
      flushSync(() => {
        setDirty(false);
        setBusy(false);
      });
      navigate(`/activity/${created.current}/setup?step=poster`, {
        replace: true,
      });
    } catch (cause) {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "errorFields" in cause
      ) {
        setStep(0);
      } else {
        setFailure(actionError(cause));
      }
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const values: Values = form.getFieldsValue(true);
  return (
    <main className="guided-page activity-setup-page">
      <header className="activity-setup-header">
        <Button
          type="text"
          className="activity-setup-back"
          icon={<ArrowLeftOutlined aria-hidden />}
          disabled={busy}
          onClick={() => navigate("/activity")}
        >
          Daftar kegiatan
        </Button>
        <Typography.Title level={2} className="activity-setup-title">
          Buat kegiatan
        </Typography.Title>
        <p>Siapkan informasi, poster, dan jadwal pendaftaran kegiatan.</p>
      </header>
      <Alert
        className="activity-setup-notice"
        role="note"
        type="info"
        showIcon
        title="Simpan sebelum mengunggah poster"
        description="Lanjut dan Kembali hanya berpindah langkah. Pilih Simpan & Lanjutkan setelah memeriksa informasi, lalu unggah poster. Sebelum disimpan, Keluar akan membuang isian Anda."
      />
      <Steps
        current={step}
        size="small"
        items={titles.map((title) => ({ title }))}
        style={{ marginBottom: 24 }}
      />
      {failure && (
        <Alert
          className="activity-setup-notice"
          type="error"
          showIcon
          title={failure}
        />
      )}
      <Form
        className="activity-setup-form"
        form={form}
        layout="vertical"
        disabled={busy}
        onValuesChange={() => setDirty(true)}
      >
        <section className="guided-section">
          <Typography.Title id="setup-step-title" tabIndex={-1} level={3}>
            {step + 1}. {titles[step]}
          </Typography.Title>

          <div hidden={step !== 0}>
            <Typography.Title level={4}>Identitas kegiatan</Typography.Title>
            <Form.Item
              name="name"
              label="Nama kegiatan"
              extra="Gunakan nama kegiatan tanpa kata tambahan seperti Pendaftaran atau Oprec, kecuali untuk tipe Umum - Hanya Pendaftaran. Nama wajib diisi untuk menyimpan draf."
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "Isi nama kegiatan untuk melanjutkan",
                },
                { max: 255 },
              ]}
            >
              <Input
                placeholder="Contoh: Pembinaan Kader Oktober"
                maxLength={255}
              />
            </Form.Item>
            <Typography.Title level={4}>
              Jenis kegiatan & peserta
            </Typography.Title>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Boleh dilengkapi nanti"
              description="Tipe, kategori, dan jenjang wajib diisi sebelum tayang. Jika ragu memilih, konsultasikan dengan Asmen atau Admin IT."
            />
            <Form.Item
              name="activity_type"
              label="Tipe kegiatan"
              extra="Menentukan jenjang pendaftar dan fitur pengelolaan. Untuk pendaftaran umum, pilih Umum - Hanya Pendaftaran."
            >
              <Select
                options={ACTIVITY_TYPE_OPTIONS}
                optionRender={(option) => (
                  <div className="activity-setup-option">
                    <div>{option.data.label}</div>
                    {option.data.title && (
                      <div className="activity-setup-option-description">
                        {option.data.title}
                      </div>
                    )}
                  </div>
                )}
                placeholder="Pilih sesuai tujuan kegiatan"
                onChange={(value) => {
                  if (value !== ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY)
                    form.setFieldValue("allow_guest_registration", false);
                }}
              />
            </Form.Item>
            <Form.Item
              name="activity_category"
              label="Kategori"
              extra="Sesuaikan dengan tujuan kegiatan."
            >
              <Select
                options={ACTIVITY_CATEGORY_OPTIONS}
                placeholder="Pilih kategori kegiatan"
              />
            </Form.Item>
            <Form.Item
              name="minimum_level"
              label="Jenjang minimum peserta"
              extra="Jenjang minimum yang harus dimiliki peserta agar dapat mendaftar. Penjelasan setiap jenjang tersedia pada pilihan di atas."
            >
              <Select
                options={USER_LEVEL_OPTIONS}
                optionRender={(option) => (
                  <div className="activity-setup-option">
                    <div>{option.data.label}</div>
                    <div className="activity-setup-option-description">
                      {option.data.title}
                    </div>
                  </div>
                )}
                placeholder="Pilih jenjang peserta"
              />
            </Form.Item>
            <Typography.Title level={4}>Pelaksanaan kegiatan</Typography.Title>
            {permissions.includes("clubs.read") && (
              <Form.Item
                name="club_id"
                label="Komunitas terkait (opsional)"
                extra="Pilih komunitas yang terkait dengan kegiatan ini. Kosongkan jika kegiatan tidak terkait dengan komunitas tertentu."
              >
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={clubs?.data.map((club) => ({
                    label: club.name,
                    value: club.id,
                  }))}
                />
              </Form.Item>
            )}
            <Form.Item
              name="activity_date"
              label="Tanggal kegiatan (opsional)"
              extra="Pilih tanggal mulai dan selesai pelaksanaan kegiatan, bukan masa pendaftaran. Boleh dikosongkan jika jadwal belum ditentukan."
            >
              <DatePicker.RangePicker allowClear style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div hidden={step !== 1}>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="warning"
              showIcon
              title="Wajib sebelum tayang"
              description="Deskripsi diperlukan sebelum kegiatan ditayangkan. Poster ditambahkan pada langkah terakhir, setelah informasi disimpan."
            />
            <Typography.Title level={4}>Deskripsi kegiatan</Typography.Title>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Panduan deskripsi kegiatan"
              description="Jelaskan tujuan, waktu, tempat, dan persiapan peserta. Jangan mencantumkan tautan website kaderisasi; hashtag tidak diperlukan."
            />
            <RichTextEditor
              ariaLabel="Deskripsi kegiatan (wajib sebelum tayang)"
              disabled={busy}
              value={description}
              minHeight="240px"
              onChange={(value) => {
                setDescription(value);
                setDirty(true);
              }}
            />
          </div>
          <div hidden={step !== 2}>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Pendaftaran boleh disiapkan nanti"
              description="Kegiatan dapat ditayangkan sebagai informasi terlebih dahulu, tanpa membuka pendaftaran."
            />
            <section
              className="activity-registration-section"
              aria-labelledby="registration-schedule-title"
            >
              <Typography.Title level={4} id="registration-schedule-title">
                Jadwal pendaftaran
              </Typography.Title>
              <Form.Item
                name="registration_date"
                label="Tanggal pendaftaran"
                extra="Tentukan rentang tanggal peserta dapat mendaftar."
              >
                <DatePicker.RangePicker allowClear style={{ width: "100%" }} />
              </Form.Item>
              <Alert
                className="activity-setup-notice"
                role="note"
                type="warning"
                showIcon
                title="Tanggal tidak otomatis membuka pendaftaran"
                description="Admin perlu membuka pendaftaran secara manual pada rentang tanggal tersebut."
              />
            </section>
            {activityType === ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY && (
              <section
                className="activity-registration-section"
                aria-labelledby="registration-access-title"
              >
                <Typography.Title level={4} id="registration-access-title">
                  Akses peserta
                </Typography.Title>
                <Form.Item
                  name="allow_guest_registration"
                  label="Izinkan peserta tanpa akun"
                  valuePropName="checked"
                  extra="Jika diaktifkan, peserta yang belum login dapat mendaftar sebagai tamu. Data tamu tidak terhubung ke akun pengguna. Hanya tersedia untuk tipe Umum - Hanya Pendaftaran."
                >
                  <Switch />
                </Form.Item>
              </section>
            )}
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Formulir disiapkan di langkah terakhir"
              description="Setelah menyimpan informasi dan poster, Anda dapat membuat atau memilih formulir pendaftaran."
            />
          </div>
          {step === 3 && (
            <>
              <dl className="guided-review">
                <dt>Nama kegiatan</dt>
                <dd>{values.name}</dd>
                <dt>Tipe kegiatan</dt>
                <dd>
                  {ACTIVITY_TYPE_OPTIONS.find(
                    (option) => option.value === values.activity_type,
                  )?.label ?? "Belum dipilih"}
                </dd>
                <dt>Kategori</dt>
                <dd>
                  {ACTIVITY_CATEGORY_OPTIONS.find(
                    (option) => option.value === values.activity_category,
                  )?.label ?? "Belum dipilih"}
                </dd>
                <dt>Jenjang minimum</dt>
                <dd>
                  {USER_LEVEL_OPTIONS.find(
                    (option) => option.value === values.minimum_level,
                  )?.label ?? "Belum dipilih"}
                </dd>
                <dt>Tanggal kegiatan</dt>
                <dd>
                  {values.activity_date
                    ?.map((date) => date.format("DD MMM YYYY"))
                    .join(" – ") || "Belum ditentukan"}
                </dd>
                <dt>Deskripsi</dt>
                <dd>
                  {description.replace(/<[^>]*>/g, "").trim()
                    ? "Sudah diisi"
                    : "Belum diisi"}
                </dd>
                <dt>Tanggal pendaftaran</dt>
                <dd>
                  {values.registration_date
                    ?.map((date) => date.format("DD MMM YYYY"))
                    .join(" – ") || "Belum ditentukan"}
                </dd>
                {activityType === ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY && (
                  <>
                    <dt>Peserta tanpa akun</dt>
                    <dd>
                      {values.allow_guest_registration
                        ? "Diizinkan"
                        : "Tidak diizinkan"}
                    </dd>
                  </>
                )}
              </dl>
              <Alert
                className="activity-setup-notice"
                role="note"
                type="info"
                showIcon
                title="Disimpan sebagai draf"
                description="Simpan & Lanjutkan akan menyimpan informasi sebagai draf dan membuka langkah unggah poster. Setelah selesai, gunakan Ringkasan untuk menyiapkan formulir dan menayangkan kegiatan."
              />
            </>
          )}
        </section>
      </Form>
      <footer className="guided-footer guided-actions">
        <span className="guided-save-state" role="status">
          {busy ? "Menyimpan kegiatan…" : "Belum disimpan"}
        </span>
        <Button
          type="text"
          disabled={busy}
          onClick={() => navigate("/activity")}
        >
          Keluar
        </Button>
        {step > 0 && (
          <Button
            disabled={busy}
            onClick={() => setStep((current) => current - 1)}
          >
            Kembali
          </Button>
        )}
        {step < 3 ? (
          <Button type="primary" onClick={() => void nextStep()}>
            Lanjut
          </Button>
        ) : (
          <Button
            type="primary"
            aria-label="Simpan & Lanjutkan"
            loading={busy}
            onClick={() => void save()}
          >
            Simpan & Lanjutkan
          </Button>
        )}
      </footer>
      <UnsavedChangesGuard dirty={dirty || busy} />
      <Modal
        open={!!duplicates}
        title="Kegiatan serupa sudah ada"
        className="activity-duplicate-dialog"
        onCancel={() => setDuplicates(undefined)}
        footer={
          <div className="guided-actions">
            <Button onClick={() => setDuplicates(undefined)}>
              Kembali ke formulir
            </Button>
            <Button loading={busy} onClick={() => void save(true)}>
              Tetap buat kegiatan berbeda
            </Button>
          </div>
        }
      >
        <p>
          Belum ada kegiatan baru yang dibuat. Jika ini kegiatan yang sama, buka
          kegiatan yang sudah tersimpan.
        </p>
        <ul className="activity-draft-list">
          {duplicates?.activities.map((existing) => (
            <li key={existing.id}>
              <span>
                {existing.name}
                <br />
                <Tag>{existing.is_published ? "Sudah tayang" : "Draf"}</Tag>
              </span>
              <Link
                to={`/activity/${existing.id}`}
                onClick={() => setDuplicates(undefined)}
              >
                Buka kegiatan
              </Link>
            </li>
          ))}
        </ul>
        {duplicates && duplicates.total > duplicates.activities.length && (
          <p>
            Menampilkan {duplicates.activities.length} dari {duplicates.total}{" "}
            kegiatan. Cari nama kegiatan di daftar kegiatan untuk melihat hasil
            lainnya.
          </p>
        )}
      </Modal>
    </main>
  );
}
