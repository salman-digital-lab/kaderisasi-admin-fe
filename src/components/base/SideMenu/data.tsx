import {
  UserOutlined,
  HomeOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  WechatOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

export const menuItems: MenuItem[] = [
  {
    key: "/dashboard",
    icon: <HomeOutlined />,
    label: <Link to="dashboard">Dashboard</Link>,
  },
  {
    key: "/activity",
    icon: <ScheduleOutlined />,
    label: <Link to="/activity">Kegiatan</Link>,
  },
  {
    key: "/member",
    icon: <UserOutlined />,
    label: <Link to="/member">Jamaah</Link>,
  },
  {
    key: "/ruang-curhat",
    icon: <WechatOutlined />,
    label: <Link to="/ruang-curhat">Ruang Curhat</Link>,
  },
  {
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
  },
  {
    key: "setting",
    icon: <SettingOutlined />,
    label: "Pengaturan",
    children: [
      {
        key: "/admin-users",
        label: <Link to="/admin-users">Akun Admin</Link>,
      },
    ],
  },
];
