import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type { ReactElement, ReactNode, Ref } from "react";
import { useNavigate } from "react-router-dom";

export interface PageHeaderBack {
  /** Destination of the back control. */
  to: string;
  /** Visible label, for example "Kembali ke daftar kegiatan". */
  label: string;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: ReactNode;
  /** One sentence explaining what the page is for. */
  description?: ReactNode;
  /** Status tags shown next to the title. */
  tags?: ReactNode;
  /** Page-level actions. Use at most one primary button. */
  extra?: ReactNode;
  back?: PageHeaderBack;
  /** Lets workflows move focus to the heading after a step change. */
  headingRef?: Ref<HTMLHeadingElement>;
}

/** Standard page title block used by every admin page. */
export default function PageHeader({
  title,
  description,
  tags,
  extra,
  back,
  headingRef,
}: PageHeaderProps): ReactElement {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <Button
          type="link"
          className="page-header-back"
          icon={<ArrowLeftOutlined aria-hidden />}
          disabled={back.disabled}
          onClick={() => navigate(back.to)}
        >
          {back.label}
        </Button>
      )}
      <div className="page-header-main">
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <div className="page-header-heading">
            <Typography.Title
              level={1}
              ref={headingRef}
              tabIndex={headingRef ? -1 : undefined}
            >
              {title}
            </Typography.Title>
            {tags}
          </div>
          {description && (
            <Typography.Paragraph
              type="secondary"
              className="page-header-description"
            >
              {description}
            </Typography.Paragraph>
          )}
        </div>
        {extra && <div className="page-header-actions">{extra}</div>}
      </div>
    </header>
  );
}
