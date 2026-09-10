import { Modal } from "antd";
import type { ModalProps } from "antd";
import type { ReactElement } from "react";

function Dialog({ className, ...props }: ModalProps): ReactElement {
  return (
    <Modal {...props} className={`responsive-dialog ${className ?? ""}`} />
  );
}

// Preserve the existing confirmation API; only form dialogs expand to full screen.
export const ResponsiveDialog = Object.assign(Dialog, {
  confirm: Modal.confirm,
  info: Modal.info,
  success: Modal.success,
  error: Modal.error,
  warning: Modal.warning,
  destroyAll: Modal.destroyAll,
  useModal: Modal.useModal,
});
