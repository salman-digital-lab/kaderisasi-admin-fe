import { useEffect, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Skeleton,
  Steps,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import {
  getActivityReadiness,
  getSetupActivity,
  saveSetupActivity,
  setupActivityConfig,
  type SetupReadiness,
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
import DeleteFeatureButton from "../../../components/common/DeleteFeatureButton";
import { actionError } from "../../../utils/action-error";
import ImageList from "../ActivityDetail/components/ImageList";
import CustomFormSelection from "../ActivityDetail/components/CustomFormSelection";
import PublicationHelp from "./PublicationHelp";
import "../../../styles/guided-workflows.css";

type Values = Pick<
  Activity,
  "name" | "activity_type" | "activity_category" | "minimum_level" | "club_id"
> & {
  activity_date?: [Dayjs, Dayjs];
  registration_date?: [Dayjs, Dayjs];
  allow_guest_registration?: boolean;
};
const dates = (start?: string, end?: string): [Dayjs, Dayjs] | undefined =>
  start && end ? [dayjs(start), dayjs(end)] : undefined;

export default function ActivitySetup(): ReactElement {
  const { id: routeId } = useParams();
  const id = routeId ? Number(routeId) : undefined;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const step = id
    ? Math.max(0, Math.min(3, Number(params.get("step")) || 0))
    : 0;
  const permissions = usePermissions();
  const canPublish = permissions.includes("activities.publish");
  const canRegister = permissions.includes("activities.registration.manage");
  const [form] = Form.useForm<Values>();
  const activityType = Form.useWatch("activity_type", form);
  const [activity, setActivity] = useState<Activity>();
  const [readiness, setReadiness] = useState<SetupReadiness>();
  const [description, setDescription] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [saved, setSaved] = useState("");
  const { loading, error, refresh } = useRequest(
    async () => {
      if (!id) return;
      const [row, checks] = await Promise.all([
        getSetupActivity(id),
        getActivityReadiness(id),
      ]);
      setActivity(row);
      setReadiness(checks);
      setDescription(row.description ?? "");
      form.setFieldsValue({
        ...row,
        activity_date: dates(row.activity_start, row.activity_end),
        registration_date: dates(row.registration_start, row.registration_end),
        allow_guest_registration:
          row.additional_config?.allow_guest_registration ?? false,
      });
    },
    { refreshDeps: [id] },
  );
  const { data: clubs } = useRequest(
    () => getClubs({ page: "1", per_page: "100" }),
    { ready: permissions.includes("clubs.read") },
  );
  useEffect(() => {
    if (step === 3 && id)
      void getActivityReadiness(id)
        .then(setReadiness)
        .catch(() =>
          setFailure(
            "Kesiapan kegiatan belum berhasil diperiksa. Coba periksa lagi.",
          ),
        );
  }, [id, step]);
  useEffect(() => {
    document.getElementById("setup-step-title")?.focus();
  }, [step]);
  const save = async (nextStep?: number, exit = false): Promise<void> => {
    if (mediaBusy || busy) return;
    setFailure("");
    try {
      await form.validateFields(["name"]);
      const values = form.getFieldsValue(true);
      setBusy(true);
      const payload: Partial<Activity> = {
        name: values.name.trim(),
        activity_type: values.activity_type,
        activity_category: values.activity_category,
        minimum_level: values.minimum_level,
        club_id: values.club_id ?? null,
        description,
        activity_start: values.activity_date?.[0]?.format("YYYY-MM-DD"),
        activity_end: values.activity_date?.[1]?.format("YYYY-MM-DD"),
        registration_start: values.registration_date?.[0]?.format("YYYY-MM-DD"),
        registration_end: values.registration_date?.[1]?.format("YYYY-MM-DD"),
        additional_config: setupActivityConfig(
          activity?.additional_config,
          values.activity_type === ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY &&
            !!values.allow_guest_registration,
        ),
      };
      const row = await saveSetupActivity(id, payload);
      flushSync(() => {
        setDirty(false);
        setSaved("Semua perubahan tersimpan");
      });
      if (exit) {
        navigate("/activity");
        return;
      }
      if (!id) {
        navigate(`/activity/${row.id}/setup?step=${nextStep ?? 0}`, {
          replace: true,
        });
        return;
      }
      setActivity(await getSetupActivity(id));
      setReadiness(await getActivityReadiness(id));
      if (nextStep !== undefined) setParams({ step: String(nextStep) });
    } catch (cause) {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "errorFields" in cause
      ) {
        form.scrollToField("name", { focus: true });
        return;
      }
      setFailure(actionError(cause));
    } finally {
      setBusy(false);
    }
  };
  const transition = async (changes: Partial<Activity>): Promise<void> => {
    if (!id || dirty) return;
    setBusy(true);
    setFailure("");
    try {
      await saveSetupActivity(id, changes);
      setActivity(await getSetupActivity(id));
      setSaved("Status kegiatan diperbarui");
    } catch (cause) {
      setFailure(actionError(cause));
    } finally {
      try {
        setReadiness(await getActivityReadiness(id));
      } catch {
        setFailure(
          "Status belum dapat diperiksa. Muat ulang sebelum mencoba lagi.",
        );
      }
      setBusy(false);
    }
  };
  const titles = [
    "Informasi dasar",
    "Deskripsi & poster",
    "Siapkan pendaftaran",
    canPublish ? "Periksa & tayangkan" : "Periksa & minta bantuan",
  ];
  return (
    <main className="guided-page">
      <Link to="/activity">← Daftar kegiatan</Link>
      <div className="guided-intro">
        <Typography.Title level={2}>
          {id ? (activity?.name ?? "Siapkan kegiatan") : "Buat kegiatan"}
        </Typography.Title>
        <p>
          Mulai dari nama kegiatan. Simpan draf sekarang dan lengkapi informasi
          secara bertahap.
        </p>
        {activity && (
          <div>
            <Tag color={activity.is_published ? "green" : "default"}>
              {activity.is_published
                ? "Tayang di website"
                : "Draf · belum terlihat publik"}
            </Tag>
            <Tag>
              {activity.is_registration_open
                ? "Pendaftaran dibuka"
                : "Pendaftaran ditutup"}
            </Tag>
            <DeleteFeatureButton
              kind="activity"
              id={activity.id}
              name={activity.name}
              disabled={busy || mediaBusy || loading}
              onDeleted={() => flushSync(() => setDirty(false))}
            />
          </div>
        )}
      </div>
      <Steps
        current={step}
        size="small"
        items={titles.map((title, index) => ({
          title,
          status: index === step ? "process" : "wait",
        }))}
        style={{ marginBottom: 24 }}
      />
      {error && (
        <Alert
          type="error"
          title="Kegiatan belum berhasil dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      )}
      {failure && (
        <Alert
          role="alert"
          type="error"
          showIcon
          title={failure}
          style={{ marginBottom: 20 }}
        />
      )}
      <Skeleton loading={loading}>
        {!error && (
          <>
            <Form
              form={form}
              layout="vertical"
              disabled={busy}
              onValuesChange={() => {
                setDirty(true);
                setSaved("");
              }}
            >
              <section className="guided-section">
                <Typography.Title id="setup-step-title" tabIndex={-1} level={3}>
                  {step + 1}. {titles[step]}
                </Typography.Title>
                <div hidden={step !== 0}>
                  <Form.Item
                    name="name"
                    label="Nama kegiatan"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Isi nama kegiatan untuk menyimpan draf",
                      },
                      { max: 255 },
                    ]}
                  >
                    <Input
                      placeholder="Contoh: Pembinaan Kader Oktober"
                      maxLength={255}
                    />
                  </Form.Item>
                  <p>
                    Informasi berikut boleh dilengkapi nanti. Tipe, kategori,
                    dan jenjang diperlukan sebelum kegiatan ditayangkan.
                  </p>
                  <Form.Item name="activity_type" label="Tipe kegiatan">
                    <Select
                      options={ACTIVITY_TYPE_OPTIONS}
                      placeholder="Pilih sesuai tujuan kegiatan"
                      onChange={(value) => {
                        if (value !== ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY)
                          form.setFieldValue("allow_guest_registration", false);
                      }}
                    />
                  </Form.Item>
                  <Form.Item name="activity_category" label="Kategori">
                    <Select
                      options={ACTIVITY_CATEGORY_OPTIONS}
                      placeholder="Pilih kategori kegiatan"
                    />
                  </Form.Item>
                  <Form.Item
                    name="minimum_level"
                    label="Jenjang minimum peserta"
                    extra="Menentukan siapa yang dapat mendaftar."
                  >
                    <Select
                      options={USER_LEVEL_OPTIONS}
                      placeholder="Pilih jenjang peserta"
                    />
                  </Form.Item>
                  {permissions.includes("clubs.read") && (
                    <Form.Item
                      name="club_id"
                      label="Komunitas terkait (opsional)"
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
                  >
                    <DatePicker.RangePicker
                      allowClear={!activity?.activity_start}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>
                <div hidden={step !== 1}>
                  <p>
                    Jelaskan tujuan, waktu, tempat, dan hal yang perlu disiapkan
                    peserta. Deskripsi dan minimal satu poster wajib diisi
                    sebelum kegiatan ditayangkan.
                  </p>
                  <RichTextEditor
                    ariaLabel="Deskripsi kegiatan (wajib sebelum tayang)"
                    disabled={busy}
                    value={description}
                    minHeight="240px"
                    onChange={(value) => {
                      setDescription(value);
                      setDirty(true);
                      setSaved("");
                    }}
                  />
                  {id && step === 1 && (
                    <div style={{ marginTop: 24 }}>
                      <ImageList onBusyChange={setMediaBusy} />
                      <p>Unggahan poster langsung disimpan.</p>
                    </div>
                  )}
                </div>
                <div hidden={step !== 2}>
                  <p>
                    Pendaftaran boleh disiapkan nanti. Kegiatan dapat
                    ditayangkan sebagai informasi terlebih dahulu.
                  </p>
                  <Form.Item
                    name="registration_date"
                    label="Tanggal pendaftaran"
                    extra="Pembukaan dilakukan manual oleh admin pada rentang tanggal ini."
                  >
                    <DatePicker.RangePicker
                      allowClear={!activity?.registration_start}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  {activityType === ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY && (
                    <Form.Item
                      name="allow_guest_registration"
                      label="Izinkan peserta tanpa akun"
                      valuePropName="checked"
                      extra="Hanya tersedia untuk kegiatan Umum – Hanya Pendaftaran."
                    >
                      <Switch />
                    </Form.Item>
                  )}
                  {id &&
                    step === 2 &&
                    (dirty ? (
                      <Alert
                        type="info"
                        title="Simpan perubahan sebelum mengatur formulir"
                        action={
                          <Button onClick={() => void save()}>
                            Simpan perubahan
                          </Button>
                        }
                      />
                    ) : (
                      <CustomFormSelection setup />
                    ))}
                </div>
                {step === 3 && (
                  <>
                    <dl className="guided-review">
                      <dt>Nama kegiatan</dt>
                      <dd>{activity?.name}</dd>
                      <dt>Penayangan</dt>
                      <dd>
                        {activity?.is_published
                          ? "Sudah tayang"
                          : "Belum tayang"}
                      </dd>
                      <dt>Pendaftaran</dt>
                      <dd>
                        {activity?.is_registration_open
                          ? "Sedang dibuka"
                          : "Ditutup"}
                      </dd>
                    </dl>
                    <Typography.Title level={4}>
                      Kesiapan penayangan
                    </Typography.Title>
                    {readiness?.can_publish ? (
                      <p>Informasi wajib sudah lengkap.</p>
                    ) : (
                      <ul>
                        {readiness?.issues
                          .filter((issue) => issue.scope === "publication")
                          .map((issue) => (
                            <li key={issue.code}>
                              <Button
                                type="link"
                                onClick={() =>
                                  setParams({ step: String(issue.step) })
                                }
                              >
                                {issue.message}
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                    <Typography.Title level={4}>
                      Kesiapan pendaftaran
                    </Typography.Title>
                    {readiness?.can_open_registration ? (
                      <p>
                        Tanggal dan formulir siap untuk membuka pendaftaran.
                      </p>
                    ) : (
                      <ul>
                        {readiness?.issues
                          .filter((issue) => issue.scope === "registration")
                          .map((issue) => (
                            <li key={issue.code}>
                              <Button
                                type="link"
                                onClick={() =>
                                  setParams({ step: String(issue.step) })
                                }
                              >
                                {issue.message}
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                    <Button
                      loading={busy}
                      onClick={() =>
                        id &&
                        void getActivityReadiness(id)
                          .then(setReadiness)
                          .catch(() =>
                            setFailure("Pemeriksaan gagal. Coba lagi."),
                          )
                      }
                    >
                      Periksa lagi
                    </Button>
                    {!canPublish && id && (
                      <PublicationHelp id={id} name={activity?.name ?? ""} />
                    )}
                    {(canPublish || canRegister) && (
                      <div className="guided-help">
                        <p>
                          Menayangkan kegiatan membuat informasinya terlihat di
                          website. Membuka pendaftaran memungkinkan peserta
                          mengirim formulir.
                        </p>
                        <div className="guided-actions">
                          {canPublish && !activity?.is_published && (
                            <Button
                              type="primary"
                              disabled={!readiness?.can_publish || busy}
                              onClick={() =>
                                void transition({ is_published: 1 })
                              }
                            >
                              Tayangkan kegiatan
                            </Button>
                          )}
                          {canPublish &&
                            canRegister &&
                            !activity?.is_published && (
                              <Button
                                disabled={
                                  !readiness?.can_publish ||
                                  !readiness?.can_open_registration ||
                                  busy
                                }
                                onClick={() =>
                                  void transition({
                                    is_published: 1,
                                    is_registration_open: true,
                                  })
                                }
                              >
                                Tayangkan & buka pendaftaran
                              </Button>
                            )}
                          {canRegister && !!activity?.is_published && (
                            <Button
                              type="primary"
                              disabled={
                                (!activity.is_registration_open &&
                                  !readiness?.can_open_registration) ||
                                busy
                              }
                              onClick={() =>
                                void transition({
                                  is_registration_open:
                                    !activity.is_registration_open,
                                })
                              }
                            >
                              {activity.is_registration_open
                                ? "Tutup pendaftaran"
                                : "Buka pendaftaran"}
                            </Button>
                          )}
                          {canPublish && !!activity?.is_published && (
                            <Button
                              disabled={busy}
                              onClick={() =>
                                void transition({ is_published: 0 })
                              }
                            >
                              Kembalikan ke draf & tutup pendaftaran
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </Form>
            <footer className="guided-footer guided-actions">
              <span className="guided-save-state" role="status">
                {mediaBusy
                  ? "Poster sedang disimpan…"
                  : dirty
                    ? "Ada perubahan belum disimpan"
                    : saved || (id ? "Perubahan tersimpan" : "Belum disimpan")}
              </span>
              {step > 0 && (
                <Button
                  disabled={busy || mediaBusy}
                  onClick={() => void save(step - 1)}
                >
                  Kembali
                </Button>
              )}
              <Button
                disabled={busy || mediaBusy}
                onClick={() => void save(undefined, true)}
              >
                Simpan & keluar
              </Button>
              {step < 3 && (
                <Button
                  type="primary"
                  loading={busy || mediaBusy}
                  onClick={() => void save(step + 1)}
                >
                  Simpan & lanjutkan
                </Button>
              )}
              {step === 3 && id && (
                <Link to={`/activity/${id}`}>Buka detail kegiatan</Link>
              )}
            </footer>
          </>
        )}
      </Skeleton>
      <UnsavedChangesGuard dirty={dirty || mediaBusy} />
    </main>
  );
}
