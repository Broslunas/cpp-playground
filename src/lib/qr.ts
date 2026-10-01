/**
 * Generador QR SVG autónomo (ISO/IEC 18004) basado en la implementación estándar
 * de referencia de Kazuhiko Arase (BSD). Soporta Modo Byte, corrección de errores M
 * y versiones 1 a 10 (hasta 213 bytes, ideal para otpauth://).
 */

interface BlockGroup {
  numBlocks: number;
  dataCodewords: number;
}

interface VersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  groups: BlockGroup[];
  alignCoords: number[];
}

const VERSIONS: VersionSpec[] = [
  { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 10, groups: [{ numBlocks: 1, dataCodewords: 16 }], alignCoords: [] },
  { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 16, groups: [{ numBlocks: 1, dataCodewords: 28 }], alignCoords: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 26, groups: [{ numBlocks: 1, dataCodewords: 44 }], alignCoords: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 18, groups: [{ numBlocks: 2, dataCodewords: 32 }], alignCoords: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 24, groups: [{ numBlocks: 2, dataCodewords: 43 }], alignCoords: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 16, groups: [{ numBlocks: 4, dataCodewords: 27 }], alignCoords: [6, 34] },
  { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 18, groups: [{ numBlocks: 4, dataCodewords: 31 }], alignCoords: [6, 22, 38] },
  { version: 8, totalCodewords: 242, ecCodewordsPerBlock: 22, groups: [{ numBlocks: 2, dataCodewords: 38 }, { numBlocks: 2, dataCodewords: 39 }], alignCoords: [6, 24, 42] },
  { version: 9, totalCodewords: 292, ecCodewordsPerBlock: 22, groups: [{ numBlocks: 3, dataCodewords: 36 }, { numBlocks: 2, dataCodewords: 37 }], alignCoords: [6, 26, 46] },
  { version: 10, totalCodewords: 346, ecCodewordsPerBlock: 26, groups: [{ numBlocks: 4, dataCodewords: 43 }, { numBlocks: 1, dataCodewords: 44 }], alignCoords: [6, 28, 50] },
];

// Galois Field GF(256) con polinomio primitivo 0x11D
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
for (let i = 0; i < 8; i++) EXP[i] = 1 << i;
for (let i = 8; i < 256; i++) EXP[i] = EXP[i - 4] ^ EXP[i - 5] ^ EXP[i - 6] ^ EXP[i - 8];
for (let i = 0; i < 255; i++) LOG[EXP[i]] = i;

function gfMul(x: number, y: number): number {
  return x === 0 || y === 0 ? 0 : EXP[(LOG[x] + LOG[y]) % 255];
}

function rsMultiply(p1: number[], p2: number[]): number[] {
  const num = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      num[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return num;
}

function rsGenPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = rsMultiply(poly, [1, EXP[i]]);
  }
  return poly;
}

function rsCalculateRemainder(data: number[], ecCount: number): number[] {
  const gen = rsGenPoly(ecCount);
  const poly = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) poly[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const lead = poly[i];
    if (lead !== 0) {
      const logLead = LOG[lead];
      for (let j = 0; j < gen.length; j++) {
        if (gen[j] !== 0) {
          poly[i + j] ^= EXP[(LOG[gen[j]] + logLead) % 255];
        }
      }
    }
  }
  return poly.slice(data.length);
}

const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);

function getBCHDigit(data: number): number {
  let digit = 0;
  while (data !== 0) {
    digit++;
    data >>>= 1;
  }
  return digit;
}

function getBCHTypeInfo(data: number): number {
  let d = data << 10;
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= G15 << (getBCHDigit(d) - getBCHDigit(G15));
  }
  return ((data << 10) | d) ^ G15_MASK;
}

function getBCHTypeNumber(data: number): number {
  let d = data << 12;
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= G18 << (getBCHDigit(d) - getBCHDigit(G18));
  }
  return (data << 12) | d;
}

function getMaskFn(mask: number): (r: number, c: number) => boolean {
  switch (mask) {
    case 0: return (r, c) => (r + c) % 2 === 0;
    case 1: return (r) => r % 2 === 0;
    case 2: return (_, c) => c % 3 === 0;
    case 3: return (r, c) => (r + c) % 3 === 0;
    case 4: return (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return () => false;
  }
}

function setupFinder(matrix: (boolean | null)[][], row: number, col: number) {
  const size = matrix.length;
  for (let r = -1; r <= 7; r++) {
    if (row + r <= -1 || size <= row + r) continue;
    for (let c = -1; c <= 7; c++) {
      if (col + c <= -1 || size <= col + c) continue;
      if (
        (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
        (2 <= r && r <= 4 && 2 <= c && c <= 4)
      ) {
        matrix[row + r][col + c] = true;
      } else {
        matrix[row + r][col + c] = false;
      }
    }
  }
}

function setupAlignment(matrix: (boolean | null)[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (
        r === -2 || r === 2 ||
        c === -2 || c === 2 ||
        (r === 0 && c === 0)
      ) {
        matrix[row + r][col + c] = true;
      } else {
        matrix[row + r][col + c] = false;
      }
    }
  }
}

function setupTypeInfo(matrix: boolean[][], maskPattern: number) {
  // Nivel M = 00
  const data = (0 << 3) | maskPattern;
  const bits = getBCHTypeInfo(data);
  const size = matrix.length;

  for (let i = 0; i < 15; i++) {
    const mod = ((bits >> i) & 1) === 1;

    // Vertical
    if (i < 6) {
      matrix[i][8] = mod;
    } else if (i < 8) {
      matrix[i + 1][8] = mod;
    } else {
      matrix[size - 15 + i][8] = mod;
    }

    // Horizontal
    if (i < 8) {
      matrix[8][size - i - 1] = mod;
    } else if (i < 9) {
      matrix[8][15 - i - 1 + 1] = mod;
    } else {
      matrix[8][15 - i - 1] = mod;
    }
  }

  // Módulo oscuro fijo
  matrix[size - 8][8] = true;
}

function setupTypeNumber(matrix: boolean[][], version: number) {
  if (version < 7) return;
  const bits = getBCHTypeNumber(version);
  const size = matrix.length;
  for (let i = 0; i < 18; i++) {
    const mod = ((bits >> i) & 1) === 1;
    matrix[Math.floor(i / 3)][(i % 3) + size - 8 - 3] = mod;
    matrix[(i % 3) + size - 8 - 3][Math.floor(i / 3)] = mod;
  }
}

function calculateLostPoints(matrix: boolean[][]): number {
  const size = matrix.length;
  let points = 0;

  // Regla 1: 5 módulos o más consecutivos del mismo color
  for (let r = 0; r < size; r++) {
    let same = 0;
    for (let c = 0; c < size; c++) {
      if (c > 0 && matrix[r][c] === matrix[r][c - 1]) same++;
      else {
        if (same >= 5) points += 3 + (same - 5);
        same = 1;
      }
    }
    if (same >= 5) points += 3 + (same - 5);
  }

  for (let c = 0; c < size; c++) {
    let same = 0;
    for (let r = 0; r < size; r++) {
      if (r > 0 && matrix[r][c] === matrix[r - 1][c]) same++;
      else {
        if (same >= 5) points += 3 + (same - 5);
        same = 1;
      }
    }
    if (same >= 5) points += 3 + (same - 5);
  }

  // Regla 2: Bloques 2x2
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = matrix[r][c];
      if (
        matrix[r + 1][c] === color &&
        matrix[r][c + 1] === color &&
        matrix[r + 1][c + 1] === color
      ) {
        points += 3;
      }
    }
  }

  return points;
}

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const rawBytes = Array.from(encoder.encode(text));

  // Elegir la versión más compacta adecuada
  let spec: VersionSpec | null = null;
  for (const s of VERSIONS) {
    let totalData = 0;
    for (const g of s.groups) totalData += g.numBlocks * g.dataCodewords;
    const headerBits = 4 + (s.version < 10 ? 8 : 16);
    const capacityBytes = Math.floor((totalData * 8 - headerBits) / 8);
    if (rawBytes.length <= capacityBytes) {
      spec = s;
      break;
    }
  }

  if (!spec) {
    throw new Error(`Texto demasiado largo para el generador QR integrado (${rawBytes.length} bytes)`);
  }

  let totalDataCodewords = 0;
  for (const g of spec.groups) totalDataCodewords += g.numBlocks * g.dataCodewords;
  const capacityBits = totalDataCodewords * 8;

  // Codificación Byte Mode (0b0100)
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4);
  pushBits(rawBytes.length, spec.version < 10 ? 8 : 16);
  for (const b of rawBytes) pushBits(b, 8);

  // Terminador
  const remaining = capacityBits - bits.length;
  pushBits(0, Math.min(4, remaining));

  // Relleno a octeto
  while (bits.length % 8 !== 0) bits.push(0);

  // Bytes de relleno alternados
  const pad = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < capacityBits) {
    pushBits(pad[padIdx % 2], 8);
    padIdx++;
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < totalDataCodewords; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    dataCodewords.push(b);
  }

  // Segmentación en bloques
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (const g of spec.groups) {
    for (let b = 0; b < g.numBlocks; b++) {
      const block = dataCodewords.slice(offset, offset + g.dataCodewords);
      dataBlocks.push(block);
      ecBlocks.push(rsCalculateRemainder(block, spec.ecCodewordsPerBlock));
      offset += g.dataCodewords;
    }
  }

  // Intercalación de datos y de corrección de errores
  const finalCodewords: number[] = [];
  let maxDataLen = 0;
  for (const db of dataBlocks) if (db.length > maxDataLen) maxDataLen = db.length;

  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (i < dataBlocks[b].length) finalCodewords.push(dataBlocks[b][i]);
    }
  }

  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  const totalBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let b = 7; b >= 0; b--) totalBits.push((cw >> b) & 1);
  }

  const size = spec.version * 4 + 17;

  // Probar las 8 máscaras para seleccionar la óptima
  let minPenalty = Infinity;
  let bestMatrix: boolean[][] = [];

  for (let mask = 0; mask < 8; mask++) {
    const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

    // 1. Patrones de búsqueda (Finders + Separadores)
    setupFinder(matrix, 0, 0);
    setupFinder(matrix, size - 7, 0);
    setupFinder(matrix, 0, size - 7);

    // 2. Patrones de alineación
    for (const r of spec.alignCoords) {
      for (const c of spec.alignCoords) {
        if (matrix[r][c] !== null) continue;
        setupAlignment(matrix, r, c);
      }
    }

    // 3. Patrones de temporización
    for (let r = 8; r < size - 8; r++) {
      if (matrix[r][6] === null) matrix[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < size - 8; c++) {
      if (matrix[6][c] === null) matrix[6][c] = c % 2 === 0;
    }

    // 4. Reservar áreas de formato y versión
    // (Fijadas para que el zigzag de datos no las sobrescriba)
    for (let i = 0; i < 9; i++) {
      if (matrix[8][i] === null) matrix[8][i] = false;
      if (matrix[i][8] === null) matrix[i][8] = false;
    }
    for (let i = size - 8; i < size; i++) {
      if (matrix[8][i] === null) matrix[8][i] = false;
      if (matrix[i][8] === null) matrix[i][8] = false;
    }
    matrix[size - 8][8] = true; // Módulo oscuro

    if (spec.version >= 7) {
      for (let r = 0; r < 6; r++) {
        for (let c = size - 11; c < size - 8; c++) matrix[r][c] = false;
      }
      for (let r = size - 11; r < size - 8; r++) {
        for (let c = 0; c < 6; c++) matrix[r][c] = false;
      }
    }

    // 5. Colocar bits de datos con la máscara aplicada
    const maskFn = getMaskFn(mask);
    let bitIndex = 0;
    let inc = -1;
    let row = size - 1;

    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;

      while (true) {
        for (let c = 0; c < 2; c++) {
          const colIdx = col - c;
          if (matrix[row][colIdx] === null) {
            let dark = false;
            if (bitIndex < totalBits.length) {
              dark = totalBits[bitIndex++] === 1;
            }
            if (maskFn(row, colIdx)) {
              dark = !dark;
            }
            matrix[row][colIdx] = dark;
          }
        }

        row += inc;
        if (row < 0 || size <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }

    const candidate = matrix as boolean[][];

    // 6. Escribir información de formato y versión definitiva
    setupTypeInfo(candidate, mask);
    setupTypeNumber(candidate, spec.version);

    // 7. Evaluar penalización
    const penalty = calculateLostPoints(candidate);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMatrix = candidate;
    }
  }

  return bestMatrix;
}

export function generateQrSvgPath(matrix: boolean[][], border = 4): { path: string; size: number } {
  const size = matrix.length;
  let d = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        d += `M${c + border},${r + border}h1v1h-1z`;
      }
    }
  }
  return { path: d, size: size + border * 2 };
}
