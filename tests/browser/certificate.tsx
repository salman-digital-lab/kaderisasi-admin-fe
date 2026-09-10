// Opt-in, network-isolated browser fixture. Never imported by an application route.
import "antd/dist/reset.css";
import "../../src/styles/global.css";
import "../../src/styles/responsive.css";
import { ResponsiveEnvironment } from "../../src/components/common/Responsive/ResponsiveEnvironment";
import { ConfigProvider } from "antd";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import axios from "../../src/api/axios";
import { useAuthStore } from "../../src/stores/authStore";
import ActivityCertificates from "../../src/pages/Activity/ActivityCertificates";
import CertificateDesigner from "../../src/pages/DigitalCertificate/CertificateDesigner";
import CertificateList from "../../src/pages/DigitalCertificate/CertificateList";
import { buildStarterTemplate } from "../../src/pages/DigitalCertificate/utils/starter-templates";
import type { CertificateElement } from "../../src/pages/DigitalCertificate/types";

const query = new URLSearchParams(location.search);
const isEditor = query.get("mode") === "editor";
const design = buildStarterTemplate("a4-landscape", "basic");
if (isEditor)
  design.elements = [
    ...design.elements,
    ...Array.from(
      { length: 200 - design.elements.length },
      (_, i): CertificateElement => ({
        id: `lab-${i}`,
        type: "static-text",
        content: `Layer ${i} · العربية 日本語`,
        x: 20 + (i % 10) * 75,
        y: 20 + Math.floor(i / 10) * 25,
        width: 72,
        height: 25,
        fontSize: 8,
        color: "#aaaaaa",
        visible: true,
        locked: false,
        opacity: 40,
      }),
    ),
  ];
const template = {
  id: 900001,
  name: "Sertifikat pelatihan kepemimpinan",
  description: null,
  status: isEditor && query.get("published") !== "1" ? "draft" : "published",
  is_active: !isEditor,
  version: 1,
  background_image: null,
  template_data: design,
  readiness: { ready: true, errors: [] },
};
const activity = {
  id: 900001,
  name: "Pelatihan Kepemimpinan Salman 2026",
  activity_start: "2026-09-09",
};
const issued = new Set<number>();
// Deterministic page-lifecycle simulation for this isolated fixture only.
let fixtureHidden = false;
let interrupted = false;
if (query.get("interrupt") === "1") {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => fixtureHidden,
  });
  const returnButton = document.createElement("button");
  returnButton.textContent = "Fixture: kembali ke aplikasi";
  returnButton.style.cssText = "min-height:44px;padding:8px";
  returnButton.onclick = () => {
    fixtureHidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  };
  document.body.append(returnButton);
}
const registrations = Array.from({ length: 1000 }, (_, i) => ({
  registration_id: i + 1,
  name:
    i === 0
      ? "Muhammad Abdurrahman Pratama Wiratama Kusumah"
      : `Peserta ${String(i + 1).padStart(4, "0")}`,
  status: "LULUS KEGIATAN",
  state: "eligible_not_issued",
  certificate_id: null,
  certificate_code: null,
}));
const metrics = document.createElement("output");
metrics.id = "lab-metrics";
metrics.style.cssText =
  "display:block;padding:8px;font:12px monospace;background:#eef;white-space:pre-wrap;overflow-wrap:anywhere";
document.body.append(metrics);
const calls: string[] = [];
const durations: number[] = [];
const report = (): void => {
  metrics.textContent = JSON.stringify({
    mode: query.get("mode") || "workspace",
    calls,
    interactionMs: durations,
    layers: design.elements.length,
    recipients: 1000,
    issued: issued.size,
    fixtureHidden,
    pdfDependenciesLoaded: performance
      .getEntriesByType("resource")
      .some((entry) => /html2canvas|jspdf/.test(entry.name)),
  });
};
new PerformanceObserver((list) => {
  for (const entry of list.getEntries())
    if ("interactionId" in entry && entry.interactionId)
      durations.push(entry.duration);
  report();
}).observe({ type: "event", buffered: true, ...{ durationThreshold: 16 } });
useAuthStore.setState({
  permissions: [
    "certificate.read",
    "certificate.issue",
    "certificate.template.manage",
  ],
  token: "isolated-fixture",
  isAuthenticated: true,
  isInitialized: true,
});
axios.defaults.adapter = async (config) => {
  calls.push(`${config.method} ${config.url}`);
  if (
    query.get("interrupt") === "1" &&
    !interrupted &&
    config.url?.includes("issue-bulk")
  ) {
    interrupted = true;
    fixtureHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  }
  report();
  await new Promise((resolve) =>
    setTimeout(resolve, config.url?.includes("issue-bulk") ? 400 : 40),
  );
  const url = config.url || "";
  if (query.get("failSave") === "1" && config.method === "put")
    throw new Error("Fixture: save unavailable");
  const params = {
    ...Object.fromEntries(new URLSearchParams(url.split("?")[1])),
    ...config.params,
  };
  const body =
    typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  let data: unknown;
  if (url.includes("/recipients")) {
    const matches = registrations.filter((row) =>
      row.name
        .toLowerCase()
        .includes(String(params.search || "").toLowerCase()),
    );
    const page = Number(params.page || 1),
      per = Number(params.per_page || 50);
    data = {
      activity,
      template,
      counts: {
        eligible_not_issued: 1000 - issued.size,
        issued_active: issued.size,
        issued_revoked: 0,
        not_eligible: 0,
      },
      meta: { total: matches.length, per_page: per, current_page: page },
      data: matches.slice((page - 1) * per, page * per).map((row) => ({
        ...row,
        ...(issued.has(row.registration_id)
          ? {
              state: "issued_active",
              certificate_code: `LAB-${row.registration_id}`,
            }
          : {}),
      })),
    };
  } else if (url.includes("prepare-issuance")) {
    const ids = (
      body.registration_ids || registrations.map((row) => row.registration_id)
    ).filter((id: number) => !issued.has(id));
    data = {
      activity_id: activity.id,
      template_id: template.id,
      template_version: template.version,
      registration_ids: ids,
      excluded: {
        already_issued: issued.size,
        revoked: 0,
        not_eligible: 0,
        missing: 0,
      },
      preview: ids.length
        ? {
            activity,
            template,
            participant: {
              ...registrations[ids[0] - 1],
              activity_name: activity.name,
              activity_date: "9 September 2026",
            },
          }
        : null,
    };
  } else if (url.includes("issue-bulk")) {
    data = {
      paused: false,
      remaining_ids: [],
      results: body.registration_ids.map((id: number) => {
        const state = issued.has(id) ? "already_issued" : "created";
        issued.add(id);
        return { registration_id: id, name: registrations[id - 1].name, state };
      }),
    };
    report();
  } else if (url.endsWith("/publish") || url.endsWith("/archive")) {
    template.status = url.endsWith("/publish") ? "published" : "archived";
    template.is_active = template.status === "published";
    template.version += 1;
    data = template;
  } else if (url.endsWith("/duplicate")) {
    data = {
      ...template,
      id: 900002,
      status: "draft",
      is_active: false,
      version: 1,
    };
  } else if (/certificate-templates\/90000[12]/.test(url)) {
    if (config.method === "put")
      Object.assign(template, body, {
        template_data: body.templateData || template.template_data,
        version: template.version + 1,
      });
    data = url.includes("900002")
      ? { ...template, id: 900002, status: "draft", is_active: false }
      : template;
  } else if (url.startsWith("/certificate-templates")) {
    data = {
      data: [template],
      meta: { total: 1, current_page: 1, per_page: 12 },
    };
  } else if (url.startsWith("/activities/")) data = activity;
  else throw new Error(`Fixture blocks unhandled request: ${url}`);
  return { status: 200, statusText: "OK", headers: {}, config, data: { data } };
};
const router = createMemoryRouter(
  [
    { path: "/activity/:id/certificates", element: <ActivityCertificates /> },
    { path: "/digital-certificate/:id", element: <CertificateDesigner /> },
    { path: "/digital-certificate/:id/edit", element: <CertificateDesigner /> },
    { path: "/digital-certificate", element: <CertificateList /> },
  ],
  {
    initialEntries: [
      isEditor
        ? "/digital-certificate/900001"
        : query.get("mode") === "library"
          ? "/digital-certificate"
          : "/activity/900001/certificates",
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
