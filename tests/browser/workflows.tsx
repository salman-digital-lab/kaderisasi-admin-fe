// In-memory API fixture. No request can reach a real backend.
import "antd/dist/reset.css";
import "../../src/styles/global.css";
import "../../src/styles/responsive.css";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AxiosError } from "axios";
import axios, { sessionClient } from "../../src/api/axios";
import { useAuthStore } from "../../src/stores/authStore";
import AppLayout from "../../src/components/base";
import { ResponsiveEnvironment } from "../../src/components/common/Responsive/ResponsiveEnvironment";
import ActivitySetup from "../../src/pages/Activity/ActivitySetup";
import MyRequests from "../../src/pages/AccessRequests/MyRequests";
import NewRequest from "../../src/pages/AccessRequests/NewRequest";
import RequestDetail from "../../src/pages/AccessRequests/RequestDetail";
import ClubList from "../../src/pages/Club/ClubList";
import type { AccessTicket } from "../../src/types/model/access";
import type { CustomForm } from "../../src/types/model/customForm";
import roles from "../../../kaderisasi-admin-be-go/internal/auth/roles.json";

const query = new URLSearchParams(location.search);
const role = roles.find((item) => item.code === query.get("role"));
const session = {
  access_token: "isolated-fixture",
  access_token_expires_in: 3600,
  user: {
    id: 1,
    email: "fixture@example.invalid",
    display_name: "Pengguna Uji",
    is_active: true,
    role: role ? { code: role.code, name: role.name } : null,
  },
  permissions: role?.permissions ?? [],
  authentication_methods: ["password"],
  is_super_admin: role?.code === "super_admin",
};
useAuthStore.getState().setSession(session);
let activity: Record<string, unknown> = {
  id: 42,
  name: "Pembinaan Kader Oktober",
  slug: "pembinaan-kader-oktober",
  activity_type: 1,
  activity_category: 2,
  minimum_level: 0,
  description: "<p>Pelatihan kepemimpinan untuk kader baru.</p>",
  additional_config: { images: [] },
  is_published: false,
  is_registration_open: false,
};
const tickets: AccessTicket[] = [];
const attachedForm: CustomForm = {
  id: 7,
  form_name: "Pendaftaran Pembinaan Kader Oktober",
  form_description: "Data peserta kegiatan pembinaan.",
  feature_type: "activity_registration",
  feature_id: 42,
  form_schema: { fields: [] },
  is_active: false,
  created_at: "2026-09-10T08:00:00Z",
  updated_at: "2026-09-10T08:00:00Z",
};
axios.defaults.adapter = async (config) => {
  const url = new URL(config.url ?? "", "https://fixture.invalid");
  const body =
    typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  let data: unknown;
  if (query.get("fail") === "1" && config.method === "post")
    throw new AxiosError("Fixture failure", "ERR_NETWORK", config);
  if (url.pathname === "/auth/me") data = session;
  else if (url.pathname === "/rbac/requestable-targets")
    data = { roles: roles.filter((item) => item.is_requestable) };
  else if (url.pathname === "/access-requests" && config.method === "post") {
    const ticket: AccessTicket = {
      id: 1,
      number: "AKS-0001",
      status: "open",
      resolution: null,
      reason: body.reason,
      rejection_reason: null,
      requester_admin_user_id: 1,
      requester_name: "Pengguna Uji",
      requester_email: "fixture@example.invalid",
      requested_role_code: body.role_code,
      role_name: roles.find((item) => item.code === body.role_code)!.name,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    tickets.push(ticket);
    data = ticket;
  } else if (url.pathname === "/access-requests") data = tickets;
  else if (url.pathname === "/access-requests/1") data = tickets[0];
  else if (url.pathname.endsWith("/readiness"))
    data = {
      can_publish: false,
      can_open_registration: false,
      issues: [
        {
          code: "poster",
          message: "Unggah minimal satu poster kegiatan.",
          step: 1,
          scope: "publication",
        },
        {
          code: "registration_period",
          message: "Tentukan periode pendaftaran.",
          step: 2,
          scope: "registration",
        },
        {
          code: "registration_form",
          message: "Siapkan dan aktifkan formulir pendaftaran yang valid.",
          step: 2,
          scope: "registration",
        },
      ],
      actions: {
        can_edit: true,
        can_publish: role?.permissions.includes("activities.publish"),
        can_manage_registration: role?.permissions.includes(
          "activities.registration.manage",
        ),
      },
    };
  else if (url.pathname === "/activities" && config.method === "post") {
    activity = { id: 42, ...body };
    data = activity;
  } else if (url.pathname === "/activities/42" && config.method === "put") {
    activity = { ...activity, ...body };
    data = activity;
  } else if (url.pathname === "/activities/42") data = activity;
  else if (url.pathname === "/custom-forms" && query.get("form") === "error")
    throw new AxiosError("Fixture form failure", "ERR_NETWORK", config);
  else if (url.pathname === "/custom-forms/7/toggle-active") {
    attachedForm.is_active = !attachedForm.is_active;
    data = attachedForm;
  } else if (
    ["/clubs", "/custom-forms", "/custom-forms/unattached"].includes(
      url.pathname,
    )
  )
    data = {
      data:
        url.pathname === "/custom-forms" && query.get("form") === "inactive"
          ? [attachedForm]
          : [],
      meta: { total: 0, current_page: 1, per_page: 10, last_page: 1 },
    };
  else
    throw new Error(
      `Unmocked fixture request: ${config.method} ${url.pathname}`,
    );
  return {
    config,
    data: { message: "SUCCESS", data },
    status: 200,
    statusText: "OK",
    headers: {},
  };
};
sessionClient.defaults.adapter = axios.defaults.adapter;
const router = createMemoryRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: "/my-requests", element: <MyRequests /> },
        { path: "/my-requests/new", element: <NewRequest /> },
        { path: "/my-requests/:id", element: <RequestDetail /> },
        { path: "/activity/new", element: <ActivitySetup /> },
        { path: "/activity/:id/setup", element: <ActivitySetup /> },
        { path: "/activity", element: <div>Kegiatan tersimpan</div> },
        { path: "/club", element: <ClubList /> },
      ],
    },
  ],
  { initialEntries: [query.get("path") ?? "/my-requests"] },
);
createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{ token: { colorPrimary: "#1F99CB", borderRadius: 0 } }}
  >
    <ResponsiveEnvironment />
    <RouterProvider router={router} />
  </ConfigProvider>,
);
