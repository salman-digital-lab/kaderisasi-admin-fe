import {
  Form,
  Input,
  Col,
  Row,
  Button,
  Descriptions,
  Space,
  Flex,
  Skeleton,
  InputNumber,
  Select,
  Divider,
  Image,
  Table,
  DatePicker,
  Tag,
  Card,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useRequest, useToggle } from "ahooks";
import { useState, useEffect } from "react";

import {
  getActivityByUserId,
  getProfile,
  putProfile,
} from "../../../api/services/member";
import { GENDER_OPTION, USER_LEVEL_OPTIONS } from "../../../constants/options";
import { getProvinces, getDataProvinceId } from "../../../api/services/province";
import EditAuthDataModal from "./components/EditAuthDataModal";
import GenerateAccountModal from "./components/GenerateAccountModal";
import { EducationEntry, WorkEntry, Member } from "../../../types/model/members";
import UniversityNameSelect from "../../../components/common/UniversityNameSelect";

type FormType = {
  name?: string;
  personal_id?: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  line?: string;
  gender?: string;
  city_id?: number;
  province_id?: number;
  birth_date?: dayjs.Dayjs | string;
  level?: number;
  badges?: string[];
  origin_province_id?: number;
  origin_city_id?: number;
  country?: string;
  education_history?: EducationEntry[];
  work_history?: WorkEntry[];
};

const ACCOUNT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "green" },
  no_account: { label: "Tanpa Akun", color: "default" },
};

const DEGREE_OPTIONS = [
  { label: "S1 (Sarjana)", value: "bachelor" },
  { label: "S2 (Magister)", value: "master" },
  { label: "S3 (Doktor)", value: "doctoral" },
];

const MemberDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<FormType>();

  const [isEdit, { setLeft: exitEdit, setRight: enterEdit }] = useToggle(false);
  const [isEditAuthOpen, setIsEditAuthOpen] = useState(false);
  const [isGenerateAccountOpen, setIsGenerateAccountOpen] = useState(false);
  const [regionalInput, setRegionalInput] = useState<string[]>([]);

  const resetFormToProfile = (profile: Member | undefined) => {
    form.setFieldsValue({
      name: profile?.name,
      personal_id: profile?.personal_id,
      whatsapp: profile?.whatsapp,
      instagram: profile?.instagram,
      linkedin: profile?.linkedin,
      tiktok: profile?.tiktok,
      line: profile?.line,
      province_id: profile?.province_id,
      city_id: profile?.city_id,
      level: profile?.level,
      gender: profile?.gender,
      badges: profile?.badges,
      birth_date: profile?.birth_date ? dayjs(profile.birth_date) : undefined,
      origin_province_id: profile?.origin_province_id,
      origin_city_id: profile?.origin_city_id,
      country: profile?.country,
      education_history: profile?.education_history ?? [],
      work_history: profile?.work_history ?? [],
    });
    setRegionalInput(profile?.extra_data?.alumni_regional_assignment ?? []);
  };

  const { data, loading, refresh } = useRequest(() => getProfile(id || ""), {
    onSuccess: (data) => {
      resetFormToProfile(data?.profile[0]);
    },
  });

  const { data: myActivities } = useRequest(
    () => getActivityByUserId(data?.profile?.[0]?.user_id?.toString() || ""),
    { ready: !!data?.profile?.[0]?.user_id },
  );

  const { loading: editLoading, runAsync } = useRequest(putProfile, { manual: true });

  const { data: provinces } = useRequest(() => getProvinces({}));

  const [currentProvinceId, setCurrentProvinceId] = useState<string | undefined>();
  const [originProvinceId, setOriginProvinceId] = useState<string | undefined>();

  const { data: currentCities, run: loadCurrentCities } = useRequest(
    (id: string) => getDataProvinceId(id),
    { manual: true },
  );
  const { data: originCities, run: loadOriginCities } = useRequest(
    (id: string) => getDataProvinceId(id),
    { manual: true },
  );

  useEffect(() => {
    const pid = data?.profile[0]?.province_id?.toString();
    const opid = data?.profile[0]?.origin_province_id?.toString();
    if (pid) { setCurrentProvinceId(pid); loadCurrentCities(pid); }
    if (opid) { setOriginProvinceId(opid); loadOriginCities(opid); }
  }, [data, loadCurrentCities, loadOriginCities]);

  const profile = data?.profile[0];
  const publicUser = profile?.publicUser;
  const accountStatus = publicUser?.account_status ?? "no_account";
  const statusMeta =
    ACCOUNT_STATUS_LABEL[accountStatus] ?? { label: accountStatus, color: "default" };

  if (loading) {
    return (
      <Card style={{ borderRadius: 0, boxShadow: "none" }}>
        <Skeleton />
      </Card>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <Card style={{ borderRadius: 0, boxShadow: "none" }}>
        {/* Account info + picture */}
        <Flex gap={24} wrap="wrap" align="flex-start">
          <Image
            width={160}
            height={160}
            src={`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${profile?.picture}`}
            fallback="https://placehold.co/160x160?text=No+Photo"
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
          <Flex vertical gap={12} style={{ flex: 1 }}>
            <Descriptions
              column={2}
              items={[
                {
                  key: "member_id",
                  label: "ID Anggota",
                  children: (
                    <span style={{ fontFamily: "monospace" }}>
                      {publicUser?.member_id ?? "-"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  label: "Status Akun",
                  children: <Tag color={statusMeta.color}>{statusMeta.label}</Tag>,
                },
                {
                  key: "email",
                  label: "Email",
                  children: publicUser?.email ?? (
                    <em style={{ color: "#999" }}>Tidak ada</em>
                  ),
                },
              ]}
            />
            <Space>
              {accountStatus === "no_account" ? (
                <Button type="primary" onClick={() => setIsGenerateAccountOpen(true)}>
                  Buat Akun
                </Button>
              ) : (
                <Button onClick={() => setIsEditAuthOpen(true)}>
                  Ubah Email dan Password
                </Button>
              )}
            </Space>
          </Flex>
        </Flex>

        {/* Edit toggle */}
        <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
          {isEdit ? (
            <>
              <Button
                htmlType="button"
                onClick={() => {
                  resetFormToProfile(data?.profile[0]);
                  exitEdit();
                }}
              >
                Batal
              </Button>
              <Button
                form="profile"
                htmlType="submit"
                loading={editLoading}
                icon={<SaveOutlined />}
                type="primary"
              >
                Simpan
              </Button>
            </>
          ) : (
            <Button type="primary" icon={<EditOutlined />} htmlType="button" onClick={() => enterEdit()}>
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = {
              gender: value.gender,
              whatsapp: value.whatsapp,
              line: value.line,
              instagram: value.instagram,
              tiktok: value.tiktok,
              linkedin: value.linkedin,
              province_id: value.province_id,
              city_id: value.city_id,
              level: value.level,
              badges: JSON.stringify(value.badges || []),
              name: value.name,
              birth_date: value.birth_date ? value.birth_date.toString() : undefined,
              origin_province_id: value.origin_province_id,
              origin_city_id: value.origin_city_id,
              country: value.country,
              education_history: value.education_history ?? [],
              work_history: value.work_history ?? [],
              extra_data: { alumni_regional_assignment: regionalInput },
            };
            await runAsync(id || "", { data: payload });
            exitEdit();
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
                    profile?.badges?.map((badge) => ({ label: badge, value: badge })) || []
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="Jenjang">
                <Select style={{ width: "100%" }} options={USER_LEVEL_OPTIONS} />
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
              <Form.Item name="birth_date" label="Tanggal Lahir">
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>

            </Col>
            <Col span={12}>
              <Form.Item name="personal_id" label="Nomor Identitas">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Domisili Saat Ini</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="province_id" label="Provinsi">
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={provinces?.data.map((p) => ({ label: p.name, value: p.id }))}
                  onChange={(val) => {
                    setCurrentProvinceId(val?.toString());
                    form.setFieldValue("city_id", undefined);
                    if (val) loadCurrentCities(val.toString());
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city_id" label="Kota / Kabupaten">
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  disabled={!isEdit || !currentProvinceId}
                  options={(currentCities?.data ?? []).map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="country" label="Negara">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Asal Daerah</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="origin_province_id" label="Provinsi Asal">
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={provinces?.data.map((p) => ({ label: p.name, value: p.id }))}
                  onChange={(val) => {
                    setOriginProvinceId(val?.toString());
                    form.setFieldValue("origin_city_id", undefined);
                    if (val) loadOriginCities(val.toString());
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="origin_city_id" label="Kota / Kabupaten Asal">
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  disabled={!isEdit || !originProvinceId}
                  options={(originCities?.data ?? []).map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Riwayat Pendidikan</Divider>
          <Form.List name="education_history">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={16} align="top">
                    <Col span={5}>
                      <Form.Item name={[name, "degree"]} label="Jenjang">
                        <Select options={DEGREE_OPTIONS} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item name={[name, "institution"]} label="Institusi">
                        <UniversityNameSelect placeholder="Cari universitas" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[name, "major"]} label="Jurusan">
                        <Input placeholder="Jurusan" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, "intake_year"]} label="Tahun Masuk">
                        <InputNumber style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label=" ">
                        <Button
                          danger
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          disabled={!isEdit}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ degree: "bachelor", institution: "", major: "", intake_year: undefined })
                    }
                    icon={<PlusOutlined />}
                    disabled={!isEdit}
                  >
                    Tambah Pendidikan
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>Riwayat Pekerjaan</Divider>
          <Form.List name="work_history">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={16} align="top">
                    <Col span={6}>
                      <Form.Item name={[name, "job"]} label="Jabatan">
                        <Input placeholder="Jabatan" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[name, "organization"]} label="Organisasi / Institusi">
                        <Input placeholder="Nama organisasi" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, "role"]} label="Peran">
                        <Input placeholder="Peran" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, "description"]} label="Deskripsi">
                        <Input placeholder="Opsional" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label=" ">
                        <Button
                          danger
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          disabled={!isEdit}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ job: "", organization: "", role: "", description: "" })
                    }
                    icon={<PlusOutlined />}
                    disabled={!isEdit}
                  >
                    Tambah Pekerjaan
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

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

        {/* Regional assignment */}
        <Divider>Penugasan Regional Alumni</Divider>
        {isEdit ? (
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="Tambah penugasan regional"
            value={regionalInput}
            onChange={(val) => setRegionalInput(val)}
          />
        ) : (
          <Space size={4} wrap>
            {(profile?.extra_data?.alumni_regional_assignment ?? []).length === 0 ? (
              <span style={{ color: "#999" }}>Belum ada penugasan</span>
            ) : (
              profile?.extra_data?.alumni_regional_assignment?.map((r, i) => (
                <Tag key={i}>{r}</Tag>
              ))
            )}
          </Space>
        )}

        {/* Activity history */}
        <Divider>Kegiatan yang Diikuti</Divider>
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
            { title: "Status", dataIndex: "status" },
          ]}
          pagination={false}
          size="small"
        />
      </Card>

      <EditAuthDataModal
        isOpen={isEditAuthOpen}
        setIsOpen={setIsEditAuthOpen}
        id={publicUser?.id.toString() || ""}
        refresh={refresh}
      />
      <GenerateAccountModal
        isOpen={isGenerateAccountOpen}
        setIsOpen={setIsGenerateAccountOpen}
        userId={publicUser?.id.toString() || ""}
        refresh={refresh}
      />
    </div>
  );
};

export default MemberDetailPage;
