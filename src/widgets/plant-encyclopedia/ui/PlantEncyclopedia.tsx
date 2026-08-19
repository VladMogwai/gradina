"use client";

import { addPlantPhoto, backfillPhotoPlaceholder, type Plant } from "@/entities/plant";
import { useSignOut } from "@/features/auth";
import { LanguageSwitcher } from "@/features/locale-switch";
import { createClient } from "@/shared/api/supabase/client";
import { AddPlantControl } from "@/widgets/garden-editor/ui/AddPlantControl";
import { PropertiesPanel } from "@/widgets/garden-editor/ui/PropertiesPanel";
import type { Selection } from "@/widgets/garden-editor/model/types";
import { useAutoSaveGardenPlan } from "@/widgets/garden-editor/model/useAutoSaveGardenPlan";
import { usePlantActions } from "@/widgets/garden-editor/model/usePlantActions";
import type { GardenDoc } from "@/widgets/garden-editor/model/useHistory";
import LogoutIcon from "@mui/icons-material/Logout";
import MapIcon from "@mui/icons-material/Map";
import SearchIcon from "@mui/icons-material/Search";
import Masonry from "@mui/lab/Masonry";
import {
  Alert,
  AppBar,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Toolbar as MuiToolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlantTile } from "./PlantTile";
import { PlantsEmptyState } from "./PlantsEmptyState";
import styles from "../styles/PlantEncyclopedia.module.scss";

interface PlantEncyclopediaProps {
  userId: string;
  initialDoc: GardenDoc;
}

// idle shows nothing - only surface the chip when there's something to say.
const SAVE_STATUS_KEYS: Partial<Record<string, string>> = {
  saving: "saving",
  saved: "saved",
  error: "saveError",
};

// No undo stack here (unlike the canvas's useHistory) - this is a browsing
// + light-edit view, not a spatial drag-editor, so commit/replacePresent
// both just update the local doc directly.
export function PlantEncyclopedia({ userId, initialDoc }: PlantEncyclopediaProps) {
  const t = useTranslations("Editor");
  const tAuth = useTranslations("Auth");
  const [doc, setDoc] = useState<GardenDoc>(initialDoc);
  const { grid, plants, zones } = doc;
  const { status: saveStatus, saveNow } = useAutoSaveGardenPlan(doc);
  const supabaseRef = useRef(createClient());

  const [query, setQuery] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [creatingPlant, setCreatingPlant] = useState(false);
  const [addPlantError, setAddPlantError] = useState<string | null>(null);
  const isWeb = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  // false on the server and on the first client render (so hydration
  // matches), flipped once we're client-side and Masonry can measure.
  const [measured, setMeasured] = useState(false);
  useEffect(() => setMeasured(true), []);

  // One-time repair for photos uploaded before the placeholder column
  // existed: without a hash they have no blur and no real aspect ratio, so
  // the masonry grid renders them all at the same fallback shape. Done one
  // at a time so a large library doesn't fire a burst of image downloads,
  // and guarded by a ref so it never re-runs as state updates.
  const docRef = useRef(doc);
  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  const backfilledRef = useRef(false);
  useEffect(() => {
    if (backfilledRef.current) return;
    const missing = docRef.current.plants.flatMap((p) =>
      p.photos
        .filter((ph) => !ph.placeholder)
        .map((ph) => ({ plantId: p.id, photo: ph })),
    );
    if (missing.length === 0) return;
    backfilledRef.current = true;

    let cancelled = false;
    (async () => {
      for (const { plantId, photo } of missing) {
        const placeholder = await backfillPhotoPlaceholder(supabaseRef.current, photo);
        if (cancelled) return;
        if (!placeholder) continue;
        setDoc((d) => ({
          ...d,
          plants: d.plants.map((p) =>
            p.id === plantId
              ? {
                  ...p,
                  photos: p.photos.map((ph) =>
                    ph.id === photo.id ? { ...ph, placeholder } : ph,
                  ),
                }
              : p,
          ),
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount, reading plants through a ref. Depending on
    // doc.plants would be self-defeating: each repaired photo calls setDoc,
    // which would re-fire this effect, run its cleanup, and cancel the loop
    // still walking the remaining photos - so only the first one ever got
    // repaired.
  }, []);

  const commit = useCallback(
    (updater: (d: GardenDoc) => GardenDoc) => setDoc(updater),
    [],
  );
  const setSelection = useCallback((s: Selection) => {
    setSelectedPlantId(s?.kind === "plant" ? s.id : null);
  }, []);

  const {
    handleAddPhoto,
    handleRemovePhoto,
    handlePlantNotesChange,
    handleAnalysisChange,
    handleDeletePlant,
    handleCreatePlant,
  } = usePlantActions({ grid, plants, commit, replacePresent: commit, setSelection });

  const signOut = useSignOut();

  const selection: Selection = selectedPlantId
    ? { kind: "plant", id: selectedPlantId }
    : null;
  const filtered = plants
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  // Mirrors GardenEditor's handleCreatePlantFromPhoto (see that file for
  // the full race-condition rationale) - duplicated rather than shared, to
  // avoid touching the canvas to extract a hook for one caller each.
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
        const photo = await addPlantPhoto(
          supabaseRef.current,
          userId,
          newPlant.id,
          file,
          0,
        );
        handleAddPhoto(newPlant.id, photo);
      } catch (e) {
        // Surfacing the underlying message, not just the friendly line:
        // this path has failed twice now for reasons invisible from the
        // outside (a secure-context-only API, then RLS), and a generic
        // "try again" gives nothing to act on. Worth trimming back to the
        // plain message once this is settled.
        const detail = e instanceof Error ? e.message : String(e);
        setAddPlantError(`${t("addPlantFailed")} [${detail}]`);
      } finally {
        setCreatingPlant(false);
      }
    },
    [doc, handleCreatePlant, saveNow, handleAddPhoto, userId, t],
  );

  return (
    <div className={styles.root}>
      <AppBar position="static" color="default" elevation={1} className={styles.appBar}>
        <MuiToolbar variant="dense" className={styles.inner}>
          <Typography variant="subtitle1" noWrap className={styles.title}>
            {/* {t("plants")} */}
          </Typography>
          {SAVE_STATUS_KEYS[saveStatus] && (
            <Chip
              size="small"
              label={t(SAVE_STATUS_KEYS[saveStatus])}
              color={saveStatus === "error" ? "error" : "default"}
              className={styles.statusChip}
            />
          )}
          <LanguageSwitcher />

          {/* Kept in the bar rather than dropped with the menu: the canvas
              has no other entry point, so removing this would strand it. */}
          {isWeb && (
            <IconButton
              component={Link}
              href="/plan"
              title={t("planSchema")}
              aria-label={t("planSchema")}
            >
              <MapIcon />
            </IconButton>
          )}

          <IconButton
            onClick={signOut}
            title={tAuth("signOut")}
            aria-label={tAuth("signOut")}
          >
            <LogoutIcon />
          </IconButton>
        </MuiToolbar>
        <div className={styles.searchRow}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlantsPlaceholder")}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              // Chrome/GBoard on Android injects a __gcruniqueid attribute
              // into text inputs on the page before React hydrates - a
              // real mismatch, but a benign one (React's own hydration
              // docs list "browser extension...before React loaded" as an
              // expected, harmless cause). This is the only input exposed
              // on first paint of "/" - everything else (notes, hardiness
              // zone, zone label) lives inside a drawer/dialog that mounts
              // after hydration, so it never hits this check.
              htmlInput: { suppressHydrationWarning: true },
            }}
          />
        </div>
      </AppBar>

      {/* Replaces the list rather than sitting inside it: as a flex item
          with flex:1 this fills exactly the space between the header and
          the bottom of the screen, so the spinner lands in the real centre
          without hard-coding any header height. */}
      {plants.length > 0 && filtered.length > 0 && !measured ? (
        <div className={styles.loadingWrap}>
          <CircularProgress aria-label={t("loading")} />
        </div>
      ) : (
      <div className={styles.list}>
        {plants.length === 0 ? (
          <PlantsEmptyState />
        ) : filtered.length === 0 ? (
          <p className={styles.emptyText}>{t("noMatches")}</p>
        ) : (
          <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 5 }} spacing={1.5} sequential>
            {filtered.map((plant, i) => (
              <PlantTile
                key={plant.id}
                plant={plant}
                onOpen={setSelectedPlantId}
                priority={i < 4}
              />
            ))}
          </Masonry>
        )}
        </div>
      )}

      <AddPlantControl onFileSelected={handleCreatePlantFromPhoto} busy={creatingPlant} />

      <PropertiesPanel
        userId={userId}
        selection={selection}
        plants={plants}
        zones={zones}
        gardenSettings={doc.settings}
        uploadingPhotoFor={creatingPlant ? selectedPlantId : null}
        onClose={() => setSelectedPlantId(null)}
        onDeletePlant={handleDeletePlant}
        onSaveNow={saveNow}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
        onPlantNotesChange={handlePlantNotesChange}
        onAnalysisChange={handleAnalysisChange}
        onZoneLabelChange={() => {}}
        onZoneColorChange={() => {}}
        onZoneNotesChange={() => {}}
        onDeleteZone={() => {}}
      />

      {/* No auto-hide: the message now carries the underlying error, and a
          4s dismiss made it easy to miss on a phone. Closed by tapping it. */}
      <Snackbar open={Boolean(addPlantError)} onClose={() => setAddPlantError(null)}>
        <Alert severity="error" onClose={() => setAddPlantError(null)} variant="filled">
          {addPlantError}
        </Alert>
      </Snackbar>
    </div>
  );
}
