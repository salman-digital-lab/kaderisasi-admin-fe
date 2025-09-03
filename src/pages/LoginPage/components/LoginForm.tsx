import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Row,
  Col,
  Card,
  notification,
  Typography,
  Space,
  Divider,
  theme,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../../api/auth";
import { renderNotification } from "../../../constants/render";

const { Title, Text } = Typography;

type FieldType = {
  email?: string;
  password?: string;
};

const LoginForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // Set focus to email field on component mount
  useEffect(() => {
    const emailInput = document.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }, []);

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    try {
      const resp = await loginUser(values);
      notification.success({
        message: "Berhasil Login",
        description: renderNotification(resp.message),
        placement: "topRight",
        duration: 4,
      });

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error)
        notification.error({
          message: "Login Gagal",
          description: renderNotification(error.message),
          placement: "topRight",
          duration: 6,
        });
      else
        notification.error({
          message: "Login Gagal",
          description: "Silahkan coba kembali setelah beberapa saat.",
          placement: "topRight",
          duration: 6,
        });
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}08 100%)`,
    padding: "20px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "420px",
    margin: "0 auto",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  };

  const logoContainerStyle = {
    textAlign: "center" as const,
    marginBottom: "32px",
    padding: "20px 0",
  };

  const formStyle = {
    padding: "40px 40px 20px 40px",
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" style={containerStyle}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
          <Card bordered={false} style={cardStyle} className="login-card">
            <div style={formStyle}>
              {/* Logo and Branding Section */}
              <div style={logoContainerStyle} className="logo-container">
                <div style={{ marginBottom: "16px" }}>
                  <img
                    src="/BMKA_logo.svg"
                    alt="BMKA Logo"
                    style={{
                      height: "80px",
                      width: "auto",
                      filter: `drop-shadow(0 4px 8px ${token.colorPrimary}20)`,
                    }}
                  />
                </div>
                <Title
                  level={2}
                  style={{
                    margin: "0 0 8px 0",
                    color: token.colorTextHeading,
                    fontWeight: 600,
                  }}
                >
                  Admin Portal
                </Title>
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  Sistem Kaderisasi BMKA
                </Text>
              </div>

              <Divider style={{ margin: "0 0 32px 0" }} />

              {/* Login Form */}
              <Form
                form={form}
                name="loginForm"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                size="large"
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Email wajib diisi" },
                    { type: "email", message: "Format email tidak valid" },
                  ]}
                >
                  <Input
                    prefix={
                      <UserOutlined
                        style={{ color: token.colorTextTertiary }}
                      />
                    }
                    placeholder="Masukkan email Anda"
                    style={{
                      height: "48px",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Password wajib diisi" },
                    { min: 6, message: "Password minimal 6 karakter" },
                  ]}
                  style={{ marginBottom: "32px" }}
                >
                  <Input.Password
                    prefix={
                      <LockOutlined
                        style={{ color: token.colorTextTertiary }}
                      />
                    }
                    placeholder="Masukkan password Anda"
                    style={{
                      height: "48px",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: "24px" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<LoginOutlined />}
                    style={{
                      width: "100%",
                      height: "48px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 500,
                      boxShadow: `0 4px 12px ${token.colorPrimary}30`,
                    }}
                  >
                    {loading ? "Sedang Login..." : "Login"}
                  </Button>
                </Form.Item>
              </Form>

              {/* Additional Options */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  Lupa password? Hubungi tim support Web BMKA
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginForm;
