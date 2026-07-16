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
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  getClubRegistrations,
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
import ApplicationDetailDrawer from "./components/ApplicationDetailDrawer";
import MembersListModal from "./components/MembersListModal";
import { CLUB_REGISTRATION_STATUS_OPTIONS } from "../../../constants/options";
import { createRegistrationStatusPayload } from "../utils/mutation-payloads";

const { Text, Title } = Typography;

type RegistrationFormType = {
  status: ClubRegistration["status"];
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

type BulkStatus = Extract<ClubRegistration["status"], "APPROVED" | "REJECTED">;

const getMemberName = (registration: ClubRegistration): string =>
  registration.member?.profile?.name || registration.member?.email || "N/A";

const ClubRegistrationsPage: React.FC = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const [filterForm] = Form.useForm<FilterFormType>();
  const [registrationForm] = Form.useForm<RegistrationFormType>();
  const [roleForm] = Form.useForm<RoleFormType>();

  const [club, setClub] = useState<Club | null>(null);
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<ClubRegistration | null>(null);
  const [viewedRegistration, setViewedRegistration] =
    useState<ClubRegistration | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRole, setSelectedRole] = useState<ClubMemberRole | null>(null);
  const [roleRegistration, setRoleRegistration] =
    useState<ClubRegistration | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState<BulkStatus | null>(null);
  const [reviewingStatus, setReviewingStatus] = useState<BulkStatus | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (clubId) {
      fetchClubData();
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      fetchRegistrations();
    }
  }, [clubId, currentPage, pageSize, statusFilter]);

  const fetchClubData = async () => {
    try {
      const response = await getClub(Number(clubId!));
      if (response) {
        setClub(response);
      }
    } catch {
      messageApi.error("Gagal memuat data klub");
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
      messageApi.error("Gagal memuat data pendaftaran");
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
    });
    setIsModalVisible(true);
  };

  const closeApplicationDrawer = (): void => {
    if (reviewingStatus) return;
    setViewedRegistration(null);
  };

  const handleReviewApplication = (status: BulkStatus): void => {
    if (!viewedRegistration) return;

    const registration = viewedRegistration;
    const isApproval = status === "APPROVED";
    const actionLabel = isApproval ? "Terima" : "Tolak";

    modal.confirm({
      title: `${actionLabel} pendaftaran ${getMemberName(registration)}?`,
      content: isApproval
        ? "Pendaftar akan menjadi anggota unit kegiatan."
        : "Pendaftaran akan ditandai sebagai ditolak.",
      okText: actionLabel,
      cancelText: "Batal",
      okButtonProps: { danger: !isApproval },
      onOk: async () => {
        setReviewingStatus(status);
        try {
          await updateClubRegistration(
            registration.id,
            createRegistrationStatusPayload(status),
          );
          setViewedRegistration(null);
          await fetchRegistrations();
        } finally {
          setReviewingStatus(null);
        }
      },
    });
  };

  const closeRegistrationModal = (): void => {
    if (savingRegistration) return;
    setIsModalVisible(false);
    setSelectedRegistration(null);
    registrationForm.resetFields();
  };

  const handleDeleteRegistration = (registration: ClubRegistration) => {
    modal.confirm({
      title: "Hapus Pendaftaran",
      icon: <ExclamationCircleOutlined />,
      content: `Apakah Anda yakin ingin menghapus pendaftaran ${getMemberName(registration)}?`,
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteClubRegistration(registration.id);
        await fetchRegistrations();
      },
    });
  };

  const handleModalOk = async () => {
    if (!selectedRegistration) return;

    try {
      const values = await registrationForm.validateFields();
      setSavingRegistration(true);
      await updateClubRegistration(
        selectedRegistration.id,
        createRegistrationStatusPayload(values.status),
      );
      setIsModalVisible(false);
      setSelectedRegistration(null);
      registrationForm.resetFields();
      await fetchRegistrations();
    } catch {
      // Error is already handled by the API function
    } finally {
      setSavingRegistration(false);
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
      await fetchRegistrations();
    } catch {
      // The API service displays the error and keeps the modal open for retry.
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = (role: ClubMemberRole) => {
    modal.confirm({
      title: "Hapus Peran",
      content: `Hapus peran "${role.role_name}" dari anggota ini?`,
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteClubMemberRole(role.id);
        await fetchRegistrations();
      },
    });
  };

  const handleBulkStatusUpdate = (status: BulkStatus): void => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning("Silakan pilih keanggotaan yang akan diperbarui");
      return;
    }

    const isApproval = status === "APPROVED";
    const actionLabel = isApproval ? "Terima" : "Tolak";
    modal.confirm({
      title: `${actionLabel} ${selectedRowKeys.length} pendaftaran?`,
      content: isApproval
        ? "Pendaftar yang dipilih akan menjadi anggota unit kegiatan."
        : "Pendaftaran yang dipilih akan ditandai sebagai ditolak.",
      okText: actionLabel,
      cancelText: "Batal",
      okButtonProps: { danger: !isApproval },
      onOk: async () => {
        setBulkUpdating(status);
        try {
          await bulkUpdateClubRegistrations({
            registrations: selectedRowKeys.map((key) => ({
              id: Number(key),
              status,
            })),
          });
          setSelectedRowKeys([]);
          await fetchRegistrations();
        } finally {
          setBulkUpdating(null);
        }
      },
    });
  };

  const handleExport = async () => {
    if (!clubId) return;

    setExporting(true);
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
    } finally {
      setExporting(false);
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
                    aria-label={`Edit peran ${role.role_name} untuk ${getMemberName(record)}`}
                  />
                </Tooltip>
                <Tooltip title="Hapus peran">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteRole(role)}
                    aria-label={`Hapus peran ${role.role_name} dari ${getMemberName(record)}`}
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
      title: "Tanggal Pendaftaran",
      dataIndex: "created_at",
      key: "registrationDate",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setViewedRegistration(record)}
            size="small"
            aria-label={`Lihat jawaban pendaftaran ${getMemberName(record)}`}
          >
            Lihat jawaban
          </Button>
          {record.status === "APPROVED" ? (
            <Tooltip title="Tambah peran">
              <Button
                icon={<PlusOutlined />}
                onClick={() => openCreateRole(record)}
                size="small"
                aria-label={`Tambah peran untuk ${getMemberName(record)}`}
              />
            </Tooltip>
          ) : null}
          <Tooltip title="Edit pendaftaran">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEditRegistration(record)}
              size="small"
              aria-label={`Ubah status pendaftaran ${getMemberName(record)}`}
            />
          </Tooltip>
          <Tooltip title="Hapus pendaftaran">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteRegistration(record)}
              size="small"
              aria-label={`Hapus pendaftaran ${getMemberName(record)}`}
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
      {modalContextHolder}
      {messageContextHolder}
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
            setSelectedRowKeys([]);
          }}
        >
          <Row gutter={16} align="bottom">
            <Col xs={24} md={8} lg={6}>
              <Form.Item label="Status Pendaftaran" name="status">
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
                  <Text type="secondary" aria-live="polite">
                    {selectedRowKeys.length
                      ? `${selectedRowKeys.length} pendaftaran dipilih`
                      : "Pilih pendaftaran untuk aksi massal"}
                  </Text>
                  <Button
                    onClick={() => handleBulkStatusUpdate("APPROVED")}
                    icon={<EditOutlined />}
                    disabled={!selectedRowKeys.length}
                    loading={bulkUpdating === "APPROVED"}
                    type="primary"
                  >
                    Terima
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusUpdate("REJECTED")}
                    icon={<EditOutlined />}
                    disabled={!selectedRowKeys.length}
                    loading={bulkUpdating === "REJECTED"}
                    danger
                  >
                    Tolak
                  </Button>
                  <Button
                    onClick={handleExport}
                    icon={<DownloadOutlined />}
                    loading={exporting}
                  >
                    Export XLSX
                  </Button>
                  <Button onClick={handleAddMember} icon={<PlusOutlined />}>
                    Tambahkan Pendaftar
                  </Button>
                  <Button icon={<SearchOutlined />} htmlType="submit">
                    Terapkan Filter
                  </Button>
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
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
              setSelectedRowKeys([]);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Space>

      <ApplicationDetailDrawer
        open={viewedRegistration !== null}
        registration={viewedRegistration}
        formSchema={club?.attachedCustomForm?.form_schema}
        reviewingStatus={reviewingStatus}
        onClose={closeApplicationDrawer}
        onReview={handleReviewApplication}
      />

      <Modal
        title="Ubah Status Pendaftaran"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={closeRegistrationModal}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={savingRegistration}
        cancelButtonProps={{ disabled: savingRegistration }}
        closable={!savingRegistration}
        width={600}
        destroyOnHidden
      >
        <Form form={registrationForm} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Silakan pilih status" }]}
          >
            <Select
              placeholder="Pilih status"
              options={CLUB_REGISTRATION_STATUS_OPTIONS}
            />
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
