// Término de búsqueda sin tildes ni mayúsculas, y la misma normalización para las columnas en SQL.

const FOLD_FROM = 'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇáàäâéèëêíìïîóòöôúùüûñç';
const FOLD_TO = 'AAAAEEEEIIIIOOOOUUUUNCaaaaeeeeiiiioooouuuunc';

export function foldSearchTerm(query: string): string {
  return query
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .normalize('NFC')
    .toLowerCase();
}

export function likePattern(query: string): string {
  return `%${foldSearchTerm(query).replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function foldColumn(column: string): string {
  return `lower(translate(coalesce(${column}, ''), '${FOLD_FROM}', '${FOLD_TO}'))`;
}
