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
  isIssueActionable: (issue: CertificateReadinessIssue) => boolean;
}

const IssueGroup: React.FC<{
  title: string;
  issues: CertificateReadinessIssue[];
  onAction: (issue: CertificateReadinessIssue) => void;
  isActionable: (issue: CertificateReadinessIssue) => boolean;
}> = ({ title, issues, onAction, isActionable }) =>
  issues.length > 0 ? (
    <section className={styles.checklistGroup}>
      <Text strong>{title}</Text>
      <ul>
        {issues.map((issue) => (
          <li key={issue.code}>
            {isActionable(issue) ? (
              <Button type="text" onClick={() => onAction(issue)}>
                {issue.severity === "error" ? (
                  <ExclamationCircleOutlined />
                ) : (
                  <InfoCircleOutlined />
                )}
                <span>{issue.message}</span>
              </Button>
            ) : (
              <div className={styles.checklistExplanation}>
                <InfoCircleOutlined />
                <span>{issue.message}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({
  issues,
  onIssueAction,
  isIssueActionable,
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
            isActionable={isIssueActionable}
          />
          {errors.length > 0 && warnings.length > 0 ? <Divider /> : null}
          <IssueGroup
            title="Rekomendasi"
            issues={warnings}
            onAction={onIssueAction}
            isActionable={isIssueActionable}
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
