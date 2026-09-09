import type { jsPDF } from "jspdf";
import type {
  CertificateElement,
  CertificateTemplate as CertificateTemplateData,
} from "../types";

export interface GenerateCertificatePdfOptions {
  template: CertificateTemplateData;
  sourceElement: HTMLElement;
  resolveText: (element: CertificateElement) => string;
  onProgress?: (stage: string) => void;
}

export function getRasterScale(width: number, height: number): number {
  return Math.min(2, Math.sqrt(8_000_000 / (width * height)));
}

export function getPdfPageSize(
  width: number,
  height: number,
): { width: number; height: number } {
  const landscape = width > height;
  const ratio = Math.min(width, height) / Math.max(width, height);
  const portrait =
    Math.abs(ratio - 595.28 / 841.89) <= 0.04
      ? { width: 595.28, height: 841.89 }
      : Math.abs(ratio - 612 / 792) <= 0.04
        ? { width: 612, height: 792 }
        : null;
  return portrait
    ? landscape
      ? { width: portrait.height, height: portrait.width }
      : portrait
    : { width: width * 0.75, height: height * 0.75 };
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  let timeout: number | undefined;
  try {
    await Promise.race([
      image.decode(),
      new Promise<never>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error("CERTIFICATE_IMAGE_TIMEOUT")),
          15_000,
        );
      }),
    ]);
    if (!image.naturalWidth) throw new Error("CERTIFICATE_IMAGE_FAILED");
  } finally {
    window.clearTimeout(timeout);
  }
}

// html2canvas does not implement object-fit. Preserve the rendered crop with explicit geometry.
function prepareFittedImages(source: HTMLElement): void {
  for (const image of source.querySelectorAll("img")) {
    const style = getComputedStyle(image);
    if (style.objectFit !== "cover" && style.objectFit !== "contain") continue;
    const width = image.clientWidth;
    const height = image.clientHeight;
    if (!width || !height) continue;
    const factor =
      style.objectFit === "cover"
        ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
        : Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const fittedWidth = image.naturalWidth * factor;
    const fittedHeight = image.naturalHeight * factor;
    const frame = document.createElement("div");
    frame.style.cssText = image.style.cssText;
    Object.assign(frame.style, {
      width: `${width}px`,
      height: `${height}px`,
      display: "block",
      overflow: "hidden",
      position: style.position === "static" ? "relative" : style.position,
    });
    image.replaceWith(frame);
    frame.appendChild(image);
    image.style.cssText = `position:absolute;max-width:none;max-height:none;left:${(width - fittedWidth) / 2}px;top:${(height - fittedHeight) / 2}px;width:${fittedWidth}px;height:${fittedHeight}px;`;
  }
}

export async function createCertificatePdf({
  template,
  sourceElement,
  resolveText,
  onProgress,
}: GenerateCertificatePdfOptions): Promise<jsPDF> {
  const startedAt = performance.now();
  onProgress?.("Memuat gambar dan huruf…");
  const imports = Promise.all([import("html2canvas"), import("jspdf")]);
  // Render a clean, unscaled copy of the same artwork used for the preview.
  const source = sourceElement.cloneNode(true) as HTMLElement;
  source.style.cssText += `;position:fixed;left:-20000px;top:0;transform:none;opacity:1;width:${template.canvasWidth}px;height:${template.canvasHeight}px;box-shadow:none;`;
  source.removeAttribute("aria-hidden");
  source
    .querySelectorAll<HTMLElement>("[data-certificate-text-element]")
    .forEach((node) => {
      const element = template.elements.find(
        (item) => item.id === node.dataset.certificateElementId,
      );
      if (element && node.firstElementChild)
        node.firstElementChild.textContent = resolveText(element);
    });
  document.body.appendChild(source);
  let raster: HTMLCanvasElement | undefined;
  try {
    const backgrounds: HTMLImageElement[] = [];
    [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))].forEach(
      (node) => {
        const background = getComputedStyle(node).backgroundImage;
        for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = match[1];
          backgrounds.push(img);
        }
      },
    );
    await Promise.all([
      document.fonts.ready,
      ...Array.from(source.querySelectorAll("img")).map(waitForImage),
      ...backgrounds.map(waitForImage),
    ]);
    prepareFittedImages(source);
    const [{ default: html2canvas }, { default: JsPDF }] = await imports;
    onProgress?.("Merender sertifikat…");
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    raster = await html2canvas(source, {
      scale: getRasterScale(template.canvasWidth, template.canvasHeight),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15_000,
      width: template.canvasWidth,
      height: template.canvasHeight,
      windowWidth: Math.max(1024, template.canvasWidth),
    });
    onProgress?.("Menyimpan PDF…");
    const blob = await new Promise<Blob>((resolve, reject) =>
      raster!.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("CERTIFICATE_RENDER_FAILED")),
        "image/png",
      ),
    );
    const metrics = getPdfPageSize(template.canvasWidth, template.canvasHeight);
    const pdf = new JsPDF({
      orientation: metrics.width > metrics.height ? "landscape" : "portrait",
      unit: "pt",
      format: [metrics.width, metrics.height],
      compress: true,
    });
    pdf.addImage(
      new Uint8Array(await blob.arrayBuffer()),
      "PNG",
      0,
      0,
      metrics.width,
      metrics.height,
      undefined,
      "FAST",
    );
    return pdf;
  } catch (error) {
    console.warn("certificate_export_failed", {
      duration_ms: Math.round(performance.now() - startedAt),
      error_type: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  } finally {
    source.remove();
    if (raster) {
      raster.width = 0;
      raster.height = 0;
    }
    // Consume imports even when an asset failed first.
    await imports.catch(() => undefined);
  }
}

export async function saveCertificatePdf(
  options: GenerateCertificatePdfOptions & { filename: string },
): Promise<void> {
  const pdf = await createCertificatePdf(options);
  pdf.save(options.filename);
}
