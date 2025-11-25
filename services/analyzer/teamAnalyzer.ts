import { Match, Player, TeamStats } from '../../libs/types/team.types';
import { getMapDisplayName } from '../../libs/utils/mapNames';

/**
 * Анализирует командную статистику
 * @param matches массив матчей
 * @param teamName имя команды для анализа
 * @returns объект с командной статистикой
 */
export function analyzeTeamStats(matches: Match[], teamName: string): TeamStats {
    const pickedCharacters = new Map<string, number>();
    const draftLocations = new Map<string, number>();
    const placements: number[] = [];
    const pointsPerGame: number[] = [];

    matches.forEach((match) => {
        const teamPlayers = match.data.filter((p: Player) => p.team_name === teamName);
        
        if (teamPlayers.length === 0) return;

        // Плейсмент команды
        const placement = teamPlayers[0].team_placement;
        placements.push(placement);

        // Очки за игру (упрощенная система: 1 место = 12 очков, 2 = 9, 3 = 7, 4-5 = 5, и т.д.)
        const points = calculatePoints(placement);
        pointsPerGame.push(points);

        // Пикаемые персонажи
        teamPlayers.forEach((player) => {
            const char = player.character_name;
            pickedCharacters.set(char, (pickedCharacters.get(char) || 0) + 1);
        });

        // Локации драфтов (карты) - преобразуем в читаемое название
        const mapName = getMapDisplayName(match.map_name);
        draftLocations.set(mapName, (draftLocations.get(mapName) || 0) + 1);
    });

    const totalMatches = placements.length;
    const avgPlacement = totalMatches > 0 
        ? placements.reduce((sum, p) => sum + p, 0) / totalMatches 
        : 0;
    const avgPointsPerGame = totalMatches > 0
        ? pointsPerGame.reduce((sum, p) => sum + p, 0) / totalMatches
        : 0;
    const maxPointsInSeries = pointsPerGame.length > 0 ? Math.max(...pointsPerGame) : 0;
    const minPointsInSeries = pointsPerGame.length > 0 ? Math.min(...pointsPerGame) : 0;

    return {
        teamName,
        totalMatches,
        avgPlacement,
        avgPointsPerGame,
        maxPointsInSeries,
        minPointsInSeries,
        pickedCharacters,
        draftLocations,
    };
}

/**
 * Упрощенная система подсчета очков ALGS
 */
function calculatePoints(placement: number): number {
    const pointsTable: { [key: number]: number } = {
        1: 12, 2: 9, 3: 7, 4: 5, 5: 5,
        6: 4, 7: 4, 8: 3, 9: 3, 10: 3,
        11: 2, 12: 2, 13: 2, 14: 1, 15: 1,
        16: 1, 17: 1, 18: 1, 19: 1, 20: 1,
    };
    return pointsTable[placement] || 0;
}

/**
 * Выводит командную статистику в консоль
 */
export function displayTeamStats(stats: TeamStats): void {
    console.log('\n========== КОМАНДНАЯ СТАТИСТИКА ==========');
    console.log(`Команда: ${stats.teamName}`);
    console.log(`Всего матчей: ${stats.totalMatches}`);
    console.log(`Средний плейсмент: ${stats.avgPlacement.toFixed(2)}`);
    console.log(`Средние очки за игру: ${stats.avgPointsPerGame.toFixed(2)}`);
    console.log(`Максимум очков за игру: ${stats.maxPointsInSeries}`);
    console.log(`Минимум очков за игру: ${stats.minPointsInSeries}`);

    console.log('\nПикаемые персонажи:');
    const sortedChars = Array.from(stats.pickedCharacters.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedChars.forEach(([char, count]) => {
        console.log(`  ${char}: ${count} раз`);
    });

    console.log('\nКарты (локации драфтов):');
    const sortedMaps = Array.from(stats.draftLocations.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedMaps.forEach(([map, count]) => {
        console.log(`  ${map}: ${count} раз`);
    });
}

