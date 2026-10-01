import type { ReactElement } from "react";
import { Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { getTalentLabel } from "./theme-guide";

// The icon sits inside report buttons, so it stays out of the tab order and the
// accessibility tree; ThemeDetail repeats the English term as visible text.
export default function TalentName({ name }: { name: string }): ReactElement {
  return (
    <>
      {getTalentLabel(name)}
      <Tooltip title={`Istilah asli: ${name}`}>
        <span
          className="talent-term-hint"
          aria-hidden="true"
          onClick={(event) => event.stopPropagation()}
        >
          <QuestionCircleOutlined />
        </span>
      </Tooltip>
    </>
  );
}
