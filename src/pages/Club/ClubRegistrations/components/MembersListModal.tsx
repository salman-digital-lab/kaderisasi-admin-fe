import { useDebounce, useRequest } from "ahooks";
import { Input, message, Modal, Space, Table, Typography } from "antd";
import { useState } from "react";
import { useParams } from "react-router-dom";
import type { Key } from "antd/es/table/interface";
import type { Dispatch, SetStateAction } from "react";

import { getProfiles } from "../../../../api/services/member";
import { createClubRegistration } from "../../../../api/services/clubRegistration";

type MembersListModalProps = {
  open: boolean;
  toggle: Dispatch<SetStateAction<boolean>>;
  onSuccess: () => void;
};

const MembersListModal = ({
  open,
  toggle,
  onSuccess,
}: MembersListModalProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, { wait: 300 });
  const [selected, setSelected] = useState<Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [messageApi, messageContextHolder] = message.useMessage();
  const { id: clubId } = useParams<{ id: string }>();

  const { data, loading } = useRequest(
    () =>
      getProfiles({
        per_page: "10",
        page: currentPage.toString(),
        search: debouncedSearch,
      }),
    {
      ready: open,
      refreshDeps: [currentPage, debouncedSearch],
    },
  );

  const { loading: addLoading, runAsync } = useRequest(createClubRegistration, {
    manual: true,
  });

  const onOk = async () => {
    if (!selected.length || !clubId) {
      return;
    }

    const selectedMember = data?.data?.find(
      (member) => member.id === selected[0],
    );
    if (!selectedMember?.user_id) {
      messageApi.error("Data anggota tidak valid");
      return;
    }

    try {
      await runAsync(Number(clubId), {
        member_id: selectedMember.user_id,
      });

      closeModal();
      onSuccess();
    } catch {
      // The API service displays the error and the modal stays open for retry.
    }
  };

  const closeModal = (): void => {
    if (addLoading) return;
    toggle(false);
    setSearch("");
    setCurrentPage(1);
    setSelected([]);
  };

  return (
    <>
      {messageContextHolder}
      <Modal
        title="Tambahkan Pendaftar ke Klub"
        open={open}
        onOk={onOk}
        confirmLoading={addLoading}
        onCancel={closeModal}
        okText="Tambahkan"
        cancelText="Batal"
        okButtonProps={{ disabled: !selected.length }}
        cancelButtonProps={{ disabled: addLoading }}
        closable={!addLoading}
        width={720}
        destroyOnHidden
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Anggota yang dipilih akan masuk sebagai pendaftar dengan status
            Menunggu.
          </Typography.Text>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelected([]);
            }}
            placeholder="Cari nama atau email anggota"
            allowClear
            aria-label="Cari anggota berdasarkan nama atau email"
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
            pagination={{
              current: currentPage,
              pageSize: data?.meta.per_page || 10,
              total: data?.meta.total || 0,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} dari ${total} anggota`,
              onChange: (page) => {
                setCurrentPage(page);
                setSelected([]);
              },
            }}
            loading={loading}
            scroll={{ y: 200 }}
            rowSelection={{
              hideSelectAll: true,
              type: "radio",
              selectedRowKeys: selected,
              onChange: (selectedRow) => setSelected(selectedRow),
            }}
          />
        </Space>
      </Modal>
    </>
  );
};

export default MembersListModal;
