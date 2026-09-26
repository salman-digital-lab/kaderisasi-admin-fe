export function fitCertificateNames(root: HTMLElement): void {
  root
    .querySelectorAll<HTMLElement>("[data-certificate-name-content]")
    .forEach((content) => {
      const box = content.parentElement;
      if (!box || !box.clientHeight || !box.clientWidth) return;
      const preferred = Number(content.dataset.certificateNameContent) || 34;
      const minimum = Math.min(preferred, 40 / 3);
      let size = preferred;
      content.style.fontSize = `${size}px`;
      const overflows = (): boolean =>
        content.scrollHeight > box.clientHeight ||
        content.scrollWidth > box.clientWidth;
      while (size > minimum && overflows()) {
        size = Math.max(minimum, size - 0.5);
        content.style.fontSize = `${size}px`;
      }
      content.dataset.certificateNameOverflow = String(overflows());
    });
}
