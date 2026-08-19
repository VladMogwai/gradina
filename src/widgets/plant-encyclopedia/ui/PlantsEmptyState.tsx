import { Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import styles from "../styles/PlantsEmptyState.module.scss";

// STUB - intentionally plain, pending its own design pass.
// Shown only when the garden has no plants at all; a search that matches
// nothing keeps the compact inline message instead.
export function PlantsEmptyState() {
  const t = useTranslations("Editor");

  return (
    <div className={styles.root}>
      <Typography variant="body2" className={styles.text}>
        {t("noPlantsYet")}
      </Typography>
    </div>
  );
}
