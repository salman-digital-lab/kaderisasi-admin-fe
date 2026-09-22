import type { ReactElement } from "react";
import { Button, Typography } from "antd";
import type { AnnouncementInput } from "./types";
import styles from "./Composer.module.css";

export default function AnnouncementMessage({
  record,
}: {
  record: AnnouncementInput;
}): ReactElement {
  return (
    <div className={styles.message}>
      <Typography.Title level={3}>{record.title}</Typography.Title>
      <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
        {record.body}
      </Typography.Paragraph>
      {record.link_url && (
        <Button
          href={record.link_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {record.link_label}
        </Button>
      )}
    </div>
  );
}
