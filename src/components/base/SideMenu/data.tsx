import {
  UserOutlined,
  HomeOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  WechatOutlined,
  SettingOutlined,
  TrophyOutlined,
  TeamOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";
import { useAuthStore } from "../../../stores/authStore";

type MenuItem = Required<MenuProps>["items"][number];

// Re-export clearAuth as clearMenuCache for backward compatibility
export const clearMenuCache = () => useAuthStore.getState().clearAuth();

export const menuItems: (permissions: string[]) => MenuItem[] = (
  permissions,
) => {
  let menuItems: MenuItem[] = [
    {
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: <Link to="dashboard">Dashboard</Link>,
    },
  ];

  if (permissions.includes("kegiatan")) {
    menuItems.push({
      key: "/activity",
      icon: <ScheduleOutlined />,
      label: <Link to="/activity">Kegiatan</Link>,
    });
  }

  if (permissions.includes("anggota")) {
    menuItems.push({
      key: "/member",
      icon: <UserOutlined />,
      label: <Link to="/member">Anggota</Link>,
    });
  }

  if (permissions.includes("ruangcurhat")) {
    menuItems.push({
      key: "/ruang-curhat",
      icon: <WechatOutlined />,
      label: <Link to="/ruang-curhat">Ruang Curhat</Link>,
    });
  }

  if (permissions.includes("leaderboard")) {
    menuItems.push({
      key: "/leaderboard",
      icon: <TrophyOutlined />,
      label: "Leaderboard",
      children: [
        {
          key: "/achievement",
          label: <Link to="/achievement">Prestasi</Link>,
        },
        {
          key: "/monthly-leaderboard",
          label: <Link to="/monthly-leaderboard">Peringkat Bulanan</Link>,
        },
        {
          key: "/lifetime-leaderboard",
          label: <Link to="/lifetime-leaderboard">Peringkat Seumur Hidup</Link>,
        },
      ],
    });
  }

  if (permissions.includes("klub")) {
    menuItems.push({
      key: "/club",
      icon: <TeamOutlined />,
      label: <Link to="/club">Unit Kegiatan</Link>,
    });
  }

  if (permissions.includes("formkustom")) {
    menuItems.push({
      key: "/custom-form",
      icon: <FormOutlined />,
      label: <Link to="/custom-form">Form Digital</Link>,
    });
  }

  if (permissions.includes("pusatdata")) {
    menuItems.push({
      key: "/data-center",
      label: "Pusat Data",
      icon: <DatabaseOutlined />,
      children: [
        {
          key: "/province",
          label: <Link to="/province">Provinsi</Link>,
        },
        {
          key: "/universities",
          label: <Link to="/universities">Perguruan Tinggi</Link>,
        },
      ],
    });
  }

  if (permissions.includes("akunadmin")) {
    menuItems.push({
      key: "setting",
      icon: <SettingOutlined />,
      label: "Pengaturan",
      children: [
        {
          key: "/admin-users",
          label: <Link to="/admin-users">Akun Admin</Link>,
        },
      ],
    });
  }

  return menuItems;
};
