import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Switch,
  Row,
  Col,
  Select,
  Divider,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { getClub, putClub } from "../../../../api/services/club";
import type { ClubType } from "../../../../types/model/club";
import { RichTextEditor } from "../../../../components/common/RichTextEditor";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import { serializeClubDate } from "../../utils/mutation-payloads";

const { Title } = Typography;

type FieldType = {
  name: string;
  club_type: ClubType;
  description?: string;
  short_description?: string;
  start_period?: Dayjs | null;
  end_period?: Dayjs | null;
  is_show?: boolean;
  is_registration_open?: boolean;
  registration_end_date?: Dayjs | null;
};

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<FieldType>();
  const isShown = Form.useWatch("is_show", form);
  const isRegistrationOpen = Form.useWatch("is_registration_open", form);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [isChanged, setIsChanged] = useState(false);

  const { loading: fetchLoading } = useRequest(() => getClub(Number(id)), {
    ready: !!id,
    onSuccess: (data) => {
      if (data) {
        setDescription(data.description || "");
        setShortDescription(data.short_description || "");
        form.setFieldsValue({
          name: data.name,
          club_type: data.club_type,
          start_period: data.start_period
            ? dayjs(data.start_period)
            : undefined,
          end_period: data.end_period ? dayjs(data.end_period) : undefined,
          is_show: data.is_show,
          is_registration_open: data.is_registration_open,
          registration_end_date: data.registration_end_date
            ? dayjs(data.registration_end_date)
            : undefined,
        });
      }
    },
  });

  const { loading: updateLoading, run: updateClub } = useRequest(
    (data: FieldType) =>
      putClub(Number(id), {
        ...data,
        description,
        short_description: shortDescription,
        start_period: serializeClubDate(data.start_period),
        end_period: serializeClubDate(data.end_period),
        registration_end_date: serializeClubDate(data.registration_end_date),
      }),
    {
      manual: true,
      onSuccess: (data) => {
        if (data) {
          setDescription(data.description || "");
          setShortDescription(data.short_description || "");
          setIsChanged(false);
        }
      },
    },
  );

  return (
    <Skeleton loading={fetchLoading}>
      <Form
        form={form}
        id="detail-club"
        layout="vertical"
        onFinish={updateClub}
        onValuesChange={() => setIsChanged(true)}
      >
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Space align="center" size="middle" wrap>
            <Title level={4} style={{ margin: 0 }}>
              Detail Umum
            </Title>
            <Tag color={isShown ? "green" : "default"}>
              {isShown ? "Tayang" : "Draf"}
            </Tag>
            <Tag color={isRegistrationOpen ? "green" : "default"}>
              {isRegistrationOpen
                ? "Pendaftaran Dibuka"
                : "Pendaftaran Ditutup"}
            </Tag>
          </Space>
          <Button
            form="detail-club"
            htmlType="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={updateLoading}
            disabled={!isChanged}
          >
            Simpan
          </Button>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tipe Club"
              name="club_type"
              rules={[{ required: true, message: "Tipe club wajib dipilih!" }]}
            >
              <Select
                options={CLUB_TYPE_OPTIONS}
                placeholder="Pilih tipe club"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Nama Unit Kegiatan"
              name="name"
              rules={[
                { required: true, message: "Nama unit kegiatan wajib diisi!" },
              ]}
            >
              <Input placeholder="Masukkan nama unit kegiatan" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Deskripsi Singkat">
          <Input.TextArea
            value={shortDescription}
            onChange={(event) => {
              setShortDescription(event.target.value);
              setIsChanged(true);
            }}
            placeholder="Masukkan deskripsi singkat unit kegiatan (maks. 200 karakter)"
            maxLength={200}
            showCount
            rows={3}
          />
        </Form.Item>

        <Form.Item label="Deskripsi">
          <RichTextEditor
            value={description}
            onChange={(value) => {
              setDescription(value);
              setIsChanged(true);
            }}
            minHeight="200px"
          />
        </Form.Item>

        <Divider style={{ margin: "12px 0" }} />
        <Row style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            Detail Waktu
          </Title>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Periode Mulai" name="start_period">
              <DatePicker
                picker="month"
                placeholder="Pilih bulan mulai"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Periode Berakhir" name="end_period">
              <DatePicker
                picker="month"
                placeholder="Pilih bulan berakhir"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "12px 0" }} />
        <Row style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            Status Unit Kegiatan
          </Title>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Pendaftaran Dibuka"
              name="is_registration_open"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tanggal Berakhir Pendaftaran"
              name="registration_end_date"
            >
              <DatePicker
                placeholder="Pilih tanggal berakhir pendaftaran"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tampilkan Unit Kegiatan"
              name="is_show"
              valuePropName="checked"
            >
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Skeleton>
  );
};

export default ClubDetail;
