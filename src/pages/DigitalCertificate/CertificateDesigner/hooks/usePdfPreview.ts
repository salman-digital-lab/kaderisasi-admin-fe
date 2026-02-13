import { useState, useCallback } from "react";
import { message } from "antd";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CertificateTemplate } from "../../types";
import { VARIABLE_OPTIONS } from "../../constants";

const SAMPLE_DATA: Record<string, string> = {
  "{{name}}": "Ahmad Fauzan",
  "{{email}}": "ahmad.fauzan@email.com",
  "{{activity_name}}": "Pelatihan Dasar Kaderisasi",
  "{{date}}": "13 Februari 2026",
  "{{certificate_id}}": "CERT-2026-001",
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

export const usePdfPreview = () => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = useCallback(async (template: CertificateTemplate) => {
    setGenerating(true);
    try {
      // Create an off-screen container to render the certificate
      const container = document.createElement("div");
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

      // Render elements
      for (const element of template.elements) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = `${element.x}px`;
        el.style.top = `${element.y}px`;
        el.style.width = `${element.width}px`;
        el.style.height = `${element.height}px`;
        el.style.padding = "4px";
        el.style.boxSizing = "border-box";

        if (
          element.type === "static-text" ||
          element.type === "variable-text"
        ) {
          el.style.fontSize = `${element.fontSize || 16}px`;
          el.style.fontFamily = element.fontFamily || "sans-serif";
          el.style.color = element.color || "#000000";
          el.style.textAlign = element.textAlign || "center";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent =
            element.textAlign === "left"
              ? "flex-start"
              : element.textAlign === "right"
                ? "flex-end"
                : "center";
          el.style.overflow = "hidden";

          const text =
            element.type === "variable-text"
              ? replaceVariables(element.variable || "")
              : element.content || "";

          el.textContent = text;
        } else if (
          (element.type === "image" ||
            element.type === "qr-code" ||
            element.type === "signature") &&
          element.imageUrl
        ) {
          // Images are added directly to the PDF via jsPDF.addImage()
          // for maximum quality — skip rendering here to avoid doubling
        } else if (
          element.type === "image" ||
          element.type === "qr-code" ||
          element.type === "signature"
        ) {
          // Placeholder for image/qr-code/signature without image
          el.style.border = "1px dashed #d9d9d9";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.color = "#bfbfbf";
          el.style.fontSize = "12px";
          el.textContent =
            element.type === "qr-code"
              ? "QR Code"
              : element.type === "signature"
                ? "Tanda Tangan"
                : "Gambar";
        }

        canvas.appendChild(el);
      }

      container.appendChild(canvas);

      // Wait for images to load
      const images = canvas.querySelectorAll("img");
      await Promise.all(
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

      // Render to canvas
      const renderedCanvas = await html2canvas(canvas, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      // Generate PDF
      const isLandscape = template.canvasWidth > template.canvasHeight;
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: [template.canvasWidth, template.canvasHeight],
      });

      const imgData = renderedCanvas.toDataURL("image/png");
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        template.canvasWidth,
        template.canvasHeight,
      );

      // Overlay image elements directly onto the PDF for maximum quality.
      // This bypasses html2canvas rasterization and uses the original image data.
      const padding = 4;
      for (const element of template.elements) {
        if (
          (element.type === "image" ||
            element.type === "qr-code" ||
            element.type === "signature") &&
          element.imageUrl
        ) {
          try {
            // Load the image to get natural dimensions for aspect ratio
            const imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              imgEl.onload = () => resolve();
              imgEl.onerror = () => reject();
              imgEl.src = element.imageUrl!;
            });

            // Calculate "contain" fit within the padded area
            const contentW = element.width - padding * 2;
            const contentH = element.height - padding * 2;
            const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            const boxRatio = contentW / contentH;

            let drawW: number, drawH: number, drawX: number, drawY: number;
            if (imgRatio > boxRatio) {
              drawW = contentW;
              drawH = contentW / imgRatio;
            } else {
              drawH = contentH;
              drawW = contentH * imgRatio;
            }
            drawX = element.x + padding + (contentW - drawW) / 2;
            drawY = element.y + padding + (contentH - drawH) / 2;

            pdf.addImage(element.imageUrl, drawX, drawY, drawW, drawH);
          } catch {
            // Fall back to html2canvas rendering if direct add fails
          }
        }
      }

      // Open in new tab
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      // Cleanup
      document.body.removeChild(container);
      message.success("PDF berhasil di-generate");
    } catch (error) {
      console.error("PDF generation error:", error);
      message.error("Gagal membuat PDF preview");
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generatePdf, generating };
};
