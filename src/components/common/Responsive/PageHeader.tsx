import { Typography } from "antd";
import type { ReactElement, ReactNode } from "react";

export function PageHeader({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}): ReactElement {
  return (
    <header className="responsive-page-header">
      <Typography.Title level={2}>{title}</Typography.Title>
      {children && <div className="responsive-page-actions">{children}</div>}
    </header>
  );
}
