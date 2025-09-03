import {
  Form,
  Input,
  Col,
  Row,
  Button,
  Card,
  Descriptions,
  Space,
  Flex,
  Skeleton,
  InputNumber,
  Select,
  Divider,
  Image,
  Table,
} from "antd";
import {
  EditOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import { useRequest, useToggle } from "ahooks";

import {
  getActivityByUserId,
  getProfile,
  putProfile,
} from "../../../api/services/member";
import { getUniversities } from "../../../api/services/university";
import { GENDER_OPTION, USER_LEVEL_OPTIONS } from "../../../constants/options";
import { getProvinces } from "../../../api/services/province";
import { GENDER } from "../../../types/constants/profile";
import EditAuthDataModal from "./components/EditAuthDataModal";
import { useState } from "react";

type FormType = {
  name?: string;
  gender?: GENDER;
  personal_id: string;
  tiktok: string;
  linkedin: string;
  whatsapp?: string;
  line?: string;
  instagram?: string;
  province_id?: number;
  city_id?: number;
  university_id?: number;
  major?: string;
  intake_year?: number;
  level?: number;
  badges?: string[];
};

const MemberDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<FormType>();

  const [isEdit, { toggle: toggleEdit }] = useToggle(false);
  const [isOpen, setIsOpen] = useState(false);
  const { data, loading, refresh } = useRequest(() => getProfile(id || ""), {
    onSuccess: (data) => {
      form.setFieldsValue({
        name: data?.profile[0].name,
        personal_id: data?.profile[0].personal_id,
        whatsapp: data?.profile[0].whatsapp,
        instagram: data?.profile[0].instagram,
        linkedin: data?.profile[0].linkedin,
        tiktok: data?.profile[0].instagram,
        line: data?.profile[0].line,
        major: data?.profile[0].major,
        intake_year: data?.profile[0].intake_year,
        university_id: data?.profile[0].university_id,
        province_id: data?.profile[0].province_id,
        level: data?.profile[0].level,
        gender: data?.profile[0].gender,
        badges: data?.profile[0].badges,
      });
    },
  });
  const { data: myActivities } = useRequest(
    () => getActivityByUserId(data?.profile?.[0]?.user_id?.toString() || ""),
    {
      ready: !!data?.profile?.[0]?.user_id,
    },
  );

  const { loading: editLoading, runAsync } = useRequest(putProfile, {
    manual: true,
  });

  const { data: universities } = useRequest(
    () => getUniversities({ per_page: "10000", page: "1" }),
    {
      cacheKey: "universities_all",
      cacheTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
      staleTime: 1000 * 60 * 60 * 24, // Consider data stale after 24 hours
      setCache: (data) =>
        localStorage.setItem("universities_all", JSON.stringify(data)),
      getCache: () => {
        const cache = localStorage.getItem("universities_all");
        return cache ? JSON.parse(cache) : undefined;
      },
    },
  );

  const { data: provinces } = useRequest(() => getProvinces({}));

  if (loading) {
    return (
      <Card>
        <Skeleton />
      </Card>
    );
  }

  return (
    <Space direction="vertical">
      <Link to="/member" style={{ display: 'inline-block' }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          style={{ 
            pointerEvents: 'auto',
            transition: 'none' // Remove transitions for immediate responsiveness
          }}
        >
          Kembali
        </Button>
      </Link>
      <Card>
        <Flex justify="flex-end">
          <EditAuthDataModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            id={data?.profile[0]?.publicUser?.id.toString() || ""}
            refresh={refresh}
          />
          <Button onClick={() => setIsOpen(true)}>
            Ubah Email dan Password
          </Button>
        </Flex>
        <Space>
          <Image
            style={{ flex: 1 }}
            width={200}
            height={200}
            src={`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${data?.profile[0]?.picture}`}
            fallback="https://placehold.co/200x200?text=Tidak ada gambar"
          />
          <Descriptions
            title="Data Akun"
            items={[
              {
                key: "1",
                label: "Alamat Email",
                children: data?.profile[0]?.publicUser?.email,
              },
            ]}
          />
        </Space>
      </Card>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Flex justify="flex-end">
            {isEdit ? (
              <div>
                <Button
                  form="profile"
                  htmlType="submit"
                  loading={editLoading}
                  icon={<SaveOutlined />}
                  type="primary"
                >
                  Simpan
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => toggleEdit()}
              >
                Ubah
              </Button>
            )}
          </Flex>
          <Form
            id="profile"
            layout="vertical"
            form={form}
            disabled={!isEdit}
            onFinish={async (value) => {
              await runAsync(id || "", {
                data: {
                  gender: value.gender,
                  whatsapp: value.whatsapp,
                  line: value.line,
                  instagram: value.instagram,
                  province_id: value.province_id,
                  city_id: value.city_id,
                  university_id: value.university_id,
                  major: value.major,
                  level: value.level,
                  intake_year: value.intake_year,
                  badges: JSON.stringify(value.badges || []),
                  name: value.name,
                },
              });
              toggleEdit();
            }}
          >
            <Divider>Informasi Akun</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="badges" label="Lencana">
                  <Select
                    mode="tags"
                    style={{ width: "100%" }}
                    options={
                      data?.profile[0].badges?.map((badge) => ({
                        label: badge,
                        value: badge,
                      })) || []
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="level" label="Jenjang">
                  <Select
                    style={{ width: "100%" }}
                    options={USER_LEVEL_OPTIONS}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Divider>Informasi Pribadi</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Nama Lengkap">
                  <Input />
                </Form.Item>

                <Form.Item name="gender" label="Jenis Kelamin">
                  <Select style={{ width: "100%" }} options={GENDER_OPTION} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="personal_id" label="Nomor Identitas">
                  <Input />
                </Form.Item>
                <Form.Item name="province_id" label="Provinsi">
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    optionFilterProp="label"
                    options={provinces?.data.map((province) => ({
                      label: province.name,
                      value: province.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Divider>Informasi Pendidikan</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="university_id" label="Perguruan Tinggi">
                  <Select
                    showSearch
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    options={universities?.data.map((university) => ({
                      label: university.name,
                      value: university.id,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="major" label="Jurusan">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="intake_year" label="Angkatan">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Informasi Kontak dan Sosial Media</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="whatsapp" label="Whatsapp">
                  <Input />
                </Form.Item>
                <Form.Item name="instagram" label="Instagram">
                  <Input />
                </Form.Item>
                <Form.Item name="line" label="ID Line">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tiktok" label="Tiktok">
                  <Input />
                </Form.Item>
                <Form.Item name="linkedin" label="LinkedIn">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Space>
      </Card>
      <Card title="Kegiatan yang diikuti">
        <Table
          dataSource={myActivities}
          columns={[
            {
              title: "Nama Aktivitas",
              dataIndex: "activity",
              render: (activity) => (
                <Link to={`/activity/${activity.id}`}>{activity.name}</Link>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
            },
          ]}
          pagination={false}
        />
      </Card>
    </Space>
  );
};

export default MemberDetailPage;
