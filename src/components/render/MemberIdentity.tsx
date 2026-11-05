import { Space, Tag, Typography } from "antd";

/** A member's ID Anggota, in the same code style as the member list. */
export function MemberIdText({ value }: { value?: string | null }) {
  if (!value) return <>-</>;
  return <Typography.Text code>{value}</Typography.Text>;
}

/** A member's profile badges as tags, or "-" when there are none. */
export function BadgeTags({ badges }: { badges?: unknown }) {
  const values = Array.isArray(badges) ? badges.map(String) : [];
  if (values.length === 0) return <>-</>;
  return (
    <Space size={4} wrap>
      {values.map((badge) => (
        <Tag key={badge}>{badge}</Tag>
      ))}
    </Space>
  );
}
