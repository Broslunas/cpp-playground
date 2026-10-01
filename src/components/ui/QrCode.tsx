"use client";

import { useMemo } from "react";
import { generateQrMatrix, generateQrSvgPath } from "@/lib/qr";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 192, className = "" }: QrCodeProps) {
  const qr = useMemo(() => {
    try {
      const matrix = generateQrMatrix(value);
      return generateQrSvgPath(matrix);
    } catch {
      return null;
    }
  }, [value]);

  if (!qr) return null;

  return (
    <svg
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`rounded-xl bg-white p-2.5 shadow-md ${className}`}
      role="img"
      aria-label="Código QR de autenticación"
    >
      <path d={qr.path} fill="#000000" />
    </svg>
  );
}
