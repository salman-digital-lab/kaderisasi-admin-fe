import React from "react";
import type { CertificateTemplateData } from "../../../types/services/certificateTemplate";

interface TemplateThumbnailProps {
  templateData?: CertificateTemplateData;
  backgroundImage?: string | null;
  width?: number;
}

const getImageUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("data:") || path.startsWith("http")) return path;

  const imageBaseUrl = import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL || "";
  return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

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
      getImageUrl(backgroundImage) || templateData.backgroundUrl;

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
                {element.type === "static-text"
                  ? element.content
                  : element.type === "variable-text"
                    ? element.variable
                    : null}
              </div>
            ))}
        </div>
      </div>
    );
  },
);

TemplateThumbnail.displayName = "TemplateThumbnail";
