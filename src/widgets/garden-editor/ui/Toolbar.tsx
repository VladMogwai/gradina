"use client";

import { useSignOut } from "@/features/auth";
import type { GridSize } from "@/shared/lib/geometry";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import MenuIcon from "@mui/icons-material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AppBar, Chip, IconButton, Menu, MenuItem, Toolbar as MuiToolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SaveStatus } from "../model/useAutoSaveGardenPlan";
import type { EditorMode } from "../model/types";
import styles from "../styles/Toolbar.module.scss";

interface ToolbarProps {
  grid: GridSize;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  gridResizeError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onFitToScreen: () => void;
  saveStatus: SaveStatus;
}

// idle shows nothing - only surface the chip when there's something to say.
const SAVE_STATUS_KEYS: Partial<Record<SaveStatus, string>> = {
  saving: "saving",
  saved: "saved",
  error: "saveError",
};

export function Toolbar({
  grid,
  onRowsChange,
  onColsChange,
  gridResizeError,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mode,
  onModeChange,
  onOpenSettings,
  onOpenLibrary,
  onFitToScreen,
  saveStatus,
}: ToolbarProps) {
  const t = useTranslations("Editor");
  const tAuth = useTranslations("Auth");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const signOut = useSignOut();
  const statusKey = SAVE_STATUS_KEYS[saveStatus];

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <AppBar position="static" color="default" elevation={1} className={styles.appBar}>
      <MuiToolbar variant="dense" className={styles.inner}>
        <IconButton edge="start" component={Link} href="/" title={t("backToPlants")} aria-label={t("backToPlants")}>
          <ArrowBackIcon />
        </IconButton>

        <IconButton onClick={onOpenLibrary} title={t("library")} aria-label={t("library")}>
          <MenuIcon />
        </IconButton>

        <Typography variant="subtitle1" noWrap className={styles.title}>
          {t("title")}
        </Typography>

        {statusKey && (
          <Chip
            size="small"
            label={t(statusKey)}
            color={saveStatus === "error" ? "error" : "default"}
            className={styles.statusChip}
          />
        )}

        {/* <div className={styles.gridSettings} title={t("gridSettings")}>
          <span>{t("rows")}</span>
          <input
            type="number"
            min={1}
            value={grid.rows}
            onChange={(e) => onRowsChange(Number(e.target.value))}
            className={styles.numberInput}
          />
          <span>{t("columns")}</span>
          <input
            type="number"
            min={1}
            value={grid.cols}
            onChange={(e) => onColsChange(Number(e.target.value))}
            className={styles.numberInput}
          />
        </div> */}

        {/* <IconButton onClick={onUndo} disabled={!canUndo} title={t("undo")}>
          <UndoIcon />
        </IconButton>
        <IconButton onClick={onRedo} disabled={!canRedo} title={t("redo")}>
          <RedoIcon />
        </IconButton> */}

        <IconButton onClick={onFitToScreen} title={t("fitToScreen")} aria-label={t("fitToScreen")}>
          <FitScreenIcon />
        </IconButton>

        <IconButton
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          title={t("menu")}
          aria-label={t("menu")}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
          <MenuItem
            onClick={() => {
              closeMenu();
              onOpenSettings();
            }}
          >
            {t("gardenSettings")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onModeChange(mode === "edit" ? "preview" : "edit");
            }}
          >
            {mode === "edit" ? t("switchToPreview") : t("switchToEdit")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              signOut();
            }}
          >
            {tAuth("signOut")}
          </MenuItem>
        </Menu>
      </MuiToolbar>
      {gridResizeError && <p className={styles.resizeError}>{gridResizeError}</p>}
    </AppBar>
  );
}
