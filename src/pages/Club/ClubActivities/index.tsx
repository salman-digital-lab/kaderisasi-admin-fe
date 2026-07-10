import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Input, Space, Table, Tag } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useRequest } from "ahooks";
import type { ColumnsType } from "antd/es/table";

import { getActivities } from "../../../api/services/activity";
import {
  renderActivityCategory,
  renderActivityType,
} from "../../../constants/render";
import type { Activity } from "../../../types/model/activity";

const pageSize = 10;

const ClubActivitiesPage = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, loading } = useRequest(
    () =>
      getActivities({
        page: currentPage.toString(),
        per_page: pageSize.toString(),
        search: search || undefined,
        club_id: clubId,
      }),
    {
      ready: Boolean(clubId),
      refreshDeps: [clubId, currentPage, search],
    },
  );

  const columns: ColumnsType<Activity> = [
    {
      title: "Kegiatan",
      key: "name",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.name}</span>
          <small>{renderActivityType(record.activity_type)}</small>
        </Space>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "activity_category",
      key: "activity_category",
      render: (value) => renderActivityCategory(value),
    },
    {
      title: "Tanggal",
      key: "activity_date",
      render: (_, record) =>
        record.activity_start
          ? dayjs(record.activity_start).format("DD MMM YYYY")
          : "-",
    },
    {
      title: "Status",
      dataIndex: "is_published",
      key: "is_published",
      render: (value) => (
        <Tag color={value ? "green" : "default"}>
          {value ? "Dipublikasi" : "Draft"}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Link to={`/activity/${record.id}`}>
          <Button size="small" icon={<EditOutlined />} />
        </Link>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Cari kegiatan"
            style={{ width: 280 }}
            onSearch={(value) => {
              setSearch(value);
              setCurrentPage(1);
            }}
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          />
          <Link to="/activity">
            <Button type="primary">Tambah di Kegiatan</Button>
          </Link>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          dataSource={data?.data || []}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: data?.meta.total || 0,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} dari ${total} kegiatan`,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </Space>
  );
};

export default ClubActivitiesPage;
