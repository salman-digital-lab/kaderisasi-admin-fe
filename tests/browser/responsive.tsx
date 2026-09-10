// Network-isolated fixtures for real admin pages. Not imported by production routes.
import "antd/dist/reset.css";
import "../../src/styles/global.css";
import "../../src/styles/responsive.css";
import { useState, type Key, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { Button, ConfigProvider, Space, Tag } from "antd";
import axios from "../../src/api/axios";
import { useAuthStore } from "../../src/stores/authStore";
import AppLayout from "../../src/components/base";
import { ResponsiveEnvironment } from "../../src/components/common/Responsive/ResponsiveEnvironment";
import { ResponsiveTable } from "../../src/components/common/Responsive/ResponsiveTable";
import MemberList from "../../src/pages/Member/MemberList";
import CustomFormEdit from "../../src/pages/CustomForm/CustomFormEdit";
import ColumnManager from "../../src/pages/Activity/ActivityParticipants/components/ColumnManager";
import ClubList from "../../src/pages/Club/ClubList";
import Dashboard from "../../src/pages/Dashboard";
import { ResponsiveDescriptions } from "../../src/components/common/Responsive/ResponsiveDescriptions";
import type { ColumnConfig } from "../../src/pages/Activity/ActivityParticipants/constants/columns";

const query = new URLSearchParams(location.search);
const calls: string[] = [];
const metrics = document.createElement("output");
metrics.id = "lab-metrics";
metrics.style.cssText =
  "display:block;overflow-wrap:anywhere;font:12px monospace;padding:8px";
document.body.append(metrics);
const members = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  name:
    index === 0
      ? "Muhammad Abdurrahman Pratama Wiratama Kusumah"
      : `Anggota ${index + 1}`,
  gender: "L",
  level: "1",
  badges: ["Kader Salman"],
  education_history: [],
  publicUser: {
    member_id: `BMKA-${index + 1}`,
    email: `anggota${index + 1}@example.invalid`,
    account_status: "active",
  },
}));
const customForm = {
  id: 900001,
  form_name: "Pendaftaran pelatihan kepemimpinan dan pengabdian masyarakat",
  form_description: "Formulir pengujian responsif",
  feature_type: "independent_form",
  feature_id: null,
  created_at: "2026-09-09T10:00:00Z",
  updated_at: "2026-09-09T10:00:00Z",
  is_active: true,
  post_submission_info: "<p>Terima kasih.</p>",
  form_schema: {
    fields: [
      {
        section_name: "Pengalaman dan motivasi",
        fields: Array.from({ length: 25 }, (_, i) => ({
          key: `question_${i}`,
          label: `Pertanyaan ${i + 1}: Ceritakan pengalaman dan motivasi mengikuti kegiatan`,
          type: "text",
          required: i === 0,
          options: [],
        })),
      },
    ],
  },
};
useAuthStore.setState({
  permissions:
    query.get("restricted") === "1"
      ? ["members.read"]
      : [
          "members.read",
          "members.manage",
          "custom_forms.read",
          "custom_forms.manage",
          "activities.read",
          "dashboard.read",
          "clubs.read",
          "clubs.manage",
        ],
  token: "isolated-fixture",
  isAuthenticated: true,
  isInitialized: true,
});
axios.defaults.adapter = async (config) => {
  calls.push(`${config.method} ${config.url}`);
  metrics.textContent = JSON.stringify({ calls });
  await new Promise((resolve) => setTimeout(resolve, 30));
  const url = new URL(config.url || "", "https://fixture.invalid");
  const params = url.searchParams;
  const body =
    typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  let data: unknown;
  if (query.get("error") === "1")
    throw new Error("Fixture: unavailable server");
  if (url.pathname === "/profiles" && config.method === "get") {
    const rows =
      query.get("empty") === "1"
        ? []
        : members.filter((row) =>
            row.name
              .toLowerCase()
              .includes((params.get("search") || "").toLowerCase()),
          );
    const page = Number(params.get("page") || 1),
      perPage = Number(params.get("per_page") || 10);
    data = {
      data: rows.slice((page - 1) * perPage, page * perPage),
      meta: { current_page: page, per_page: perPage, total: rows.length },
    };
  } else if (url.pathname === "/profiles" && config.method === "post") {
    data = { ...body, id: 900001 };
  } else if (url.pathname === "/dashboard/stats") {
    data = {
      totalProfiles: 123456,
      totalActivities: 1234,
      totalClubs: 100,
      totalRuangCurhats: 1000,
    };
  } else if (url.pathname === "/clubs") {
    data = {
      data: [
        {
          id: 900001,
          name: "Komunitas Pengabdian Masyarakat dan Pengembangan Kepemimpinan Salman",
          club_type: "UNIT",
          is_show: true,
          is_registration_open: true,
          media: { items: [] },
        },
      ],
      meta: { current_page: 1, per_page: 10, total: 1 },
    };
  } else if (url.pathname === "/custom-forms/900001") {
    if (config.method === "put")
      Object.assign(customForm, {
        form_name: body.formName,
        form_schema: body.formSchema,
      });
    data = customForm;
  } else if (url.pathname.startsWith("/custom-forms/available-")) data = [];
  else
    throw new Error(
      `Fixture blocks unhandled request: ${config.method} ${config.url}`,
    );
  return { status: 200, statusText: "OK", headers: {}, config, data: { data } };
};

const defaults: ColumnConfig[] = [
  {
    key: "name",
    dataIndex: "name",
    title: "Nama",
    visible: true,
    fixed: "left",
  },
  { key: "status", dataIndex: "status", title: "Status", visible: true },
  { key: "email", dataIndex: "email", title: "Email", visible: true },
];
function SelectionFixture(): ReactElement {
  const [selected, setSelected] = useState<Key[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"ascend" | "descend" | null>(null);
  const [changes, setChanges] = useState(0);
  const [columns, setColumns] = useState(defaults);
  const rows = [...members].sort((a, b) =>
    sort === "descend" ? b.id - a.id : a.id - b.id,
  );
  return (
    <main style={{ padding: 16 }}>
      <Space wrap>
        <Link to="/member">Anggota</Link>
        <Link to="/custom-form/900001/edit">Ubah formulir</Link>
        <ColumnManager
          columns={columns}
          defaultColumns={defaults}
          onColumnsChange={setColumns}
          activityId="responsive-fixture"
        />
      </Space>
      <output id="selection-state" style={{ display: "block" }}>
        {JSON.stringify({
          selected,
          page,
          sort,
          changes,
          columns: columns.map((column) => column.key),
        })}
      </output>
      <ResponsiveTable
        listId="responsive-fixture-selection"
        rowKey="id"
        dataSource={rows.slice((page - 1) * 5, page * 5)}
        columns={[
          {
            key: "name",
            title: "Nama",
            dataIndex: "name",
            sorter: true,
            sortOrder: sort,
            fixed: "left",
          },
          { key: "status", title: "Status", render: () => <Tag>Aktif</Tag> },
          { key: "email", title: "Email", dataIndex: ["publicUser", "email"] },
          {
            key: "actions",
            title: "Aksi",
            render: (_, row) => (
              <Button onClick={() => setSelected([row.id])}>
                Pilih {row.id}
              </Button>
            ),
          },
        ]}
        rowSelection={{
          selectedRowKeys: selected,
          preserveSelectedRowKeys: true,
          onChange: setSelected,
          getCheckboxProps: (row) => ({
            disabled: false,
            "aria-label": `Pilih anggota ${row.id}`,
          }),
        }}
        pagination={{
          current: page,
          pageSize: 5,
          total: rows.length,
          showSizeChanger: false,
        }}
        scroll={{ x: 900 }}
        onChange={(pagination, _filters, sorter) => {
          setPage(pagination.current || 1);
          if (!Array.isArray(sorter)) setSort(sorter.order || null);
          setChanges((value) => value + 1);
        }}
      />
    </main>
  );
}
const router = createMemoryRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: "/member", element: <MemberList /> },
        { path: "/custom-form/:formId/edit", element: <CustomFormEdit /> },
        { path: "/custom-form", element: <SelectionFixture /> },
        { path: "/dashboard", element: <SelectionFixture /> },
        { path: "/activity", element: <SelectionFixture /> },
        { path: "/club", element: <ClubList /> },
        { path: "/fixture-dashboard", element: <Dashboard /> },
        {
          path: "/fixture-details",
          element: (
            <div style={{ padding: 12 }}>
              <ResponsiveDescriptions
                title="Detail anggota"
                bordered
                column={2}
                items={[
                  { key: "name", label: "Nama", children: members[0].name },
                  {
                    key: "status",
                    label: "Status",
                    children: <Tag>Aktif</Tag>,
                  },
                  {
                    key: "notes",
                    label: "Catatan",
                    span: 2,
                    children:
                      "Informasi administrasi dengan data panjang yang tetap dapat dibaca pada kedua orientasi ponsel.",
                  },
                ]}
              />
            </div>
          ),
        },
      ],
    },
  ],
  {
    initialEntries: [
      query.get("mode") === "club"
        ? "/club"
        : query.get("mode") === "dashboard"
          ? "/fixture-dashboard"
          : query.get("mode") === "details"
            ? "/fixture-details"
            : query.get("mode") === "form"
              ? "/custom-form/900001/edit"
              : query.get("mode") === "selection"
                ? "/dashboard"
                : "/member",
    ],
  },
);
createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{ token: { colorPrimary: "#1F99CB", borderRadius: 0 } }}
  >
    <ResponsiveEnvironment />
    <RouterProvider router={router} />
  </ConfigProvider>,
);
