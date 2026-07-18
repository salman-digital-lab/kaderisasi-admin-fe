import React, { useMemo, useState } from "react";
import { Button, Input, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { VARIABLE_OPTIONS } from "../constants";
import type { CertificateElement } from "../types";
import { resolveCertificateSampleText } from "../utils/certificate-content";
import styles from "../CertificateDesigner/CertificateDesigner.module.css";

const { Text } = Typography;

interface VariableTextChooserProps {
  onSelect: (variable: string) => void;
}

export const VariableTextChooser: React.FC<VariableTextChooserProps> = ({
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return VARIABLE_OPTIONS.filter(
      (option) =>
        !normalized ||
        option.label.toLocaleLowerCase("id-ID").includes(normalized) ||
        option.value.toLocaleLowerCase("id-ID").includes(normalized),
    );
  }, [query]);

  return (
    <div className={styles.variableChooser}>
      <Text strong>Tambahkan variabel</Text>
      <Text type="secondary">
        Kanvas menampilkan data contoh; nilai asli dipakai saat penerbitan.
      </Text>
      <Input
        autoFocus
        allowClear
        prefix={<SearchOutlined />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari variabel"
        aria-label="Cari variabel sertifikat"
      />
      <div className={styles.variableOptions} role="listbox">
        {options.map((option) => {
          const sampleElement: CertificateElement = {
            id: "sample",
            type: "variable-text",
            variable: option.value,
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          };
          return (
            <Button
              key={option.value}
              type="text"
              role="option"
              onClick={() => onSelect(option.value)}
            >
              <span>
                <Text>{option.label}</Text>
                <Text type="secondary">
                  {resolveCertificateSampleText(sampleElement)}
                </Text>
              </span>
              <Text code>{option.value}</Text>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
