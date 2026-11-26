"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

export function StationFavicon({
  src,
  alt = "",
  size = 40,
  className = "h-full w-full object-cover",
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset fallback when src changes
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <Radio size={size} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
