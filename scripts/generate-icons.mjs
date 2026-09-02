/**
 * Genera los PNG de la PWA a partir de los SVG en public/icons/.
 *   node scripts/generate-icons.mjs   (o: npm run icons)
 *
 * Requiere `sharp` (ya esta en devDependencies).
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const iconsDir = fileURLToPath(new URL("../public/icons/", import.meta.url));

const jobs = [
  { src: "icon.svg", out: "icon-192.png", size: 192 },
  { src: "icon.svg", out: "icon-512.png", size: 512 },
  { src: "icon.svg", out: "apple-touch-icon.png", size: 180, bg: "#16a34a" },
  { src: "maskable.svg", out: "maskable-512.png", size: 512 },
  { src: "icon.svg", out: "../favicon.ico", size: 48 },
];

for (const job of jobs) {
  const svg = await readFile(iconsDir + job.src);
  const buf = await sharp(svg, { density: 384 })
    .resize(job.size, job.size, {
      fit: "contain",
      background: job.bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await writeFile(iconsDir + job.out, buf);
  console.log("✓", job.out);
}
