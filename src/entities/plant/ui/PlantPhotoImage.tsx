"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { thumbHashToDataURL } from "thumbhash";
import styles from "../styles/PlantPhotoImage.module.scss";

interface PlantPhotoImageProps {
  src: string;
  alt: string;
  /** Matches the container's real rendered width - see each call site. */
  sizes: string;
  /** Above-the-fold images load eagerly; everything else stays lazy. */
  priority?: boolean;
  /**
   * Applied inline rather than via a class: callers also pass their own
   * className, and two same-specificity CSS-module classes would resolve
   * by stylesheet order (non-deterministic). The canvas tile needs
   * "contain" - see PlantObject.
   */
  objectFit?: "cover" | "contain";
  className?: string;
}

// Decodes the stored base64 thumbhash into the data URL next/image wants.
// Bad/legacy values degrade to no blur rather than throwing.
function useBlurDataUrl(placeholder: string | null | undefined): string | null {
  return useMemo(() => {
    if (!placeholder) return null;
    try {
      const bytes = Uint8Array.from(atob(placeholder), (c) => c.charCodeAt(0));
      return thumbHashToDataURL(bytes);
    } catch {
      return null;
    }
  }, [placeholder]);
}

// One wrapper for every plant photo in the app. Always `fill`, so callers
// own the aspect ratio via a positioned container - a photo can never
// stretch the layout regardless of its intrinsic dimensions.
export function PlantPhotoImage({
  src,
  alt,
  sizes,
  priority = false,
  objectFit = "cover",
  placeholder,
  className,
}: PlantPhotoImageProps & { placeholder?: string | null }) {
  const [failed, setFailed] = useState(false);
  const blurDataURL = useBlurDataUrl(placeholder);

  // A URL that 404s (deleted object, stale row) renders as a neutral
  // surface rather than the browser's broken-image glyph.
  if (failed) return <div className={styles.failed} aria-label={alt} role="img" />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      style={{ objectFit }}
      className={className}
      {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
    />
  );
}
