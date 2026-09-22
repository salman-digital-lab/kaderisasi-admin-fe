import { Tabs } from "antd";
import type { ReactElement, Ref } from "react";
import type { CertificatePayload } from "../../../types/services/certificateTemplate";
import {
  CertificateArtwork,
  type CertificateArtworkProps,
} from "./CertificateArtwork";
import { CertificateScoreDetails } from "./CertificateScoreDetails";
import {
  CertificateScoreSheet,
  SCORE_SHEET_WIDTH,
} from "./CertificateScoreSheet";
import styles from "./certificate-preview.module.css";

type CertificatePreviewPagesProps = CertificateArtworkProps & {
  participant: CertificatePayload["participant"];
  certificateCode?: string;
  artworkRef?: Ref<HTMLDivElement>;
  scoreRef?: Ref<HTMLDivElement>;
};

export function CertificatePreviewPages({
  participant,
  certificateCode,
  artworkRef,
  scoreRef,
  ...artwork
}: CertificatePreviewPagesProps): ReactElement {
  const score = participant.scoring_result;
  const certificate = <CertificateArtwork ref={artworkRef} {...artwork} />;
  if (!score) return certificate;
  return (
    <>
      <Tabs
        className={styles.pages}
        defaultActiveKey="certificate"
        items={[
          {
            key: "certificate",
            label: "1. Sertifikat",
            forceRender: true,
            children: certificate,
          },
          {
            key: "scores",
            label: "2. Hasil penilaian",
            children: <CertificateScoreDetails score={score} />,
          },
        ]}
      />
      {scoreRef && (
        <div
          aria-hidden="true"
          inert
          style={{
            position: "fixed",
            left: -20000,
            top: 0,
            width: SCORE_SHEET_WIDTH,
            pointerEvents: "none",
          }}
        >
          <CertificateScoreSheet
            ref={scoreRef}
            participant={participant}
            certificateCode={certificateCode}
            revoked={artwork.revoked}
          />
        </div>
      )}
    </>
  );
}
