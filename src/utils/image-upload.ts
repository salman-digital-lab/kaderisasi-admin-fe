export const IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const MAX_ACTIVITY_IMAGES = 8;
export const MAX_CLUB_MEDIA_ITEMS = 20;

const BYTES_PER_MEGABYTE = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ImageUploadPolicy = {
  maxSizeMb: number;
  guidance: string;
};

export const IMAGE_UPLOAD_POLICIES = {
  activity: {
    maxSizeMb: 1,
    guidance:
      "JPG, PNG, atau WebP hingga 1 MB. Rasio 16:10 disarankan untuk gambar utama.",
  },
  clubLogo: {
    maxSizeMb: 2,
    guidance:
      "JPG, PNG, atau WebP hingga 2 MB. Gunakan gambar persegi (rasio 1:1).",
  },
  clubMedia: {
    maxSizeMb: 5,
    guidance:
      "JPG, PNG, atau WebP hingga 5 MB. Gambar akan dioptimalkan otomatis.",
  },
  certificate: {
    maxSizeMb: 5,
    guidance:
      "JPG, PNG, atau WebP hingga 5 MB. Gambar akan dioptimalkan otomatis.",
  },
} satisfies Record<string, ImageUploadPolicy>;

type ImageFile = Pick<File, "name" | "size" | "type">;

export function getImageUploadError(
  file: ImageFile,
  policy: ImageUploadPolicy,
): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${file.name}: gunakan gambar JPG, PNG, atau WebP.`;
  }

  if (file.size > policy.maxSizeMb * BYTES_PER_MEGABYTE) {
    return `${file.name}: ukuran gambar maksimal ${policy.maxSizeMb} MB.`;
  }

  return null;
}
