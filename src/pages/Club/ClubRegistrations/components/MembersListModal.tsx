import { useRequest } from "ahooks";
import { Input, Modal, notification, Space, Table } from "antd";
import { useState } from "react";
import { Key } from "antd/es/table/interface";
import { useParams } from "react-router-dom";
import { Dispatch, SetStateAction } from "react";

import { getProfiles } from "../../../../api/services/member";
import { createClubRegistration } from "../../../../api/services/clubRegistration";

type MembersListModalProps = {
  open: boolean;
  toggle: Dispatch<SetStateAction<boolean>>;
  onSuccess: () => void;
};

const MembersListModal = ({ open, toggle, onSuccess }: MembersListModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Key[]>([]);
  const { id: clubId } = useParams<{ id: string }>();

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

  const { loading: addLoading, runAsync } = useRequest(createClubRegistration, {
    manual: true,
  });

  const onOk = async () => {
    if (!selected.length || !clubId) {
      return;
    }

    const selectedMember = data?.data?.find(member => member.id === selected[0]);
    if (!selectedMember?.user_id) {
      notification.error({
        message: "Gagal",
        description: "Data anggota tidak valid",
      });
      return;
    }

    await runAsync(Number(clubId), {
      member_id: selectedMember.user_id,
      additional_data: {},
    });
    
    toggle(false);
    setSelected([]);
    onSuccess();
  };

  return (
    <Modal
      title="Tambah Anggota ke Unit Kegiatan"
      open={open}
      onOk={onOk}
      confirmLoading={addLoading}
      onCancel={() => {
        toggle(false);
        setSelected([]);
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama anggota"
          allowClear
        />
        <Table
          rowKey="id"
          columns={[
            {
              title: "Nama Anggota",
              dataIndex: "name",
            },
            {
              title: "Email",
              dataIndex: ["publicUser", "email"],
              render: (email: string) => email || "N/A",
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
