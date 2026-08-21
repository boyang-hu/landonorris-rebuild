// lib/png.mjs — minimal zero-dependency PNG decoder/encoder + image metrics.
// Adapted from careers-kimi-rebuild/scripts/lib/png.mjs.
//
// Minimal PNG decoder/encoder — enough for Chrome's Page.captureScreenshot
// output (8-bit gray / RGB / RGBA, non-interlaced). Zero npm dependencies,
// node:zlib only.
//
// Screenshots are the only honest way to measure what a WebGL page rendered:
// reading a live WebGL canvas with drawImage returns a blank buffer unless the
// context was created with preserveDrawingBuffer, which source sites' usually
// are not. So probes capture a screenshot and measure it here.
//
// careers-kimi M7.3 lesson: Chrome encodes opaque screenshots as colorType 2
// (RGB, THREE channels) but canvas toDataURL as colorType 6 (RGBA). The decoder
// always returned the faithful channel count, yet every ad-hoc consumer indexed
// with a hardcoded *4 — which produced convincing-looking garbage geometry
// during the M5.10 diagnosis. decodePng therefore now NORMALIZES its output to
// RGBA (channels always 4, alpha 255): linear hashing stays valid and per-pixel
// indexing can no longer be silently wrong.

import zlib from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** @returns {{width:number,height:number,channels:number,data:Buffer}} */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error("not a PNG");

  let pos = 8;
  let ihdr = null;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        bitDepth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }

  if (!ihdr) throw new Error("no IHDR");
  if (ihdr.bitDepth !== 8) throw new Error(`unsupported bit depth ${ihdr.bitDepth}`);
  if (ihdr.interlace !== 0) throw new Error("interlaced PNG unsupported");
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) throw new Error(`unsupported color type ${ihdr.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = src[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[x] = v & 0xff;
    }
  }

  // normalize to RGBA so per-pixel indexing is always (y*width + x) * 4
  if (channels === 4) return { width, height, channels: 4, data: out };
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0, q = 0; p < out.length; p += channels, q += 4) {
    if (channels === 3) {
      rgba[q] = out[p];
      rgba[q + 1] = out[p + 1];
      rgba[q + 2] = out[p + 2];
      rgba[q + 3] = 255;
    } else if (channels === 1) {
      rgba[q] = rgba[q + 1] = rgba[q + 2] = out[p];
      rgba[q + 3] = 255;
    } else {
      rgba[q] = rgba[q + 1] = rgba[q + 2] = out[p];
      rgba[q + 3] = out[p + 1];
    }
  }
  return { width, height, channels: 4, data: rgba };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, body])));
  return Buffer.concat([len, typeBuf, body, crc]);
}

/** Encode an RGBA buffer as a non-interlaced 8-bit PNG (filter 0 rows). */
export function encodePng(width, height, rgba) {
  if (rgba.length !== width * height * 4) {
    throw new Error(`buffer size ${rgba.length} != ${width}x${height}x4`);
  }
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Summary statistics used to tell "the scene rendered" from "the page is blank".
 * distinctColors is counted on a 4-bit-per-channel quantization so that noise
 * and dithering do not inflate it.
 */
export function imageStats(png) {
  const { width, height, channels, data } = png;
  const seen = new Set();
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = channels >= 3 ? data[i + 1] : r;
    const b = channels >= 3 ? data[i + 2] : r;
    seen.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    n += 1;
  }
  return {
    width,
    height,
    distinctColors: seen.size,
    meanLuma: +(sum / n).toFixed(2),
  };
}

/**
 * Mean absolute per-pixel difference between two same-size images, plus the
 * worst grid cell (default 64x40 grid). Used for side-by-side source-vs-rebuild
 * comparison.
 */
export function compare(a, b, cols = 64, rows = 40) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`size mismatch: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  }
  const cell = new Float64Array(cols * rows);
  const count = new Float64Array(cols * rows);
  let total = 0;
  let n = 0;

  for (let y = 0; y < a.height; y += 1) {
    for (let x = 0; x < a.width; x += 1) {
      const ia = (y * a.width + x) * a.channels;
      const ib = (y * b.width + x) * b.channels;
      const d =
        (Math.abs(a.data[ia] - b.data[ib]) +
          Math.abs(a.data[ia + 1] - b.data[ib + 1]) +
          Math.abs(a.data[ia + 2] - b.data[ib + 2])) /
        3;
      total += d;
      n += 1;
      const ci = Math.min(rows - 1, Math.floor((y / a.height) * rows)) * cols +
        Math.min(cols - 1, Math.floor((x / a.width) * cols));
      cell[ci] += d;
      count[ci] += 1;
    }
  }

  let worst = 0;
  let worstAt = [0, 0];
  for (let i = 0; i < cell.length; i += 1) {
    const v = count[i] ? cell[i] / count[i] : 0;
    if (v > worst) {
      worst = v;
      worstAt = [i % cols, Math.floor(i / cols)];
    }
  }

  const mean = total / n;
  return {
    meanAbsDiff: +mean.toFixed(2),
    worstCellDiff: +worst.toFixed(1),
    worstCell: worstAt,
    similarityPct: +(100 - mean / 2.55).toFixed(1),
  };
}
