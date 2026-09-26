import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { CertificateArtwork } from "../../src/pages/DigitalCertificate/components/CertificateArtwork";
import { buildStarterTemplate } from "../../src/pages/DigitalCertificate/utils/starter-templates";
import { saveCertificatePdf } from "../../src/pages/DigitalCertificate/utils/certificatePdf";
import { resolveCertificateText } from "../../src/pages/DigitalCertificate/utils/certificate-content";

const template = buildStarterTemplate("a4-portrait-salman", "salman");
template.elements = template.elements.filter(
  (element) => element.type !== "image",
);
const name =
  new URLSearchParams(location.search).get("name") ||
  "Muhammad Abdurrahman Pratama Wiratama Kusumah";
const resolveText = (element: (typeof template.elements)[number]): string =>
  resolveCertificateText(
    element,
    {
      registration_id: 1,
      user_id: 1,
      name,
      email: "",
      university: "",
      gender: "",
      activity_name: "Pelatihan Salman",
      activity_date: "26 September 2026",
    },
    "CERT-NAME-FIT",
    {
      signer_name: "Oktofa Yudha Sudrajad, S.T., M.S.M., Ph.D.",
      signer_title: "Ketua Bidang Mahasiswa, Kaderisasi, dan Alumni",
      approved_at: "2026-09-26T00:00:00Z",
    },
  );
function Lab(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        onClick={() => {
          if (ref.current)
            void saveCertificatePdf({
              template,
              sourceElement: ref.current,
              resolveText,
              filename: "long-name.pdf",
            });
        }}
      >
        Export PDF
      </button>
      <CertificateArtwork
        ref={ref}
        template={template}
        resolveText={resolveText}
        verificationUrl="https://example.test/verify/CERT-NAME-FIT"
      />
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Lab />);
