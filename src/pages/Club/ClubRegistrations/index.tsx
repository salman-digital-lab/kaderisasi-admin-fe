import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Space,
  message,
  Row,
  Col,
  Typography,
  DatePicker,
  InputNumber,
  Switch,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  getClubRegistrations,
  createClubRegistration,
  updateClubRegistration,
  deleteClubRegistration,
  bulkUpdateClubRegistrations,
  exportClubRegistrations,
} from "../../../api/services/clubRegistration";
import { getClub } from "../../../api/services/club";
import {
  createClubMemberRole,
  deleteClubMemberRole,
  updateClubMemberRole,
} from "../../../api/services/clubMemberRole";
import type { ClubRegistration } from "../../../types/model/clubRegistration";
import type { Club } from "../../../types/model/club";
import type { ClubMemberRole } from "../../../types/model/clubMemberRole";
import MembersListModal from "./components/MembersListModal";
import { CLUB_REGISTRATION_STATUS_OPTIONS } from "../../../constants/options";

const { Option } = Select;
const { confirm } = Modal;
const { Title } = Typography;

type RegistrationFormType = {
  member_id: number;
  status: ClubRegistration["status"];
  additional_data?: string;
};

type FilterFormType = {
  status?: ClubRegistration["status"];
};

type RoleFormType = {
  role_name: string;
  start_date?: Dayjs;
  end_date?: Dayjs;
  is_primary?: boolean;
  sort_order?: number;
};

const getMemberName = (registration: ClubRegistration): string =>
  registration.member?.profile?.name || registration.member?.email || "N/A";

const ClubRegistrationsPage: React.FC = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const [filterForm] = Form.useForm<FilterFormType>();
  const [registrationForm] = Form.useForm<RegistrationFormType>();
  const [roleForm] = Form.useForm<RoleFormType>();

  const [club, setClub] = useState<Club | null>(null);
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<ClubRegistration | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRole, setSelectedRole] = useState<ClubMemberRole | null>(null);
  const [roleRegistration, setRoleRegistration] =
    useState<ClubRegistration | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    if (clubId) {
      fetchClubData();
      fetchRegistrations();
    }
  }, [clubId, currentPage, statusFilter]);

  const fetchClubData = async () => {
    try {
      const response = await getClub(Number(clubId!));
      if (response) {
        setClub(response);
      }
    } catch {
      message.error("Gagal memuat data klub");
    }
  };

  const fetchRegistrations = async () => {
    if (!clubId) return;

    setLoading(true);
    try {
      const response = await getClubRegistrations(Number(clubId), {
        page: currentPage.toString(),
        limit: pageSize.toString(),
        status: statusFilter || undefined,
      });
      if (response) {
        setRegistrations(response.data);
        setTotalItems(response.meta.total);
      }
    } catch {
      message.error("Gagal memuat keanggotaan");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setIsMembersModalVisible(true);
  };

  const handleEditRegistration = (registration: ClubRegistration) => {
    setSelectedRegistration(registration);
    registrationForm.setFieldsValue({
      status: registration.status,
      additional_data: JSON.stringify(registration.additional_data, null, 2),
    });
    setIsModalVisible(true);
  };

  const handleDeleteRegistration = (registration: ClubRegistration) => {
    confirm({
      title: "Hapus Keanggotaan",
      icon: <ExclamationCircleOutlined />,
      content: `Apakah Anda yakin ingin menghapus keanggotaan untuk ${registration.member?.profile?.name || registration.member?.email}?`,
      onOk: async () => {
        try {
          await deleteClubRegistration(registration.id);
          fetchRegistrations();
        } catch {
          // Error is already handled by the API function
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await registrationForm.validateFields();

      if (selectedRegistration) {
        // Update existing registration
        await updateClubRegistration(selectedRegistration.id, {
          status: values.status,
          additional_data: values.additional_data
            ? JSON.parse(values.additional_data)
            : {},
        });
      } else {
        // Create new registration
        await createClubRegistration(Number(clubId!), {
          member_id: values.member_id,
          additional_data: values.additional_data
            ? JSON.parse(values.additional_data)
            : {},
        });
      }

      setIsModalVisible(false);
      registrationForm.resetFields();
      fetchRegistrations();
    } catch {
      // Error is already handled by the API function
    }
  };

  const openCreateRole = (registration: ClubRegistration) => {
    setRoleRegistration(registration);
    setSelectedRole(null);
    roleForm.resetFields();
    roleForm.setFieldsValue({
      is_primary: !registration.roles?.length,
      sort_order: registration.roles?.length || 0,
    });
    setRoleModalOpen(true);
  };

  const openEditRole = (
    registration: ClubRegistration,
    role: ClubMemberRole,
  ) => {
    setRoleRegistration(registration);
    setSelectedRole(role);
    roleForm.setFieldsValue({
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
    setRoleRegistration(null);
    setSelectedRole(null);
    roleForm.resetFields();
  };

  const handleSaveRole = async () => {
    if (!clubId || !roleRegistration) return;

    const values = await roleForm.validateFields();
    setSavingRole(true);
    try {
      const payload = {
        role_name: values.role_name,
        start_date: values.start_date?.format("YYYY-MM-DD"),
        end_date: values.end_date?.format("YYYY-MM-DD"),
        is_primary: values.is_primary,
        sort_order: values.sort_order,
      };

      if (selectedRole) {
        await updateClubMemberRole(selectedRole.id, payload);
      } else {
        await createClubMemberRole(Number(clubId), {
          club_registration_id: roleRegistration.id,
          ...payload,
        });
      }

      closeRoleModal();
      fetchRegistrations();
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = (role: ClubMemberRole) => {
    Modal.confirm({
      title: "Hapus Peran",
      content: `Hapus peran "${role.role_name}" dari anggota ini?`,
      okText: "Hapus",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteClubMemberRole(role.id);
        fetchRegistrations();
      },
    });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Silakan pilih keanggotaan yang akan diperbarui");
      return;
    }

    try {
      await bulkUpdateClubRegistrations({
        registrations: selectedRowKeys.map((key) => ({
          id: Number(key),
          status: status as "PENDING" | "APPROVED" | "REJECTED",
        })),
      });
      setSelectedRowKeys([]);
      fetchRegistrations();
    } catch {
      // Error is already handled by the API function
    }
  };

  const handleExport = async () => {
    if (!clubId) return;

    try {
      const blob = await exportClubRegistrations(Number(clubId));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${club?.name || "unit-kegiatan"}_registrations.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error is already handled by the API function
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "orange",
      APPROVED: "green",
      REJECTED: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const columns: ColumnsType<ClubRegistration> = [
    {
      title: "Nama Anggota",
      dataIndex: ["member", "profile", "name"],
      key: "memberName",
      render: (name: string, record: ClubRegistration) =>
        name || record.member?.email || "N/A",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusOption = CLUB_REGISTRATION_STATUS_OPTIONS.find(
          (option) => option.value === status,
        );
        return (
          <Tag color={getStatusColor(status)}>
            {statusOption ? statusOption.label : status}
          </Tag>
        );
      },
    },
    {
      title: "Peran",
      key: "roles",
      render: (_, record) => {
        if (record.status !== "APPROVED") {
          return (
            <span style={{ color: "#8c8c8c" }}>Belum menjadi anggota</span>
          );
        }

        return record.roles?.length ? (
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
        );
      },
    },
    {
      title: "Tanggal Keanggotaan",
      dataIndex: "created_at",
      key: "registrationDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          {record.status === "APPROVED" ? (
            <Tooltip title="Tambah peran">
              <Button
                icon={<PlusOutlined />}
                onClick={() => openCreateRole(record)}
                size="small"
              />
            </Tooltip>
          ) : null}
          <Tooltip title="Edit pendaftaran">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditRegistration(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Hapus pendaftaran">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteRegistration(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Title level={4} style={{ margin: 0 }}>
          {club?.name} - Anggota & Pendaftaran
        </Title>
        <MembersListModal
          open={isMembersModalVisible}
          toggle={setIsMembersModalVisible}
          onSuccess={() => {
            fetchRegistrations();
          }}
        />

        <Form
          layout="vertical"
          form={filterForm}
          onFinish={(val) => {
            setStatusFilter(val.status || "");
            setCurrentPage(1);
          }}
        >
          <Row gutter={16} align="bottom">
            <Col xs={24} md={8} lg={6}>
              <Form.Item label="Status Keanggotaan" name="status">
                <Select
                  options={CLUB_REGISTRATION_STATUS_OPTIONS}
                  placeholder="Status Keanggotaan"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col flex="auto">
              <Form.Item>
                <Space wrap>
                  <Button
                    onClick={() => handleBulkStatusUpdate("APPROVED")}
                    icon={<EditOutlined />}
                    disabled={!selectedRowKeys.length}
                    type="primary"
                  >
                    Terima
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusUpdate("REJECTED")}
                    icon={<EditOutlined />}
                    disabled={!selectedRowKeys.length}
                    danger
                  >
                    Tolak
                  </Button>
                  <Button onClick={handleExport} icon={<DownloadOutlined />}>
                    Export XLSX
                  </Button>
                  <Button onClick={handleAddMember} icon={<PlusOutlined />}>
                    Tambah Keanggotaan
                  </Button>
                  <Button
                    icon={<SearchOutlined />}
                    type="primary"
                    htmlType="submit"
                  />
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          dataSource={registrations}
          columns={columns}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            total: totalItems,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} item`,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: 1200 }}
        />
      </Space>

      <Modal
        title={selectedRegistration ? "Edit Keanggotaan" : "Buat Keanggotaan"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={registrationForm} layout="vertical">
          {!selectedRegistration && (
            <Form.Item
              name="member_id"
              label="ID Anggota"
              rules={[
                { required: true, message: "Silakan masukkan ID anggota" },
              ]}
            >
              <Input placeholder="Masukkan ID anggota" />
            </Form.Item>
          )}

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Silakan pilih status" }]}
          >
            <Select placeholder="Pilih status">
              {CLUB_REGISTRATION_STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={selectedRole ? "Edit Peran Anggota" : "Tambah Peran Anggota"}
        open={roleModalOpen}
        onCancel={closeRoleModal}
        onOk={handleSaveRole}
        confirmLoading={savingRole}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={roleForm} layout="vertical">
          <Form.Item label="Anggota">
            <Input
              value={roleRegistration ? getMemberName(roleRegistration) : ""}
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
    </>
  );
};

export default ClubRegistrationsPage;
