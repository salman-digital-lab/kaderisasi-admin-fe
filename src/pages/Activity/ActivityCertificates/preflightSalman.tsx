import { createRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import axios from "../../../api/axios";
import type { CertificatePayload } from "../../../types/services/certificateTemplate";
import { CertificateArtwork } from "../../DigitalCertificate/components/CertificateArtwork";
import {
  SalmanScoreSheet,
  salmanScoreOverflow,
} from "../../DigitalCertificate/components/SalmanScoreSheet";
import {
  getCertificateVerificationUrl,
  resolveCertificateText,
} from "../../DigitalCertificate/utils/certificate-content";
import { salmanCertificateOverflow } from "../../DigitalCertificate/utils/certificatePdf";

const PREFLIGHT_CODE = "CERT-2026-2147483647-0123456789ABCDEF0123456789ABCDEF";

async function preview(registrationId: number): Promise<CertificatePayload> {
  const response = await axios.post<{ data: CertificatePayload }>(
    "/certificates/generate-single",
    { registration_id: registrationId },
  );
  return response.data.data;
}

export async function preflightSalmanRecipients(
  registrationIds: number[],
  signerName: string,
  signerTitle: string,
  onProgress: (text: string) => void,
): Promise<string[]> {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.inert = true;
  Object.assign(container.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: "794px",
    pointerEvents: "none",
  });
  document.body.appendChild(container);
  const root = createRoot(container);
  const errors: string[] = [];
  const approval = {
    signer_name: signerName,
    signer_title: signerTitle,
    approved_at: "2026-12-31T12:00:00+07:00",
  };
  try {
    for (const [index, registrationId] of registrationIds.entries()) {
      onProgress(
        `Memeriksa tata letak ${index + 1} dari ${registrationIds.length}…`,
      );
      const data = await preview(registrationId);
      const artwork = createRef<HTMLDivElement>();
      const score = createRef<HTMLDivElement>();
      flushSync(() =>
        root.render(
          <>
            <CertificateArtwork
              ref={artwork}
              template={data.template.template_data}
              backgroundImage={data.template.background_image}
              resolveText={(element) =>
                resolveCertificateText(
                  element,
                  data.participant,
                  PREFLIGHT_CODE,
                  approval,
                  data.activity.certificate_settings,
                )
              }
              verificationUrl={getCertificateVerificationUrl(PREFLIGHT_CODE)}
            />
            {data.activity.certificate_settings?.include_scores && (
              <SalmanScoreSheet
                ref={score}
                participant={data.participant}
                certificateCode={PREFLIGHT_CODE}
                approval={approval}
              />
            )}
          </>,
        ),
      );
      await document.fonts.ready;
      const images = Array.from(container.querySelectorAll("img"));
      try {
        await Promise.all(images.map((image) => image.decode()));
      } catch {
        errors.push(`${data.participant.name}: gambar gagal dimuat`);
        continue;
      }
      const overflow = [
        ...(artwork.current
          ? salmanCertificateOverflow(artwork.current)
          : ["sertifikat"]),
        ...(data.activity.certificate_settings?.include_scores
          ? score.current
            ? salmanScoreOverflow(score.current)
            : ["daftar nilai"]
          : []),
      ];
      if (overflow.length) {
        errors.push(`${data.participant.name}: ${overflow.join(", ")}`);
      }
    }
  } finally {
    root.unmount();
    container.remove();
  }
  return errors;
}
