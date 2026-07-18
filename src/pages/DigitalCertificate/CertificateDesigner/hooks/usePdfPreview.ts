import { createElement, useCallback, useState } from "react";
import { QRCode, message } from "antd";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import type { CertificateElement, CertificateTemplate } from "../../types";
import {
  CERTIFICATE_SAMPLE_CODE,
  getCertificateAssetUrl,
  getCertificateVerificationUrl,
  resolveCertificateSampleText,
} from "../../utils/certificate-content";

const getPlaceholderLabel = (type: CertificateElement["type"]): string =>
  type === "signature" ? "Tanda Tangan" : "Gambar";

export const usePdfPreview = () => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = useCallback(async (template: CertificateTemplate) => {
    setGenerating(true);
    let container: HTMLDivElement | null = null;
    const reactRoots: Root[] = [];
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      message.error(
        "Popup diblokir browser. Izinkan popup untuk membuka preview PDF.",
      );
      setGenerating(false);
      return;
    }

    previewWindow.opener = null;
    previewWindow.document.body.textContent = "Menyiapkan preview PDF…";

    try {
      const verificationUrl = getCertificateVerificationUrl(
        CERTIFICATE_SAMPLE_CODE,
      );
      if (
        template.elements.some(
          (element) => element.visible !== false && element.type === "qr-code",
        ) &&
        !verificationUrl
      ) {
        throw new Error("PUBLIC_CERTIFICATE_URL_NOT_CONFIGURED");
      }

      const pdfModulePromise = import("../../utils/certificatePdf");
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      const canvas = document.createElement("div");
      canvas.style.position = "relative";
      canvas.style.width = `${template.canvasWidth}px`;
      canvas.style.height = `${template.canvasHeight}px`;
      canvas.style.backgroundColor = "#ffffff";

      if (template.backgroundUrl) {
        const backgroundUrl = getCertificateAssetUrl(template.backgroundUrl);
        if (backgroundUrl) {
          canvas.style.backgroundImage = `url(${backgroundUrl})`;
        }
        canvas.style.backgroundSize = "cover";
        canvas.style.backgroundPosition = "center";
      }

      for (const element of template.elements) {
        if (
          element.visible === false ||
          element.type === "static-text" ||
          element.type === "variable-text"
        ) {
          continue;
        }

        const target = document.createElement("div");
        target.style.position = "absolute";
        target.style.left = `${element.x}px`;
        target.style.top = `${element.y}px`;
        target.style.width = `${element.width}px`;
        target.style.height = `${element.height}px`;
        target.style.padding = "4px";
        target.style.boxSizing = "border-box";
        target.style.opacity = String((element.opacity ?? 100) / 100);
        target.style.transform = `rotate(${element.rotation || 0}deg)`;
        target.style.transformOrigin = "center center";
        target.style.borderRadius = `${element.borderRadius || 0}px`;
        target.style.overflow = "hidden";

        if (element.type === "qr-code" && verificationUrl) {
          const root = createRoot(target);
          reactRoots.push(root);
          flushSync(() => {
            root.render(
              createElement(QRCode, {
                type: "svg",
                bordered: false,
                value: verificationUrl,
                size: Math.max(24, Math.min(element.width, element.height) - 8),
                style: { width: "100%", height: "100%" },
              }),
            );
          });
        } else if (element.imageUrl) {
          const image = document.createElement("img");
          image.src = getCertificateAssetUrl(element.imageUrl) || "";
          image.crossOrigin = "anonymous";
          image.style.width = "100%";
          image.style.height = "100%";
          image.style.objectFit = element.objectFit || "contain";
          image.style.borderRadius = `${element.borderRadius || 0}px`;
          target.appendChild(image);
        } else {
          target.style.border = "1px dashed #d9d9d9";
          target.style.display = "flex";
          target.style.alignItems = "center";
          target.style.justifyContent = "center";
          target.style.color = "#bfbfbf";
          target.style.fontSize = "12px";
          target.textContent = getPlaceholderLabel(element.type);
        }

        canvas.appendChild(target);
      }

      container.appendChild(canvas);

      const imagesReady = Promise.all(
        Array.from(canvas.querySelectorAll("img")).map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) resolve();
              else {
                image.onload = () => resolve();
                image.onerror = () => resolve();
              }
            }),
        ),
      );

      const [, { openCertificatePdf }] = await Promise.all([
        imagesReady,
        pdfModulePromise,
      ]);
      await openCertificatePdf({
        template,
        sourceElement: canvas,
        resolveText: resolveCertificateSampleText,
        targetWindow: previewWindow,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      if (!previewWindow.closed) previewWindow.close();
      message.error(
        error instanceof Error &&
          error.message === "PUBLIC_CERTIFICATE_URL_NOT_CONFIGURED"
          ? "VITE_PUBLIC_WEB_URL diperlukan untuk membuat QR preview."
          : "Gagal membuat PDF preview",
      );
    } finally {
      reactRoots.forEach((root) => root.unmount());
      if (container?.parentNode) document.body.removeChild(container);
      setGenerating(false);
    }
  }, []);

  return { generatePdf, generating };
};
