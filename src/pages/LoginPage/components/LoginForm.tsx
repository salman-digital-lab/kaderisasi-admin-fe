import { useState } from "react";
import { Button, Form, Input, Row, Col, Card, notification } from "antd";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../../api/auth";
import { renderNotification } from "../../../constants/render";

type FieldType = {
  email?: string;
  password?: string;
};

const LoginForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    try {
      const resp = await loginUser(values);
      notification.success({
        message: "Berhasil",
        description: renderNotification(resp.message),
      });

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error)
        notification.error({
          message: "Gagal",
          description: renderNotification(error.message),
        });
      else
        notification.error({
          message: "Gagal",
          description: "Silahkan coba kembali setelah beberapa saat.",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col xs={20} sm={18} md={16} lg={12} xl={10}>
        <Card bordered={false} style={{ width: "100%" }}>
          <Form
            name="basic"
            style={{ maxWidth: 600, margin: "6vh" }}
            initialValues={{ remember: true }}
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: "Please input your email!" }]}
            >
              <Input placeholder="Email" style={{ height: "6vh" }} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                style={{ height: "6vh" }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ width: "100%", height: "6vh" }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginForm;
