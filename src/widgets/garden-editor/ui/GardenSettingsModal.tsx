import { LanguageSwitcher } from "@/features/locale-switch";
import { Dialog, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { GardenSettings } from "../model/useHistory";

interface GardenSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: GardenSettings;
  onSettingsChange: (patch: Partial<GardenSettings>) => void;
}

// Fields apply immediately on change (same direct-edit pattern as every
// other field in the app - the debounced autosave persists it), no
// separate save step. Doubles as the app's general "settings" surface, so
// the language switcher (moved off the top bar) lives here too.
export function GardenSettingsModal({ open, onClose, settings, onSettingsChange }: GardenSettingsModalProps) {
  const t = useTranslations("Editor");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("gardenSettings")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label={t("hardinessZone")}
            value={settings.hardinessZone ?? ""}
            onChange={(e) => onSettingsChange({ hardinessZone: e.target.value.trim() || null })}
            placeholder={t("hardinessZonePlaceholder")}
            size="small"
            fullWidth
          />
          <TextField
            label={t("lastFrostDate")}
            type="date"
            value={settings.lastFrostDate ?? ""}
            onChange={(e) => onSettingsChange({ lastFrostDate: e.target.value || null })}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t("firstFrostDate")}
            type="date"
            value={settings.firstFrostDate ?? ""}
            onChange={(e) => onSettingsChange({ firstFrostDate: e.target.value || null })}
            size="small"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Typography variant="caption" color="text.secondary">
            {t("gardenSettingsHint")}
          </Typography>

          <Divider />
          <LanguageSwitcher />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
