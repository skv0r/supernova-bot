/**
 * База данных псевдонимов игроков
 * Ключ - канонический (основной) никнейм игрока
 * Значение - массив всех известных псевдонимов этого игрока
 */
export const PLAYER_ALIASES: { [canonicalName: string]: string[] } = {
    // SUPERNOVA
    'SN NINEimpulse': [
        'SN NINEimpulse',
        'SN BusDriver',
        'BusDriver',
    ],
    'SN Kazakh': [
        'SN Kazakh',
    ],
    'SN H': [
        'SN H',
    ],
    
    // Добавляйте других игроков по мере необходимости
    // 'Основной ник': ['Основной ник', 'Альтернативный ник 1', 'Альтернативный ник 2'],
};

/**
 * Обратный маппинг: псевдоним -> канонический никнейм
 * Генерируется автоматически из PLAYER_ALIASES
 */
const aliasToCanonical: Map<string, string> = new Map();

// Заполняем обратный маппинг
Object.entries(PLAYER_ALIASES).forEach(([canonical, aliases]) => {
    aliases.forEach(alias => {
        aliasToCanonical.set(alias, canonical);
    });
});

/**
 * Получает канонический (основной) никнейм игрока
 * @param playerName любой известный никнейм игрока
 * @returns канонический никнейм или исходный, если не найден в базе
 */
export function getCanonicalPlayerName(playerName: string): string {
    return aliasToCanonical.get(playerName) || playerName;
}

/**
 * Проверяет, являются ли два никнейма одним и тем же игроком
 * @param name1 первый никнейм
 * @param name2 второй никнейм
 * @returns true, если это один игрок
 */
export function isSamePlayer(name1: string, name2: string): boolean {
    const canonical1 = getCanonicalPlayerName(name1);
    const canonical2 = getCanonicalPlayerName(name2);
    return canonical1 === canonical2;
}

/**
 * Получает все известные псевдонимы игрока
 * @param playerName любой известный никнейм игрока
 * @returns массив всех псевдонимов или [playerName], если не найден в базе
 */
export function getAllAliases(playerName: string): string[] {
    const canonical = getCanonicalPlayerName(playerName);
    return PLAYER_ALIASES[canonical] || [playerName];
}

