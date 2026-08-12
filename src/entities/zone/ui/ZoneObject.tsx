import { useTranslations } from "next-intl";
import type { Zone } from "../model/types";
import styles from "../styles/ZoneObject.module.scss";

interface ZoneObjectProps {
  zone: Zone;
  cellSize: number;
  selected: boolean;
  editable: boolean;
  override?: { startRow: number; startCol: number; width: number; height: number; valid: boolean };
  // SVG path data (fill-rule evenodd) for this zone's visible shape: its
  // own rect with a hole cut out for every smaller zone it overlaps, so it
  // renders flowing around them instead of painting over them.
  pathData: string;
  onSelect: (id: string) => void;
  onBeginMove: (id: string, e: React.PointerEvent) => void;
  onBeginResize: (id: string, e: React.PointerEvent) => void;
}

export function ZoneObject({
  zone,
  cellSize,
  selected,
  editable,
  override,
  pathData,
  onSelect,
  onBeginMove,
  onBeginResize,
}: ZoneObjectProps) {
  const t = useTranslations("Editor");
  const rect = override ?? zone;
  const dragging = Boolean(override);
  const widthPx = rect.width * cellSize;
  const heightPx = rect.height * cellSize;

  const fill = dragging
    ? override!.valid
      ? "#10b98133"
      : "#ef444433"
    : `${zone.color}26`;
  const stroke = dragging
    ? override!.valid
      ? "#10b981"
      : "#ef4444"
    : selected
      ? "#0ea5e9"
      : `${zone.color}99`;

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.zDragging : selected ? styles.zSelected : styles.zIdle}`}
      style={{ top: rect.startRow * cellSize, left: rect.startCol * cellSize, width: widthPx, height: heightPx }}
    >
      <svg width={widthPx} height={heightPx} style={{ overflow: "visible" }} className={styles.path}>
        <path
          d={pathData}
          fillRule="evenodd"
          fill={fill}
          stroke={stroke}
          strokeWidth={dragging || selected ? 3 : 1.5}
          strokeDasharray={dragging || selected ? undefined : "4 3"}
          className={editable ? styles.editable : styles.notEditable}
          onPointerDown={(e) => {
            if (!editable) return;
            onBeginMove(zone.id, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(zone.id);
          }}
        />
      </svg>
      <div className={styles.label} style={{ backgroundColor: `${zone.color}cc` }}>
        {dragging && !override!.valid ? t("invalidPlacement") : zone.label}
      </div>
      {selected && editable && !dragging && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onBeginResize(zone.id, e);
          }}
          className={styles.resizeHandle}
          style={{ backgroundColor: zone.color }}
        />
      )}
    </div>
  );
}
