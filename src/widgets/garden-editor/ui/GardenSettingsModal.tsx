import { Modal } from "@/shared/ui/Modal";
import { useTranslations } from "next-intl";
import type { GardenSettings } from "../model/useHistory";
import styles from "../styles/GardenSettingsModal.module.scss";

interface GardenSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: GardenSettings;
  onSettingsChange: (patch: Partial<GardenSettings>) => void;
}

// Fields apply immediately on change (same direct-edit pattern as every
// other field in the app - the debounced autosave persists it), no
// separate save step. The modal is just a container for a settings group
// that doesn't need to live in the always-visible toolbar.
export function GardenSettingsModal({ open, onClose, settings, onSettingsChange }: GardenSettingsModalProps) {
  const t = useTranslations("Editor");

  return (
    <Modal open={open} onClose={onClose} title={t("gardenSettings")}>
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("hardinessZone")}</span>
          <input
            type="text"
            value={settings.hardinessZone ?? ""}
            onChange={(e) => onSettingsChange({ hardinessZone: e.target.value.trim() || null })}
            placeholder={t("hardinessZonePlaceholder")}
            className={styles.textField}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("lastFrostDate")}</span>
          <input
            type="date"
            value={settings.lastFrostDate ?? ""}
            onChange={(e) => onSettingsChange({ lastFrostDate: e.target.value || null })}
            className={styles.textField}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t("firstFrostDate")}</span>
          <input
            type="date"
            value={settings.firstFrostDate ?? ""}
            onChange={(e) => onSettingsChange({ firstFrostDate: e.target.value || null })}
            className={styles.textField}
          />
        </label>
        <p className={styles.hint}>{t("gardenSettingsHint")}</p>
      </div>
    </Modal>
  );
}
