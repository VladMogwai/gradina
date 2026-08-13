import { LogoutButton } from "@/features/auth";
import { LanguageSwitcher } from "@/features/locale-switch";
import type { GridSize } from "@/shared/lib/geometry";
import { useTranslations } from "next-intl";
import { ZOOM_MAX, ZOOM_MIN } from "../config/constants";
import type { EditorMode } from "../model/types";
import styles from "../styles/Toolbar.module.scss";

interface ToolbarProps {
  grid: GridSize;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  gridResizeError: string | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  debug: boolean;
  onDebugChange: (debug: boolean) => void;
  onSave: () => void;
  savedFlash: boolean;
}

function IconButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={styles.iconButton}>
      {children}
    </button>
  );
}

export function Toolbar({
  grid,
  onRowsChange,
  onColsChange,
  gridResizeError,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mode,
  onModeChange,
  debug,
  onDebugChange,
  onSave,
  savedFlash,
}: ToolbarProps) {
  const t = useTranslations("Editor");
  const editable = mode === "edit";

  return (
    <div className={styles.toolbar}>
      <div className={styles.row}>
        <span className={styles.title}>{t("title")}</span>

        <div className={styles.gridSettings} title={t("gridSettings")}>
          <span>{t("rows")}</span>
          <input
            type="number"
            min={1}
            value={grid.rows}
            disabled={!editable}
            onChange={(e) => onRowsChange(Number(e.target.value))}
            className={styles.numberInput}
          />
          <span>{t("columns")}</span>
          <input
            type="number"
            min={1}
            value={grid.cols}
            disabled={!editable}
            onChange={(e) => onColsChange(Number(e.target.value))}
            className={styles.numberInput}
          />
        </div>

        <div className={styles.group}>
          <IconButton onClick={() => onZoomChange(zoom - 0.1)} disabled={zoom <= ZOOM_MIN} title={t("zoomOut")}>
            −
          </IconButton>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <IconButton onClick={() => onZoomChange(zoom + 0.1)} disabled={zoom >= ZOOM_MAX} title={t("zoomIn")}>
            +
          </IconButton>
        </div>

        <div className={styles.group}>
          <IconButton onClick={onUndo} disabled={!canUndo} title={t("undo")}>
            ↶ {t("undo")}
          </IconButton>
          <IconButton onClick={onRedo} disabled={!canRedo} title={t("redo")}>
            ↷ {t("redo")}
          </IconButton>
        </div>

        <label className={styles.debugLabel}>
          <input type="checkbox" checked={debug} onChange={(e) => onDebugChange(e.target.checked)} />
          {t("debug")}
        </label>

        <div className={styles.actions}>
          <div className={styles.languageSwitcher}>
            <LanguageSwitcher />
          </div>
          <LogoutButton className={styles.iconButton} />
          {savedFlash && <span className={styles.savedFlash}>{t("saved")} ✓</span>}
          <button onClick={onSave} className={styles.saveButton}>
            {t("save")}
          </button>
          <div className={styles.modeSwitch}>
            <button
              onClick={() => onModeChange("edit")}
              className={mode === "edit" ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton}
            >
              {t("edit")}
            </button>
            <button
              onClick={() => onModeChange("preview")}
              className={
                mode === "preview" ? `${styles.modeButton} ${styles.modeButtonActive}` : styles.modeButton
              }
            >
              {t("preview")}
            </button>
          </div>
        </div>
      </div>
      {gridResizeError && <p className={styles.resizeError}>{gridResizeError}</p>}
    </div>
  );
}
