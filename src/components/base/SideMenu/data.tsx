import {
  UserOutlined,
  HomeOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  WechatOutlined,
  SettingOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";
import { ADMIN_ROLE_PERMISSION } from "../../../constants/permissions";

type MenuItem = Required<MenuProps>["items"][number];

export const menuItems: () => MenuItem[] = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}").user;
  const role = user?.role as keyof typeof ADMIN_ROLE_PERMISSION;

  const permissions = ADMIN_ROLE_PERMISSION[role] || [];

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
      key: "/achievement",
      icon: <TrophyOutlined />,
      label: <Link to="/achievement">Leaderboard</Link>,
    });
  }

  if (permissions.includes("klub")) {
    menuItems.push({
      key: "/club",
      icon: <TeamOutlined />,
      label: <Link to="/club">Club</Link>,
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
        {
          key: "/custom-form",
          label: <Link to="/custom-form">Form Kustom</Link>,
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
