import { useEffect, type ReactElement } from "react";
import { Modal } from "antd";
import { useBlocker } from "react-router-dom";

export default function UnsavedChangesGuard({
  dirty,
}: {
  dirty: boolean;
}): ReactElement {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  return (
    <Modal
      open={blocker.state === "blocked"}
      title="Perubahan belum disimpan"
      okText="Keluar tanpa menyimpan"
      cancelText="Lanjutkan mengisi"
      onOk={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    >
      <p>Jika keluar sekarang, perubahan yang belum disimpan akan hilang.</p>
    </Modal>
  );
}
