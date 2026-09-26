import type {
  CertificateTemplate,
  CertificateTemplateData,
} from "../../../types/services/certificateTemplate";

export function loadDesignerTemplate(
  source: Pick<CertificateTemplate, "template_data" | "background_image">,
): CertificateTemplateData {
  return {
    ...source.template_data,
    backgroundUrl:
      source.background_image || source.template_data.backgroundUrl || null,
  };
}
