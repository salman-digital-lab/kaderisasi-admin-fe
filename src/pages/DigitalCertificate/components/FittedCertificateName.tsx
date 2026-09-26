import { useLayoutEffect, useRef } from "react";
import { fitCertificateNames } from "../utils/fit-certificate-names";

export function FittedCertificateName({
  text,
  fontSize,
}: {
  text: string;
  fontSize: number;
}): React.ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    let active = true;
    const fit = (): void => {
      if (active && ref.current?.parentElement)
        fitCertificateNames(ref.current.parentElement);
    };
    fit();
    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    if (ref.current?.parentElement) observer.observe(ref.current.parentElement);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text, fontSize]);
  return (
    <span
      ref={ref}
      data-certificate-name-content={fontSize}
      style={{
        display: "block",
        width: "100%",
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "2px 4px",
      }}
    >
      {text}
    </span>
  );
}
