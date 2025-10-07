// Generic memory deck builder for Vite/React
// - Loads assets from one or more folders (globs)
// - Creates color placeholders for missing pairs
// - Duplicates cards into pairs and shuffles

export type DeckCard = {
  id: string;          // unique card id
  pairId: string;      // same id for both cards of a pair
  img: string;         // URL (vite asset or data: URI)
  label: string;       // a11y / tooltip
  isPlaceholder: boolean;
};

export type BuildDeckOptions = {
  desiredPairs: number;               // e.g., 20
  buckets?: (keyof typeof ASSET_GLOBS)[]; // which folders to use
  labelOverrides?: Record<string, string>;
  placeholderLabel?: string;          // default: "Coming soon"
  placeholderColors?: string[];       // custom palette if you want
};

// 1) Declare all the folders ("buckets") you may want to use.
//    Add more lines when you create new categories.
//    (Vite requires string literals here.)
const ASSET_GLOBS = {
  // Shields you already have
  blason: import.meta.glob(
    "/src/assets/images/blason/**/*",
    { eager: true }
  ) as Record<string, { default: string }>,

  // Examples you can add later:
  castles: {} as Record<string, { default: string }>, // import.meta.glob("/src/assets/images/castles/*.{png,jpg,webp,svg}", { eager: true })
  foods: {} as Record<string, { default: string }>,   // import.meta.glob("/src/assets/images/foods/*.{png,jpg,webp,svg}", { eager: true })
};

const DEFAULT_PLACEHOLDER_COLORS = [
  "#FDE68A","#A7F3D0","#BFDBFE","#FBCFE8","#FCA5A5","#C7D2FE",
  "#FCD34D","#BBF7D0","#BAE6FD","#F5D0FE","#FDBA74","#A5B4FC",
  "#86EFAC","#93C5FD","#F9A8D4","#FDE68A","#A7F3D0","#BFDBFE",
  "#FBCFE8","#FCA5A5",
];

function labelFromFilename(filename: string): string {
  return filename
    .replace(/\.(svg\.png|png|jpe?g|webp|svg)$/i, "")
    .replace(/^blason[-_]?/i, "")
    .replace(/^blason_/i, "")
    .replace(/^Blason[-_]?/i, "")
    .replace(/[_()-]/g, " ")
    .replace(/\s+fr\s+/i, " ")
    .replace(/\s+ville\s+.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeSquarePlaceholder(label: string, color: string): string {
  const size = 512;
  const fg = "#111827";
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="100%" height="100%" rx="24" ry="24" fill="${color}"/>
      <text x="50%" y="54%" text-anchor="middle" font-family="system-ui, sans-serif"
            font-size="44" fill="${fg}" opacity="0.7">${label}</text>
    </svg>`
  );
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

function collectAssets(
  buckets: (keyof typeof ASSET_GLOBS)[],
  labelOverrides: Record<string, string>
) {
  const entries: { url: string; filename: string; label: string }[] = [];

  for (const b of buckets) {
    const mods = ASSET_GLOBS[b];
    for (const [path, mod] of Object.entries(mods)) {
      if (!/\.(png|jpe?g|webp|svg)(\.png)?$/i.test(path)) continue;
      const filename = path.split("/").pop() || "";
      const label = labelOverrides[filename] ?? labelFromFilename(filename);
      entries.push({ url: mod.default, filename, label });
    }
  }

  return entries;
}

/**
 * Build a shuffled memory deck from the selected buckets, filling with placeholders if needed.
 */
export function buildMemoryDeck(options: BuildDeckOptions): DeckCard[] {
  const {
    desiredPairs,
    buckets = ["blason"],
    labelOverrides = {},
    placeholderLabel = "Coming soon",
    placeholderColors = DEFAULT_PLACEHOLDER_COLORS,
  } = options;

  const assets = collectAssets(buckets, labelOverrides);

  // Take as many real items as possible
  const real = assets.slice(0, desiredPairs);

  // Fill missing pairs with placeholders
  const missing = Math.max(0, desiredPairs - real.length);
  const placeholders = Array.from({ length: missing }, (_, i) => {
    const color = placeholderColors[i % placeholderColors.length];
    return {
      url: makeSquarePlaceholder(`${placeholderLabel} ${i + 1}`, color),
      filename: `placeholder-${i + 1}.svg`,
      label: `${placeholderLabel} ${i + 1}`,
    };
  });

  const sources = [...real, ...placeholders];

  // Duplicate into cards (A & B) and shuffle (Fisher–Yates)
  const cards: DeckCard[] = sources.flatMap((s, idx) => {
    const pairId = `pair-${idx}`;
    const base: Omit<DeckCard, "id"> = {
      pairId,
      img: s.url,
      label: s.label,
      isPlaceholder: s.filename.startsWith("placeholder"),
    };
    return [
      { id: `${pairId}-a`, ...base },
      { id: `${pairId}-b`, ...base },
    ];
  });

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}
