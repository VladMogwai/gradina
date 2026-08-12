import { fallbackColorFor, type LibrarySpecies } from "@/entities/plant";
import {
  DEFAULT_ZONE_SIZE,
  ZONE_KIND_DEFAULT_COLOR,
  ZONE_KIND_LABEL_KEYS,
  ZONE_KINDS,
  zoneKindLibraryLabel,
  type LibraryZoneKind,
  type ZoneKind,
} from "@/entities/zone";
import { useTranslations } from "next-intl";
import { useState } from "react";
import styles from "../styles/PlantLibraryPanel.module.scss";

interface PlantLibraryPanelProps {
  editable: boolean;
  species: LibrarySpecies[];
  zoneKinds: LibraryZoneKind[];
  onBeginPlantDrag: (species: LibrarySpecies) => void;
  onBeginZoneDrag: (zoneKind: LibraryZoneKind) => void;
  onAddCustomSpecies: (name: string, color: string, width: number, height: number) => void;
  onDeleteCustomSpecies: (key: string) => void;
  onUpdateCustomSpecies: (key: string, patch: Partial<Omit<LibrarySpecies, "key" | "custom">>) => void;
  onAddCustomZoneKind: (kind: ZoneKind, label: string, color: string, width: number, height: number) => void;
  onDeleteCustomZoneKind: (key: string) => void;
  onUpdateCustomZoneKind: (key: string, patch: Partial<Omit<LibraryZoneKind, "key" | "custom">>) => void;
}

function AddCustomPlantRow({ onAdd }: { onAdd: PlantLibraryPanelProps["onAddCustomSpecies"] }) {
  const t = useTranslations("Editor");
  const [name, setName] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  // The color picker is the source of truth for the placed plant's fill;
  // it just starts out pre-filled with a color derived from the name.
  const [color, setColor] = useState(fallbackColorFor("custom-plant"));

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim(), color, Math.max(1, width), Math.max(1, height));
    setName("");
    setWidth(1);
    setHeight(1);
  }

  return (
    <div className={styles.addCard}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("name")}
        className={styles.textField}
      />
      <div className={styles.row}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title={t("color")}
          className={styles.colorInputMd}
        />
        <input
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className={styles.smallNumber}
        />
        <span className={styles.times}>×</span>
        <input
          type="number"
          min={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className={styles.smallNumber}
        />
      </div>
      <button onClick={submit} disabled={!name.trim()} className={styles.addButton}>
        {t("addPlant")}
      </button>
    </div>
  );
}

// Custom species are freely renamed/recolored/resized in place; only the
// swatch acts as the drag handle so the text/number fields stay editable.
function CustomPlantEntry({
  species,
  editable,
  onBeginDrag,
  onUpdate,
  onDelete,
}: {
  species: LibrarySpecies;
  editable: boolean;
  onBeginDrag: () => void;
  onUpdate: PlantLibraryPanelProps["onUpdateCustomSpecies"];
  onDelete: () => void;
}) {
  const t = useTranslations("Editor");
  return (
    <div className={styles.customRow}>
      <div
        onPointerDown={() => editable && onBeginDrag()}
        title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
        aria-label={`${t("addPlant")}: ${species.name}`}
        className={`${styles.dragHandle} ${editable ? styles.dragHandleEditable : styles.dragHandleDisabled}`}
        style={{ background: `linear-gradient(135deg, ${species.color}, ${species.color}cc)` }}
      />
      <input
        type="text"
        value={species.name}
        onChange={(e) => onUpdate(species.key, { name: e.target.value })}
        className={styles.inlineNameInput}
      />
      <input
        type="number"
        min={1}
        value={species.defaultWidth}
        onChange={(e) => onUpdate(species.key, { defaultWidth: Math.max(1, Number(e.target.value)) })}
        className={styles.miniNumber}
      />
      <span className={styles.miniTimes}>×</span>
      <input
        type="number"
        min={1}
        value={species.defaultHeight}
        onChange={(e) => onUpdate(species.key, { defaultHeight: Math.max(1, Number(e.target.value)) })}
        className={styles.miniNumber}
      />
      <input
        type="color"
        value={species.color}
        onChange={(e) => onUpdate(species.key, { color: e.target.value })}
        title={t("color")}
        className={styles.miniColor}
      />
      <button onClick={onDelete} title={t("delete")} className={styles.deleteButton}>
        ×
      </button>
    </div>
  );
}

function AddCustomZoneRow({ onAdd }: { onAdd: PlantLibraryPanelProps["onAddCustomZoneKind"] }) {
  const t = useTranslations("Editor");
  const [kind, setKind] = useState<ZoneKind>(ZONE_KINDS[0]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(ZONE_KIND_DEFAULT_COLOR[ZONE_KINDS[0]]);
  const [width, setWidth] = useState(DEFAULT_ZONE_SIZE);
  const [height, setHeight] = useState(DEFAULT_ZONE_SIZE);

  function handleKindChange(nextKind: ZoneKind) {
    setKind(nextKind);
    setColor(ZONE_KIND_DEFAULT_COLOR[nextKind]);
  }

  function submit() {
    const finalLabel = label.trim() || t(ZONE_KIND_LABEL_KEYS[kind]);
    onAdd(kind, finalLabel, color, Math.max(1, width), Math.max(1, height));
    setLabel("");
  }

  return (
    <div className={styles.addCard}>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t("label")}
        className={styles.textField}
      />
      <div className={styles.row}>
        <select
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as ZoneKind)}
          title={t("kind")}
          className={styles.textField}
        >
          {ZONE_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(ZONE_KIND_LABEL_KEYS[k])}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title={t("color")}
          className={styles.colorInputMd}
        />
      </div>
      <div className={styles.row}>
        <input
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className={styles.smallNumber}
        />
        <span className={styles.times}>×</span>
        <input
          type="number"
          min={1}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className={styles.smallNumber}
        />
      </div>
      <button onClick={submit} className={styles.addButton}>
        {t("addZone")}
      </button>
    </div>
  );
}

// Custom zones are freely renamed/recolored/resized in place; the "kind"
// select only seeds a default color and is never required for naming.
function CustomZoneEntry({
  zoneKind,
  editable,
  onBeginDrag,
  onUpdate,
  onDelete,
}: {
  zoneKind: LibraryZoneKind;
  editable: boolean;
  onBeginDrag: () => void;
  onUpdate: PlantLibraryPanelProps["onUpdateCustomZoneKind"];
  onDelete: () => void;
}) {
  const t = useTranslations("Editor");
  return (
    <div className={styles.customZoneRow}>
      <div className={styles.row}>
        <div
          onPointerDown={() => editable && onBeginDrag()}
          title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
          aria-label={`${t("zone")}: ${zoneKindLibraryLabel(zoneKind, t)}`}
          className={`${styles.dragHandleZone} ${editable ? styles.dragHandleEditable : styles.dragHandleDisabled}`}
          style={{ backgroundColor: `${zoneKind.color}33`, borderColor: zoneKind.color }}
        />
        <input
          type="text"
          value={zoneKind.label ?? ""}
          onChange={(e) => onUpdate(zoneKind.key, { label: e.target.value })}
          placeholder={t(ZONE_KIND_LABEL_KEYS[zoneKind.kind])}
          className={styles.inlineNameInput}
        />
        <input
          type="color"
          value={zoneKind.color}
          onChange={(e) => onUpdate(zoneKind.key, { color: e.target.value })}
          title={t("color")}
          className={styles.miniColor}
        />
        <button onClick={onDelete} title={t("delete")} className={styles.deleteButton}>
          ×
        </button>
      </div>
      <div className={styles.zoneSecondRow}>
        <select
          value={zoneKind.kind}
          onChange={(e) => onUpdate(zoneKind.key, { kind: e.target.value as ZoneKind })}
          title={t("kind")}
          className={styles.miniSelect}
        >
          {ZONE_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(ZONE_KIND_LABEL_KEYS[k])}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={zoneKind.defaultWidth}
          onChange={(e) => onUpdate(zoneKind.key, { defaultWidth: Math.max(1, Number(e.target.value)) })}
          className={styles.miniNumber}
        />
        <span className={styles.miniTimes}>×</span>
        <input
          type="number"
          min={1}
          value={zoneKind.defaultHeight}
          onChange={(e) => onUpdate(zoneKind.key, { defaultHeight: Math.max(1, Number(e.target.value)) })}
          className={styles.miniNumber}
        />
        <span className={styles.cellsLabel}>{t("cells")}</span>
      </div>
    </div>
  );
}

export function PlantLibraryPanel({
  editable,
  species,
  zoneKinds,
  onBeginPlantDrag,
  onBeginZoneDrag,
  onAddCustomSpecies,
  onDeleteCustomSpecies,
  onUpdateCustomSpecies,
  onAddCustomZoneKind,
  onDeleteCustomZoneKind,
  onUpdateCustomZoneKind,
}: PlantLibraryPanelProps) {
  const t = useTranslations("Editor");
  const [query, setQuery] = useState("");
  const filteredSpecies = species.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  const filteredZones = zoneKinds.filter((z) =>
    zoneKindLibraryLabel(z, t).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{t("library")}</h2>
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
            {filteredSpecies.map((s) =>
              s.custom ? (
                <CustomPlantEntry
                  key={s.key}
                  species={s}
                  editable={editable}
                  onBeginDrag={() => onBeginPlantDrag(s)}
                  onUpdate={onUpdateCustomSpecies}
                  onDelete={() => onDeleteCustomSpecies(s.key)}
                />
              ) : (
                <div
                  key={s.key}
                  onPointerDown={() => editable && onBeginPlantDrag(s)}
                  className={`${styles.entryRow} ${editable ? styles.entryRowEditable : styles.entryRowDisabled}`}
                  title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
                  aria-label={`${t("addPlant")}: ${s.name}`}
                >
                  <div
                    className={styles.swatch}
                    style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}
                  />
                  <div className={styles.entryBody}>
                    <div className={styles.entryName}>{s.name}</div>
                    <div className={styles.entrySize}>
                      {s.defaultWidth}×{s.defaultHeight} {t("cells")}
                    </div>
                  </div>
                </div>
              )
            )}
            {filteredSpecies.length === 0 && <p className={styles.noMatches}>{t("noMatches")}</p>}
            {editable && <AddCustomPlantRow onAdd={onAddCustomSpecies} />}
          </div>
        </div>

        <div>
          <h3 className={styles.sectionHeading}>{t("zones")}</h3>
          <div className={styles.list}>
            {filteredZones.map((z) =>
              z.custom ? (
                <CustomZoneEntry
                  key={z.key}
                  zoneKind={z}
                  editable={editable}
                  onBeginDrag={() => onBeginZoneDrag(z)}
                  onUpdate={onUpdateCustomZoneKind}
                  onDelete={() => onDeleteCustomZoneKind(z.key)}
                />
              ) : (
                <div
                  key={z.key}
                  onPointerDown={() => editable && onBeginZoneDrag(z)}
                  className={`${styles.entryRow} ${editable ? styles.entryRowEditable : styles.entryRowDisabled}`}
                  title={editable ? t("dragToPlace") : t("switchToEditToPlace")}
                  aria-label={`${t("zone")}: ${zoneKindLibraryLabel(z, t)}`}
                >
                  <div
                    className={styles.zoneSwatch}
                    style={{ backgroundColor: `${z.color}33`, borderColor: z.color }}
                  />
                  <div className={styles.entryBody}>
                    <div className={styles.entryName}>{zoneKindLibraryLabel(z, t)}</div>
                    <div className={styles.entrySize}>
                      {z.defaultWidth}×{z.defaultHeight} {t("cells")}
                    </div>
                  </div>
                </div>
              )
            )}
            {filteredZones.length === 0 && <p className={styles.noMatches}>{t("noMatches")}</p>}
            {editable && <AddCustomZoneRow onAdd={onAddCustomZoneKind} />}
          </div>
        </div>
      </div>
      <p className={styles.footerNote}>{t("libraryPrototypeNote")}</p>
    </div>
  );
}
