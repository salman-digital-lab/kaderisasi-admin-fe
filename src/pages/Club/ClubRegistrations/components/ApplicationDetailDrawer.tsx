import { ResponsiveDescriptions as Descriptions } from "../../../../components/common/Responsive/ResponsiveDescriptions";
import FormAnswerFiles from "../../../../components/common/FormAnswerFiles";
import { Button, Drawer, Empty, Space, Tag, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import dayjs from "dayjs";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useMemo } from "react";

import { CLUB_REGISTRATION_STATUS_OPTIONS } from "../../../../constants/options";
import type { ClubRegistration } from "../../../../types/model/clubRegistration";
import type { FormSchema } from "../../../../types/model/customForm";
import { buildApplicationAnswerSections } from "../utils/application-answers";
import { buildApplicationProfileItems } from "../utils/application-profile";

const { Text, Title } = Typography;

type ReviewStatus = Extract<
  ClubRegistration["status"],
  "APPROVED" | "REJECTED"
>;

type ApplicationDetailDrawerProps = {
  formId?: number;
  open: boolean;
  registration: ClubRegistration | null;
  formSchema?: FormSchema;
  reviewingStatus: ReviewStatus | null;
  onClose: () => void;
  onReview: (status: ReviewStatus) => void;
};

const STATUS_COLORS: Record<ClubRegistration["status"], string> = {
  PENDING: "orange",
  APPROVED: "green",
  REJECTED: "red",
};

const ApplicationDetailDrawer = ({
  formId,
  open,
  registration,
  formSchema,
  reviewingStatus,
  onClose,
  onReview,
}: ApplicationDetailDrawerProps) => {
  const answerSections = useMemo(
    () =>
      buildApplicationAnswerSections(registration?.additional_data, formSchema),
    [formSchema, registration?.additional_data],
  );

  const identityItems = useMemo<DescriptionsProps["items"]>(() => {
    if (!registration) return [];

    const statusLabel =
      CLUB_REGISTRATION_STATUS_OPTIONS.find(
        (option) => option.value === registration.status,
      )?.label || registration.status;

    return [
      ...buildApplicationProfileItems(registration, formSchema),
      {
        key: "status",
        label: "Status",
        children: (
          <Tag color={STATUS_COLORS[registration.status]}>{statusLabel}</Tag>
        ),
      },
      {
        key: "submittedAt",
        label: "Tanggal pendaftaran",
        children: dayjs(registration.created_at).format("DD MMM YYYY, HH:mm"),
      },
    ];
  }, [registration, formSchema]);

  const isReviewing = reviewingStatus !== null;

  return (
    <Drawer
      title="Detail Pendaftaran"
      open={open}
      onClose={onClose}
      size={640}
      destroyOnHidden
      keyboard={!isReviewing}
      closable={{
        "aria-label": "Tutup detail pendaftaran",
        disabled: isReviewing,
      }}
      styles={{
        wrapper: { maxWidth: "100vw" },
        body: { overflowWrap: "anywhere" },
      }}
      footer={
        registration ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Button onClick={onClose} disabled={isReviewing}>
              Tutup
            </Button>
            {registration.status === "PENDING" ? (
              <Space wrap>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => onReview("REJECTED")}
                  loading={reviewingStatus === "REJECTED"}
                  disabled={reviewingStatus === "APPROVED"}
                >
                  Tolak
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => onReview("APPROVED")}
                  loading={reviewingStatus === "APPROVED"}
                  disabled={reviewingStatus === "REJECTED"}
                >
                  Terima
                </Button>
              </Space>
            ) : null}
          </div>
        ) : null
      }
    >
      {registration ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <section aria-labelledby="applicant-identity-heading">
            <Title id="applicant-identity-heading" level={5}>
              Informasi Pendaftar
            </Title>
            <Descriptions
              bordered
              size="small"
              column={1}
              items={identityItems}
            />
          </section>

          <section aria-labelledby="application-answers-heading">
            {formId &&
              formSchema?.fields
                .flatMap((section) => section.fields)
                .filter((field) => field.type === "file")
                .map((field) => (
                  <div key={field.key}>
                    <Text strong>{field.label}</Text>
                    <FormAnswerFiles
                      formId={formId}
                      value={registration.additional_data?.[field.key]}
                    />
                  </div>
                ))}
            <Title id="application-answers-heading" level={5}>
              Jawaban Pendaftaran
            </Title>
            {answerSections.length > 0 ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {answerSections.map((section, sectionIndex) => {
                  const headingId = `application-answer-section-${sectionIndex}`;

                  return (
                    <section key={section.key} aria-labelledby={headingId}>
                      <Title id={headingId} level={5} style={{ fontSize: 14 }}>
                        {section.title}
                      </Title>
                      <Descriptions
                        bordered
                        size="small"
                        column={1}
                        items={section.answers.map((answer) => ({
                          key: answer.key,
                          label: answer.label,
                          children: (
                            <Text
                              style={{
                                whiteSpace: "pre-wrap",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {answer.displayValue}
                            </Text>
                          ),
                        }))}
                      />
                    </section>
                  );
                })}
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Tidak ada jawaban tambahan pada pendaftaran ini"
              />
            )}
          </section>
        </Space>
      ) : null}
    </Drawer>
  );
};

export default ApplicationDetailDrawer;
