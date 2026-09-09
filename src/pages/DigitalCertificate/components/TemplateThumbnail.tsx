import { memo, useEffect, useRef, useState } from "react";
import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
import { CertificateArtwork } from "./CertificateArtwork";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateVerificationUrl,
  resolveCertificateSampleText,
} from "../utils/certificate-content";

interface TemplateThumbnailProps {
  templateData?: CertificateTemplateData;
  backgroundImage?: string | null;
  width?: number;
}

export const TemplateThumbnail = memo(function TemplateThumbnail({
  templateData,
  backgroundImage,
  width = 120,
}: TemplateThumbnailProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const height = templateData
    ? (width * templateData.canvasHeight) / templateData.canvasWidth
    : 72;
  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        overflow: "hidden",
        border: "1px solid #f0f0f0",
        background: "#fff",
      }}
    >
      {visible && templateData && (
        <CertificateArtwork
          template={templateData}
          backgroundImage={backgroundImage}
          resolveText={resolveCertificateSampleText}
          verificationUrl={getCertificateVerificationUrl(
            CERTIFICATE_SAMPLE_CODE,
          )}
        />
      )}
    </div>
  );
});
