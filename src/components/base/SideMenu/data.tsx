import {
  DatabaseOutlined,
  ReadOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";
import type { MenuProps } from "antd";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";

type MenuItem = Required<MenuProps>["items"][number];

export const clearMenuCache = () => useAuthStore.getState().clearAuth();

export function menuItems(permissions: string[], reviewCount = 0): MenuItem[] {
  const items: MenuItem[] = [];
  if (permissions.includes("dashboard.read")) {
    items.push({
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    });
  }
  items.push({
    key: "/access-tickets",
    icon: <FileTextOutlined />,
    label: "Akses & Tiket",
    children: [
      {
        key: "/my-requests",
        label: <Link to="/my-requests">Permintaan Saya</Link>,
      },
      ...(permissions.includes("tickets.review")
        ? [
            {
              key: "/ticket-review",
              label: (
                <Link
                  to="/ticket-review"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span>Tinjau Permintaan</span>
                  <Badge count={reviewCount} size="small" />
                </Link>
              ),
            },
          ]
        : []),
    ],
  });
  if (permissions.includes("activities.read"))
    items.push({
      key: "/activity",
      icon: <ScheduleOutlined />,
      label: <Link to="/activity">Kegiatan</Link>,
    });
  if (permissions.includes("members.read"))
    items.push({
      key: "/member",
      icon: <UserOutlined />,
      label: <Link to="/member">Anggota</Link>,
    });
  if (permissions.includes("counseling.read"))
    items.push({
      key: "/ruang-curhat",
      icon: <WechatOutlined />,
      label: <Link to="/ruang-curhat">Ruang Curhat</Link>,
    });
  if (
    permissions.includes("achievements.read") ||
    permissions.includes("leaderboards.read")
  ) {
    items.push({
      key: "/leaderboard",
      icon: <TrophyOutlined />,
      label: "Leaderboard",
      children: [
        ...(permissions.includes("achievements.read")
          ? [
              {
                key: "/achievement",
                label: <Link to="/achievement">Prestasi</Link>,
              },
            ]
          : []),
        ...(permissions.includes("leaderboards.read")
          ? [
              {
                key: "/monthly-leaderboard",
                label: <Link to="/monthly-leaderboard">Peringkat Bulanan</Link>,
              },
              {
                key: "/lifetime-leaderboard",
                label: (
                  <Link to="/lifetime-leaderboard">Peringkat Seumur Hidup</Link>
                ),
              },
            ]
          : []),
      ],
    });
  }
  if (permissions.includes("custom_forms.read"))
    items.push({
      key: "/custom-form",
      icon: <FormOutlined />,
      label: <Link to="/custom-form">Form Digital</Link>,
    });
  if (permissions.includes("clubs.read"))
    items.push({
      key: "/club",
      icon: <TeamOutlined />,
      label: <Link to="/club">Klub</Link>,
    });
  if (permissions.includes("courses.read"))
    items.push({
      key: "/courses",
      icon: <ReadOutlined />,
      label: <Link to="/courses">Kelas</Link>,
    });
  if (permissions.includes("certificate.read"))
    items.push({
      key: "/digital-certificate",
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/digital-certificate">Sertifikat Digital</Link>,
    });
  if (permissions.includes("reference_data.manage")) {
    items.push({
      key: "/data-center",
      icon: <DatabaseOutlined />,
      label: "Pusat Data",
      children: [
        { key: "/province", label: <Link to="/province">Provinsi</Link> },
        {
          key: "/universities",
          label: <Link to="/universities">Perguruan Tinggi</Link>,
        },
      ],
    });
  }
  if (
    permissions.includes("admin_users.read") ||
    permissions.includes("rbac.read")
  ) {
    items.push({
      key: "setting",
      icon: <SettingOutlined />,
      label: "Pengaturan",
      children: [
        ...(permissions.includes("admin_users.read")
          ? [
              {
                key: "/admin-users",
                label: <Link to="/admin-users">Akun Admin</Link>,
              },
            ]
          : []),
        ...(permissions.includes("rbac.read")
          ? [
              {
                key: "/rbac/roles",
                label: <Link to="/rbac/roles">Role & Permission</Link>,
              },
            ]
          : []),
      ],
    });
  }
  return items;
}
