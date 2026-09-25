import { createRoot } from "react-dom/client";
import { useRef, useState } from "react";
import { CertificateArtwork } from "../../src/pages/DigitalCertificate/components/CertificateArtwork";
import { SalmanScoreSheet } from "../../src/pages/DigitalCertificate/components/SalmanScoreSheet";
import { buildStarterTemplate } from "../../src/pages/DigitalCertificate/utils/starter-templates";
import { resolveCertificateText } from "../../src/pages/DigitalCertificate/utils/certificate-content";
import { createCertificatePdf } from "../../src/pages/DigitalCertificate/utils/certificatePdf";
import type {
  CertificateParticipant,
  CertificateSettings,
} from "../../src/types/services/certificateTemplate";

const template = buildStarterTemplate("a4-portrait-salman", "salman");
template.elements = template.elements.map((element) => ({
  ...element,
  imageUrl:
    element.id === "salman-logo"
      ? `${window.location.origin}/certificate/salman-logo.png`
      : element.id === "salman-basmalah"
        ? `${window.location.origin}/certificate/basmalah.png`
        : element.imageUrl,
}));
const settings: CertificateSettings = {
  version: 1,
  institution: "YAYASAN PEMBINA MASJID (YPM) SALMAN ITB",
  role: "PESERTA",
  event_date: "24 s.d. 26 Juli 2026",
  hijri_date: "09 s.d. 11 Muharram 1448 H",
  delivery_mode: "Dilaksanakan offline",
  venue: "Masjid Salman ITB, Bukit Bintang, dan Masjid Khairina Cimenyan",
  organizer: "Bidang Mahasiswa, Kaderisasi, dan Alumni Salman ITB",
  document_place: "Bandung",
  document_date: "30 Juli 2026 / 15 Muharram 1448 H",
  include_scores: true,
};
if (new URLSearchParams(window.location.search).has("one-page")) {
  settings.include_scores = false;
}
const participant: CertificateParticipant = {
  registration_id: 1,
  user_id: 1,
  name: "Abdurrahman Attijari",
  email: "",
  university: "Universitas Sultan Ageng Tirtayasa",
  certificate_group: "3",
  activity_name: "Latihan Mujahid Dakwah (LMD) 240",
  activity_date: "24 Juli 2026",
  scoring_result: {
    revision: 1,
    published_at: "2026-07-26T12:00:00+07:00",
    note: "Semoga Allah memberkahi setiap langkah dan ikhtiarmu.",
    rubric: {
      note: "",
      grades: [
        { label: "A+", minimum: 90 },
        { label: "A", minimum: 80 },
        { label: "B+", minimum: 70 },
      ],
      groups: [
        {
          id: "mujtahid",
          name: "Mujtahid",
          criteria: [
            { id: "shiddiq", name: "Shiddiq", maximum: 100, weight: 1 },
            { id: "amanah", name: "Amanah", maximum: 100, weight: 1 },
            { id: "tabligh", name: "Tabligh", maximum: 100, weight: 1 },
            { id: "fathanah", name: "Fathanah", maximum: 100, weight: 1 },
          ],
        },
      ],
    },
    result: {
      complete: true,
      total: 89.1,
      grade: "A+",
      criteria: [
        { criterion_id: "shiddiq", score: 100, normalized: 100, grade: "A+" },
        { criterion_id: "amanah", score: 70, normalized: 70, grade: "B+" },
        { criterion_id: "tabligh", score: 86.4, normalized: 86.4, grade: "A" },
        { criterion_id: "fathanah", score: 100, normalized: 100, grade: "A+" },
      ],
    },
  },
};
if (
  new URLSearchParams(window.location.search).has("long-note") &&
  participant.scoring_result
) {
  participant.scoring_result.note = "Catatan pembinaan sangat panjang. ".repeat(
    150,
  );
}
if (
  new URLSearchParams(window.location.search).has("no-grade") &&
  participant.scoring_result
) {
  participant.scoring_result.rubric.grades = [];
  participant.scoring_result.result.grade = "";
  participant.scoring_result.result.criteria.forEach((criterion) => {
    criterion.grade = "";
  });
}
const approval = {
  signer_name: "Oktofa Yudha Sudrajad",
  signer_title: "Ketua Bidang Mahasiswa, Kaderisasi, dan Alumni",
  approved_at: "2026-07-30T10:00:00+07:00",
};
const code = "CERT-2026-240-0123456789ABCDEF0123456789ABCDEF";
function App(): React.ReactElement {
  const front = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  async function download(): Promise<void> {
    if (!front.current || (settings.include_scores && !back.current)) return;
    try {
      const pdf = await createCertificatePdf({
        template,
        sourceElement: front.current,
        scoreSourceElement: settings.include_scores ? back.current : null,
        resolveText: (element) =>
          resolveCertificateText(
            element,
            participant,
            code,
            approval,
            settings,
          ),
      });
      pdf.save("salman-preview.pdf");
      setStatus("PDF siap");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PDF gagal");
    }
  }
  return (
    <main
      style={{
        maxWidth: 1000,
        padding: 24,
        margin: "auto",
        fontFamily: "Arial",
      }}
    >
      <button onClick={download}>Unduh PDF</button>
      <p role="status">{status}</p>
      <CertificateArtwork
        ref={front}
        template={template}
        resolveText={(element) =>
          resolveCertificateText(element, participant, code, approval, settings)
        }
        verificationUrl="https://example.org/certificate/verify/CERT-2026-240-0123456789ABCDEF0123456789ABCDEF"
      />
      {settings.include_scores && (
        <SalmanScoreSheet
          ref={back}
          participant={participant}
          certificateCode={code}
          approval={approval}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
