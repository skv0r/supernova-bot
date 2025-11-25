import { Match, Player } from '../../libs/types/team.types';

/**
 * Статистика лучших игроков
 */
export interface TopPlayerStats {
    playerName: string;
    teamName: string;
    value: number;
}

/**
 * Статистика команды
 */
export interface TeamPerformance {
    teamName: string;
    avgPlacement: number;
    avgPoints: number;
    totalGames: number;
    heroVariety: number; // количество уникальных героев
}

/**
 * Общая статистика матчей
 */
export interface MatchStats {
    topDamagePlayers: TopPlayerStats[]; // топ по урону
    topKillsPlayers: TopPlayerStats[]; // топ по киллам
    topAssistsPlayers: TopPlayerStats[]; // топ по ассистам
    topSurvivalPlayers: TopPlayerStats[]; // топ по времени выживания
    bestTeamsByPoints: TeamPerformance[]; // лучшие команды по очкам
    bestTeamsByPlacement: TeamPerformance[]; // лучшие команды по плейсменту
    mostDiverseTeams: TeamPerformance[]; // самые разнообразные команды
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
 * Анализирует общую статистику матчей (не привязанную к конкретной команде)
 */
export function analyzeMatchStats(matches: Match[]): MatchStats {
    // Собираем статистику по игрокам
    const playerStats = new Map<string, {
        playerName: string;
        teamName: string;
        totalDamage: number;
        totalKills: number;
        totalAssists: number;
        totalSurvivalTime: number;
        gamesPlayed: number;
    }>();

    // Собираем статистику по командам
    const teamStats = new Map<string, {
        placements: number[];
        points: number[];
        heroes: Set<string>;
    }>();

    matches.forEach((match) => {
        // Отслеживаем, какие команды уже учтены в этом матче
        const processedTeamsInMatch = new Set<string>();

        match.data.forEach((player: Player) => {
            const key = `${player.player_name}_${player.team_name}`;
            
            // Статистика игрока
            if (!playerStats.has(key)) {
                playerStats.set(key, {
                    playerName: player.player_name,
                    teamName: player.team_name,
                    totalDamage: 0,
                    totalKills: 0,
                    totalAssists: 0,
                    totalSurvivalTime: 0,
                    gamesPlayed: 0,
                });
            }
            const pStats = playerStats.get(key)!;
            pStats.totalDamage += player.damage_dealt;
            pStats.totalKills += player.kills;
            pStats.totalAssists += player.assists;
            pStats.totalSurvivalTime += player.survival_time;
            pStats.gamesPlayed++;

            // Статистика команды
            const teamName = player.team_name;
            if (!teamStats.has(teamName)) {
                teamStats.set(teamName, {
                    placements: [],
                    points: [],
                    heroes: new Set(),
                });
            }
            const tStats = teamStats.get(teamName)!;
            
            // Добавляем плейсмент только один раз за матч для каждой команды
            if (!processedTeamsInMatch.has(teamName)) {
                tStats.placements.push(player.team_placement);
                tStats.points.push(calculatePoints(player.team_placement));
                processedTeamsInMatch.add(teamName);
            }
            
            // Собираем уникальных героев
            tStats.heroes.add(player.character_name);
        });
    });

    // Топ игроков по урону
    const topDamagePlayers = Array.from(playerStats.values())
        .sort((a, b) => b.totalDamage - a.totalDamage)
        .slice(0, 10)
        .map(p => ({
            playerName: p.playerName,
            teamName: p.teamName,
            value: p.totalDamage,
        }));

    // Топ игроков по киллам
    const topKillsPlayers = Array.from(playerStats.values())
        .sort((a, b) => b.totalKills - a.totalKills)
        .slice(0, 10)
        .map(p => ({
            playerName: p.playerName,
            teamName: p.teamName,
            value: p.totalKills,
        }));

    // Топ игроков по ассистам
    const topAssistsPlayers = Array.from(playerStats.values())
        .sort((a, b) => b.totalAssists - a.totalAssists)
        .slice(0, 10)
        .map(p => ({
            playerName: p.playerName,
            teamName: p.teamName,
            value: p.totalAssists,
        }));

    // Топ игроков по времени выживания
    const topSurvivalPlayers = Array.from(playerStats.values())
        .sort((a, b) => b.totalSurvivalTime - a.totalSurvivalTime)
        .slice(0, 10)
        .map(p => ({
            playerName: p.playerName,
            teamName: p.teamName,
            value: Math.round(p.totalSurvivalTime / 60), // в минутах
        }));

    // Формируем статистику команд
    const teamPerformances: TeamPerformance[] = Array.from(teamStats.entries())
        .map(([teamName, stats]) => ({
            teamName,
            avgPlacement: stats.placements.reduce((sum, p) => sum + p, 0) / stats.placements.length,
            avgPoints: stats.points.reduce((sum, p) => sum + p, 0) / stats.points.length,
            totalGames: stats.placements.length,
            heroVariety: stats.heroes.size,
        }));

    // Лучшие команды по очкам
    const bestTeamsByPoints = [...teamPerformances]
        .sort((a, b) => b.avgPoints - a.avgPoints)
        .slice(0, 10);

    // Лучшие команды по плейсменту
    const bestTeamsByPlacement = [...teamPerformances]
        .sort((a, b) => a.avgPlacement - b.avgPlacement)
        .slice(0, 10);

    // Самые разнообразные команды (по количеству уникальных героев)
    const mostDiverseTeams = [...teamPerformances]
        .sort((a, b) => b.heroVariety - a.heroVariety)
        .slice(0, 10);

    return {
        topDamagePlayers,
        topKillsPlayers,
        topAssistsPlayers,
        topSurvivalPlayers,
        bestTeamsByPoints,
        bestTeamsByPlacement,
        mostDiverseTeams,
    };
}

/**
 * Выводит общую статистику матчей
 */
export function displayMatchStats(stats: MatchStats): void {
    console.log('\n========== ОБЩАЯ СТАТИСТИКА МАТЧЕЙ ==========');

    console.log('\n--- Топ-10 игроков по урону ---');
    stats.topDamagePlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName}): ${player.value} урона`);
    });

    console.log('\n--- Топ-10 игроков по киллам ---');
    stats.topKillsPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName}): ${player.value} киллов`);
    });

    console.log('\n--- Топ-10 игроков по ассистам ---');
    stats.topAssistsPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName}): ${player.value} ассистов`);
    });

    console.log('\n--- Топ-10 игроков по времени выживания ---');
    stats.topSurvivalPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName}): ${player.value} мин`);
    });

    console.log('\n========== СТАТИСТИКА КОМАНД ==========');

    console.log('\n--- Топ-10 команд по средним очкам ---');
    stats.bestTeamsByPoints.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.teamName}`);
        console.log(`     Средние очки: ${team.avgPoints.toFixed(2)}, Игр: ${team.totalGames}`);
    });

    console.log('\n--- Топ-10 команд по среднему плейсменту ---');
    stats.bestTeamsByPlacement.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.teamName}`);
        console.log(`     Средний плейсмент: ${team.avgPlacement.toFixed(2)}, Игр: ${team.totalGames}`);
    });

    console.log('\n--- Топ-10 самых разнообразных команд (по выбору героев) ---');
    stats.mostDiverseTeams.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.teamName}`);
        console.log(`     Уникальных героев: ${team.heroVariety}, Игр: ${team.totalGames}`);
    });
}

