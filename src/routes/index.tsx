import { createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { ReactNode, Suspense, lazy } from "react";
import { Skeleton } from "antd";
import {
  useIsAuthenticated,
  useIsInitialized,
  useHasPermission,
} from "../stores/authStore";

import AppLayout from "../components/base";

// Lazy load pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const MainMember = lazy(() => import("../pages/Member/MemberList"));
const MainMemberDetail = lazy(() => import("../pages/Member/MemberDetail"));
const MainActivity = lazy(() => import("../pages/Activity/ActivityList"));
const MainUniversity = lazy(() => import("../pages/University"));
const MainProvince = lazy(() => import("../pages/Province"));
const ActivityDetail = lazy(() => import("../pages/Activity/ActivityDetail"));
const ActivityParticipants = lazy(
  () => import("../pages/Activity/ActivityParticipants"),
);
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const RegistrantDetail = lazy(
  () => import("../pages/Activity/RegistrantDetail"),
);
const RuangCurhatList = lazy(
  () => import("../pages/RuangCurhat/RuangCurhatList"),
);
const RuangCurhatDetail = lazy(() =>
  import("../pages/RuangCurhat/RuangCurhatDetail").then((module) => ({
    default: module.RuangCurhatDetail,
  })),
);
const AdminUserList = lazy(() => import("../pages/AdminUser/AdminUserList"));
const AchievementList = lazy(
  () => import("../pages/Leaderboard/AchievementList"),
);
const AchievementDetail = lazy(
  () => import("../pages/Leaderboard/AchievementDetail"),
);
const MonthlyLeaderboard = lazy(
  () => import("../pages/Leaderboard/MonthlyLeaderboard"),
);
const LifetimeLeaderboard = lazy(
  () => import("../pages/Leaderboard/LifetimeLeaderboard"),
);
const ClubList = lazy(() => import("../pages/Club/ClubList"));
const ClubDetail = lazy(() => import("../pages/Club/ClubDetail"));
const CustomFormList = lazy(() => import("../pages/CustomForm/CustomFormList"));
const CustomFormEdit = lazy(() => import("../pages/CustomForm/CustomFormEdit"));
const DigitalCertificate = lazy(() => import("../pages/DigitalCertificate"));
const CertificateDesigner = lazy(
  () => import("../pages/DigitalCertificate/CertificateDesigner"),
);

// Loading Component
const Loading = () => (
  <div style={{ padding: "12px", backgroundColor: "white" }}>
    <Skeleton active paragraph={{ rows: 2 }} title={{ width: "30%" }} />
    <div style={{ marginTop: "12px" }}>
      <Skeleton active paragraph={{ rows: 8 }} title={false} />
    </div>
  </div>
);

// Wrapper for lazy loaded components
const SuspenseWrapper = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

// eslint-disable-next-line react-refresh/only-export-components
const AuthUser = ({ element }: { element: ReactNode }) => {
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();

  // Wait for initialization to prevent infinite loops
  if (!isInitialized) {
    return <Loading />;
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
    return <Loading />;
  }

  if (!isAuthenticated || !hasPermission(permission)) {
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
};

const routes = createBrowserRouter(
  [
    {
      path: "/login",
      element: (
        <SuspenseWrapper>
          <LoginPage />
        </SuspenseWrapper>
      ),
    },
    {
      path: "/",
      element: <AuthUser element={<AppLayout />} />,
      children: [
        {
          path: "/",
          element: (
            <SuspenseWrapper>
              <DashboardPage />
            </SuspenseWrapper>
          ),
        },
        {
          path: "dashboard",
          element: (
            <SuspenseWrapper>
              <DashboardPage />
            </SuspenseWrapper>
          ),
        },
        {
          path: "member",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <MainMember />
                </SuspenseWrapper>
              }
              permission="anggota"
            />
          ),
        },
        {
          path: "member/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <MainMemberDetail />
                </SuspenseWrapper>
              }
              permission="anggota"
            />
          ),
        },
        {
          path: "activity",
          element: (
            <SuspenseWrapper>
              <MainActivity />
            </SuspenseWrapper>
          ),
        },
        {
          path: "activity/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <ActivityDetail />
                </SuspenseWrapper>
              }
              permission="kegiatan"
            />
          ),
        },
        {
          path: "activity/:id/participants",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <ActivityParticipants />
                </SuspenseWrapper>
              }
              permission="kegiatan"
            />
          ),
        },
        {
          path: "activity/:id/participants/:participantId",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <RegistrantDetail />
                </SuspenseWrapper>
              }
              permission="kegiatan"
            />
          ),
        },
        {
          path: "activity/:activityId/form/:formId/edit",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <CustomFormEdit />
                </SuspenseWrapper>
              }
              permission="kegiatan"
            />
          ),
        },
        {
          path: "registrant/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <RegistrantDetail />
                </SuspenseWrapper>
              }
              permission="kegiatan"
            />
          ),
        },
        {
          path: "universities",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <MainUniversity />
                </SuspenseWrapper>
              }
              permission="pusatdata"
            />
          ),
        },
        {
          path: "province",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <MainProvince />
                </SuspenseWrapper>
              }
              permission="pusatdata"
            />
          ),
        },
        {
          path: "ruang-curhat",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <RuangCurhatList />
                </SuspenseWrapper>
              }
              permission="ruangcurhat"
            />
          ),
        },
        {
          path: "ruang-curhat/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <RuangCurhatDetail />
                </SuspenseWrapper>
              }
              permission="ruangcurhat"
            />
          ),
        },
        {
          path: "/admin-users",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <AdminUserList />
                </SuspenseWrapper>
              }
              permission="akunadmin"
            />
          ),
        },
        {
          path: "/achievement",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <AchievementList />
                </SuspenseWrapper>
              }
              permission="leaderboard"
            />
          ),
        },
        {
          path: "/achievement/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <AchievementDetail />
                </SuspenseWrapper>
              }
              permission="leaderboard"
            />
          ),
        },
        {
          path: "/monthly-leaderboard",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <MonthlyLeaderboard />
                </SuspenseWrapper>
              }
              permission="leaderboard"
            />
          ),
        },
        {
          path: "/lifetime-leaderboard",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <LifetimeLeaderboard />
                </SuspenseWrapper>
              }
              permission="leaderboard"
            />
          ),
        },
        {
          path: "/club",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <ClubList />
                </SuspenseWrapper>
              }
              permission="pusatdata"
            />
          ),
        },
        {
          path: "/club/:id",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <ClubDetail />
                </SuspenseWrapper>
              }
              permission="pusatdata"
            />
          ),
        },
        {
          path: "/custom-form",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <CustomFormList />
                </SuspenseWrapper>
              }
              permission="formkustom"
            />
          ),
        },
        {
          path: "/custom-form/:formId/edit",
          element: (
            <RoleUser
              element={
                <SuspenseWrapper>
                  <CustomFormEdit />
                </SuspenseWrapper>
              }
              permission="formkustom"
            />
          ),
        },
        {
          path: "/digital-certificate",
          element: (
            <SuspenseWrapper>
              <DigitalCertificate />
            </SuspenseWrapper>
          ),
        },
        {
          path: "/digital-certificate/:id/edit",
          element: (
            <SuspenseWrapper>
              <CertificateDesigner />
            </SuspenseWrapper>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);

export default routes;
