import { Skeleton } from "antd";
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/base";
import {
  useIsAuthenticated,
  useIsInitialized,
  usePermissions,
} from "../stores/authStore";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard"));
const MainMember = lazy(() => import("../pages/Member/MemberList"));
const MainMemberDetail = lazy(() => import("../pages/Member/MemberDetail"));
const MainActivity = lazy(() => import("../pages/Activity/ActivityList"));
const ActivityDetail = lazy(() => import("../pages/Activity/ActivityDetail"));
const ActivityParticipants = lazy(
  () => import("../pages/Activity/ActivityParticipants"),
);
const RegistrantDetail = lazy(
  () => import("../pages/Activity/RegistrantDetail"),
);
const MainUniversity = lazy(() => import("../pages/University"));
const MainProvince = lazy(() => import("../pages/Province"));
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
const CustomFormList = lazy(() => import("../pages/CustomForm/CustomFormList"));
const CustomFormEdit = lazy(() => import("../pages/CustomForm/CustomFormEdit"));
const ClubList = lazy(() => import("../pages/Club/ClubList"));
const ClubDetail = lazy(() => import("../pages/Club/ClubDetail"));
const CourseList = lazy(() => import("../pages/Course/CourseList"));
const CourseDetail = lazy(() => import("../pages/Course/CourseDetail"));
const ActivityCertificates = lazy(
  () => import("../pages/Activity/ActivityCertificates"),
);
const DigitalCertificate = lazy(() => import("../pages/DigitalCertificate"));
const CertificateDesigner = lazy(
  () => import("../pages/DigitalCertificate/CertificateDesigner"),
);
const CertificatePreview = lazy(() => import("../pages/CertificatePreview"));
const ForbiddenPage = lazy(() => import("../pages/Forbidden"));
const MyRequestsPage = lazy(() => import("../pages/AccessRequests/MyRequests"));
const RequestDetailPage = lazy(
  () => import("../pages/AccessRequests/RequestDetail"),
);
const ReviewInboxPage = lazy(
  () => import("../pages/AccessRequests/ReviewInbox"),
);
const ReviewDetailPage = lazy(
  () => import("../pages/AccessRequests/ReviewDetail"),
);
const RbacRolesPage = lazy(() => import("../pages/Rbac/Roles"));

const Loading = () => (
  <div style={{ padding: 12, backgroundColor: "white" }}>
    <Skeleton active paragraph={{ rows: 8 }} title={{ width: "30%" }} />
  </div>
);

const Page = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
);

const Authenticated = ({ element }: { element: ReactNode }) => {
  const initialized = useIsInitialized();
  const authenticated = useIsAuthenticated();
  if (!initialized) return <Loading />;
  return authenticated ? <>{element}</> : <Navigate to="/login" replace />;
};

const Authorized = ({
  element,
  permission,
}: {
  element: ReactNode;
  permission: string;
}) => {
  const initialized = useIsInitialized();
  const authenticated = useIsAuthenticated();
  const permissions = usePermissions();
  if (!initialized) return <Loading />;
  if (!authenticated) return <Navigate to="/login" replace />;
  return permissions.includes(permission) ? (
    <>{element}</>
  ) : (
    <Navigate to="/forbidden" replace />
  );
};

const DefaultLanding = () => {
  const permissions = usePermissions();
  return (
    <Navigate
      to={
        permissions.includes("dashboard.read") ? "/dashboard" : "/my-requests"
      }
      replace
    />
  );
};

const guarded = (component: ReactNode, permission: string) => (
  <Authorized permission={permission} element={<Page>{component}</Page>} />
);

const routes = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Page>
        <LoginPage />
      </Page>
    ),
  },
  {
    path: "/digital-certificate/:id/edit",
    element: guarded(<CertificateDesigner />, "certificate.template.manage"),
  },
  {
    path: "/certificate-preview/:id",
    element: guarded(<CertificatePreview />, "certificate.read"),
  },
  {
    path: "/",
    element: <Authenticated element={<AppLayout />} />,
    children: [
      { index: true, element: <DefaultLanding /> },
      {
        path: "forbidden",
        element: (
          <Page>
            <ForbiddenPage />
          </Page>
        ),
      },
      {
        path: "dashboard",
        element: guarded(<DashboardPage />, "dashboard.read"),
      },
      {
        path: "my-requests",
        element: (
          <Page>
            <MyRequestsPage />
          </Page>
        ),
      },
      {
        path: "my-requests/:id",
        element: (
          <Page>
            <RequestDetailPage />
          </Page>
        ),
      },
      {
        path: "ticket-review",
        element: guarded(<ReviewInboxPage />, "tickets.review"),
      },
      {
        path: "ticket-review/:id",
        element: guarded(<ReviewDetailPage />, "tickets.review"),
      },
      { path: "rbac/roles", element: guarded(<RbacRolesPage />, "rbac.read") },
      {
        path: "admin-users",
        element: guarded(<AdminUserList />, "admin_users.read"),
      },
      { path: "member", element: guarded(<MainMember />, "members.read") },
      {
        path: "member/:id",
        element: guarded(<MainMemberDetail />, "members.read"),
      },
      {
        path: "activity",
        element: guarded(<MainActivity />, "activities.read"),
      },
      {
        path: "activity/:id",
        element: guarded(<ActivityDetail />, "activities.read"),
      },
      {
        path: "activity/:id/participants",
        element: guarded(
          <ActivityParticipants />,
          "activity_registrations.read",
        ),
      },
      {
        path: "activity/:id/participants/:participantId",
        element: guarded(<RegistrantDetail />, "activity_registrations.read"),
      },
      {
        path: "registrant/:id",
        element: guarded(<RegistrantDetail />, "activity_registrations.read"),
      },
      {
        path: "activity/:activityId/form/:formId/edit",
        element: guarded(<CustomFormEdit />, "custom_forms.manage"),
      },
      {
        path: "universities",
        element: guarded(<MainUniversity />, "reference_data.manage"),
      },
      {
        path: "province",
        element: guarded(<MainProvince />, "reference_data.manage"),
      },
      {
        path: "ruang-curhat",
        element: guarded(<RuangCurhatList />, "counseling.read"),
      },
      {
        path: "ruang-curhat/:id",
        element: guarded(<RuangCurhatDetail />, "counseling.read"),
      },
      {
        path: "achievement",
        element: guarded(<AchievementList />, "achievements.read"),
      },
      {
        path: "achievement/:id",
        element: guarded(<AchievementDetail />, "achievements.read"),
      },
      {
        path: "monthly-leaderboard",
        element: guarded(<MonthlyLeaderboard />, "leaderboards.read"),
      },
      {
        path: "lifetime-leaderboard",
        element: guarded(<LifetimeLeaderboard />, "leaderboards.read"),
      },
      { path: "club", element: guarded(<ClubList />, "clubs.read") },
      { path: "courses", element: guarded(<CourseList />, "courses.read") },
      {
        path: "courses/:id",
        element: guarded(<CourseDetail />, "courses.read"),
      },
      { path: "club/:id", element: guarded(<ClubDetail />, "clubs.read") },
      {
        path: "club/:clubId/form/:formId/edit",
        element: guarded(<CustomFormEdit />, "custom_forms.manage"),
      },
      {
        path: "custom-form",
        element: guarded(<CustomFormList />, "custom_forms.read"),
      },
      {
        path: "custom-form/:formId/edit",
        element: guarded(<CustomFormEdit />, "custom_forms.manage"),
      },
      {
        path: "activity/:id/certificates",
        element: guarded(<ActivityCertificates />, "certificate.read"),
      },
      {
        path: "digital-certificate",
        element: guarded(<DigitalCertificate />, "certificate.read"),
      },
      { path: "*", element: <Navigate to="/forbidden" replace /> },
    ],
  },
]);

export default routes;
