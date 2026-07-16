export interface CertificateElement {
  id: string;
  type: "static-text" | "variable-text" | "image" | "qr-code" | "signature";
  name?: string;
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
  verticalAlign?: "top" | "middle" | "bottom";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  lineHeight?: number;
  letterSpacing?: number;
  imageUrl?: string;
  assetKey?: string;
  opacity?: number;
  rotation?: number;
  borderRadius?: number;
  objectFit?: "contain" | "cover" | "fill";
  visible?: boolean;
  locked?: boolean;
}

export interface CertificateTemplate {
  backgroundUrl: string | null;
  elements: CertificateElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export type ElementType = CertificateElement["type"];
