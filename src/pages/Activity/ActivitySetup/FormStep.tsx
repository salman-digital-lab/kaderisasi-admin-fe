import { useEffect, useRef, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import {
  Alert,
  Button,
  Form,
  Input,
  Radio,
  Select,
  Skeleton,
  Steps,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { getSetupActivity } from "../../../api/services/activity-setup";
import {
  attachFormToActivity,
  createCustomForm,
  getCustomForms,
  getUnattachedForms,
} from "../../../api/services/customForm";
import { usePermissions } from "../../../stores/authStore";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { actionError } from "../../../utils/action-error";
import { ACTIVITY_CREATION_STEPS } from "./steps";

type Values = { name: string; formId?: number };

export default function FormStep(): ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const canRead = permissions.includes("custom_forms.read");
  const canManage = permissions.includes("custom_forms.manage");
  const [form] = Form.useForm<Values>();
  const [mode, setMode] = useState<"later" | "new" | "existing">("later");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const saving = useRef(false);
  const { data, loading, error, refresh } = useRequest(
    async () => {
      const activity = await getSetupActivity(Number(id));
      const forms = canRead
        ? await getCustomForms({
            feature_type: "activity_registration",
            feature_id: id,
            per_page: "1",
          })
        : undefined;
      form.setFieldValue("name", `Pendaftaran ${activity.name}`.slice(0, 100));
      return { activity, currentForm: forms?.data[0] };
    },
    { refreshDeps: [id, canRead] },
  );
  const {
    data: available,
    loading: optionsLoading,
    error: optionsError,
    refresh: retryOptions,
  } = useRequest(() => getUnattachedForms({ per_page: "100" }), {
    ready: canRead && mode === "existing",
  });
  useEffect(() => {
    if (!loading) document.getElementById("setup-step-title")?.focus();
  }, [loading]);
  const finish = async (): Promise<void> => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailure("");
    try {
      let target = `/activity/${id}`;
      if (!data?.currentForm && mode !== "later") {
        const values = await form.validateFields();
        if (mode === "existing") {
          if (!values.formId) return;
          await attachFormToActivity(values.formId, Number(id));
        } else {
          const created = await createCustomForm({
            formName: values.name.trim(),
            featureType: "activity_registration",
            featureId: Number(id),
            isActive: false,
            formSchema: { fields: [] },
          });
          target = `/activity/${id}/form/${created.id}/edit?setup=1`;
        }
      }
      flushSync(() => {
        setDirty(false);
        setBusy(false);
      });
      navigate(target, { replace: true });
    } catch (cause) {
      if (
        !(typeof cause === "object" && cause !== null && "errorFields" in cause)
      )
        setFailure(actionError(cause));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <main className="guided-page activity-setup-page">
      <header className="activity-setup-header">
        <Typography.Title level={2} className="activity-setup-title">
          {data?.activity.name ?? "Formulir pendaftaran"}
        </Typography.Title>
        <p>Siapkan formulir pendaftaran atau lanjutkan nanti dari Ringkasan.</p>
      </header>
      <Steps
        current={5}
        size="small"
        items={ACTIVITY_CREATION_STEPS.map((title) => ({ title }))}
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
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Formulir belum berhasil dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : (
        <Skeleton loading={loading}>
          <section className="guided-section">
            <Typography.Title level={3} id="setup-step-title" tabIndex={-1}>
              6. Formulir pendaftaran
            </Typography.Title>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Pilihan disimpan saat Anda menyelesaikan langkah ini"
              description="Keluar membuang pilihan formulir yang belum disimpan. Informasi kegiatan, poster, dan formulir yang sudah disimpan tetap tersedia."
            />
            {data?.currentForm ? (
              <>
                <Typography.Title level={4}>
                  Formulir terlampir
                </Typography.Title>
                <p>{data.currentForm.form_name}</p>
                {canManage && (
                  <Button
                    onClick={() =>
                      navigate(
                        `/activity/${id}/form/${data.currentForm?.id}/edit?setup=1`,
                      )
                    }
                  >
                    Atur pertanyaan
                  </Button>
                )}
              </>
            ) : canManage && canRead ? (
              <Form
                form={form}
                layout="vertical"
                disabled={busy}
                onValuesChange={() => setDirty(true)}
              >
                <Form.Item label="Formulir pendaftaran">
                  <Radio.Group
                    value={mode}
                    onChange={(event) => {
                      setMode(event.target.value as typeof mode);
                      setDirty(true);
                    }}
                  >
                    <Radio value="later">Siapkan nanti</Radio>
                    <Radio value="new">Buat formulir baru</Radio>
                    <Radio value="existing">
                      Pilih formulir yang sudah ada
                    </Radio>
                  </Radio.Group>
                </Form.Item>
                {mode === "new" && (
                  <>
                    <Form.Item
                      name="name"
                      label="Nama formulir"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Isi nama formulir",
                        },
                        { max: 100 },
                      ]}
                    >
                      <Input maxLength={100} />
                    </Form.Item>
                    <Alert
                      role="note"
                      type="info"
                      showIcon
                      title="Atur pertanyaan setelah menyimpan formulir"
                      description="Formulir baru disimpan dalam keadaan tidak aktif. Anda akan diarahkan ke editor untuk menambahkan pertanyaan."
                    />
                  </>
                )}
                {mode === "existing" && (
                  <>
                    {optionsError && (
                      <Alert
                        type="error"
                        title="Daftar formulir gagal dimuat"
                        action={
                          <Button onClick={retryOptions}>Coba lagi</Button>
                        }
                      />
                    )}
                    <Form.Item
                      name="formId"
                      label="Pilih formulir"
                      rules={[
                        {
                          required: true,
                          message: "Pilih formulir pendaftaran",
                        },
                      ]}
                    >
                      <Select
                        loading={optionsLoading}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Pilih formulir yang belum terlampir"
                        options={available?.data.map((item) => ({
                          value: item.id,
                          label: item.form_name,
                        }))}
                      />
                    </Form.Item>
                  </>
                )}
              </Form>
            ) : (
              <Alert
                role="note"
                type="info"
                showIcon
                title="Formulir dapat disiapkan oleh admin yang berwenang"
                description="Anda dapat menyelesaikan pembuatan kegiatan dan meminta bantuan melalui Ringkasan."
              />
            )}
          </section>
        </Skeleton>
      )}
      <footer className="guided-footer guided-actions">
        <span className="guided-save-state" role="status">
          {busy
            ? "Menyimpan formulir…"
            : dirty
              ? "Pilihan formulir belum disimpan"
              : "Informasi kegiatan dan poster tersimpan"}
        </span>
        <Button disabled={busy} onClick={() => navigate("/activity")}>
          Keluar
        </Button>
        <Button
          type="primary"
          loading={busy}
          disabled={loading || !!error}
          onClick={() => void finish()}
        >
          {mode === "new" && !data?.currentForm
            ? "Simpan & Atur Pertanyaan"
            : mode === "existing" && !data?.currentForm
              ? "Simpan & Selesai"
              : "Selesai"}
        </Button>
      </footer>
      <UnsavedChangesGuard dirty={dirty || busy} includeSearchChanges />
    </main>
  );
}
