"use client";

import { useEffect, useRef } from "react";
import styles from "../styles/Modal.module.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Built on the native <dialog> element: showModal()/close() give us
// Esc-to-close, a focus trap, and returning focus to the trigger element on
// close for free. Children are only rendered while open, so any form inside
// remounts fresh (and re-autofocuses) every time the modal opens.
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => {
        // Zero padding on .dialog means only a genuine backdrop click can
        // target the <dialog> element itself - anything inside .content
        // targets a descendant instead.
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      {open && (
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
