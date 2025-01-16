import {
  Col,
  Row,
  Card,
  Divider,
  Flex,
  Typography,
  Switch,
  Tooltip,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const QuestionButton = () => {
  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  const componentStyle = {
    card: {
      marginBottom: "2em",
    },
    cardContent: {
      paddingBottom: "1em",
      "&:lastChild": {
        paddingBottom: "1em",
      },
    },
  };

  return (
    <Card style={{ ...componentStyle.card, ...componentStyle.cardContent }}>
      <Divider />
      <Flex vertical gap={12} style={{ marginBottom: "16px" }}>
        <Row gutter={16}>
          <Col className="gutter-row" span={8} offset={4}>
            <Tooltip title="Add">
              <DeleteOutlined />
            </Tooltip>
            <Text type="secondary">Required</Text>
            <Switch defaultChecked onChange={onChange} />
          </Col>
        </Row>
      </Flex>
    </Card>
  );
};

export default QuestionButton;
