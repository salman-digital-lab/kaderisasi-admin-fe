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
import AchievementDetail from "../pages/Leaderboard/AchievementDetail";
import MonthlyLeaderboard from "../pages/Leaderboard/MonthlyLeaderboard";
import LifetimeLeaderboard from "../pages/Leaderboard/LifetimeLeaderboard";
import ClubList from "../pages/Club/ClubList";
import ClubDetail from "../pages/Club/ClubDetail";
import CustomFormList from "../pages/CustomForm/CustomFormList";
import CustomFormEdit from "../pages/CustomForm/CustomFormEdit";
import { useIsAuthenticated, useIsInitialized, useHasPermission } from "../stores/authStore";

// eslint-disable-next-line react-refresh/only-export-components
const AuthUser = ({ element }: { element: ReactNode }) => {
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();
  
  // Wait for initialization to prevent infinite loops
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();
  const hasPermission = useHasPermission();
  
  // Wait for initialization to prevent infinite loops
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated || !hasPermission(permission)) {
    return <Navigate to="/login" replace />;
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
        path: "/achievement",
        element: (
          <RoleUser element={<AchievementList />} permission="leaderboard" />
        ),
      },
      {
        path: "/achievement/:id",
        element: (
          <RoleUser element={<AchievementDetail />} permission="leaderboard" />
        ),
      },
      {
        path: "/monthly-leaderboard",
        element: (
          <RoleUser element={<MonthlyLeaderboard />} permission="leaderboard" />
        ),
      },
      {
        path: "/lifetime-leaderboard",
        element: (
          <RoleUser element={<LifetimeLeaderboard />} permission="leaderboard" />
        ),
      },
      {
        path: "/club",
        element: (
          <RoleUser element={<ClubList />} permission="pusatdata" />
        ),
      },
      {
        path: "/club/:id",
        element: (
          <RoleUser element={<ClubDetail />} permission="pusatdata" />
        ),
      },
      {
        path: "/custom-form",
        element: (
          <RoleUser element={<CustomFormList />} permission="formkustom" />
        ),
      },
      {
        path: "/custom-form/:id/edit",
        element: (
          <RoleUser element={<CustomFormEdit />} permission="formkustom" />
        ),
      },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

export default routes;
