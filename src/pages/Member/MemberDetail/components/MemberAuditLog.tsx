import { Divider, Flex, Typography } from "antd";
import { useRequest } from "ahooks";
import { useState } from "react";

import { getMemberAuditLogs } from "../../../../api/services/member-audit";
import { ResponsiveTable as Table } from "../../../../components/common/Responsive/ResponsiveTable";
import { EMPTY_VALUE } from "../../../../theme/tokens";
import type { MemberAuditLog as AuditEntry } from "../../../../types/model/member-audit";
import { formatDateTime } from "../../../../utils/date-format";
import { AUDIT_ACTION_LABEL, auditLines } from "../../../../utils/member-audit";

const PAGE_SIZE = 10;

type Props = {
  profileId: string;
  /** Changes whenever the member was saved, so the trail reloads. */
  version: number;
  provinces?: Record<number, string>;
};

/** Read-only trail of admin changes to this member (members.audit.read). */
const MemberAuditLog = ({ profileId, version, provinces }: Props) => {
  const [page, setPage] = useState(1);
  const { data, loading } = useRequest(
    () => getMemberAuditLogs(profileId, page, PAGE_SIZE),
    { ready: !!profileId, refreshDeps: [profileId, page, version] },
  );

  return (
    <>
      <Divider titlePlacement="start">Riwayat Perubahan</Divider>
      <Table<AuditEntry>
        listId="pages/Member/MemberDetail/MemberAuditLog:1"
        rowKey="id"
        loading={loading}
        dataSource={data?.data}
        locale={{ emptyText: "Belum ada perubahan yang tercatat." }}
        columns={[
          {
            title: "Waktu",
            dataIndex: "created_at",
            width: 170,
            render: (value: string | null) =>
              value ? formatDateTime(value) : EMPTY_VALUE,
          },
          {
            title: "Admin",
            dataIndex: "actor_name",
            width: 200,
            render: (value: string) => value || EMPTY_VALUE,
          },
          {
            title: "Aksi",
            dataIndex: "action",
            width: 220,
            render: (value: AuditEntry["action"]) =>
              AUDIT_ACTION_LABEL[value] ?? value,
          },
          {
            title: "Perubahan",
            dataIndex: "changes",
            render: (changes: AuditEntry["changes"]) => (
              <Flex vertical gap={2}>
                {auditLines(changes, { provinces }).map((line) => (
                  <Typography.Text key={line.field}>
                    <Typography.Text type="secondary">
                      {line.label}:
                    </Typography.Text>{" "}
                    {line.text}
                  </Typography.Text>
                ))}
              </Flex>
            ),
          },
        ]}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.meta.total ?? 0,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: setPage,
        }}
        size="small"
      />
    </>
  );
};

export default MemberAuditLog;
