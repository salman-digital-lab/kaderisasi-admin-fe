import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { CertificateElement, CertificateTemplate } from "../types";

const PDF_RASTER_SCALE = 2;
const PDF_RASTER_IMAGE_QUALITY = 0.92;
const ELEMENT_PADDING = 4;
const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const LETTER_PORTRAIT = { width: 612, height: 792 };
const RATIO_TOLERANCE = 0.04;

type ResolveText = (element: CertificateElement) => string;

interface GenerateCertificatePdfOptions {
  template: CertificateTemplate;
  sourceElement: HTMLElement;
  resolveText: ResolveText;
}

interface PdfMetrics {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

const isTextElement = (element: CertificateElement): boolean =>
  element.type === "static-text" || element.type === "variable-text";

const getPdfMetrics = (template: CertificateTemplate): PdfMetrics => {
  const canvasRatio = template.canvasWidth / template.canvasHeight;
  const isLandscape = template.canvasWidth > template.canvasHeight;
  const a4Ratio = A4_PORTRAIT.width / A4_PORTRAIT.height;
  const letterRatio = LETTER_PORTRAIT.width / LETTER_PORTRAIT.height;
  const normalizedRatio = isLandscape ? 1 / canvasRatio : canvasRatio;

  let pageSize = {
    width: template.canvasWidth * 0.75,
    height: template.canvasHeight * 0.75,
  };

  if (Math.abs(normalizedRatio - a4Ratio) <= RATIO_TOLERANCE) {
    pageSize = isLandscape
      ? { width: A4_PORTRAIT.height, height: A4_PORTRAIT.width }
      : A4_PORTRAIT;
  } else if (Math.abs(normalizedRatio - letterRatio) <= RATIO_TOLERANCE) {
    pageSize = isLandscape
      ? { width: LETTER_PORTRAIT.height, height: LETTER_PORTRAIT.width }
      : LETTER_PORTRAIT;
  }

  return {
    ...pageSize,
    scaleX: pageSize.width / template.canvasWidth,
    scaleY: pageSize.height / template.canvasHeight,
  };
};

const mapFontFamily = (fontFamily?: string): string => {
  const normalized = (fontFamily || "").toLowerCase();
  if (normalized.includes("mono")) return "courier";
  if (
    normalized.includes("serif") ||
    normalized.includes("times") ||
    normalized.includes("georgia")
  ) {
    return "times";
  }
  return "helvetica";
};

const mapFontStyle = (element: CertificateElement): string => {
  const isBold = element.fontWeight === "bold";
  const isItalic = element.fontStyle === "italic";
  if (isBold && isItalic) return "bolditalic";
  if (isBold) return "bold";
  if (isItalic) return "italic";
  return "normal";
};

const getTextAnchorX = (element: CertificateElement): number => {
  if (element.textAlign === "left") return element.x + ELEMENT_PADDING;
  if (element.textAlign === "right") {
    return element.x + element.width - ELEMENT_PADDING;
  }
  return element.x + element.width / 2;
};

const getTextAlign = (
  align?: CertificateElement["textAlign"],
): "left" | "center" | "right" => {
  if (align === "left" || align === "right") return align;
  return "center";
};

const getTextTopY = (
  element: CertificateElement,
  lineCount: number,
  metrics: PdfMetrics,
): number => {
  const fontSize = (element.fontSize || 16) * metrics.scaleY;
  const lineHeight = element.lineHeight || 1.2;
  const blockHeight = lineCount * fontSize * lineHeight;

  if (element.verticalAlign === "top") {
    return (element.y + ELEMENT_PADDING) * metrics.scaleY;
  }
  if (element.verticalAlign === "bottom") {
    return (
      (element.y + element.height - ELEMENT_PADDING) * metrics.scaleY -
      blockHeight
    );
  }
  return (
    element.y * metrics.scaleY +
    (element.height * metrics.scaleY - blockHeight) / 2
  );
};

const drawUnderline = (
  pdf: jsPDF,
  element: CertificateElement,
  lines: string[],
  anchorX: number,
  topY: number,
  metrics: PdfMetrics,
): void => {
  if (element.textDecoration !== "underline") return;

  const fontSize = (element.fontSize || 16) * metrics.scaleY;
  const lineHeight = element.lineHeight || 1.2;
  const textAlign = getTextAlign(element.textAlign);
  pdf.setLineWidth(Math.max(0.5, fontSize / 18));

  lines.forEach((line, index) => {
    const width = pdf.getTextWidth(line);
    const y = topY + index * fontSize * lineHeight + fontSize + 1;
    const startX =
      textAlign === "center"
        ? anchorX - width / 2
        : textAlign === "right"
          ? anchorX - width
          : anchorX;
    pdf.line(startX, y, startX + width, y);
  });
};

const drawVectorTextElements = (
  pdf: jsPDF,
  template: CertificateTemplate,
  resolveText: ResolveText,
  metrics: PdfMetrics,
): void => {
  template.elements
    .filter((element) => element.visible !== false && isTextElement(element))
    .forEach((element) => {
      const text = resolveText(element);
      if (!text) return;

      const fontSize = (element.fontSize || 16) * metrics.scaleY;
      const lineHeight = element.lineHeight || 1.2;
      const maxTextWidth = Math.max(
        1,
        (element.width - ELEMENT_PADDING * 2) * metrics.scaleX,
      );
      const lines = pdf.splitTextToSize(text, maxTextWidth) as string[];
      const anchorX = getTextAnchorX(element) * metrics.scaleX;
      const topY = getTextTopY(element, lines.length, metrics);

      pdf.setFont(mapFontFamily(element.fontFamily), mapFontStyle(element));
      pdf.setFontSize(fontSize);
      pdf.setTextColor(element.color || "#000000");
      pdf.setLineHeightFactor(lineHeight);

      pdf.text(lines, anchorX, topY, {
        align: getTextAlign(element.textAlign),
        baseline: "top",
        angle: element.rotation || 0,
        charSpace: (element.letterSpacing || 0) * metrics.scaleX,
        lineHeightFactor: lineHeight,
        maxWidth: maxTextWidth,
      });

      drawUnderline(pdf, element, lines, anchorX, topY, metrics);
    });
};

export const createCertificatePdf = async ({
  template,
  sourceElement,
  resolveText,
}: GenerateCertificatePdfOptions): Promise<jsPDF> => {
  const rasterCanvas = await html2canvas(sourceElement, {
    scale: PDF_RASTER_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 0,
    onclone: (clonedDoc) => {
      clonedDoc
        .querySelectorAll<HTMLElement>('[data-certificate-text-element="true"]')
        .forEach((element) => {
          element.style.visibility = "hidden";
        });
    },
  });

  const metrics = getPdfMetrics(template);
  const pdf = new jsPDF({
    orientation: metrics.width > metrics.height ? "landscape" : "portrait",
    unit: "pt",
    format: [metrics.width, metrics.height],
    compress: true,
  });

  pdf.addImage(
    rasterCanvas.toDataURL("image/jpeg", PDF_RASTER_IMAGE_QUALITY),
    "JPEG",
    0,
    0,
    metrics.width,
    metrics.height,
    undefined,
    "MEDIUM",
  );

  drawVectorTextElements(pdf, template, resolveText, metrics);

  return pdf;
};

export const openCertificatePdf = async (
  options: GenerateCertificatePdfOptions,
): Promise<void> => {
  const pdf = await createCertificatePdf(options);
  const pdfBlob = pdf.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
};

export const saveCertificatePdf = async (
  options: GenerateCertificatePdfOptions & { filename: string },
): Promise<void> => {
  const pdf = await createCertificatePdf(options);
  pdf.save(options.filename);
};
