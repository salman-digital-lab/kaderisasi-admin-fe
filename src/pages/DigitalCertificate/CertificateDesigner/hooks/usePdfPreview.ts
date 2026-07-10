import { useState, useCallback } from "react";
import { message } from "antd";
import { CertificateElement, CertificateTemplate } from "../../types";
import { VARIABLE_OPTIONS } from "../../constants";

const SAMPLE_DATA: Record<string, string> = {
  "{{name}}": "Ahmad Fauzan",
  "{{email}}": "ahmad.fauzan@email.com",
  "{{activity_name}}": "Pelatihan Dasar Kaderisasi",
  "{{activity_date}}": "13 Februari 2026",
  "{{date}}": "13 Februari 2026",
  "{{certificate_id}}": "CERT-2026-001",
  "{{certificate_code}}": "CERT-2026-001",
  "{{university}}": "Institut Teknologi Bandung",
  "{{gender}}": "Laki-laki",
};

function replaceVariables(text: string): string {
  let result = text;
  for (const option of VARIABLE_OPTIONS) {
    if (result.includes(option.value)) {
      result = result.replace(
        new RegExp(option.value.replace(/[{}]/g, "\\$&"), "g"),
        SAMPLE_DATA[option.value] || option.label,
      );
    }
  }
  return result;
}

const getPlaceholderLabel = (type: CertificateElement["type"]): string => {
  if (type === "qr-code") return "QR Code";
  if (type === "signature") return "Tanda Tangan";
  return "Gambar";
};

export const usePdfPreview = () => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = useCallback(async (template: CertificateTemplate) => {
    setGenerating(true);
    let container: HTMLDivElement | null = null;
    try {
      const pdfModulePromise = import("../../utils/certificatePdf");

      // Create an off-screen container to render the certificate
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Create the canvas element
      const canvas = document.createElement("div");
      canvas.style.position = "relative";
      canvas.style.width = `${template.canvasWidth}px`;
      canvas.style.height = `${template.canvasHeight}px`;
      canvas.style.backgroundColor = "#ffffff";

      if (template.backgroundUrl) {
        canvas.style.backgroundImage = `url(${template.backgroundUrl})`;
        canvas.style.backgroundSize = "cover";
        canvas.style.backgroundPosition = "center";
      }

      for (const element of template.elements) {
        if (element.visible === false) continue;
        if (
          element.type === "static-text" ||
          element.type === "variable-text"
        ) {
          continue;
        }

        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = `${element.x}px`;
        el.style.top = `${element.y}px`;
        el.style.width = `${element.width}px`;
        el.style.height = `${element.height}px`;
        el.style.padding = "4px";
        el.style.boxSizing = "border-box";
        el.style.opacity = String((element.opacity ?? 100) / 100);
        el.style.transform = `rotate(${element.rotation || 0}deg)`;
        el.style.transformOrigin = "center center";
        el.style.borderRadius = `${element.borderRadius || 0}px`;
        el.style.overflow = "hidden";

        if (
          element.type === "image" ||
          element.type === "qr-code" ||
          element.type === "signature"
        ) {
          if (element.imageUrl) {
            const img = document.createElement("img");
            img.src = element.imageUrl;
            img.crossOrigin = "anonymous";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = element.objectFit || "contain";
            img.style.borderRadius = `${element.borderRadius || 0}px`;
            el.appendChild(img);
          } else {
            el.style.border = "1px dashed #d9d9d9";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.color = "#bfbfbf";
            el.style.fontSize = "12px";
            el.textContent = getPlaceholderLabel(element.type);
          }
        }

        canvas.appendChild(el);
      }

      container.appendChild(canvas);

      // Wait for images to load
      const images = canvas.querySelectorAll("img");
      const imagesReady = Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            }),
        ),
      );

      // PDF dependencies are large and only needed on demand. Load them in
      // parallel with image decoding after the user requests a preview.
      const [, { openCertificatePdf }] = await Promise.all([
        imagesReady,
        pdfModulePromise,
      ]);
      await openCertificatePdf({
        template,
        sourceElement: canvas,
        resolveText: (element) =>
          element.type === "variable-text"
            ? replaceVariables(element.variable || "")
            : element.content || "",
      });

      message.success("PDF berhasil di-generate");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Gagal membuat PDF preview");
    } finally {
      if (container?.parentNode) {
        document.body.removeChild(container);
      }
      setGenerating(false);
    }
  }, []);

  return { generatePdf, generating };
};
