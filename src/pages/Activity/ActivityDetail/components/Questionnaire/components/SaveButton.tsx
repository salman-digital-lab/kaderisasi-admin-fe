import { Button, Col, Row } from "antd";
import { SaveFilled } from "@ant-design/icons";

interface FieldData {
  onSave: () => void;
}

const SaveButton = ({ onSave }: FieldData) => {
  return (
    <Row justify="end">
      <Col>
        <Button onClick={onSave} icon={<SaveFilled />}>
          Save Question
        </Button>
      </Col>
    </Row>
  );
};

export default SaveButton;
