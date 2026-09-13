import { useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Typography,
} from "antd";
import type {
  ScoringDraft,
  ScoringEntry,
  ScoringRubric,
} from "../../../types/services/scoring";
import { saveScoringDraft } from "../../../api/services/scoring";
import { actionError } from "../../../utils/action-error";

export default function ScoreEditor({
  activityId,
  entry,
  rubric,
  canEdit,
  onClose,
  onSaved,
  onDirty,
}: {
  activityId: number;
  entry: ScoringEntry;
  rubric: ScoringRubric;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDirty: (dirty: boolean) => void;
}): ReactElement {
  const [form] = Form.useForm<ScoringDraft>();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [failure, setFailure] = useState("");
  const close = (): void => {
    onDirty(false);
    onClose();
  };
  const save = async (draft: ScoringDraft): Promise<void> => {
    setBusy(true);
    setFailure("");
    try {
      await saveScoringDraft(activityId, entry.registration_id, {
        revision: entry.scoring_data?.revision ?? 0,
        rubric_revision: rubric.revision,
        draft: { scores: draft.scores ?? {}, note: draft.note ?? "" },
      });
      onDirty(false);
      onSaved();
    } catch (error) {
      setFailure(actionError(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Modal
        open
        title={`Penilaian: ${entry.name}`}
        width={720}
        onCancel={() => (dirty ? setDiscard(true) : close())}
        maskClosable={false}
        footer={
          <Space>
            <Button
              disabled={busy}
              onClick={() => (dirty ? setDiscard(true) : close())}
            >
              Tutup
            </Button>
            {canEdit && (
              <Button
                type="primary"
                loading={busy}
                onClick={() => form.submit()}
              >
                Simpan draf
              </Button>
            )}
          </Space>
        }
      >
        {failure && <Alert type="error" title={failure} role="alert" />}
        <Typography.Paragraph>
          Nilai kosong berarti belum dinilai. Mengisi 0 berarti nilai nol.
          Simpan draf terlebih dahulu, lalu terbitkan dari daftar peserta.
        </Typography.Paragraph>
        {entry.scoring_data?.published && (
          <Alert
            type="info"
            title={`Hasil terbit: ${entry.scoring_data.published.result.total?.toLocaleString("id-ID")} ${entry.scoring_data.published.result.grade ?? ""}`}
            description="Perubahan draf tidak mengganti hasil peserta sampai diterbitkan ulang."
          />
        )}
        <Form
          name={`scoring-registration-${entry.registration_id}`}
          form={form}
          layout="vertical"
          initialValues={entry.scoring_data?.draft ?? { scores: {}, note: "" }}
          disabled={!canEdit || busy}
          onFinish={save}
          onValuesChange={() => {
            setDirty(true);
            onDirty(true);
          }}
        >
          {rubric.groups.map((group) => (
            <section key={group.id} aria-label={group.name}>
              <Typography.Title level={5}>{group.name}</Typography.Title>
              {group.criteria.map((criterion) => (
                <Form.Item
                  key={criterion.id}
                  name={["scores", criterion.id]}
                  label={`${criterion.name} (maks. ${criterion.maximum}, bobot ${criterion.weight})`}
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      max: criterion.maximum,
                      message: `Masukkan nilai 0 sampai ${criterion.maximum}`,
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={criterion.maximum}
                    precision={2}
                    style={{ width: "100%" }}
                    placeholder="Belum dinilai"
                  />
                </Form.Item>
              ))}
            </section>
          ))}
          <Form.Item name="note" label="Catatan peserta">
            <Input.TextArea rows={4} maxLength={5000} showCount />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={discard}
        title="Perubahan belum disimpan"
        okText="Buang perubahan"
        cancelText="Lanjutkan mengisi"
        onOk={close}
        onCancel={() => setDiscard(false)}
      >
        <p>Perubahan nilai dalam formulir ini belum tersimpan.</p>
      </Modal>
    </>
  );
}
