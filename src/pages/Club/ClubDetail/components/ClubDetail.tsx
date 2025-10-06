import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Form, Input, Button, DatePicker, Switch, Row, Col } from "antd";
import { useRequest } from "ahooks";
import dayjs from "dayjs";

import { getClub, putClub } from "../../../../api/services/club";
import { Club } from "../../../../types/model/club";
import { RichTextEditor } from "../../../../components/common/RichTextEditor";

type FieldType = {
  name: string;
  description?: string;
  short_description?: string;
  start_period?: any;
  end_period?: any;
  is_show?: boolean;
  is_registration_open?: boolean;
  registration_end_date?: any;
};

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<FieldType>();
  const [, setClubData] = useState<Club | null>(null);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  const { loading: fetchLoading } = useRequest(
    () => getClub(Number(id)),
    {
      ready: !!id,
      onSuccess: (data) => {
        if (data) {
          setClubData(data);
          setDescription(data.description || "");
          setShortDescription(data.short_description || "");
          form.setFieldsValue({
            name: data.name,
            start_period: data.start_period ? dayjs(data.start_period) : undefined,
            end_period: data.end_period ? dayjs(data.end_period) : undefined,
            is_show: data.is_show,
            is_registration_open: data.is_registration_open,
            registration_end_date: data.registration_end_date ? dayjs(data.registration_end_date) : undefined,
          });
        }
      },
    }
  );

  const { loading: updateLoading, run: updateClub } = useRequest(
    (data: FieldType) => putClub(Number(id), { 
      ...data, 
      description,
      short_description: shortDescription,
      start_period: data.start_period ? dayjs(data.start_period).format('YYYY-MM-DD') : undefined,
      end_period: data.end_period ? dayjs(data.end_period).format('YYYY-MM-DD') : undefined,
      registration_end_date: data.registration_end_date ? dayjs(data.registration_end_date).format('YYYY-MM-DD') : undefined,
    }),
    {
      manual: true,
      onSuccess: (data) => {
        if (data) {
          setClubData(data);
          setDescription(data.description || "");
          setShortDescription(data.short_description || "");
        }
      },
    }
  );

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      updateClub(values);
    });
  };

  if (fetchLoading) {
    return <Card loading />;
  }

  return (
    <Card 
      title="Informasi Unit Kegiatan"
      extra={
        <Button 
          type="primary" 
          onClick={handleSubmit}
          loading={updateLoading}
        >
          Simpan Perubahan
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Nama Unit Kegiatan"
          name="name"
          rules={[{ required: true, message: "Nama unit kegiatan wajib diisi!" }]}
        >
          <Input placeholder="Masukkan nama unit kegiatan" />
        </Form.Item>
        
        <Form.Item label="Deskripsi Singkat">
          <Input.TextArea 
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Masukkan deskripsi singkat unit kegiatan (maks. 200 karakter)"
            maxLength={200}
            showCount
            rows={3}
          />
        </Form.Item>
        
        <Form.Item label="Deskripsi">
          <RichTextEditor
            value={description}
            onChange={setDescription}
            minHeight="200px"
          />
        </Form.Item>

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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Pendaftaran Dibuka" name="is_registration_open" valuePropName="checked">
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tanggal Berakhir Pendaftaran" name="registration_end_date">
              <DatePicker 
                placeholder="Pilih tanggal berakhir pendaftaran"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item label="Tampilkan Unit Kegiatan" name="is_show" valuePropName="checked">
          <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ClubDetail;
