import { Modal, Form, Input, DatePicker, Row, Col, Select } from "antd";
import { useRequest } from "ahooks";
import type { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";

import { postClub } from "../../../../api/services/club";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import type { ClubType } from "../../../../types/model/club";
import {
  createDraftClubPayload,
  serializeClubDate,
} from "../../utils/mutation-payloads";

type ClubFormProps = {
  open: boolean;
  onClose: () => void;
};

type FieldType = {
  name: string;
  club_type: ClubType;
  short_description?: string;
  start_period?: Dayjs | null;
  end_period?: Dayjs | null;
  is_registration_open?: boolean;
  registration_end_date?: Dayjs | null;
};

const ClubForm = ({ open, onClose }: ClubFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FieldType>();

  const { loading, run } = useRequest(
    (data: FieldType) =>
      postClub(
        createDraftClubPayload({
          ...data,
          start_period: serializeClubDate(data.start_period),
          end_period: serializeClubDate(data.end_period),
          registration_end_date: serializeClubDate(data.registration_end_date),
        }),
      ),
    {
      manual: true,
      onSuccess: (createdClub) => {
        form.resetFields();
        onClose();
        navigate(`/club/${createdClub.id}?setup=1`);
      },
    },
  );

  const handleSubmit = (): void => {
    form.submit();
  };

  const handleCancel = (): void => {
    if (loading) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Tambah Unit Kegiatan"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="Simpan sebagai Draf"
      cancelText="Batal"
      confirmLoading={loading}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      keyboard={!loading}
      maskClosable={!loading}
    >
      <Form form={form} layout="vertical" onFinish={run}>
        <Form.Item
          label="Tipe Club"
          name="club_type"
          initialValue="UKM"
          rules={[{ required: true, message: "Tipe club wajib dipilih!" }]}
        >
          <Select options={CLUB_TYPE_OPTIONS} placeholder="Pilih tipe club" />
        </Form.Item>

        <Form.Item
          label="Nama Unit Kegiatan"
          name="name"
          rules={[
            { required: true, message: "Nama unit kegiatan wajib diisi!" },
          ]}
        >
          <Input placeholder="Masukkan nama unit kegiatan" />
        </Form.Item>
        <Form.Item
          label="Deskripsi Singkat"
          name="short_description"
          rules={[
            { max: 200, message: "Deskripsi singkat maksimal 200 karakter!" },
            { required: true, message: "Deskripsi singkat wajib diisi!" },
          ]}
        >
          <Input.TextArea
            placeholder="Masukkan deskripsi singkat unit kegiatan (maks. 200 karakter)"
            maxLength={200}
            showCount
            rows={3}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Periode Mulai"
              name="start_period"
              rules={[
                { required: true, message: "Periode mulai wajib diisi!" },
              ]}
            >
              <DatePicker
                picker="month"
                placeholder="Pilih bulan mulai"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Periode Berakhir"
              name="end_period"
              dependencies={["start_period"]}
              rules={[
                { required: true, message: "Periode berakhir wajib diisi!" },
                ({ getFieldValue }) => ({
                  validator(_, value?: Dayjs) {
                    const startPeriod = getFieldValue("start_period") as
                      | Dayjs
                      | undefined;
                    if (
                      !value ||
                      !startPeriod ||
                      !value.isBefore(startPeriod, "month")
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "Periode berakhir tidak boleh sebelum periode mulai!",
                      ),
                    );
                  },
                }),
              ]}
            >
              <DatePicker
                picker="month"
                placeholder="Pilih bulan berakhir"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ClubForm;
