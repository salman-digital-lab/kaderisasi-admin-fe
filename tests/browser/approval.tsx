import "antd/dist/reset.css";
import "../../src/styles/global.css";
import "../../src/styles/responsive.css";
import { ResponsiveEnvironment } from "../../src/components/common/Responsive/ResponsiveEnvironment";
import { ConfigProvider, Card } from "antd";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { CertificateApprovals } from "../../src/pages/DigitalCertificate/components/CertificateApprovals";
import { ApprovalRequestForm } from "../../src/pages/Activity/ActivityCertificates/ApprovalRequestForm";
import { CertificateArtwork } from "../../src/pages/DigitalCertificate/components/CertificateArtwork";
import {
  resolveCertificateText,
  getCertificateVerificationUrl,
} from "../../src/pages/DigitalCertificate/utils/certificate-content";
import { buildStarterTemplate } from "../../src/pages/DigitalCertificate/utils/starter-templates";
import { useAuthStore } from "../../src/stores/authStore";
import axios from "../../src/api/axios";
import type {
  ApprovalDetail,
  ApprovalOutcome,
} from "../../src/api/services/certificateApproval";
import type { IssuancePlan } from "../../src/types/services/certificateWorkflow";
import type {
  CertificateApproval,
  CertificatePayload,
} from "../../src/types/services/certificateTemplate";

// Opt-in synthetic fixture; the adapter blocks every request outside this workflow.
const mode = new URLSearchParams(location.search).get("mode");
const snapshot: CertificatePayload = {
  activity: {
    id: 1,
    name: "Kegiatan uji persetujuan",
    activity_start: "2026-09-10",
  },
  template: {
    id: 1,
    name: "Desain uji persetujuan",
    background_image: null,
    template_data: buildStarterTemplate("a4-landscape", "basic"),
  },
  participant: {
    registration_id: 1,
    user_id: null,
    name: "Peserta Uji",
    email: "fixture@example.test",
    university: "",
    activity_name: "Kegiatan uji persetujuan",
    activity_date: "10 September 2026",
  },
};
const rows: ApprovalDetail[] = [1, 2].map((id) => ({
  id,
  registration_id: id,
  activity_id: 1,
  signer_id: 1,
  requested_by: mode === "cancel" ? 1 : 2,
  signer_name: "Penandatangan Uji",
  signer_title: "Ketua kegiatan",
  participant_name: `Peserta Uji ${id}`,
  activity_name: snapshot.activity.name,
  content_hash: String(id).repeat(64),
  status: "pending",
  decided_at: null,
  reason: null,
  certificate_id: null,
  created_at: "2026-09-10T03:00:00.000Z",
  snapshot: {
    ...snapshot,
    participant: {
      ...snapshot.participant,
      registration_id: id,
      name: `Peserta Uji ${id}`,
    },
  },
}));
const evidence: CertificateApproval = {
  signer_name: "Penandatangan Uji",
  signer_title: "Ketua kegiatan",
  approved_at: "2026-09-10T10:00:00.000+07:00",
};
useAuthStore.setState({
  user: {
    id: 1,
    email: "signer@example.test",
    display_name: "Penandatangan Uji",
    role: null,
    is_active: true,
  },
  permissions: ["certificate.read", "certificate.issue", "certificate.approve"],
  isAuthenticated: true,
  isInitialized: true,
});
axios.defaults.adapter = async (config) => {
  const url = config.url ?? "";
  let data: unknown;
  if (mode === "error") throw new Error("Synthetic offline state");
  if (url === "/certificates/signers")
    data = mode === "empty" ? [] : [{ id: 1, name: "Penandatangan Uji" }];
  else if (url === "/certificates/approvals" && config.method === "get") {
    const matches =
      mode === "empty"
        ? []
        : rows.filter((row) => row.status === config.params.status);
    data = {
      data: matches,
      meta: { total: matches.length, current_page: 1, per_page: 20 },
    };
  } else if (url === "/certificates/approvals" && config.method === "post") {
    data = rows.map((row) => ({
      id: row.id,
      registration_id: row.registration_id,
      status: row.status,
    }));
  } else if (url === "/certificates/approvals/decide") {
    const body = JSON.parse(config.data) as {
      items: Array<{ id: number; content_hash: string }>;
      action: "approve" | "reject" | "cancel";
      consent: boolean;
      reason?: string;
    };
    if (body.action === "approve" && !body.consent)
      throw new Error("Consent missing");
    data = body.items.map((item): ApprovalOutcome => {
      const row = rows.find((entry) => entry.id === item.id);
      if (!row || row.content_hash !== item.content_hash)
        throw new Error("Invalid review");
      row.status =
        body.action === "approve"
          ? "approved"
          : body.action === "reject"
            ? "rejected"
            : "cancelled";
      row.decided_at = evidence.approved_at;
      row.reason = body.reason ?? null;
      if (row.status === "approved") row.certificate_id = row.id;
      return {
        id: row.id,
        registration_id: row.registration_id,
        status: row.status,
        certificate_id: row.certificate_id ?? undefined,
      };
    });
  } else if (/^\/certificates\/approvals\/\d+$/.test(url))
    data = rows.find((row) => row.id === Number(url.split("/").pop()));
  else throw new Error(`Unhandled fixture request: ${url}`);
  return { data: { data }, status: 200, statusText: "OK", headers: {}, config };
};
const plan: IssuancePlan = {
  activity_id: 1,
  template_id: 1,
  template_version: 1,
  registration_ids: [1, 2],
  preview: snapshot,
  excluded: { already_issued: 0, revoked: 0, not_eligible: 0, missing: 0 },
};
const router = createMemoryRouter([
  {
    path: "/",
    element: (
      <main style={{ padding: 12 }}>
        <Card title="Kegiatan uji persetujuan">
          <ApprovalRequestForm
            plan={plan}
            onSubmitted={() => {
              document.getElementById("fixture-status")!.textContent =
                "Permintaan terkirim";
            }}
          />
          <p id="fixture-status" role="status" />
        </Card>
        <CertificateApprovals />
        <Card title="Contoh sertifikat disetujui" style={{ marginTop: 16 }}>
          <CertificateArtwork
            template={snapshot.template.template_data}
            resolveText={(element) =>
              resolveCertificateText(
                element,
                snapshot.participant,
                "CERT-FIXTURE-1",
                evidence,
              )
            }
            verificationUrl={getCertificateVerificationUrl("CERT-FIXTURE-1")}
          />
        </Card>
      </main>
    ),
  },
]);
createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{ token: { colorPrimary: "#1F99CB", borderRadius: 0 } }}
  >
    <ResponsiveEnvironment />
    <RouterProvider router={router} />
  </ConfigProvider>,
);
