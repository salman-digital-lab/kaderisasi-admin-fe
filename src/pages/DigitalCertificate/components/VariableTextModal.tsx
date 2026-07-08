import React from "react";
import { Card, Modal, Select, Typography } from "antd";
import { VARIABLE_OPTIONS } from "../constants";

const { Text } = Typography;

const SAMPLE_VALUES: Record<string, string> = {
  "{{name}}": "Ahmad Fauzan",
  "{{email}}": "ahmad.fauzan@email.com",
  "{{activity_name}}": "Pelatihan Dasar Kaderisasi",
  "{{activity_date}}": "13 Februari 2026",
  "{{date}}": "13 Februari 2026",
  "{{certificate_id}}": "CERT-2026-001",
  "{{certificate_code}}": "CERT-2026-001",
  "{{university}}": "Institut Teknologi Bandung",
  "{{gender}}": "Laki-laki",
};

interface VariableTextModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (variable: string) => void;
}

export const VariableTextModal: React.FC<VariableTextModalProps> = ({
  visible,
  onCancel,
  onSelect,
}) => {
  const [selectedVariable, setSelectedVariable] = React.useState<string>(
    VARIABLE_OPTIONS[0].value,
  );

  const handleOk = () => {
    onSelect(selectedVariable);
  };

  const selectedOption = VARIABLE_OPTIONS.find(
    (option) => option.value === selectedVariable,
  );

  React.useEffect(() => {
    if (visible) {
      setSelectedVariable(VARIABLE_OPTIONS[0].value);
    }
  }, [visible]);

  return (
    <Modal
      title="Pilih Variabel"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Tambahkan"
      cancelText="Batal"
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Variabel akan diganti dengan data peserta saat sertifikat digenerate.
        </Text>
      </div>
      <Select
        showSearch
        style={{ width: "100%" }}
        value={selectedVariable}
        onChange={setSelectedVariable}
        optionFilterProp="label"
        options={VARIABLE_OPTIONS.map((opt) => ({
          label: `${opt.label} (${opt.value})`,
          value: opt.value,
        }))}
      />
      <Card
        size="small"
        style={{ marginTop: 12, background: "#fafafa", borderRadius: 6 }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Preview
        </Text>
        <div style={{ marginTop: 4 }}>
          <Text strong>{selectedOption?.label}</Text>
          <br />
          <Text>{SAMPLE_VALUES[selectedVariable] || selectedVariable}</Text>
        </div>
      </Card>
    </Modal>
  );
};
