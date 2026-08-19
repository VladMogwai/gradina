import {
  ConfidenceBadge,
  PlantPhotoImage,
  aspectRatioFor,
  fallbackColorFor,
  type Plant,
} from "@/entities/plant";
import { CardActionArea } from "@mui/material";
import styles from "../styles/PlantTile.module.scss";

interface PlantTileProps {
  plant: Plant;
  onOpen: (id: string) => void;
  /** Set for the first row or so - they're above the fold. */
  priority?: boolean;
}

// One masonry cell: the photo is the tile, with the name laid over it.
// Everything else about the plant (description, care, tags) lives in the
// detail sheet this opens.
export function PlantTile({ plant, onOpen, priority = false }: PlantTileProps) {
  const photo = plant.photos[0] ?? null;
  const species = plant.species;
  const color = plant.color ?? fallbackColorFor(species?.scientificName ?? plant.name);
  // Reserving the real height up front is what keeps the masonry layout
  // from reshuffling as photos stream in.
  const aspectRatio = photo ? aspectRatioFor(photo.placeholder) : 1;
  const confidence =
    species && plant.identificationConfidence ? plant.identificationConfidence : null;

  return (
    <CardActionArea onClick={() => onOpen(plant.id)} className={styles.tile}>
      <div className={styles.media} style={{ aspectRatio }}>
        {photo ? (
          <PlantPhotoImage
            src={photo.url}
            alt={plant.name}
            placeholder={photo.placeholder}
            priority={priority}
            // Two columns on phones, narrowing as the column count grows.
            sizes="(min-width: 1200px) 20vw, (min-width: 900px) 25vw, (min-width: 600px) 33vw, 50vw"
          />
        ) : (
          <div
            className={styles.noPhoto}
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          />
        )}

        {/* {confidence && <ConfidenceBadge confidence={confidence} className={styles.confidence} />} */}

        <div className={styles.nameBar}>
          <span className={styles.name}>{plant.name}</span>
        </div>
      </div>
    </CardActionArea>
  );
}
