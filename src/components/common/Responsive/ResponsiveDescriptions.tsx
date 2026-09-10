import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
} from "react";
import { Descriptions, type DescriptionsProps } from "antd";
import { useAdminViewport } from "../../../hooks/useAdminViewport";

function ResponsiveDescriptionsView(props: DescriptionsProps): ReactElement {
  const { compact } = useAdminViewport();
  return (
    <Descriptions
      {...props}
      column={compact ? 1 : props.column}
      layout={compact ? "vertical" : props.layout}
      items={
        compact
          ? props.items?.map((item) => ({ ...item, span: 1 }))
          : props.items
      }
    >
      {compact
        ? Children.map(props.children, (child) =>
            isValidElement<{ span?: number }>(child) &&
            child.type === Descriptions.Item
              ? cloneElement(child, { span: 1 })
              : child,
          )
        : props.children}
    </Descriptions>
  );
}

export const ResponsiveDescriptions = Object.assign(
  ResponsiveDescriptionsView,
  {
    Item: Descriptions.Item,
  },
);
