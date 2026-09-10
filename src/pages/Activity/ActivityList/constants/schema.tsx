import { Link } from "react-router-dom";
import { Tag, Tooltip, Typography, Button, Space } from "antd";
import type { TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";

import {
  renderActivityCategory,
  renderActivityType,
} from "../../../../constants/render";
import { Activity } from "../../../../types/model/activity";
import { hasPermission } from "../../../../stores/authStore";

const { Text } = Typography;

const toBoolean = (value: boolean | number | undefined): boolean =>
  Boolean(value);

export const TABLE_SCHEMA: TableProps<Activity>["columns"] = [
  {
    title: "Judul Aktivitas/Kegiatan",
    dataIndex: "name",
    key: "name",
    render: (name, record) => (
      <Space
        size={8}
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Text
          ellipsis={{ tooltip: name }}
          style={{
            fontWeight: 500,
          }}
        >
          {name}
        </Text>
        <Tooltip title="Edit aktivitas">
          <Link
            to={`/activity/${record.id}${!record.is_published && hasPermission("activities.manage") ? "/setup" : ""}`}
          >
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={
                !record.is_published
                  ? "Lanjutkan persiapan kegiatan"
                  : "Buka detail kegiatan"
              }
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
              }}
            >
              {!record.is_published ? "Lanjutkan draf" : "Detail"}
            </Button>
          </Link>
        </Tooltip>
      </Space>
    ),
    width: 250,
  },
  {
    title: "Tipe Aktivitas",
    dataIndex: "activity_type",
    width: 150,
    render: (value) => (
      <Tooltip title={`Tipe: ${value}`}>{renderActivityType(value)}</Tooltip>
    ),
  },
  {
    title: "Kategori Aktivitas",
    dataIndex: "activity_category",
    width: 150,
    render: (value) => (
      <Tooltip title={`Kategori: ${value}`}>
        {renderActivityCategory(value)}
      </Tooltip>
    ),
  },
  {
    title: "Klub",
    key: "club",
    width: 160,
    render: (_, record) => record.club?.name || "-",
  },
  {
    title: "Status Publikasi",
    dataIndex: "is_published",
    width: 140,
    render: (value) => {
      const isPublished = toBoolean(value);
      return (
        <Tooltip
          title={
            isPublished
              ? "Kegiatan ditampilkan di website"
              : "Kegiatan tidak ditampilkan di website"
          }
        >
          <Tag
            color={isPublished ? "success" : "default"}
            style={{
              borderRadius: "6px",
              fontWeight: 500,
              border: "none",
              cursor: "help",
            }}
          >
            {isPublished ? "Dipublikasi" : "Draft"}
          </Tag>
        </Tooltip>
      );
    },
  },
  {
    title: "Status Pendaftaran",
    dataIndex: "is_registration_open",
    width: 160,
    render: (value) => {
      const isRegistrationOpen = toBoolean(value);
      return (
        <Tooltip
          title={
            isRegistrationOpen
              ? "Pendaftaran kegiatan sedang dibuka"
              : "Pendaftaran kegiatan sedang ditutup"
          }
        >
          <Tag
            color={isRegistrationOpen ? "success" : "default"}
            style={{
              borderRadius: "6px",
              fontWeight: 500,
              border: "none",
              cursor: "help",
            }}
          >
            {isRegistrationOpen ? "Dibuka" : "Ditutup"}
          </Tag>
        </Tooltip>
      );
    },
  },
];
