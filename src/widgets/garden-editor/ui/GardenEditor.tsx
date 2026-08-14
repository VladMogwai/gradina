"use client";

import type { ZoneKind } from "@/entities/zone";
import { findFreeCell } from "@/shared/lib/geometry";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { BASE_CELL_SIZE } from "../config/constants";
import type { EditorMode } from "../model/types";
import { useAutoSaveGardenPlan } from "../model/useAutoSaveGardenPlan";
import { useEditorHotkeys } from "../model/useEditorHotkeys";
import { useEditorSelection } from "../model/useEditorSelection";
import { useGardenDrag } from "../model/useGardenDrag";
import { useGridResize } from "../model/useGridResize";
import { useHistory, type GardenDoc, type GardenSettings } from "../model/useHistory";
import { usePersistedZoom } from "../model/usePersistedZoom";
import { usePlantActions } from "../model/usePlantActions";
import { useZoneActions } from "../model/useZoneActions";
import styles from "../styles/GardenEditor.module.scss";
import { GardenSettingsModal } from "./GardenSettingsModal";
import { GridCanvas } from "./GridCanvas";
import { PlantLibraryPanel } from "./PlantLibraryPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { Toolbar } from "./Toolbar";

interface GardenEditorProps {
  userId: string;
  initialDoc: GardenDoc;
}

export default function GardenEditor({ userId, initialDoc }: GardenEditorProps) {
  const t = useTranslations("Editor");
  const { doc, commit, replacePresent, undo, redo, canUndo, canRedo } = useHistory(initialDoc);
  const { grid, plants, zones } = doc;

  const [mode, setMode] = useState<EditorMode>("edit");
  const [zoom, setZoom] = usePersistedZoom();
  const [debug, setDebug] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const { status: saveStatus, saveNow } = useAutoSaveGardenPlan(doc);

  const { selection, setSelection, selectCell, selectPlant, selectZone, clearSelection } = useEditorSelection(
    plants,
    zones
  );

  const { canvasRef, dragState, beginMove, beginResize, beginLibraryPlantDrag, beginLibraryZoneDrag } =
    useGardenDrag({ zoom, grid, plants, zones, commit, setSelection });

  const { gridResizeError, handleRowsChange, handleColsChange } = useGridResize({ grid, plants, zones, commit, t });

  const {
    handleAddPhoto,
    handleRemovePhoto,
    handlePlantNameChange,
    handlePlantColorChange,
    handlePlantNotesChange,
    handleAnalysisChange,
    handleDeletePlant,
    handleAddPlant,
  } = usePlantActions({ grid, plants, commit, replacePresent, setSelection });

  const { handleZoneLabelChange, handleZoneColorChange, handleZoneNotesChange, handleAddZone, handleDeleteZone } =
    useZoneActions({ grid, commit, setSelection });

  useEditorHotkeys({ undo, redo, onEscape: clearSelection });

  const cellSize = BASE_CELL_SIZE * zoom;

  const handleZoomChange = useCallback(
    (z: number) => {
      setZoom(z);
    },
    [setZoom]
  );

  const handleZoomDelta = useCallback(
    (deltaY: number) => {
      setZoom((z) => z - deltaY * 0.001);
    },
    [setZoom]
  );

  // Modal submit handlers: the form collects name/color/size, this picks
  // where it lands (first free cell) and actually creates it.
  const handleAddPlantSubmit = useCallback(
    (name: string, color: string, width: number, height: number) => {
      const free = findFreeCell(width, height, plants, grid);
      if (!free) return;
      handleAddPlant(free.row, free.col, name, width, height, color);
    },
    [plants, grid, handleAddPlant]
  );

  const handleAddZoneSubmit = useCallback(
    (kind: ZoneKind, label: string, color: string, width: number, height: number) => {
      const free = findFreeCell(width, height, [], grid);
      if (!free) return;
      handleAddZone(free.row, free.col, kind, label, color, width, height);
    },
    [grid, handleAddZone]
  );

  const handleSettingsChange = useCallback(
    (patch: Partial<GardenSettings>) => {
      commit((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    },
    [commit]
  );

  return (
    <div className={styles.root}>
      <Toolbar
        grid={grid}
        onRowsChange={handleRowsChange}
        onColsChange={handleColsChange}
        gridResizeError={gridResizeError}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        mode={mode}
        onModeChange={setMode}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onSave={saveNow}
        savedFlash={saveStatus === "saved"}
      />
      <div className={styles.body}>
        {mode === "edit" && (
          <PlantLibraryPanel
            editable={mode === "edit"}
            plants={plants}
            zones={zones}
            onBeginPlantDrag={beginLibraryPlantDrag}
            onBeginZoneDrag={beginLibraryZoneDrag}
            onAddPlant={handleAddPlantSubmit}
            onAddZone={handleAddZoneSubmit}
            onDeletePlant={handleDeletePlant}
            onDeleteZone={handleDeleteZone}
          />
        )}
        <div className={styles.canvasArea}>
          <GridCanvas
            canvasRef={canvasRef}
            grid={grid}
            plants={plants}
            zones={zones}
            cellSize={cellSize}
            mode={mode}
            debug={debug}
            selection={selection}
            dragState={dragState}
            onSelectCell={selectCell}
            onSelectPlant={selectPlant}
            onSelectZone={selectZone}
            onBeginMove={beginMove}
            onBeginResize={beginResize}
            onZoomDelta={handleZoomDelta}
          />
        </div>
        {mode === "edit" && (
          <PropertiesPanel
            userId={userId}
            selection={selection}
            plants={plants}
            zones={zones}
            gardenSettings={doc.settings}
            onClose={clearSelection}
            onDeletePlant={handleDeletePlant}
            onSaveNow={saveNow}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            onPlantNameChange={handlePlantNameChange}
            onPlantColorChange={handlePlantColorChange}
            onPlantNotesChange={handlePlantNotesChange}
            onAnalysisChange={handleAnalysisChange}
            onZoneLabelChange={handleZoneLabelChange}
            onZoneColorChange={handleZoneColorChange}
            onZoneNotesChange={handleZoneNotesChange}
            onDeleteZone={handleDeleteZone}
          />
        )}
      </div>
      <GardenSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={doc.settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
