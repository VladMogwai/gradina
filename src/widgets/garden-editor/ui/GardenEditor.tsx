"use client";

import { addPlantPhoto, type Plant } from "@/entities/plant";
import type { ZoneKind } from "@/entities/zone";
import { createClient } from "@/shared/api/supabase/client";
import { findFreeCell } from "@/shared/lib/geometry";
import { Alert, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
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
import { AddPlantControl } from "./AddPlantControl";
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
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);
  const [creatingPlant, setCreatingPlant] = useState(false);
  const [addPlantError, setAddPlantError] = useState<string | null>(null);
  const { status: saveStatus, saveNow } = useAutoSaveGardenPlan(doc);
  const supabaseRef = useRef(createClient());

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
    handlePlantNotesChange,
    handleAnalysisChange,
    handleDeletePlant,
    handleCreatePlant,
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

  // Photo-only creation: no name/color/size form. handleCreatePlant already
  // committed the new (undoable) plant and returns the exact Plant it
  // built, so nextDoc here is provably the same document that commit just
  // applied - saveNow(nextDoc) persists it directly rather than reading a
  // possibly-stale ref, closing the race where plant_photos' RLS check
  // could otherwise run before the new plant's row exists in garden_plants.
  const handleCreatePlantFromPhoto = useCallback(
    async (file: File) => {
      setAddPlantError(null);
      setCreatingPlant(true);
      try {
        const newPlant: Plant | null = handleCreatePlant(t("newPlantDefaultName"));
        if (!newPlant) {
          setAddPlantError(t("gridFullError"));
          return;
        }
        const nextDoc: GardenDoc = { ...doc, plants: [...doc.plants, newPlant] };
        await saveNow(nextDoc);
        const photo = await addPlantPhoto(supabaseRef.current, userId, newPlant.id, file, 0);
        handleAddPhoto(newPlant.id, photo);
      } catch {
        setAddPlantError(t("addPlantFailed"));
      } finally {
        setCreatingPlant(false);
      }
    },
    [doc, handleCreatePlant, saveNow, handleAddPhoto, userId, t]
  );

  return (
    <div className={styles.root}>
      <Toolbar
        grid={grid}
        onRowsChange={handleRowsChange}
        onColsChange={handleColsChange}
        gridResizeError={gridResizeError}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        mode={mode}
        onModeChange={setMode}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onFitToScreen={() => setFitSignal((n) => n + 1)}
        saveStatus={saveStatus}
      />

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
          onZoomChange={handleZoomChange}
          fitSignal={fitSignal}
        />
      </div>

      <PlantLibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        editable={mode === "edit"}
        plants={plants}
        zones={zones}
        onBeginPlantDrag={beginLibraryPlantDrag}
        onBeginZoneDrag={beginLibraryZoneDrag}
        onAddZone={handleAddZoneSubmit}
        onDeletePlant={handleDeletePlant}
        onDeleteZone={handleDeleteZone}
      />

      <PropertiesPanel
        userId={userId}
        selection={selection}
        plants={plants}
        zones={zones}
        gardenSettings={doc.settings}
        uploadingPhotoFor={creatingPlant && selection?.kind === "plant" ? selection.id : null}
        onClose={clearSelection}
        onDeletePlant={handleDeletePlant}
        onSaveNow={saveNow}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
        onPlantNotesChange={handlePlantNotesChange}
        onAnalysisChange={handleAnalysisChange}
        onZoneLabelChange={handleZoneLabelChange}
        onZoneColorChange={handleZoneColorChange}
        onZoneNotesChange={handleZoneNotesChange}
        onDeleteZone={handleDeleteZone}
      />

      <AddPlantControl onFileSelected={handleCreatePlantFromPhoto} busy={creatingPlant} />

      <GardenSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={doc.settings}
        onSettingsChange={handleSettingsChange}
      />

      <Snackbar open={Boolean(addPlantError)} autoHideDuration={4000} onClose={() => setAddPlantError(null)}>
        <Alert severity="error" onClose={() => setAddPlantError(null)} variant="filled">
          {addPlantError}
        </Alert>
      </Snackbar>
    </div>
  );
}
