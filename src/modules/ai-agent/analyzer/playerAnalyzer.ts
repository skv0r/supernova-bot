import { Match, Player, PlayerStats } from '../team.types.js';
import { getCanonicalPlayerName, getAllAliases } from '../data/playerAliases.js';

/**
 * Анализирует персональную статистику игроков команды
 * @param matches массив матчей
 * @param teamName имя команды для анализа
 * @returns массив объектов со статистикой каждого игрока
 */
export function analyzePlayerStats(matches: Match[], teamName: string): PlayerStats[] {
    const playerDataMap = new Map<string, {
        kills: number[];
        damage: number[];
        assists: number[];
        survivalTimes: number[];
        knockdowns: number;
        revives: number;
        aliases: Set<string>; // все встреченные псевдонимы
    }>();

    matches.forEach((match) => {
        const teamPlayers = match.data.filter((p: Player) => p.team_name === teamName);

        teamPlayers.forEach((player) => {
            // Получаем канонический никнейм
            const canonicalName = getCanonicalPlayerName(player.player_name);
            
            if (!playerDataMap.has(canonicalName)) {
                playerDataMap.set(canonicalName, {
                    kills: [],
                    damage: [],
                    assists: [],
                    survivalTimes: [],
                    knockdowns: 0,
                    revives: 0,
                    aliases: new Set(),
                });
            }

            const data = playerDataMap.get(canonicalName)!;
            data.kills.push(player.kills);
            data.damage.push(player.damage_dealt);
            data.assists.push(player.assists);
            data.survivalTimes.push(player.survival_time);
            data.knockdowns += player.knockdowns;
            data.revives += player.revives_given;
            data.aliases.add(player.player_name); // сохраняем встреченный псевдоним
        });
    });

    const playerStats: PlayerStats[] = [];

    playerDataMap.forEach((data, canonicalName) => {
        const gamesPlayed = data.kills.length;
        const totalKills = data.kills.reduce((sum, k) => sum + k, 0);
        const totalDamage = data.damage.reduce((sum, d) => sum + d, 0);
        const totalAssists = data.assists.reduce((sum, a) => sum + a, 0);
        const totalSurvivalTime = data.survivalTimes.reduce((sum, t) => sum + t, 0);

        // Формируем отображаемое имя с псевдонимами, если они есть
        let displayName = canonicalName;
        if (data.aliases.size > 1) {
            const aliasesList = Array.from(data.aliases).join(' / ');
            displayName = `${canonicalName} (также: ${aliasesList})`;
        }

        playerStats.push({
            playerName: displayName,
            totalKills,
            avgKills: gamesPlayed > 0 ? totalKills / gamesPlayed : 0,
            maxKills: data.kills.length > 0 ? Math.max(...data.kills) : 0,
            totalDamage,
            avgDamage: gamesPlayed > 0 ? totalDamage / gamesPlayed : 0,
            maxDamage: data.damage.length > 0 ? Math.max(...data.damage) : 0,
            totalAssists,
            avgAssists: gamesPlayed > 0 ? totalAssists / gamesPlayed : 0,
            maxAssists: data.assists.length > 0 ? Math.max(...data.assists) : 0,
            avgSurvivalTime: gamesPlayed > 0 ? totalSurvivalTime / gamesPlayed : 0,
            totalKnockdowns: data.knockdowns,
            totalRevives: data.revives,
            gamesPlayed,
        });
    });

    return playerStats;
}

/**
 * Выводит персональную статистику игроков в консоль
 */
export function displayPlayerStats(stats: PlayerStats[]): void {
    console.log('\n========== ПЕРСОНАЛЬНАЯ СТАТИСТИКА ИГРОКОВ ==========');
    
    stats.forEach((player) => {
        console.log(`\n--- ${player.playerName} ---`);
        console.log(`Игр сыграно: ${player.gamesPlayed}`);
        console.log(`Киллы: всего ${player.totalKills}, в среднем ${player.avgKills.toFixed(2)}, макс ${player.maxKills}`);
        console.log(`Урон: всего ${player.totalDamage}, в среднем ${player.avgDamage.toFixed(2)}, макс ${player.maxDamage}`);
        console.log(`Ассисты: всего ${player.totalAssists}, в среднем ${player.avgAssists.toFixed(2)}, макс ${player.maxAssists}`);
        console.log(`Среднее время жизни: ${(player.avgSurvivalTime / 60).toFixed(2)} мин`);
        console.log(`Нокдауны: ${player.totalKnockdowns}`);
        console.log(`Воскрешения: ${player.totalRevives}`);
    });
}

