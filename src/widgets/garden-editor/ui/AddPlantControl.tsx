"use client";

import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "../styles/AddPlantControl.module.scss";

interface AddPlantControlProps {
  onFileSelected: (file: File) => void;
  busy: boolean;
}

// Platform detected via a coarse-pointer media query (touch capability),
// not user-agent sniffing: on touch the Fab IS the file input, on a fine
// pointer it opens a dialog instead.
//
// The input deliberately carries no `capture` attribute. `capture` pins the
// picker to the camera and hides the photo library entirely; without it the
// OS shows its own sheet offering both ("Photo Library / Take Photo / Choose
// File" on iOS). Wrapping the two sources in a custom menu was tried and
// broke photo picking on a real device, so this keeps the plain
// label-wraps-input form, which is the shape browsers handle most
// reliably - especially on iOS, where opening a file picker has to come
// straight from the user's own tap.
export function AddPlantControl({ onFileSelected, busy }: AddPlantControlProps) {
  const t = useTranslations("Editor");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setDialogOpen(false);
    if (file) onFileSelected(file);
  }

  return (
    <>
      <Fab
        color="primary"
        component={coarsePointer ? "label" : "button"}
        onClick={coarsePointer ? undefined : () => setDialogOpen(true)}
        disabled={busy}
        aria-label={t("addPlantFromPhoto")}
        title={t("addPlantFromPhoto")}
        className={styles.fab}
      >
        {busy ? <CircularProgress size={24} color="inherit" /> : <AddAPhotoIcon />}
        {coarsePointer && <input type="file" accept="image/*" onChange={handleFile} hidden />}
      </Fab>

      {!coarsePointer && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{t("addPlantFromPhoto")}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            <Typography variant="body2" color="text.secondary">
              {t("choosePhotoHint")}
            </Typography>
            <Button component="label" variant="outlined" startIcon={<AddAPhotoIcon />}>
              {t("choosePhoto")}
              <input type="file" accept="image/*" onChange={handleFile} hidden />
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
