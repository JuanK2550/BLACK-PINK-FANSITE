// Variantes del término buscado: tal cual y sin tildes, para que «Rosé» encuentre «ROSE».

export function searchVariants(query: string): string[] {
  const term = query.trim();
  const plain = term
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .normalize('NFC');
  return plain === term ? [term] : [term, plain];
}
