export interface CertificateElement {
  id: string;
  type: "static-text" | "variable-text" | "image" | "qr-code" | "signature";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  variable?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  imageUrl?: string;
}

export interface CertificateTemplate {
  backgroundUrl: string | null;
  elements: CertificateElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export type ElementType = CertificateElement["type"];
