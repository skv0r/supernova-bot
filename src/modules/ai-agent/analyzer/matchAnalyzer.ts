import {
    Match,
    Player,
    MatchStats,
    TopPlayerStats,
    TeamPerformance
} from '../team.types.js';
import { getCanonicalPlayerName } from '../data/playerAliases.js';
import { calculatePoints } from '../utils/calculatePoints.js';

/**
 * Анализирует общую статистику матчей (не привязанную к конкретной команде)
 */
export function analyzeMatchStats(matches: Match[]): MatchStats {
    // Собираем статистику по игрокам (используем канонические имена)
    const playerStats = new Map<string, {
        canonicalName: string;
        displayName: string;
        teamName: string;
        totalDamage: number;
        totalKills: number;
        totalAssists: number;
        totalSurvivalTime: number;
        gamesPlayed: number;
        aliases: Set<string>;
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
            const canonicalName = getCanonicalPlayerName(player.player_name);
            const key = `${canonicalName}_${player.team_name}`;
            
            // Статистика игрока
            if (!playerStats.has(key)) {
                playerStats.set(key, {
                    canonicalName,
                    displayName: canonicalName,
                    teamName: player.team_name,
                    totalDamage: 0,
                    totalKills: 0,
                    totalAssists: 0,
                    totalSurvivalTime: 0,
                    gamesPlayed: 0,
                    aliases: new Set(),
                });
            }
            const pStats = playerStats.get(key)!;
            pStats.totalDamage += player.damage_dealt;
            pStats.totalKills += player.kills;
            pStats.totalAssists += player.assists;
            pStats.totalSurvivalTime += player.survival_time;
            pStats.gamesPlayed++;
            pStats.aliases.add(player.player_name);

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

    // Формируем отображаемые имена с псевдонимами
    playerStats.forEach((stats) => {
        if (stats.aliases.size > 1) {
            const aliasesList = Array.from(stats.aliases).join(' / ');
            stats.displayName = `${stats.canonicalName} (${aliasesList})`;
        }
    });

    // Топ игроков по среднему урону
    const topDamagePlayers = Array.from(playerStats.values())
        .map(p => ({
            playerName: p.displayName,
            teamName: p.teamName,
            avgValue: p.gamesPlayed > 0 ? p.totalDamage / p.gamesPlayed : 0,
            totalValue: p.totalDamage,
            gamesPlayed: p.gamesPlayed,
        }))
        .sort((a, b) => b.avgValue - a.avgValue)
        .slice(0, 10);

    // Топ игроков по средним киллам
    const topKillsPlayers = Array.from(playerStats.values())
        .map(p => ({
            playerName: p.displayName,
            teamName: p.teamName,
            avgValue: p.gamesPlayed > 0 ? p.totalKills / p.gamesPlayed : 0,
            totalValue: p.totalKills,
            gamesPlayed: p.gamesPlayed,
        }))
        .sort((a, b) => b.avgValue - a.avgValue)
        .slice(0, 10);

    // Топ игроков по средним ассистам
    const topAssistsPlayers = Array.from(playerStats.values())
        .map(p => ({
            playerName: p.displayName,
            teamName: p.teamName,
            avgValue: p.gamesPlayed > 0 ? p.totalAssists / p.gamesPlayed : 0,
            totalValue: p.totalAssists,
            gamesPlayed: p.gamesPlayed,
        }))
        .sort((a, b) => b.avgValue - a.avgValue)
        .slice(0, 10);

    // Топ игроков по среднему времени выживания
    const topSurvivalPlayers = Array.from(playerStats.values())
        .map(p => ({
            playerName: p.displayName,
            teamName: p.teamName,
            avgValue: p.gamesPlayed > 0 ? p.totalSurvivalTime / p.gamesPlayed / 60 : 0, // в минутах
            totalValue: Math.round(p.totalSurvivalTime / 60), // в минутах
            gamesPlayed: p.gamesPlayed,
        }))
        .sort((a, b) => b.avgValue - a.avgValue)
        .slice(0, 10);

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

    console.log('\n--- Топ-10 игроков по среднему урону ---');
    stats.topDamagePlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName})`);
        console.log(`     Средний урон: ${player.avgValue.toFixed(1)}, Всего: ${player.totalValue}, Игр: ${player.gamesPlayed}`);
    });

    console.log('\n--- Топ-10 игроков по средним киллам ---');
    stats.topKillsPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName})`);
        console.log(`     Средние киллы: ${player.avgValue.toFixed(2)}, Всего: ${player.totalValue}, Игр: ${player.gamesPlayed}`);
    });

    console.log('\n--- Топ-10 игроков по средним ассистам ---');
    stats.topAssistsPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName})`);
        console.log(`     Средние ассисты: ${player.avgValue.toFixed(2)}, Всего: ${player.totalValue}, Игр: ${player.gamesPlayed}`);
    });

    console.log('\n--- Топ-10 игроков по среднему времени выживания ---');
    stats.topSurvivalPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.playerName} (${player.teamName})`);
        console.log(`     Среднее время: ${player.avgValue.toFixed(1)} мин, Всего: ${player.totalValue} мин, Игр: ${player.gamesPlayed}`);
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

