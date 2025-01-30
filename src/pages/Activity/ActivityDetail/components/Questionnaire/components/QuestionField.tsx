import {
  Flex,
  Col,
  Row,
  Select,
  Card,
  Typography,
  Switch,
  Space,
  Button,
} from "antd";
import { DeleteFilled } from "@ant-design/icons";
import LeftField from "./form";
import { generateDefaultQuestion } from "../../../constants/default";
import { Questionnaire } from "../../../../../../types/model/activity";

const { Text } = Typography;

interface QuestionFieldProps {
  idx: number;
  question: Questionnaire;
  onDelete: () => void;
  handleChangeCard: (
    questionName: string,
    changeCb: (question: Questionnaire) => Questionnaire,
  ) => void;
}

const QuestionField = ({
  idx,
  question,
  onDelete,
  handleChangeCard,
}: QuestionFieldProps) => {
  const handleDropdownChange = (
    value: "text" | "number" | "dropdown" | "textarea",
  ) => {
    handleChangeCard(question.name, (old) => {
      return { ...generateDefaultQuestion(value), name: old.name };
    });
  };

  const onChange = (checked: boolean) => {
    handleChangeCard(question.name, (old) => {
      return { ...old, required: checked };
    });
  };

  return (
    <Card
      title={idx}
      id={question.name}
      extra={
        <Button
          icon={<DeleteFilled />}
          type="primary"
          onClick={onDelete}
          danger
        />
      }
    >
      <Flex vertical gap={12}>
        <Row gutter={[24, 16]}>
          <Col className="gutter-row" span={16}>
            <LeftField
              question={question}
              handleChangeCard={handleChangeCard}
            />
          </Col>
          <Col className="gutter-row" span={8}>
            <Select
              style={{ width: "100%" }}
              value={question.type}
              onChange={handleDropdownChange}
              allowClear
              options={[
                { value: "text", label: "Teks" },
                { value: "number", label: "Angka" },
                { value: "dropdown", label: "Pilihan" },
                { value: "textarea", label: "Teks Panjang" },
              ]}
            />
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Col>
              <Space>
                <Text>Wajib Diisi</Text>
                <Switch
                  defaultChecked={question.required}
                  onChange={onChange}
                />
              </Space>
            </Col>
          </Space>
        </Row>
      </Flex>
    </Card>
  );
};

export default QuestionField;
