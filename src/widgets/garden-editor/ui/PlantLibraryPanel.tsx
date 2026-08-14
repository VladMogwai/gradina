import { fallbackColorFor, type Plant } from "@/entities/plant";
import { ZONE_KIND_DEFAULT_COLOR, ZONE_KIND_LABEL_KEYS, ZONE_KINDS, type Zone, type ZoneKind } from "@/entities/zone";
import { Modal } from "@/shared/ui/Modal";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "../styles/PlantLibraryPanel.module.scss";

interface PlantLibraryPanelProps {
  editable: boolean;
  plants: Plant[];
  zones: Zone[];
  onBeginPlantDrag: (id: string) => void;
  onBeginZoneDrag: (id: string) => void;
  onAddPlant: (name: string, color: string, width: number, height: number) => void;
  onAddZone: (kind: ZoneKind, label: string, color: string, width: number, height: number) => void;
  onDeletePlant: (id: string) => void;
  onDeleteZone: (id: string) => void;
}

function AddPlantModalForm({
  onAdd,
  onClose,
}: {
  onAdd: PlantLibraryPanelProps["onAddPlant"];
  onClose: () => void;
}) {
  const t = useTranslations("Editor");
  const [name, setName] = useState("");
  const [color, setColor] = useState(fallbackColorFor("custom-plant"));
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [nameError, setNameError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onAdd(name.trim(), color, Math.max(1, width), Math.max(1, height));
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t("name")}</span>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
          placeholder={t("name")}
          className={styles.textField}
        />
        {nameError && <span className={styles.fieldError}>{t("nameRequired")}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t("color")}</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={styles.colorInputMd}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t("sizeCells")}</span>
        <div className={styles.sizeRow}>
          <div className={styles.sizeInput}>
            <input
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className={styles.smallNumber}
            />
            <span className={styles.sizeHint}>{t("width")}</span>
          </div>
          <span className={styles.times}>×</span>
          <div className={styles.sizeInput}>
            <input
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className={styles.smallNumber}
            />
            <span className={styles.sizeHint}>{t("height")}</span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.secondaryButton}>
          {t("cancel")}
        </button>
        <button type="submit" className={styles.primaryButton}>
          {t("addPlant")}
        </button>
      </div>
    </form>
  );
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
    <form onSubmit={handleSubmit} className={styles.modalForm}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t("name")}</span>
        <input
          type="text"
          autoFocus
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setNameError(false);
          }}
          placeholder={t(ZONE_KIND_LABEL_KEYS[kind])}
          className={styles.textField}
        />
        {nameError && <span className={styles.fieldError}>{t("nameRequired")}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t("kind")}</span>
        <select
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as ZoneKind)}
          className={styles.textField}
        >
          {ZONE_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(ZONE_KIND_LABEL_KEYS[k])}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{t("color")}</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className={styles.colorInputMd}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t("sizeCells")}</span>
        <div className={styles.sizeRow}>
          <div className={styles.sizeInput}>
            <input
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className={styles.smallNumber}
            />
            <span className={styles.sizeHint}>{t("width")}</span>
          </div>
          <span className={styles.times}>×</span>
          <div className={styles.sizeInput}>
            <input
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className={styles.smallNumber}
            />
            <span className={styles.sizeHint}>{t("height")}</span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.secondaryButton}>
          {t("cancel")}
        </button>
        <button type="submit" className={styles.primaryButton}>
          {t("addZone")}
        </button>
      </div>
    </form>
  );
}

// Browse + select-to-drag + delete only - no inline editing. Editing a
// plant/zone happens in the right-hand detail panel after selecting it.
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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className={styles.thumb} />
      ) : (
        <div
          className={styles.swatch}
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        />
      )}
      <div className={styles.entryBody}>
        <div className={styles.entryName}>{plant.name}</div>
      </div>
      <button
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("delete")}
        className={styles.deleteButton}
      >
        ×
      </button>
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
      <button
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("delete")}
        className={styles.deleteButton}
      >
        ×
      </button>
    </div>
  );
}

export function PlantLibraryPanel({
  editable,
  plants,
  zones,
  onBeginPlantDrag,
  onBeginZoneDrag,
  onAddPlant,
  onAddZone,
  onDeletePlant,
  onDeleteZone,
}: PlantLibraryPanelProps) {
  const t = useTranslations("Editor");
  const [query, setQuery] = useState("");
  const [plantModalOpen, setPlantModalOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const filteredPlants = plants.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredZones = zones.filter((z) => z.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{t("library")}</h2>
      {editable && (
        <div className={styles.headerActions}>
          <button onClick={() => setPlantModalOpen(true)} className={styles.headerButton}>
            + {t("addPlant")}
          </button>
          <button onClick={() => setZoneModalOpen(true)} className={styles.headerButton}>
            + {t("addZone")}
          </button>
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`${t("search")}…`}
        className={styles.searchInput}
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

      <Modal open={plantModalOpen} onClose={() => setPlantModalOpen(false)} title={t("addPlant")}>
        <AddPlantModalForm onAdd={onAddPlant} onClose={() => setPlantModalOpen(false)} />
      </Modal>
      <Modal open={zoneModalOpen} onClose={() => setZoneModalOpen(false)} title={t("addZone")}>
        <AddZoneModalForm onAdd={onAddZone} onClose={() => setZoneModalOpen(false)} />
      </Modal>
    </div>
  );
}
