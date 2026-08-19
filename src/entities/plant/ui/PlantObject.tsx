import { useTranslations } from "next-intl";
import { fallbackColorFor } from "../model/constants";
import type { Plant } from "../model/types";
import { PlantPhotoImage } from "./PlantPhotoImage";
import styles from "../styles/PlantObject.module.scss";

interface PlantObjectProps {
  plant: Plant;
  cellSize: number;
  selected: boolean;
  editable: boolean;
  debug: boolean;
  override?: { startRow: number; startCol: number; width: number; height: number; valid: boolean };
  onSelect: (id: string) => void;
  onBeginMove: (id: string, e: React.PointerEvent) => void;
  onBeginResize: (id: string, e: React.PointerEvent) => void;
}

export function PlantObject({
  plant,
  cellSize,
  selected,
  editable,
  debug,
  override,
  onSelect,
  onBeginMove,
  onBeginResize,
}: PlantObjectProps) {
  const t = useTranslations("Editor");
  const rect = override ?? plant;
  const dragging = Boolean(override);
  // The chosen color (set when the plant was created/edited) is the source
  // of truth; only fall back to a name-derived color when none was set.
  const color = plant.color ?? fallbackColorFor(plant.species?.scientificName ?? plant.name);

  const classNames = [
    styles.plant,
    editable ? styles.editable : styles.notEditable,
    dragging ? (override!.valid ? styles.draggingValid : styles.draggingInvalid) : styles.idle,
    !dragging && (selected ? styles.selected : styles.unselected),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{
        top: rect.startRow * cellSize,
        left: rect.startCol * cellSize,
        width: rect.width * cellSize,
        height: rect.height * cellSize,
      }}
      onPointerDown={(e) => {
        if (!editable) return;
        onBeginMove(plant.id, e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(plant.id);
      }}
    >
      <div
        className={styles.fallbackFill}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        }}
      />
      {plant.photos[0] && (
        <PlantPhotoImage
          src={plant.photos[0].url}
          alt={plant.name}
          placeholder={plant.photos[0].placeholder}
          // Tile size follows the zoom level, so this is a rough upper
          // bound rather than an exact width.
          sizes="200px"
          // contain (not cover) so the whole photo stays visible, scaled to
          // fit the plant's current size, instead of being cropped when its
          // aspect ratio doesn't match the tile; the color fill behind it
          // shows through as letterboxing.
          objectFit="contain"
        />
      )}
      <div className={styles.label}>{dragging && !override!.valid ? t("invalidPlacement") : plant.name}</div>
      {debug && (
        <div className={styles.debugBadge}>
          {rect.startRow},{rect.startCol}
        </div>
      )}
      {selected && editable && !dragging && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onBeginResize(plant.id, e);
          }}
          className={styles.resizeHandle}
        />
      )}
    </div>
  );
}
