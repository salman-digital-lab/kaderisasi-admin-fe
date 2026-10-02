import {
  AuditOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  LinkOutlined,
  NotificationOutlined,
  ReadOutlined,
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
import { NAV_LABELS as L } from "../../../constants/navigation";

type MenuItem = Required<MenuProps>["items"][number];

export const clearMenuCache = () => useAuthStore.getState().clearAuth();

export function menuItems(permissions: string[], reviewCount = 0): MenuItem[] {
  const items: MenuItem[] = [];
  if (permissions.includes("dashboard.read")) {
    items.push({
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: <Link to="/dashboard">{L.dashboard}</Link>,
    });
  }
  if (permissions.includes("announcements.manage")) {
    items.push({
      key: "/announcements",
      icon: <NotificationOutlined />,
      label: <Link to="/announcements">{L.announcements}</Link>,
    });
  }
  items.push({
    key: "/access-tickets",
    icon: <AuditOutlined />,
    label: L.accessGroup,
    children: [
      {
        key: "/my-requests",
        label: <Link to="/my-requests">{L.myRequests}</Link>,
      },
      ...(permissions.includes("tickets.review")
        ? [
            {
              key: "/ticket-review",
              label: (
                <Link
                  to="/ticket-review"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                  aria-label={
                    reviewCount > 0
                      ? `${L.ticketReview}, ${reviewCount} menunggu`
                      : undefined
                  }
                >
                  <span>{L.ticketReview}</span>
                  <Badge count={reviewCount} size="small" />
                </Link>
              ),
            },
          ]
        : []),
    ],
  });
  if (permissions.includes("calendar.read"))
    items.push({
      key: "/calendar",
      icon: <CalendarOutlined />,
      label: <Link to="/calendar">{L.calendar}</Link>,
    });
  if (permissions.includes("activities.read"))
    items.push({
      key: "/activity",
      icon: <ScheduleOutlined />,
      label: <Link to="/activity">{L.activities}</Link>,
    });
  if (permissions.includes("members.read"))
    items.push({
      key: "/member",
      icon: <UserOutlined />,
      label: <Link to="/member">{L.members}</Link>,
    });
  if (permissions.includes("counseling.read"))
    items.push({
      key: "/ruang-curhat",
      icon: <WechatOutlined />,
      label: <Link to="/ruang-curhat">{L.counseling}</Link>,
    });
  if (
    permissions.includes("achievements.read") ||
    permissions.includes("leaderboards.read")
  ) {
    items.push({
      key: "/leaderboard",
      icon: <TrophyOutlined />,
      label: L.leaderboardGroup,
      children: [
        ...(permissions.includes("achievements.read")
          ? [
              {
                key: "/achievement",
                label: <Link to="/achievement">{L.achievements}</Link>,
              },
            ]
          : []),
        ...(permissions.includes("leaderboards.read")
          ? [
              {
                key: "/monthly-leaderboard",
                label: (
                  <Link to="/monthly-leaderboard">{L.monthlyLeaderboard}</Link>
                ),
              },
              {
                key: "/lifetime-leaderboard",
                label: (
                  <Link to="/lifetime-leaderboard">
                    {L.lifetimeLeaderboard}
                  </Link>
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
      label: <Link to="/custom-form">{L.customForms}</Link>,
    });
  if (permissions.includes("short_links.read"))
    items.push({
      key: "/short-links",
      icon: <LinkOutlined />,
      label: <Link to="/short-links">{L.shortLinks}</Link>,
    });
  if (permissions.includes("clubs.read"))
    items.push({
      key: "/club",
      icon: <TeamOutlined />,
      label: <Link to="/club">{L.clubs}</Link>,
    });
  if (permissions.includes("courses.read"))
    items.push({
      key: "/courses",
      icon: <ReadOutlined />,
      label: <Link to="/courses">{L.courses}</Link>,
    });
  if (permissions.includes("certificate.read"))
    items.push({
      key: "/digital-certificate",
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/digital-certificate">{L.certificates}</Link>,
    });
  if (permissions.includes("reference_data.manage")) {
    items.push({
      key: "/data-center",
      icon: <DatabaseOutlined />,
      label: L.dataCenterGroup,
      children: [
        { key: "/province", label: <Link to="/province">{L.provinces}</Link> },
        {
          key: "/universities",
          label: <Link to="/universities">{L.universities}</Link>,
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
      label: L.settingsGroup,
      children: [
        ...(permissions.includes("admin_users.read")
          ? [
              {
                key: "/admin-users",
                label: <Link to="/admin-users">{L.adminUsers}</Link>,
              },
            ]
          : []),
        ...(permissions.includes("rbac.read")
          ? [
              {
                key: "/rbac/roles",
                label: <Link to="/rbac/roles">{L.roles}</Link>,
              },
            ]
          : []),
      ],
    });
  }
  return items;
}
