"use client";

import { GardenEditor } from "@/widgets/garden-editor";
import type { GardenDoc } from "@/widgets/garden-editor/model/useHistory";
import { useMediaQuery } from "@mui/material";
import { useTranslations } from "next-intl";
import styles from "./PlanClient.module.scss";

interface PlanClientProps {
  userId: string;
  initialDoc: GardenDoc;
}

// The canvas needs real screen space and precise pointer control, so it
// stays a web (>=600px, MUI's `sm`) experience - this only guards someone
// opening /plan directly on a phone (a bookmark, a rotated tablet); the
// entry point into this route is already hidden on narrow viewports at
// the source (see PlantEncyclopedia's overflow menu).
export function PlanClient({ userId, initialDoc }: PlanClientProps) {
  const t = useTranslations("Editor");
  const isWeb = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  if (!isWeb) {
    return <div className={styles.webOnlyNote}>{t("planSchemaWebOnly")}</div>;
  }

  return <GardenEditor userId={userId} initialDoc={initialDoc} />;
}
