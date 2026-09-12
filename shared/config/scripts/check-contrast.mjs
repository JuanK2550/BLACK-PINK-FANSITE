// Comprueba que los colores del sistema cumplen el contraste AA.

const hex = (value) => {
  const h = value.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

const linearize = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

const luminance = (value) => {
  const [r, g, b] = hex(value).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

const TOKENS = {
  noir950: '#08070a',
  noir900: '#0d0b10',
  noir800: '#1a1620',
  noir500: '#524a60',
  noir400: '#6e6579',
  noir350: '#8b8299',
  noir300: '#a79fb0',
  pink400: '#ff5497',
  pink500: '#ff2e88',
  pink700: '#cc0066',
  pink800: '#a30052',
  blush100: '#ffeaf2',
  blush200: '#ffd6e6',
  blush300: '#ffc2da',
  noir600: '#3a3346',
  noir700: '#262130',
  white: '#ffffff',
  paperLight: '#fbf9fa',
  fgMutedLight: '#5b5266',
};

const T = TOKENS;

const PAIRS = [
  ['oscuro  texto principal', T.white, T.noir950, 4.5],
  ['oscuro  texto secundario', T.noir300, T.noir950, 4.5],
  ['oscuro  texto tenue', T.noir350, T.noir950, 4.5],
  ['oscuro  tenue sobre superficie', T.noir350, T.noir900, 4.5],
  ['oscuro  tenue sobre overlay', T.noir350, T.noir800, 4.5],
  ['oscuro  acento como texto', T.pink500, T.noir950, 4.5],
  ['oscuro  pastel secundario', T.blush300, T.noir950, 4.5],
  ['oscuro  boton primario', T.noir950, T.pink500, 4.5],
  ['oscuro  texto sobre superficie', T.white, T.noir900, 4.5],
  ['oscuro  secundario sobre superficie', T.noir300, T.noir900, 4.5],
  ['oscuro  texto sobre overlay', T.white, T.noir800, 4.5],
  ['oscuro  secundario sobre overlay', T.noir300, T.noir800, 4.5],
  ['oscuro  anillo de foco', T.pink400, T.noir950, 3.0],
  ['claro   texto principal', T.noir950, T.paperLight, 4.5],
  ['claro   texto secundario', T.fgMutedLight, T.paperLight, 4.5],
  ['claro   texto tenue', T.noir500, T.paperLight, 4.5],
  ['claro   acento como texto', T.pink700, T.paperLight, 4.5],
  ['claro   boton primario', T.white, T.pink700, 4.5],
  ['claro   boton primario en hover', T.white, T.pink800, 4.5],
  ['claro   anillo de foco', T.pink700, T.paperLight, 3.0],

  ['blink   texto principal', T.noir950, T.blush300, 4.5],
  ['blink   texto secundario', T.noir600, T.blush300, 4.5],
  ['blink   texto tenue', T.noir500, T.blush300, 4.5],
  ['blink   acento como texto', T.noir950, T.blush300, 4.5],
  ['blink   boton primario', T.blush100, T.noir950, 4.5],
  ['blink   boton primario en hover', T.blush100, T.noir800, 4.5],
  ['blink   texto sobre superficie', T.noir950, T.blush200, 4.5],
  ['blink   secundario sobre superficie', T.noir600, T.blush200, 4.5],
  ['blink   texto sobre overlay', T.noir950, T.blush100, 4.5],
  ['blink   pastel secundario', T.pink800, T.blush300, 4.5],
  ['blink   anillo de foco', T.noir950, T.blush300, 3.0],
];

let failures = 0;
for (const [label, fg, bg, min] of PAIRS) {
  const value = ratio(fg, bg);
  const passes = value >= min;
  if (!passes) failures += 1;
  const status = passes ? 'OK   ' : 'FALLA';
  console.log(`${status} ${label.padEnd(36)} ${value.toFixed(2)}:1  (minimo ${min})`);
}

if (failures > 0) {
  console.error(`\n${failures} par(es) por debajo del minimo AA.`);
  process.exit(1);
}

console.log(`\n${PAIRS.length} pares comprobados. Todos pasan AA.`);
