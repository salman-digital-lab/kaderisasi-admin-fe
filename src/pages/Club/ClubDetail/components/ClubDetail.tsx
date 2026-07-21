import { useState } from "react";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { putClub } from "../../../../api/services/club";
import type { Club, ClubType } from "../../../../types/model/club";
import { RichTextEditor } from "../../../../components/common/RichTextEditor";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import { serializeClubDate } from "../../utils/mutation-payloads";

const { Paragraph, Title } = Typography;

type FieldType = {
  name: string;
  club_type: ClubType;
  start_period?: Dayjs | null;
  end_period?: Dayjs | null;
};

type ClubDetailProps = {
  club: Club;
  onUpdated: (club: Club) => void;
};

const ClubDetail = ({ club, onUpdated }: ClubDetailProps) => {
  const [form] = Form.useForm<FieldType>();
  const [description, setDescription] = useState(club.description || "");
  const [shortDescription, setShortDescription] = useState(
    club.short_description || "",
  );
  const [isChanged, setIsChanged] = useState(false);

  const { loading: updateLoading, run: updateClub } = useRequest(
    (data: FieldType) =>
      putClub(club.id, {
        ...data,
        description,
        short_description: shortDescription,
        start_period: serializeClubDate(data.start_period),
        end_period: serializeClubDate(data.end_period),
      }),
    {
      manual: true,
      onSuccess: (updatedClub) => {
        setDescription(updatedClub.description || "");
        setShortDescription(updatedClub.short_description || "");
        setIsChanged(false);
        onUpdated({ ...club, ...updatedClub });
      },
    },
  );

  return (
    <section aria-labelledby="club-basic-information-title">
      <Space direction="vertical" size={2} style={{ marginBottom: 16 }}>
        <Title
          id="club-basic-information-title"
          level={4}
          style={{ margin: 0 }}
        >
          Informasi Dasar
        </Title>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Informasi ini membantu calon anggota memahami identitas dan fokus
          klub.
        </Paragraph>
      </Space>

      <Form
        form={form}
        id="detail-club"
        layout="vertical"
        initialValues={{
          name: club.name,
          club_type: club.club_type,
          start_period: club.start_period ? dayjs(club.start_period) : null,
          end_period: club.end_period ? dayjs(club.end_period) : null,
        }}
        onFinish={updateClub}
        onValuesChange={() => setIsChanged(true)}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tipe Klub"
              name="club_type"
              extra="Pilih kategori yang paling sesuai dengan bentuk komunitas."
              rules={[{ required: true, message: "Tipe klub wajib dipilih!" }]}
            >
              <Select
                options={CLUB_TYPE_OPTIONS}
                placeholder="Pilih tipe klub"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Nama Klub"
              name="name"
              rules={[{ required: true, message: "Nama klub wajib diisi!" }]}
            >
              <Input placeholder="Masukkan nama klub" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Deskripsi Singkat (Disarankan)"
          extra="Tampil sebagai ringkasan cepat untuk calon anggota."
        >
          <Input.TextArea
            value={shortDescription}
            onChange={(event) => {
              setShortDescription(event.target.value);
              setIsChanged(true);
            }}
            placeholder="Contoh: Komunitas belajar desain produk dan teknologi"
            maxLength={200}
            showCount
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Deskripsi Lengkap (Disarankan)"
          extra="Jelaskan fokus, manfaat, program, dan siapa yang cocok bergabung."
        >
          <RichTextEditor
            value={description}
            onChange={(value) => {
              setDescription(value);
              setIsChanged(true);
            }}
            minHeight="200px"
          />
        </Form.Item>

        <Title level={5}>Periode Klub</Title>
        <Paragraph type="secondary">
          Biarkan kosong jika klub tidak memiliki periode kepengurusan atau
          program tertentu.
        </Paragraph>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Periode Mulai" name="start_period">
              <DatePicker
                picker="month"
                placeholder="Pilih bulan mulai"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Periode Berakhir"
              name="end_period"
              dependencies={["start_period"]}
              rules={[
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

        <Button
          form="detail-club"
          htmlType="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={updateLoading}
          disabled={!isChanged}
        >
          Simpan Profil
        </Button>
      </Form>
    </section>
  );
};

export default ClubDetail;
