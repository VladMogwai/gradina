import { PlantPhotoImage, fallbackColorFor, type Plant } from "@/entities/plant";
import { ZONE_KIND_DEFAULT_COLOR, ZONE_KIND_LABEL_KEYS, ZONE_KINDS, type Zone, type ZoneKind } from "@/entities/zone";
import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "../styles/PlantLibraryPanel.module.scss";

interface PlantLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  editable: boolean;
  plants: Plant[];
  zones: Zone[];
  onBeginPlantDrag: (id: string) => void;
  onBeginZoneDrag: (id: string) => void;
  onAddZone: (kind: ZoneKind, label: string, color: string, width: number, height: number) => void;
  onDeletePlant: (id: string) => void;
  onDeleteZone: (id: string) => void;
}

function AddZoneModalForm({
  onAdd,
  onClose,
}: {
  onAdd: PlantLibraryPanelProps["onAddZone"];
  onClose: () => void;
}) {
  const t = useTranslations("Editor");
  const [kind, setKind] = useState<ZoneKind>(ZONE_KINDS[0]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(ZONE_KIND_DEFAULT_COLOR[ZONE_KINDS[0]]);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(3);
  const [nameError, setNameError] = useState(false);

  function handleKindChange(nextKind: ZoneKind) {
    setKind(nextKind);
    setColor(ZONE_KIND_DEFAULT_COLOR[nextKind]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalLabel = label.trim() || t(ZONE_KIND_LABEL_KEYS[kind]);
    if (!finalLabel.trim()) {
      setNameError(true);
      return;
    }
    onAdd(kind, finalLabel, color, Math.max(1, width), Math.max(1, height));
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <TextField
          label={t("name")}
          autoFocus
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setNameError(false);
          }}
          placeholder={t(ZONE_KIND_LABEL_KEYS[kind])}
          error={nameError}
          helperText={nameError ? t("nameRequired") : undefined}
          size="small"
          fullWidth
        />

        <TextField
          select
          label={t("kind")}
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as ZoneKind)}
          size="small"
          fullWidth
        >
          {ZONE_KINDS.map((k) => (
            <MenuItem key={k} value={k}>
              {t(ZONE_KIND_LABEL_KEYS[k])}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("color")}
          </Typography>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorInputMd}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <TextField
            label={t("width")}
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            size="small"
          />
          <TextField
            label={t("height")}
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            size="small"
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" onClick={onClose} color="inherit">
            {t("cancel")}
          </Button>
          <Button type="submit" variant="contained">
            {t("addZone")}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

// Browse + select-to-drag + delete only - no inline editing. Editing a
// plant/zone happens in the properties bottom sheet after selecting it.
function PlantRow({
  plant,
  editable,
  onBeginDrag,
  onDelete,
}: {
  plant: Plant;
  editable: boolean;
  onBeginDrag: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Editor");
  const color = plant.color ?? fallbackColorFor(plant.species?.scientificName ?? plant.name);
  const thumbUrl = plant.photos[0]?.url ?? null;
  return (
    <div
      onPointerDown={() => editable && onBeginDrag()}
      title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
      aria-label={`${t("name")}: ${plant.name}`}
      className={`${styles.entryRow} ${editable ? styles.entryRowEditable : styles.entryRowDisabled}`}
    >
      {thumbUrl ? (
        <div className={styles.thumbWrap}>
          <PlantPhotoImage
            src={thumbUrl}
            alt=""
            placeholder={plant.photos[0]?.placeholder}
            sizes="32px"
            className={styles.thumb}
          />
        </div>
      ) : (
        <div
          className={styles.swatch}
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        />
      )}
      <div className={styles.entryBody}>
        <div className={styles.entryName}>{plant.name}</div>
      </div>
      <IconButton
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("delete")}
        aria-label={t("delete")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
}

function ZoneRow({
  zone,
  editable,
  onBeginDrag,
  onDelete,
}: {
  zone: Zone;
  editable: boolean;
  onBeginDrag: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Editor");
  return (
    <div
      onPointerDown={() => editable && onBeginDrag()}
      title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
      aria-label={`${t("zone")}: ${zone.label}`}
      className={`${styles.entryRow} ${editable ? styles.entryRowEditable : styles.entryRowDisabled}`}
    >
      <div
        className={styles.zoneSwatch}
        style={{ backgroundColor: `${zone.color}33`, borderColor: zone.color }}
      />
      <div className={styles.entryBody}>
        <div className={styles.entryName}>{zone.label}</div>
        <div className={styles.entryMeta}>{t(ZONE_KIND_LABEL_KEYS[zone.kind])}</div>
      </div>
      <IconButton
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("delete")}
        aria-label={t("delete")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
}

export function PlantLibraryPanel({
  open,
  onClose,
  editable,
  plants,
  zones,
  onBeginPlantDrag,
  onBeginZoneDrag,
  onAddZone,
  onDeletePlant,
  onDeleteZone,
}: PlantLibraryPanelProps) {
  const t = useTranslations("Editor");
  const [query, setQuery] = useState("");
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const filteredPlants = plants.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredZones = zones.filter((z) => z.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.heading}>{t("library")}</h2>
          <IconButton onClick={onClose} title={t("close")} aria-label={t("close")}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        {editable && (
          <div className={styles.headerActions}>
            <Button onClick={() => setZoneModalOpen(true)} size="small" variant="outlined">
              + {t("addZone")}
            </Button>
          </div>
        )}
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${t("search")}…`}
          size="small"
          fullWidth
          sx={{ mb: 1.5 }}
        />
        <div className={styles.scrollArea}>
          <div>
            <h3 className={styles.sectionHeading}>{t("plants")}</h3>
            <div className={styles.list}>
              {filteredPlants.map((p) => (
                <PlantRow
                  key={p.id}
                  plant={p}
                  editable={editable}
                  onBeginDrag={() => onBeginPlantDrag(p.id)}
                  onDelete={() => onDeletePlant(p.id)}
                />
              ))}
              {plants.length === 0 && <p className={styles.noMatches}>{t("noPlantsYet")}</p>}
              {plants.length > 0 && filteredPlants.length === 0 && (
                <p className={styles.noMatches}>{t("noMatches")}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className={styles.sectionHeading}>{t("zones")}</h3>
            <div className={styles.list}>
              {filteredZones.map((z) => (
                <ZoneRow
                  key={z.id}
                  zone={z}
                  editable={editable}
                  onBeginDrag={() => onBeginZoneDrag(z.id)}
                  onDelete={() => onDeleteZone(z.id)}
                />
              ))}
              {zones.length === 0 && <p className={styles.noMatches}>{t("noZonesYet")}</p>}
              {zones.length > 0 && filteredZones.length === 0 && (
                <p className={styles.noMatches}>{t("noMatches")}</p>
              )}
            </div>
          </div>
        </div>
        <p className={styles.footerNote}>{t("libraryPrototypeNote")}</p>
      </div>

      <Dialog open={zoneModalOpen} onClose={() => setZoneModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("addZone")}</DialogTitle>
        <DialogContent>
          <AddZoneModalForm onAdd={onAddZone} onClose={() => setZoneModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
