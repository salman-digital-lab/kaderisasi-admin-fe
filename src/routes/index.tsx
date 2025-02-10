import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import MainMember from "../pages/Member/MemberList";
import AppLayout from "../components/base";
import MainMemberDetail from "../pages/Member/MemberDetail";
import MainActivity from "../pages/Activity/ActivityList";
import MainUniversity from "../pages/University";
import MainProvince from "../pages/Province";
import ActivityDetail from "../pages/Activity/ActivityDetail";
import { ReactNode } from "react";
import DashboardPage from "../pages/Dashboard";
import RegistrantDetail from "../pages/Activity/RegistrantDetail";
import RuangCurhatList from "../pages/RuangCurhat/RuangCurhatList";
import { RuangCurhatDetail } from "../pages/RuangCurhat/RuangCurhatDetail";
import AdminUserList from "../pages/AdminUser/AdminUserList";
import AchievementList from "../pages/Leaderboard/AchievementList";
import { ADMIN_ROLE_PERMISSION } from "../constants/permissions";

const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

// eslint-disable-next-line react-refresh/only-export-components
const AuthUser = ({ element }: { element: ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <>{element}</>;
};

// eslint-disable-next-line react-refresh/only-export-components
const RoleUser = ({
  element,
  permission,
}: {
  element: ReactNode;
  permission: string;
}) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}").user;
  const role = user?.role as keyof typeof ADMIN_ROLE_PERMISSION;

  if (!ADMIN_ROLE_PERMISSION[role].includes(permission)) {
    return <Navigate to="/login" />;
  }

  return <>{element}</>;
};

const routes = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AuthUser element={<AppLayout />} />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "member",
        element: <RoleUser element={<MainMember />} permission="anggota" />,
      },
      {
        path: "member/:id",
        element: (
          <RoleUser element={<MainMemberDetail />} permission="anggota" />
        ),
      },
      {
        path: "activity",
        element: <MainActivity />,
      },
      {
        path: "activity/:id",
        element: (
          <RoleUser element={<ActivityDetail />} permission="kegiatan" />
        ),
      },
      {
        path: "registrant/:id",
        element: (
          <RoleUser element={<RegistrantDetail />} permission="kegiatan" />
        ),
      },
      {
        path: "universities",
        element: (
          <RoleUser element={<MainUniversity />} permission="pusatdata" />
        ),
      },
      {
        path: "province",
        element: <RoleUser element={<MainProvince />} permission="pusatdata" />,
      },
      {
        path: "ruang-curhat",
        element: (
          <RoleUser element={<RuangCurhatList />} permission="ruangcurhat" />
        ),
      },
      {
        path: "ruang-curhat/:id",
        element: (
          <RoleUser element={<RuangCurhatDetail />} permission="ruangcurhat" />
        ),
      },
      {
        path: "/admin-users",
        element: (
          <RoleUser element={<AdminUserList />} permission="akunadmin" />
        ),
      },
      {
        path: "/achievements",
        element: (
          <RoleUser element={<AchievementList />} permission="leaderboard" />
        ),
      },
    ],
  },
]);

export default routes;
