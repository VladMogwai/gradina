"use client";

import { LIBRARY_SPECIES } from "@/entities/plant";
import { LIBRARY_ZONES } from "@/entities/zone";
import { clamp } from "@/shared/lib/geometry";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { BASE_CELL_SIZE, ZOOM_MAX, ZOOM_MIN } from "../config/constants";
import type { EditorMode } from "../model/types";
import { useAutoSaveGardenPlan } from "../model/useAutoSaveGardenPlan";
import { useCustomLibrary } from "../model/useCustomLibrary";
import { useEditorHotkeys } from "../model/useEditorHotkeys";
import { useEditorSelection } from "../model/useEditorSelection";
import { useGardenDrag } from "../model/useGardenDrag";
import { useGridResize } from "../model/useGridResize";
import { useHistory, type GardenDoc } from "../model/useHistory";
import { usePlantActions } from "../model/usePlantActions";
import { useZoneActions } from "../model/useZoneActions";
import styles from "../styles/GardenEditor.module.scss";
import { GridCanvas } from "./GridCanvas";
import { PlantLibraryPanel } from "./PlantLibraryPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { Toolbar } from "./Toolbar";

interface GardenEditorProps {
  initialDoc: GardenDoc;
}

export default function GardenEditor({ initialDoc }: GardenEditorProps) {
  const t = useTranslations("Editor");
  const { doc, commit, undo, redo, canUndo, canRedo } = useHistory(initialDoc);
  const { grid, plants, zones } = doc;

  const [mode, setMode] = useState<EditorMode>("edit");
  const [zoom, setZoom] = useState(1);
  const [debug, setDebug] = useState(false);
  const { status: saveStatus, saveNow } = useAutoSaveGardenPlan(doc);

  const { selection, setSelection, selectCell, selectPlant, selectZone, clearSelection } = useEditorSelection(
    plants,
    zones
  );

  const { canvasRef, dragState, beginMove, beginResize, beginLibraryPlantDrag, beginLibraryZoneDrag } =
    useGardenDrag({ zoom, grid, plants, zones, commit, setSelection, t });

  const { gridResizeError, handleRowsChange, handleColsChange } = useGridResize({ grid, plants, zones, commit, t });

  const {
    handleWaterNow,
    handlePhotoChange,
    handlePlantNameChange,
    handlePlantColorChange,
    handlePlantSpeciesChange,
    handlePlantNotesChange,
    handleDeletePlant,
    handleAddPlant,
  } = usePlantActions({ grid, plants, commit, setSelection });

  const {
    handleZoneLabelChange,
    handleZoneColorChange,
    handleZoneNotesChange,
    handleAddZone,
    handleDeleteZone,
  } = useZoneActions({ grid, commit, setSelection });

  const {
    customSpecies,
    customZoneKinds,
    handleAddCustomSpecies,
    handleDeleteCustomSpecies,
    handleUpdateCustomSpecies,
    handleAddCustomZoneKind,
    handleDeleteCustomZoneKind,
    handleUpdateCustomZoneKind,
  } = useCustomLibrary();

  useEditorHotkeys({ undo, redo, onEscape: clearSelection });

  const cellSize = BASE_CELL_SIZE * zoom;

  const handleZoomChange = useCallback((z: number) => {
    setZoom(clamp(Number(z.toFixed(2)), ZOOM_MIN, ZOOM_MAX));
  }, []);

  const handleZoomDelta = useCallback((deltaY: number) => {
    setZoom((z) => clamp(Number((z - deltaY * 0.001).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
  }, []);

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
        debug={debug}
        onDebugChange={setDebug}
        onSave={saveNow}
        savedFlash={saveStatus === "saved"}
      />
      <div className={styles.body}>
        {mode === "edit" && (
          <PlantLibraryPanel
            editable={mode === "edit"}
            species={[...LIBRARY_SPECIES, ...customSpecies]}
            zoneKinds={[...LIBRARY_ZONES, ...customZoneKinds]}
            onBeginPlantDrag={beginLibraryPlantDrag}
            onBeginZoneDrag={beginLibraryZoneDrag}
            onAddCustomSpecies={handleAddCustomSpecies}
            onDeleteCustomSpecies={handleDeleteCustomSpecies}
            onUpdateCustomSpecies={handleUpdateCustomSpecies}
            onAddCustomZoneKind={handleAddCustomZoneKind}
            onDeleteCustomZoneKind={handleDeleteCustomZoneKind}
            onUpdateCustomZoneKind={handleUpdateCustomZoneKind}
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
            selection={selection}
            plants={plants}
            zones={zones}
            onWaterNow={handleWaterNow}
            onDeletePlant={handleDeletePlant}
            onPhotoChange={handlePhotoChange}
            onPlantNameChange={handlePlantNameChange}
            onPlantColorChange={handlePlantColorChange}
            onPlantSpeciesChange={handlePlantSpeciesChange}
            onPlantNotesChange={handlePlantNotesChange}
            onZoneLabelChange={handleZoneLabelChange}
            onZoneColorChange={handleZoneColorChange}
            onZoneNotesChange={handleZoneNotesChange}
            onDeleteZone={handleDeleteZone}
            onAddPlant={handleAddPlant}
            onAddZone={handleAddZone}
          />
        )}
      </div>
    </div>
  );
}
