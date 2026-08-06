/**
 * Best-guess morphing between arbitrary SVG path shapes.
 *
 * Shapes here are single paths made of several subpaths (outer silhouette plus
 * counter shapes) rendered with `fill-rule: evenodd`, and the detail levels have
 * different command counts, so neither CSS `d` interpolation nor libraries that
 * drop holes (flubber) can be used. Instead each subpath is resampled to a fixed
 * number of points by arc length, paired with the closest subpath in the target,
 * rotated to the cheapest correspondence, and interpolated point by point.
 */

const POINTS = 96;
const VIEW = 128;
/** Weight for radius mismatch relative to centroid distance when pairing. */
const RADIUS_WEIGHT = 1.2;

export type Fit = { scale: number; tx: number; ty: number };
export type Shape = { d: string; fit: Fit; subpaths: string[] };
export type Ring = { pts: Float64Array; cx: number; cy: number; radius: number };

/** Subpaths are split on absolute `M`; these assets contain no relative moves. */
function splitSubpaths(d: string): string[] {
  return d
    .split(/(?=M)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .map((part) => (/[Zz]\s*$/.test(part) ? part : `${part}Z`));
}

export function parseSvgShape(raw: string): Shape {
  const d = [...raw.matchAll(/\sd="([^"]+)"/g)]
    .map((m) => m[1]!.replace(/\s+/g, " ").trim())
    .join(" ");

  const box = (raw.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${VIEW} ${VIEW}`)
    .split(/[\s,]+/)
    .map(Number);
  const [minX = 0, minY = 0, width = VIEW, height = VIEW] = box;

  const scale = Math.min(VIEW / width, VIEW / height);
  return {
    d,
    subpaths: splitSubpaths(d),
    fit: {
      scale,
      tx: (VIEW - width * scale) / 2 - minX * scale,
      ty: (VIEW - height * scale) / 2 - minY * scale,
    },
  };
}

/** Transform that maps a shape's own coordinates into the shared 128 box. */
export function fitTransform(fit: Fit): string | undefined {
  if (fit.scale === 1 && fit.tx === 0 && fit.ty === 0) return undefined;
  return `translate(${fit.tx} ${fit.ty}) scale(${fit.scale})`;
}

let sampler: SVGPathElement | null = null;

function getSampler(): SVGPathElement {
  if (sampler) return sampler;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.visibility = "hidden";
  svg.style.pointerEvents = "none";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.appendChild(path);
  document.body.appendChild(svg);
  sampler = path;
  return path;
}

function makeRing(pts: Float64Array): Ring {
  const n = pts.length / 2;
  let twiceArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x0 = pts[i * 2]!;
    const y0 = pts[i * 2 + 1]!;
    const x1 = pts[j * 2]!;
    const y1 = pts[j * 2 + 1]!;
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  const area = twiceArea / 2;
  if (Math.abs(area) > 1e-6) {
    cx /= 6 * area;
    cy /= 6 * area;
  } else {
    cx = 0;
    cy = 0;
    for (let i = 0; i < n; i++) {
      cx += pts[i * 2]!;
      cy += pts[i * 2 + 1]!;
    }
    cx /= n;
    cy /= n;
  }

  return { pts, cx, cy, radius: Math.sqrt(Math.abs(area) / Math.PI) };
}

export function ringsFromShape(shape: Shape): Ring[] {
  const path = getSampler();
  const { scale, tx, ty } = shape.fit;
  const rings: Ring[] = [];

  for (const subpath of shape.subpaths) {
    path.setAttribute("d", subpath);
    const length = path.getTotalLength();
    if (!Number.isFinite(length) || length < 1) continue;

    const pts = new Float64Array(POINTS * 2);
    for (let i = 0; i < POINTS; i++) {
      const point = path.getPointAtLength((i / POINTS) * length);
      pts[i * 2] = point.x * scale + tx;
      pts[i * 2 + 1] = point.y * scale + ty;
    }
    rings.push(makeRing(pts));
  }

  return rings;
}

export function ringsFromPoints(list: Float64Array[]): Ring[] {
  return list.map((pts) => makeRing(pts));
}

function collapsed(ring: Ring): Float64Array {
  const pts = new Float64Array(POINTS * 2);
  for (let i = 0; i < POINTS; i++) {
    pts[i * 2] = ring.cx;
    pts[i * 2 + 1] = ring.cy;
  }
  return pts;
}

/** Rotate (and optionally reverse) `b` so its points sit closest to `a`. */
function align(a: Float64Array, b: Float64Array): Float64Array {
  let best = Infinity;
  let bestOffset = 0;
  let bestReversed = false;

  for (let dir = 0; dir < 2; dir++) {
    const reversed = dir === 1;
    for (let offset = 0; offset < POINTS; offset++) {
      let sum = 0;
      for (let i = 0; i < POINTS; i++) {
        const raw = (i + offset) % POINTS;
        const j = reversed ? POINTS - 1 - raw : raw;
        const dx = a[i * 2]! - b[j * 2]!;
        const dy = a[i * 2 + 1]! - b[j * 2 + 1]!;
        sum += dx * dx + dy * dy;
        if (sum >= best) break;
      }
      if (sum < best) {
        best = sum;
        bestOffset = offset;
        bestReversed = reversed;
      }
    }
  }

  const out = new Float64Array(POINTS * 2);
  for (let i = 0; i < POINTS; i++) {
    const raw = (i + bestOffset) % POINTS;
    const j = bestReversed ? POINTS - 1 - raw : raw;
    out[i * 2] = b[j * 2]!;
    out[i * 2 + 1] = b[j * 2 + 1]!;
  }
  return out;
}

type Pair = { from: Float64Array; to: Float64Array };

/**
 * Pairs subpaths greedily by centroid distance and size, so the silhouette maps
 * to the silhouette. Leftover subpaths grow out of / shrink into their centroid.
 */
function pairRings(from: Ring[], to: Ring[]): Pair[] {
  const costs: { i: number; j: number; cost: number }[] = [];
  for (let i = 0; i < from.length; i++) {
    for (let j = 0; j < to.length; j++) {
      const a = from[i]!;
      const b = to[j]!;
      costs.push({
        i,
        j,
        cost:
          Math.hypot(a.cx - b.cx, a.cy - b.cy) +
          RADIUS_WEIGHT * Math.abs(a.radius - b.radius),
      });
    }
  }
  costs.sort((x, y) => x.cost - y.cost);

  const usedFrom = new Set<number>();
  const usedTo = new Set<number>();
  const pairs: Pair[] = [];

  for (const { i, j } of costs) {
    if (usedFrom.has(i) || usedTo.has(j)) continue;
    usedFrom.add(i);
    usedTo.add(j);
    pairs.push({ from: from[i]!.pts, to: align(from[i]!.pts, to[j]!.pts) });
  }

  from.forEach((ring, i) => {
    if (!usedFrom.has(i)) pairs.push({ from: ring.pts, to: collapsed(ring) });
  });
  to.forEach((ring, j) => {
    if (!usedTo.has(j)) pairs.push({ from: collapsed(ring), to: ring.pts });
  });

  return pairs;
}

export type Morph = (t: number) => Float64Array[];

export function createMorph(from: Ring[], to: Ring[]): Morph {
  const pairs = pairRings(from, to);
  const buffers = pairs.map(() => new Float64Array(POINTS * 2));

  return (t: number) => {
    for (let p = 0; p < pairs.length; p++) {
      const { from: a, to: b } = pairs[p]!;
      const out = buffers[p]!;
      for (let i = 0; i < POINTS * 2; i++) {
        out[i] = a[i]! + (b[i]! - a[i]!) * t;
      }
    }
    return buffers;
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

export function ringsToPathD(rings: Float64Array[]): string {
  let d = "";
  for (const pts of rings) {
    d += `M${round(pts[0]!)} ${round(pts[1]!)}`;
    for (let i = 1; i < POINTS; i++) {
      d += `L${round(pts[i * 2]!)} ${round(pts[i * 2 + 1]!)}`;
    }
    d += "Z";
  }
  return d;
}
