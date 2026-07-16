import React from "react";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Button, Divider, Empty, Popover, Typography } from "antd";
import type { CertificateReadinessIssue } from "../utils/certificate-readiness";
import styles from "./CertificateDesigner.module.css";

const { Text } = Typography;

interface ReadinessChecklistProps {
  issues: CertificateReadinessIssue[];
  onIssueAction: (issue: CertificateReadinessIssue) => void;
}

const IssueGroup: React.FC<{
  title: string;
  issues: CertificateReadinessIssue[];
  onAction: (issue: CertificateReadinessIssue) => void;
}> = ({ title, issues, onAction }) =>
  issues.length > 0 ? (
    <section className={styles.checklistGroup}>
      <Text strong>{title}</Text>
      <ul>
        {issues.map((issue) => (
          <li key={issue.code}>
            <Button type="text" onClick={() => onAction(issue)}>
              {issue.severity === "error" ? (
                <ExclamationCircleOutlined />
              ) : (
                <InfoCircleOutlined />
              )}
              <span>{issue.message}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({
  issues,
  onIssueAction,
}) => {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const content = (
    <div className={styles.checklist}>
      {issues.length === 0 ? (
        <Empty
          image={<CheckCircleOutlined className={styles.readyIcon} />}
          description="Template siap dipublikasikan"
        />
      ) : (
        <>
          <IssueGroup
            title="Harus diperbaiki"
            issues={errors}
            onAction={onIssueAction}
          />
          {errors.length > 0 && warnings.length > 0 ? <Divider /> : null}
          <IssueGroup
            title="Rekomendasi"
            issues={warnings}
            onAction={onIssueAction}
          />
        </>
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight">
      <Button
        icon={
          errors.length > 0 ? (
            <ExclamationCircleOutlined />
          ) : (
            <CheckCircleOutlined />
          )
        }
        danger={errors.length > 0}
        aria-label={`Kesiapan template, ${errors.length} masalah wajib dan ${warnings.length} rekomendasi`}
      >
        {errors.length > 0 ? `${errors.length} masalah` : "Siap"}
      </Button>
    </Popover>
  );
};
