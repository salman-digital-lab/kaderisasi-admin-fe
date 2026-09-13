import { useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
} from "antd";
import type { ScoringRubric } from "../../../types/services/scoring";
import { saveScoringRubric } from "../../../api/services/scoring";
import { actionError } from "../../../utils/action-error";
import styles from "./scoring.module.css";

const required = [{ required: true, message: "Wajib diisi" }];
const numberRules = [
  {
    required: true,
    type: "number" as const,
    min: 0.01,
    max: 1000000,
    message: "Masukkan angka 0,01 sampai 1.000.000",
  },
];
const newCriterion = (): {
  id: string;
  name: string;
  maximum: number;
  weight: number;
} => ({ id: crypto.randomUUID(), name: "", maximum: 100, weight: 1 });

export default function RubricEditor({
  activityId,
  rubric,
  canManage,
  onSaved,
  onDirty,
}: {
  activityId: number;
  rubric: ScoringRubric | null;
  canManage: boolean;
  onSaved: () => void;
  onDirty: (dirty: boolean) => void;
}): ReactElement {
  const [form] = Form.useForm<ScoringRubric>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const locked = !!rubric?.locked || !canManage;
  const save = async (values: ScoringRubric): Promise<void> => {
    setBusy(true);
    setFailure("");
    try {
      await saveScoringRubric(activityId, {
        ...values,
        grades: values.grades ?? [],
        note: values.note ?? "",
        revision: rubric?.revision ?? 0,
        locked: false,
      });
      onDirty(false);
      onSaved();
    } catch (error) {
      setFailure(
        actionError(
          error,
          "Rubrik belum tersimpan. Periksa kelompok, aspek, serta batas indeks yang unik dan dimulai dari 0.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Form
      name={`scoring-rubric-${activityId}`}
      form={form}
      layout="vertical"
      initialValues={rubric ?? { groups: [], grades: [], note: "" }}
      onValuesChange={() => onDirty(true)}
      onFinish={save}
      disabled={locked || busy}
    >
      <Typography.Paragraph>
        Atur aspek, nilai maksimum, dan bobot relatif. Nilai dinormalisasi ke
        0–100 sebelum dihitung menjadi rata-rata berbobot.
      </Typography.Paragraph>
      {rubric?.locked && (
        <Alert
          type="info"
          title="Rubrik terkunci karena nilai sudah diisi"
          description="Nilai peserta dan catatan peserta tetap dapat diperbarui."
          className={styles.notice}
        />
      )}
      {failure && (
        <Alert
          type="error"
          title={failure}
          role="alert"
          className={styles.notice}
        />
      )}
      <Form.List
        name="groups"
        rules={[
          {
            validator: async (_, groups: unknown[]) => {
              if (!groups?.length)
                throw new Error("Tambahkan setidaknya satu kelompok");
            },
          },
        ]}
      >
        {(groups, { add, remove, move }, { errors }) => (
          <div className={styles.stack}>
            {groups.map(({ key, name }, groupIndex) => (
              <Card
                key={key}
                size="small"
                title={`Kelompok ${groupIndex + 1}`}
                extra={
                  !locked && (
                    <Space>
                      <Button
                        aria-label={`Naikkan kelompok ${groupIndex + 1}`}
                        disabled={groupIndex === 0}
                        onClick={() => {
                          move(name, name - 1);
                          onDirty(true);
                        }}
                      >
                        Naik
                      </Button>
                      <Button
                        danger
                        onClick={() => {
                          remove(name);
                          onDirty(true);
                        }}
                      >
                        Hapus kelompok
                      </Button>
                    </Space>
                  )
                }
              >
                <Form.Item name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name={[name, "name"]}
                  label="Nama kelompok"
                  rules={required}
                >
                  <Input maxLength={200} placeholder="Contoh: Karakter" />
                </Form.Item>
                <Form.List
                  name={[name, "criteria"]}
                  rules={[
                    {
                      validator: async (_, criteria: unknown[]) => {
                        if (!criteria?.length)
                          throw new Error("Tambahkan setidaknya satu aspek");
                      },
                    },
                  ]}
                >
                  {(criteria, operations, meta) => (
                    <div className={styles.stack}>
                      {criteria.map((criterion, index) => (
                        <div key={criterion.key} className={styles.criterion}>
                          <Form.Item name={[criterion.name, "id"]} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={[criterion.name, "name"]}
                            label={`Aspek ${index + 1}`}
                            rules={required}
                          >
                            <Input maxLength={200} />
                          </Form.Item>
                          <Form.Item
                            name={[criterion.name, "maximum"]}
                            label="Nilai maksimum"
                            rules={numberRules}
                          >
                            <InputNumber
                              min={0.01}
                              max={1000000}
                              precision={2}
                            />
                          </Form.Item>
                          <Form.Item
                            name={[criterion.name, "weight"]}
                            label="Bobot"
                            rules={numberRules}
                          >
                            <InputNumber
                              min={0.01}
                              max={1000000}
                              precision={2}
                            />
                          </Form.Item>
                          {!locked && (
                            <Space wrap>
                              <Button
                                aria-label={`Naikkan aspek ${index + 1}`}
                                disabled={index === 0}
                                onClick={() => {
                                  operations.move(
                                    criterion.name,
                                    criterion.name - 1,
                                  );
                                  onDirty(true);
                                }}
                              >
                                Naik
                              </Button>
                              <Button
                                danger
                                aria-label={`Hapus aspek ${index + 1}`}
                                onClick={() => {
                                  operations.remove(criterion.name);
                                  onDirty(true);
                                }}
                              >
                                Hapus
                              </Button>
                            </Space>
                          )}
                        </div>
                      ))}
                      <Form.ErrorList errors={meta.errors} />
                      {!locked && (
                        <Button
                          disabled={criteria.length >= 100}
                          onClick={() => {
                            operations.add(newCriterion());
                            onDirty(true);
                          }}
                        >
                          Tambah aspek
                        </Button>
                      )}
                    </div>
                  )}
                </Form.List>
              </Card>
            ))}
            <Form.ErrorList errors={errors} />
            {!locked && (
              <Button
                disabled={groups.length >= 30}
                onClick={() => {
                  add({
                    id: crypto.randomUUID(),
                    name: "",
                    criteria: [newCriterion()],
                  });
                  onDirty(true);
                }}
              >
                Tambah kelompok
              </Button>
            )}
          </div>
        )}
      </Form.List>
      <Typography.Title level={5}>Indeks nilai (opsional)</Typography.Title>
      <Typography.Paragraph type="secondary">
        Setiap indeks berlaku mulai batas minimumnya sampai batas indeks
        berikutnya. Sertakan batas 0 agar semua nilai memiliki indeks.
      </Typography.Paragraph>
      <Form.List name="grades">
        {(grades, { add, remove }) => (
          <div className={styles.stack}>
            {grades.map(({ key, name }) => (
              <div key={key} className={styles.grade}>
                <Form.Item
                  name={[name, "label"]}
                  label="Indeks"
                  rules={required}
                >
                  <Input maxLength={30} placeholder="Contoh: A+" />
                </Form.Item>
                <Form.Item
                  name={[name, "minimum"]}
                  label="Nilai minimum (0–100)"
                  rules={[{ required: true, type: "number", min: 0, max: 100 }]}
                >
                  <InputNumber min={0} max={100} precision={2} />
                </Form.Item>
                {!locked && (
                  <Button
                    danger
                    onClick={() => {
                      remove(name);
                      onDirty(true);
                    }}
                  >
                    Hapus indeks
                  </Button>
                )}
              </div>
            ))}
            {!locked && (
              <Button
                disabled={grades.length >= 30}
                onClick={() => {
                  add({ label: "", minimum: 0 });
                  onDirty(true);
                }}
              >
                Tambah indeks
              </Button>
            )}
          </div>
        )}
      </Form.List>
      <Form.Item
        name="note"
        label="Catatan untuk semua peserta"
        className={styles.notice}
      >
        <Input.TextArea rows={3} maxLength={5000} showCount />
      </Form.Item>
      {!locked && (
        <Button type="primary" htmlType="submit" loading={busy}>
          Simpan rubrik
        </Button>
      )}
    </Form>
  );
}
