import { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  Input,
  Row,
  Col,
  Card,
  notification,
  Typography,
  Divider,
  theme,
} from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { loginUser, loginWithGoogle } from "../../../api/auth";
import { renderNotification } from "../../../constants/render";
import { useSetSession } from "../../../stores/authStore";

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
  const setSession = useSetSession();
  const googleButton = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const finishLogin = (
    session: Awaited<ReturnType<typeof loginUser>>["data"],
  ) => {
    setSession(session);
    navigate(
      session.permissions.includes("dashboard.read")
        ? "/dashboard"
        : "/my-requests",
      {
        replace: true,
      },
    );
  };

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

      finishLogin(resp.data);

      notification.success({
        message: "Berhasil Login",
        description: renderNotification(resp.message),
        placement: "topRight",
        duration: 4,
      });
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

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;
    const renderGoogleButton = () => {
      if (!window.google || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setLoading(true);
          try {
            const response = await loginWithGoogle(credential);
            finishLogin(response.data);
            notification.success({
              message: "Berhasil Login",
              placement: "topRight",
            });
          } catch (error) {
            notification.error({
              message: "Login Google Gagal",
              description:
                error instanceof Error
                  ? renderNotification(error.message)
                  : "Silakan coba lagi.",
              placement: "topRight",
            });
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: Math.min(360, googleButton.current.clientWidth),
        text: "signin_with",
      });
    };
    if (window.google) {
      renderGoogleButton();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  const containerStyle = {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${token.colorPrimary}15 0%, ${token.colorPrimary}08 100%)`,
    padding: "20px",
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
    <div>
      <Row justify="center" align="middle" style={containerStyle}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
          <Card className="login-card">
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
                    autoComplete="current-password"
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
                    }}
                  >
                    {loading ? "Sedang Login..." : "Login"}
                  </Button>
                </Form.Item>
              </Form>

              {googleClientId && (
                <>
                  <Divider plain>atau</Divider>
                  <div
                    ref={googleButton}
                    style={{ display: "flex", justifyContent: "center" }}
                  />
                </>
              )}

              {/* Additional Options */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  Lupa password atau belum punya akun?{" "}
                  <a
                    href="https://chat.whatsapp.com/G4qpf2oFwtBJjaQb5YwDiV"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#25D366", fontWeight: 500 }}
                  >
                    Hubungi tim support Web BMKA via WhatsApp
                  </a>
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
