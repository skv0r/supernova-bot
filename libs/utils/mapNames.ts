/**
 * Словарь для преобразования кодовых названий карт в читаемые
 */
export const MAP_NAMES: { [key: string]: string } = {
    'mp_rr_desertlands_hu': 'Край Света',
    'mp_rr_district_mu1': 'Дистрикт',
    // Добавьте другие карты по мере необходимости
};

/**
 * Преобразует кодовое название карты в читаемое
 * @param mapCode кодовое название карты
 * @returns читаемое название или исходное, если не найдено в словаре
 */
export function getMapDisplayName(mapCode: string): string {
    return MAP_NAMES[mapCode] || mapCode;
}

