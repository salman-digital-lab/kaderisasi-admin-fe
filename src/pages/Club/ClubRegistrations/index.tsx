import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  getClubRegistrations,
  createClubRegistration,
  updateClubRegistration,
  deleteClubRegistration,
  bulkUpdateClubRegistrations,
  exportClubRegistrations,
} from "../../../api/services/clubRegistration";
import { getClub } from "../../../api/services/club";
import { ClubRegistration } from "../../../types/model/clubRegistration";
import { Club } from "../../../types/model/club";
import MembersListModal from "./components/MembersListModal";
import { CLUB_REGISTRATION_STATUS_OPTIONS } from "../../../constants/options";

const { Option } = Select;
const { confirm } = Modal;

const ClubRegistrationsPage: React.FC = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const [form] = Form.useForm();

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
    } catch (error) {
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
    } catch (error) {
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
    form.setFieldsValue({
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
        } catch (error) {
          // Error is already handled by the API function
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

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
      form.resetFields();
      fetchRegistrations();
    } catch (error) {
      // Error is already handled by the API function
    }
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
    } catch (error) {
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
    } catch (error) {
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

  const columns = [
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
      title: "Tanggal Keanggotaan",
      dataIndex: "created_at",
      key: "registrationDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: any, record: ClubRegistration) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditRegistration(record)}
            size="small"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteRegistration(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2>{club?.name} - Keanggotaan</h2>
      </div>

      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <MembersListModal
          open={isMembersModalVisible}
          toggle={setIsMembersModalVisible}
          onSuccess={() => {
            fetchRegistrations();
          }}
        />

        <Card>
          <Form
            layout="vertical"
            form={form}
            onFinish={(val) => {
              setStatusFilter(val.status || "");
              setCurrentPage(1);
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Status Keanggotaan" name="status">
                  <Select
                    options={CLUB_REGISTRATION_STATUS_OPTIONS}
                    placeholder="Status Keanggotaan"
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="end">
              <Space>
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
            </Row>
          </Form>
        </Card>

        <Card>
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
        </Card>
      </Space>

      <Modal
        title={selectedRegistration ? "Edit Keanggotaan" : "Buat Keanggotaan"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
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
    </div>
  );
};

export default ClubRegistrationsPage;
