import { QRCode } from "antd";
import { forwardRef, memo, useEffect, useRef, useState } from "react";
import type { CertificateElement, CertificateTemplate } from "../types";
import { getCertificateAssetUrl } from "../utils/certificate-content";

export interface CertificateArtworkProps {
  template: CertificateTemplate;
  backgroundImage?: string | null;
  resolveText: (element: CertificateElement) => string;
  verificationUrl?: string | null;
  revoked?: boolean;
}

export const CertificateArtwork = memo(
  forwardRef<HTMLDivElement, CertificateArtworkProps>(
    function CertificateArtwork(
      { template, backgroundImage, resolveText, verificationUrl, revoked },
      ref,
    ) {
      const viewportRef = useRef<HTMLDivElement>(null);
      const [scale, setScale] = useState(1);
      useEffect(() => {
        const node = viewportRef.current;
        if (!node) return;
        const update = (): void =>
          setScale(Math.min(1, node.clientWidth / template.canvasWidth));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => observer.disconnect();
      }, [template.canvasWidth]);
      const background = getCertificateAssetUrl(
        backgroundImage || template.backgroundUrl,
      );
      return (
        <div
          ref={viewportRef}
          style={{
            width: "100%",
            maxWidth: template.canvasWidth,
            aspectRatio: `${template.canvasWidth} / ${template.canvasHeight}`,
            marginInline: "auto",
            overflow: "hidden",
          }}
          aria-label="Pratinjau sertifikat"
        >
          <div
            style={{
              position: "relative",
              margin: "0 auto",
              width: "100%",
              height: "100%",
            }}
          >
            <div
              ref={ref}
              data-certificate-content
              style={{
                position: "absolute",
                inset: 0,
                width: template.canvasWidth,
                height: template.canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              {background && (
                <img
                  data-certificate-background
                  src={background}
                  crossOrigin="anonymous"
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
              {template.elements
                .filter((element) => element.visible !== false)
                .map((element) => {
                  const isText =
                    element.type === "static-text" ||
                    element.type === "variable-text";
                  return (
                    <div
                      key={element.id}
                      data-certificate-element-id={element.id}
                      data-certificate-text-element={
                        isText ? "true" : undefined
                      }
                      style={{
                        position: "absolute",
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        padding: 4,
                        boxSizing: "border-box",
                        opacity: (element.opacity ?? 100) / 100,
                        transform: `rotate(${element.rotation ?? 0}deg)`,
                        transformOrigin: "center center",
                        overflow: "hidden",
                        borderRadius: element.borderRadius ?? 0,
                      }}
                    >
                      {isText ? (
                        <div
                          style={{
                            display: "flex",
                            width: "100%",
                            height: "100%",
                            alignItems:
                              element.verticalAlign === "top"
                                ? "flex-start"
                                : element.verticalAlign === "bottom"
                                  ? "flex-end"
                                  : "center",
                            justifyContent:
                              element.textAlign === "left"
                                ? "flex-start"
                                : element.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                            fontFamily: element.fontFamily || "sans-serif",
                            fontSize: element.fontSize || 16,
                            fontWeight: element.fontWeight || "normal",
                            fontStyle: element.fontStyle || "normal",
                            textDecoration: element.textDecoration || "none",
                            textAlign: element.textAlign || "center",
                            color: element.color || "#000",
                            lineHeight: element.lineHeight || 1.2,
                            letterSpacing: element.letterSpacing || 0,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {resolveText(element)}
                        </div>
                      ) : element.type === "qr-code" ? (
                        verificationUrl ? (
                          <QRCode
                            type="svg"
                            bordered={false}
                            value={verificationUrl}
                            size={Math.max(
                              24,
                              Math.min(element.width, element.height) - 8,
                            )}
                          />
                        ) : (
                          <span>URL verifikasi belum tersedia</span>
                        )
                      ) : element.imageUrl ? (
                        <img
                          src={getCertificateAssetUrl(element.imageUrl) || ""}
                          crossOrigin="anonymous"
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: element.objectFit || "contain",
                            borderRadius: element.borderRadius || 0,
                          }}
                        />
                      ) : (
                        <span>Aset belum dipilih</span>
                      )}
                    </div>
                  );
                })}
              {revoked && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    color: "#cf132255",
                    fontSize: template.canvasWidth / 8,
                    transform: "rotate(-24deg)",
                    fontWeight: 800,
                  }}
                >
                  DICABUT
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
  ),
);
