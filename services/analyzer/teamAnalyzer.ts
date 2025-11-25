import { 
    Match, 
    Player, 
    TeamStats, 
    TeamCompositionPerformance, 
    TeamHeroPerformance, 
    PlayerRanking 
} from '../../libs/types/team.types';

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
    // Собираем статистику всех игроков
    const allPlayersStats = new Map<string, {
        playerName: string;
        teamName: string;
        totalDamage: number;
        totalKills: number;
        totalAssists: number;
        totalSurvival: number;
    }>();

    matches.forEach((match) => {
        match.data.forEach((player: Player) => {
            const key = `${player.player_name}_${player.team_name}`;
            
            if (!allPlayersStats.has(key)) {
                allPlayersStats.set(key, {
                    playerName: player.player_name,
                    teamName: player.team_name,
                    totalDamage: 0,
                    totalKills: 0,
                    totalAssists: 0,
                    totalSurvival: 0,
                });
            }
            
            const stats = allPlayersStats.get(key)!;
            stats.totalDamage += player.damage_dealt;
            stats.totalKills += player.kills;
            stats.totalAssists += player.assists;
            stats.totalSurvival += player.survival_time;
        });
    });

    const allPlayers = Array.from(allPlayersStats.values());
    const totalPlayers = allPlayers.length;

    // Сортируем по каждой метрике
    const damageRanking = [...allPlayers].sort((a, b) => b.totalDamage - a.totalDamage);
    const killsRanking = [...allPlayers].sort((a, b) => b.totalKills - a.totalKills);
    const assistsRanking = [...allPlayers].sort((a, b) => b.totalAssists - a.totalAssists);
    const survivalRanking = [...allPlayers].sort((a, b) => b.totalSurvival - a.totalSurvival);

    // Находим игроков нашей команды и их рейтинги
    const teamPlayers = allPlayers.filter(p => p.teamName === teamName);

    return teamPlayers.map(player => {
        const damageRank = damageRanking.findIndex(p => 
            p.playerName === player.playerName && p.teamName === player.teamName) + 1;
        const killsRank = killsRanking.findIndex(p => 
            p.playerName === player.playerName && p.teamName === player.teamName) + 1;
        const assistsRank = assistsRanking.findIndex(p => 
            p.playerName === player.playerName && p.teamName === player.teamName) + 1;
        const survivalRank = survivalRanking.findIndex(p => 
            p.playerName === player.playerName && p.teamName === player.teamName) + 1;

        return {
            playerName: player.playerName,
            damageRank,
            damageTotal: player.totalDamage,
            killsRank,
            killsTotal: player.totalKills,
            assistsRank,
            assistsTotal: player.totalAssists,
            survivalRank,
            survivalTotal: Math.round(player.totalSurvival / 60), // в минутах
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
        console.log(`  Урон: ${ranking.damageTotal} (Топ-${ranking.damageRank} из ${ranking.totalPlayers})`);
        console.log(`  Киллы: ${ranking.killsTotal} (Топ-${ranking.killsRank} из ${ranking.totalPlayers})`);
        console.log(`  Ассисты: ${ranking.assistsTotal} (Топ-${ranking.assistsRank} из ${ranking.totalPlayers})`);
        console.log(`  Время выживания: ${ranking.survivalTotal} мин (Топ-${ranking.survivalRank} из ${ranking.totalPlayers})`);
    });
}
