import React from "react";
import { QRCode } from "antd";
import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateAssetUrl,
  getCertificateVerificationUrl,
} from "../utils/certificate-content";

interface TemplateThumbnailProps {
  templateData?: CertificateTemplateData;
  backgroundImage?: string | null;
  width?: number;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = React.memo(
  ({ templateData, backgroundImage, width = 120 }) => {
    if (!templateData) {
      return (
        <div
          style={{
            width,
            height: 72,
            border: "1px solid #f0f0f0",
            background: "#fafafa",
          }}
        />
      );
    }

    const canvasWidth = templateData.canvasWidth || 800;
    const canvasHeight = templateData.canvasHeight || 566;
    const scale = width / canvasWidth;
    const thumbnailHeight = Math.round(canvasHeight * scale);
    const backgroundUrl =
      getCertificateAssetUrl(backgroundImage) ||
      getCertificateAssetUrl(templateData.backgroundUrl);
    const verificationUrl = getCertificateVerificationUrl(
      CERTIFICATE_SAMPLE_CODE,
    );

    return (
      <div
        style={{
          width,
          height: thumbnailHeight,
          position: "relative",
          overflow: "hidden",
          border: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            backgroundColor: "#fff",
            backgroundImage: backgroundUrl
              ? `url(${backgroundUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {templateData.elements
            ?.filter((element) => element.visible !== false)
            .map((element) => (
              <div
                key={element.id}
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  padding: 4,
                  boxSizing: "border-box",
                  opacity: (element.opacity ?? 100) / 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  fontSize: element.fontSize || 16,
                  fontFamily: element.fontFamily || "sans-serif",
                  fontWeight: element.fontWeight || "normal",
                  fontStyle: element.fontStyle || "normal",
                  color: element.color || "#000",
                  textAlign: element.textAlign || "center",
                  overflow: "hidden",
                }}
              >
                {element.type === "static-text" ? (
                  element.content
                ) : element.type === "variable-text" ? (
                  element.variable
                ) : element.type === "qr-code" && verificationUrl ? (
                  <QRCode
                    type="svg"
                    bordered={false}
                    value={verificationUrl}
                    size={Math.max(32, Math.min(element.width, element.height))}
                  />
                ) : element.imageUrl ? (
                  <img
                    src={getCertificateAssetUrl(element.imageUrl) || undefined}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: element.objectFit || "contain",
                    }}
                  />
                ) : null}
              </div>
            ))}
        </div>
      </div>
    );
  },
);

TemplateThumbnail.displayName = "TemplateThumbnail";
