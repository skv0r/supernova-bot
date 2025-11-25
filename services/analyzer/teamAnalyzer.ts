import { 
    Match, 
    Player, 
    TeamStats, 
    TeamCompositionPerformance, 
    TeamHeroPerformance, 
    PlayerRanking 
} from '../../libs/types/team.types';
import { getCanonicalPlayerName } from '../../libs/data/playerAliases';
import { calculatePoints } from '../../libs/utils/calculatePoints';

/**
 * Анализирует статистику команды (продвинутая версия)
 */
export function analyzeTeamStats(matches: Match[], teamName: string): TeamStats {
    // Статистика троек героев команды
    const compositionsMap = new Map<string, number[]>(); // ключ -> массив плейсментов

    // Статистика отдельных героев команды
    const heroPlacementsMap = new Map<string, number[]>(); // герой -> массив плейсментов

    // Собираем данные по команде
    matches.forEach((match) => {
        const teamPlayers = match.data.filter((p: Player) => p.team_name === teamName);
        
        if (teamPlayers.length === 0) return;

        const placement = teamPlayers[0].team_placement;

        // Тройка героев
        if (teamPlayers.length === 3) {
            const heroes = teamPlayers.map(p => p.character_name).sort();
            const compositionKey = heroes.join(',');
            
            if (!compositionsMap.has(compositionKey)) {
                compositionsMap.set(compositionKey, []);
            }
            compositionsMap.get(compositionKey)!.push(placement);
        }

        // Отдельные герои
        teamPlayers.forEach((player) => {
            const hero = player.character_name;
            if (!heroPlacementsMap.has(hero)) {
                heroPlacementsMap.set(hero, []);
            }
            heroPlacementsMap.get(hero)!.push(placement);
        });
    });

    // Формируем статистику троек
    const teamCompositions: TeamCompositionPerformance[] = Array.from(compositionsMap.entries())
        .map(([key, placements]) => ({
            heroes: key.split(','),
            avgPlacement: placements.reduce((sum, p) => sum + p, 0) / placements.length,
            gamesPlayed: placements.length,
            bestPlacement: Math.min(...placements),
            worstPlacement: Math.max(...placements),
        }))
        .sort((a, b) => a.avgPlacement - b.avgPlacement); // Сортируем по среднему месту

    // Формируем статистику героев
    const heroPerformances: TeamHeroPerformance[] = Array.from(heroPlacementsMap.entries())
        .map(([hero, placements]) => ({
            heroName: hero,
            avgPlacement: placements.reduce((sum, p) => sum + p, 0) / placements.length,
            gamesPlayed: placements.length,
            bestPlacement: Math.min(...placements),
            worstPlacement: Math.max(...placements),
        }))
        .sort((a, b) => a.avgPlacement - b.avgPlacement);

    // Рейтинги игроков относительно всех
    const playerRankings = calculatePlayerRankings(matches, teamName);

    return {
        teamCompositions,
        heroPerformances,
        playerRankings,
    };
}

/**
 * Вычисляет рейтинги игроков команды относительно всех игроков
 */
function calculatePlayerRankings(matches: Match[], teamName: string): PlayerRanking[] {
    // Собираем статистику всех игроков (используем канонические имена)
    const allPlayersStats = new Map<string, {
        canonicalName: string;
        displayName: string;
        teamName: string;
        totalDamage: number;
        totalKills: number;
        totalAssists: number;
        totalSurvival: number;
        gamesPlayed: number;
        aliases: Set<string>;
    }>();

    matches.forEach((match) => {
        match.data.forEach((player: Player) => {
            const canonicalName = getCanonicalPlayerName(player.player_name);
            const key = `${canonicalName}_${player.team_name}`;
            
            if (!allPlayersStats.has(key)) {
                allPlayersStats.set(key, {
                    canonicalName,
                    displayName: canonicalName,
                    teamName: player.team_name,
                    totalDamage: 0,
                    totalKills: 0,
                    totalAssists: 0,
                    totalSurvival: 0,
                    gamesPlayed: 0,
                    aliases: new Set(),
                });
            }
            
            const stats = allPlayersStats.get(key)!;
            stats.totalDamage += player.damage_dealt;
            stats.totalKills += player.kills;
            stats.totalAssists += player.assists;
            stats.totalSurvival += player.survival_time;
            stats.gamesPlayed++;
            stats.aliases.add(player.player_name);
        });
    });

    // Формируем отображаемые имена с псевдонимами
    allPlayersStats.forEach((stats) => {
        if (stats.aliases.size > 1) {
            const aliasesList = Array.from(stats.aliases).join(' / ');
            stats.displayName = `${stats.canonicalName} (${aliasesList})`;
        }
    });

    const allPlayers = Array.from(allPlayersStats.values());
    const totalPlayers = allPlayers.length;

    // Вычисляем средние значения для каждого игрока
    const playersWithAvg = allPlayers.map(p => ({
        ...p,
        avgDamage: p.gamesPlayed > 0 ? p.totalDamage / p.gamesPlayed : 0,
        avgKills: p.gamesPlayed > 0 ? p.totalKills / p.gamesPlayed : 0,
        avgAssists: p.gamesPlayed > 0 ? p.totalAssists / p.gamesPlayed : 0,
        avgSurvival: p.gamesPlayed > 0 ? p.totalSurvival / p.gamesPlayed / 60 : 0, // в минутах
    }));

    // Сортируем по средним значениям
    const damageRanking = [...playersWithAvg].sort((a, b) => b.avgDamage - a.avgDamage);
    const killsRanking = [...playersWithAvg].sort((a, b) => b.avgKills - a.avgKills);
    const assistsRanking = [...playersWithAvg].sort((a, b) => b.avgAssists - a.avgAssists);
    const survivalRanking = [...playersWithAvg].sort((a, b) => b.avgSurvival - a.avgSurvival);

    // Находим игроков нашей команды и их рейтинги
    const teamPlayers = playersWithAvg.filter(p => p.teamName === teamName);

    return teamPlayers.map(player => {
        const damageRank = damageRanking.findIndex(p => 
            p.canonicalName === player.canonicalName && p.teamName === player.teamName) + 1;
        const killsRank = killsRanking.findIndex(p => 
            p.canonicalName === player.canonicalName && p.teamName === player.teamName) + 1;
        const assistsRank = assistsRanking.findIndex(p => 
            p.canonicalName === player.canonicalName && p.teamName === player.teamName) + 1;
        const survivalRank = survivalRanking.findIndex(p => 
            p.canonicalName === player.canonicalName && p.teamName === player.teamName) + 1;

        return {
            playerName: player.displayName,
            damageRank,
            avgDamage: player.avgDamage,
            totalDamage: player.totalDamage,
            killsRank,
            avgKills: player.avgKills,
            totalKills: player.totalKills,
            assistsRank,
            avgAssists: player.avgAssists,
            totalAssists: player.totalAssists,
            survivalRank,
            avgSurvival: player.avgSurvival,
            totalSurvival: Math.round(player.totalSurvival / 60), // в минутах
            gamesPlayed: player.gamesPlayed,
            totalPlayers,
        };
    });
}

/**
 * Выводит статистику команды
 */
export function displayTeamStats(stats: TeamStats, teamName: string): void {
    console.log('\n========== СТАТИСТИКА КОМАНДЫ ==========');

    // Статистика троек героев
    if (stats.teamCompositions.length > 0) {
        console.log('\n--- Тройки героев по среднему плейсменту ---');
        stats.teamCompositions.forEach((comp, index) => {
            console.log(`  ${index + 1}. ${comp.heroes.join(' + ')}`);
            console.log(`     Средний плейсмент: ${comp.avgPlacement.toFixed(2)}, Игр: ${comp.gamesPlayed}`);
            console.log(`     Лучший: ${comp.bestPlacement}, Худший: ${comp.worstPlacement}`);
        });
    }

    // Статистика отдельных героев
    if (stats.heroPerformances.length > 0) {
        console.log('\n--- Герои по среднему плейсменту ---');
        stats.heroPerformances.forEach((hero, index) => {
            console.log(`  ${index + 1}. ${hero.heroName}`);
            console.log(`     Средний плейсмент: ${hero.avgPlacement.toFixed(2)}, Игр: ${hero.gamesPlayed}`);
            console.log(`     Лучший: ${hero.bestPlacement}, Худший: ${hero.worstPlacement}`);
        });
    }

    // Рейтинги игроков
    console.log('\n--- РЕЙТИНГИ ИГРОКОВ ОТНОСИТЕЛЬНО ВСЕХ ---');
    console.log(`(Всего игроков в турнире: ${stats.playerRankings[0]?.totalPlayers || 0})\n`);
    
    stats.playerRankings.forEach((ranking) => {
        console.log(`${ranking.playerName}:`);
        console.log(`  Урон: ${ranking.avgDamage.toFixed(1)} в среднем (Всего: ${ranking.totalDamage}, Игр: ${ranking.gamesPlayed})`);
        console.log(`  Рейтинг: Топ-${ranking.damageRank} из ${ranking.totalPlayers}`);
        console.log(`  Киллы: ${ranking.avgKills.toFixed(2)} в среднем (Всего: ${ranking.totalKills}, Игр: ${ranking.gamesPlayed})`);
        console.log(`  Рейтинг: Топ-${ranking.killsRank} из ${ranking.totalPlayers}`);
        console.log(`  Ассисты: ${ranking.avgAssists.toFixed(2)} в среднем (Всего: ${ranking.totalAssists}, Игр: ${ranking.gamesPlayed})`);
        console.log(`  Рейтинг: Топ-${ranking.assistsRank} из ${ranking.totalPlayers}`);
        console.log(`  Время выживания: ${ranking.avgSurvival.toFixed(1)} мин в среднем (Всего: ${ranking.totalSurvival} мин, Игр: ${ranking.gamesPlayed})`);
        console.log(`  Рейтинг: Топ-${ranking.survivalRank} из ${ranking.totalPlayers}\n`);
    });
}
