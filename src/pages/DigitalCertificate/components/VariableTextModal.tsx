import React from "react";
import { Modal, Select, Typography } from "antd";
import { VARIABLE_OPTIONS } from "../constants";

const { Text } = Typography;

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
        style={{ width: "100%" }}
        value={selectedVariable}
        onChange={setSelectedVariable}
        options={VARIABLE_OPTIONS.map((opt) => ({
          label: `${opt.label} (${opt.value})`,
          value: opt.value,
        }))}
      />
    </Modal>
  );
};
