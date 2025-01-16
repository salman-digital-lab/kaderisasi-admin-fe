import { useRequest } from "ahooks";
import { Input, Modal, notification, Space, Table } from "antd";
import { useState } from "react";
import { Key } from "antd/es/table/interface";
import { useParams } from "react-router-dom";

import { getProfiles } from "../../../../../api/services/member";
import { postRegistrant } from "../../../../../api/services/activity";
import { handleError } from "../../../../../api/errorHandling";

type MembersListModalProps = {
  open: boolean;
  toggle: (val?: boolean) => void;
};

const MembersListModal = ({ open, toggle }: MembersListModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Key[]>([]);
  const { id } = useParams<{ id: string }>();

  const { data, loading } = useRequest(
    () =>
      getProfiles({
        per_page: "10",
        page: "1",
        search: search,
      }),
    {
      refreshDeps: [search],
    },
  );

  const { loading: addLoading, runAsync } = useRequest(postRegistrant, {
    manual: true,
  });

  const onOk = async () => {
    try {
      if (selected.length) {
        await runAsync(id, {
          user_id: String(selected[0]),
          questionnaire_answer: {},
        });
        notification.success({
          message: "Berhasil",
          description: "Peserta berhasil ditambahkan",
        });
        toggle(false);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Modal
      title="Tambah Peserta"
      open={open}
      onOk={onOk}
      confirmLoading={addLoading}
      onCancel={() => toggle(false)}
    >
      <Space direction="vertical">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nama Pendaftar"
          allowClear
        />
        <Table
          rowKey="id"
          columns={[
            {
              title: "Nama Jamaah",
              dataIndex: "name",
            },
          ]}
          dataSource={data?.data}
          pagination={false}
          loading={loading}
          scroll={{ y: 200 }}
          rowSelection={{
            hideSelectAll: true,
            type: "radio",
            selectedRowKeys: selected,
            onChange: (selectedRow) => setSelected(selectedRow),
          }}
          onRow={(record) => ({
            onClick: () => {
              setSelected([record.id]);
            },
          })}
        />
      </Space>
    </Modal>
  );
};

export default MembersListModal;
