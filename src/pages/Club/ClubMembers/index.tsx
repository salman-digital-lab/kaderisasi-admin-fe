import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";

import { getClubMembers } from "../../../api/services/clubRegistration";
import {
  createClubMemberRole,
  deleteClubMemberRole,
  updateClubMemberRole,
} from "../../../api/services/clubMemberRole";
import type { ClubMemberRole } from "../../../types/model/clubMemberRole";
import type { ClubRegistration } from "../../../types/model/clubRegistration";

type RoleFormType = {
  role_name: string;
  start_date?: Dayjs;
  end_date?: Dayjs;
  is_primary?: boolean;
  sort_order?: number;
};

const { Title } = Typography;
const pageSize = 20;

const getMemberName = (registration: ClubRegistration): string =>
  registration.member?.profile?.name || registration.member?.email || "N/A";

const ClubMembersPage = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const [form] = Form.useForm<RoleFormType>();
  const [members, setMembers] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<ClubRegistration | null>(
    null,
  );
  const [selectedRole, setSelectedRole] = useState<ClubMemberRole | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const fetchMembers = async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const response = await getClubMembers(Number(clubId), {
        page: currentPage.toString(),
        limit: pageSize.toString(),
        status: "APPROVED",
        search: search || undefined,
      });

      if (response) {
        setMembers(response.data);
        setTotalItems(response.meta.total);
      }
    } catch {
      message.error("Gagal memuat anggota club");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [clubId, currentPage, search]);

  const openCreateRole = (member: ClubRegistration) => {
    setSelectedMember(member);
    setSelectedRole(null);
    form.resetFields();
    form.setFieldsValue({
      is_primary: !member.roles?.length,
      sort_order: member.roles?.length || 0,
    });
    setRoleModalOpen(true);
  };

  const openEditRole = (member: ClubRegistration, role: ClubMemberRole) => {
    setSelectedMember(member);
    setSelectedRole(role);
    form.setFieldsValue({
      role_name: role.role_name,
      start_date: role.start_date ? dayjs(role.start_date) : undefined,
      end_date: role.end_date ? dayjs(role.end_date) : undefined,
      is_primary: role.is_primary,
      sort_order: role.sort_order,
    });
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedMember(null);
    setSelectedRole(null);
    form.resetFields();
  };

  const handleSaveRole = async () => {
    if (!clubId || !selectedMember) return;

    const values = await form.validateFields();
    setSavingRole(true);
    try {
      const payload = {
        role_name: values.role_name,
        start_date: values.start_date
          ? values.start_date.format("YYYY-MM-DD")
          : undefined,
        end_date: values.end_date
          ? values.end_date.format("YYYY-MM-DD")
          : undefined,
        is_primary: values.is_primary,
        sort_order: values.sort_order,
      };

      if (selectedRole) {
        await updateClubMemberRole(selectedRole.id, payload);
      } else {
        await createClubMemberRole(Number(clubId), {
          club_registration_id: selectedMember.id,
          ...payload,
        });
      }

      closeRoleModal();
      fetchMembers();
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: ClubMemberRole) => {
    Modal.confirm({
      title: "Hapus Peran",
      content: `Hapus peran "${role.role_name}" dari anggota ini?`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteClubMemberRole(role.id);
        fetchMembers();
      },
    });
  };

  const columns: ColumnsType<ClubRegistration> = [
    {
      title: "Nama Anggota",
      key: "member",
      render: (_, record) => getMemberName(record),
    },
    {
      title: "Email",
      dataIndex: ["member", "email"],
      key: "email",
    },
    {
      title: "Whatsapp",
      dataIndex: ["member", "profile", "whatsapp"],
      key: "whatsapp",
      render: (value?: string) => value || "-",
    },
    {
      title: "Peran",
      key: "roles",
      render: (_, record) =>
        record.roles?.length ? (
          <Space direction="vertical" size={4}>
            {record.roles.map((role) => (
              <Space key={role.id} size={4} wrap>
                <Tag color={role.is_primary ? "blue" : "default"}>
                  {role.role_name}
                </Tag>
                <Tooltip title="Edit peran">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditRole(record, role)}
                  />
                </Tooltip>
                <Tooltip title="Hapus peran">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteRole(role)}
                  />
                </Tooltip>
              </Space>
            ))}
          </Space>
        ) : (
          <Tag>Belum ada peran</Tag>
        ),
    },
    {
      title: "Tanggal Diterima",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (value: string) => dayjs(value).format("DD MMM YYYY"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 130,
      render: (_, record) => (
        <Button
          icon={<PlusOutlined />}
          onClick={() => openCreateRole(record)}
          size="small"
        >
          Peran
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Title level={4} style={{ margin: 0 }}>
        Anggota Unit
      </Title>
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Cari nama atau email anggota"
          style={{ width: 320 }}
          onSearch={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        />
      </Space>

      <Table
        rowKey="id"
        dataSource={members}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalItems,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} dari ${total} anggota`,
          onChange: (page) => setCurrentPage(page),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={selectedRole ? "Edit Peran Anggota" : "Tambah Peran Anggota"}
        open={roleModalOpen}
        onCancel={closeRoleModal}
        onOk={handleSaveRole}
        confirmLoading={savingRole}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Anggota"
            help={selectedMember ? getMemberName(selectedMember) : undefined}
          >
            <Input
              value={selectedMember ? getMemberName(selectedMember) : ""}
              disabled
            />
          </Form.Item>
          <Form.Item
            label="Peran"
            name="role_name"
            rules={[{ required: true, message: "Peran wajib diisi!" }]}
          >
            <Input placeholder="Contoh: Ketua Divisi Kaderisasi" />
          </Form.Item>
          <Space size="middle" style={{ width: "100%" }}>
            <Form.Item label="Mulai" name="start_date">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label="Selesai" name="end_date">
              <DatePicker style={{ width: 160 }} />
            </Form.Item>
          </Space>
          <Form.Item label="Urutan" name="sort_order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Peran Utama"
            name="is_primary"
            valuePropName="checked"
          >
            <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ClubMembersPage;
