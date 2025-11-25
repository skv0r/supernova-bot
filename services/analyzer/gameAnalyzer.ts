import { Match, Player, GameStats, TeamComposition, CharacterStats } from '../../libs/types/team.types';
import { getMapDisplayName } from '../../libs/utils/mapNames';

/**
 * Анализирует игровую статистику (баны, пикрейт героев, карты, тройки героев, винрейт)
 * @param matches массив матчей
 * @returns объект с игровой статистикой
 */
export function analyzeGameStats(matches: Match[]): GameStats {
    const bans = new Map<string, number>();
    const characterPickRate = new Map<string, number>();
    const mapPlayRate = new Map<string, number>();
    
    // Для анализа троек героев: ключ - строка из отсортированных героев, значение - {wins, losses}
    const compositionsMap = new Map<string, { wins: number; losses: number; totalGames: number }>();
    
    // Для анализа троек героев по картам: карта -> (композиция -> статистика)
    const compositionsByMapData = new Map<string, Map<string, { wins: number; losses: number; totalGames: number }>>();
    
    // Для винрейта отдельных героев: ключ - имя героя, значение - {wins, losses}
    const characterWinLoss = new Map<string, { wins: number; losses: number }>();

    matches.forEach((match) => {
        // Баны
        if (match.ban) {
            bans.set(match.ban, (bans.get(match.ban) || 0) + 1);
        }

        // Карты (преобразуем в читаемое название)
        const mapName = getMapDisplayName(match.map_name);
        mapPlayRate.set(mapName, (mapPlayRate.get(mapName) || 0) + 1);

        // Инициализируем Map для этой карты, если еще нет
        if (!compositionsByMapData.has(mapName)) {
            compositionsByMapData.set(mapName, new Map());
        }
        const mapCompositions = compositionsByMapData.get(mapName)!;

        // Группируем игроков по командам
        const teamMap = new Map<string, Player[]>();
        match.data.forEach((player: Player) => {
            const teamId = player.team_id;
            if (!teamMap.has(teamId)) {
                teamMap.set(teamId, []);
            }
            teamMap.get(teamId)!.push(player);

            // Пикрейт героев (по всем игрокам)
            const char = player.character_name;
            characterPickRate.set(char, (characterPickRate.get(char) || 0) + 1);
        });

        // Анализируем каждую команду
        teamMap.forEach((teamPlayers) => {
            if (teamPlayers.length !== 3) return; // Пропускаем неполные команды

            const placement = teamPlayers[0].team_placement;
            const isWin = placement <= 3; // Победа = топ-3

            // Формируем тройку героев (сортируем для уникальности)
            const heroes = teamPlayers
                .map(p => p.character_name)
                .sort();
            const compositionKey = heroes.join(',');

            // Обновляем общую статистику тройки
            if (!compositionsMap.has(compositionKey)) {
                compositionsMap.set(compositionKey, { wins: 0, losses: 0, totalGames: 0 });
            }
            const compStats = compositionsMap.get(compositionKey)!;
            compStats.totalGames++;
            if (isWin) {
                compStats.wins++;
            } else {
                compStats.losses++;
            }

            // Обновляем статистику тройки для конкретной карты
            if (!mapCompositions.has(compositionKey)) {
                mapCompositions.set(compositionKey, { wins: 0, losses: 0, totalGames: 0 });
            }
            const mapCompStats = mapCompositions.get(compositionKey)!;
            mapCompStats.totalGames++;
            if (isWin) {
                mapCompStats.wins++;
            } else {
                mapCompStats.losses++;
            }

            // Обновляем статистику каждого героя
            heroes.forEach(hero => {
                if (!characterWinLoss.has(hero)) {
                    characterWinLoss.set(hero, { wins: 0, losses: 0 });
                }
                const heroStats = characterWinLoss.get(hero)!;
                if (isWin) {
                    heroStats.wins++;
                } else {
                    heroStats.losses++;
                }
            });
        });
    });

    // Топ-5 самых частых банов
    const mostFrequentBans = Array.from(bans.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ban]) => ban);

    // Формируем массив троек героев с винрейтом
    const teamCompositions: TeamComposition[] = Array.from(compositionsMap.entries())
        .map(([key, stats]) => ({
            heroes: key.split(','),
            wins: stats.wins,
            losses: stats.losses,
            totalGames: stats.totalGames,
            winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
        }))
        .filter(comp => comp.totalGames >= 2) // Показываем только тройки с 2+ играми
        .sort((a, b) => {
            // Сортируем по винрейту (по убыванию), при равном винрейте - по количеству игр
            if (b.winRate !== a.winRate) {
                return b.winRate - a.winRate;
            }
            return b.totalGames - a.totalGames;
        });

    // Формируем статистику отдельных героев
    const characterStats: CharacterStats[] = Array.from(characterWinLoss.entries())
        .map(([char, stats]) => {
            const totalGames = stats.wins + stats.losses;
            return {
                characterName: char,
                totalPicks: characterPickRate.get(char) || 0,
                wins: stats.wins,
                losses: stats.losses,
                winRate: totalGames > 0 ? (stats.wins / totalGames) * 100 : 0,
                loseRate: totalGames > 0 ? (stats.losses / totalGames) * 100 : 0,
            };
        })
        .sort((a, b) => b.totalPicks - a.totalPicks); // Сортируем по популярности

    // Формируем статистику троек по картам
    const teamCompositionsByMap = new Map<string, TeamComposition[]>();
    compositionsByMapData.forEach((mapComps, mapName) => {
        const compositions: TeamComposition[] = Array.from(mapComps.entries())
            .map(([key, stats]) => ({
                heroes: key.split(','),
                wins: stats.wins,
                losses: stats.losses,
                totalGames: stats.totalGames,
                winRate: stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0,
            }))
            .filter(comp => comp.totalGames >= 1) // Для карт показываем все тройки
            .sort((a, b) => {
                // Сортируем по винрейту
                if (b.winRate !== a.winRate) {
                    return b.winRate - a.winRate;
                }
                return b.totalGames - a.totalGames;
            });
        teamCompositionsByMap.set(mapName, compositions);
    });

    return {
        totalMaps: matches.length,
        bans,
        mostFrequentBans,
        characterPickRate,
        mapPlayRate,
        teamCompositions,
        teamCompositionsByMap,
        characterStats,
    };
}

/**
 * Выводит игровую статистику в консоль
 */
export function displayGameStats(stats: GameStats): void {
    console.log('\n========== ИГРОВАЯ СТАТИСТИКА ==========');
    console.log(`Всего карт (матчей): ${stats.totalMaps}`);

    console.log('\nТоп-5 самых частых банов:');
    stats.mostFrequentBans.forEach((ban, index) => {
        const count = stats.bans.get(ban) || 0;
        console.log(`  ${index + 1}. ${ban}: ${count} раз`);
    });

    console.log('\nВсе баны:');
    const sortedBans = Array.from(stats.bans.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedBans.forEach(([ban, count]) => {
        console.log(`  ${ban}: ${count} раз`);
    });

    console.log('\nПикрейт героев (топ-10):');
    const sortedChars = Array.from(stats.characterPickRate.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    sortedChars.forEach(([char, count]) => {
        const pickRate = ((count / (stats.totalMaps * 60)) * 100).toFixed(2); // ~60 игроков в матче
        console.log(`  ${char}: ${count} раз (${pickRate}%)`);
    });

    console.log('\nИгры на картах:');
    const sortedMaps = Array.from(stats.mapPlayRate.entries())
        .sort((a, b) => b[1] - a[1]);
    sortedMaps.forEach(([map, count]) => {
        console.log(`  ${map}: ${count} раз`);
    });

    // Статистика троек героев
    console.log('\n========== СТАТИСТИКА ТРОЕК ГЕРОЕВ ==========');
    console.log('(Минимум 2 игры для отображения, сортировка по винрейту)\n');

    if (stats.teamCompositions.length > 0) {
        console.log('Топ-10 троек героев по винрейту:');
        stats.teamCompositions.slice(0, 10).forEach((comp, index) => {
            console.log(`  ${index + 1}. ${comp.heroes.join(' + ')}`);
            console.log(`     Винрейт: ${comp.winRate.toFixed(1)}% | Игр: ${comp.totalGames} (${comp.wins}W/${comp.losses}L)`);
        });

        // Самые популярные тройки
        const mostPopularComps = [...stats.teamCompositions]
            .sort((a, b) => b.totalGames - a.totalGames)
            .slice(0, 5);
        console.log('\nСамые популярные тройки (по количеству игр):');
        mostPopularComps.forEach((comp, index) => {
            console.log(`  ${index + 1}. ${comp.heroes.join(' + ')}`);
            console.log(`     Игр: ${comp.totalGames}, Винрейт: ${comp.winRate.toFixed(1)}% (${comp.wins}W/${comp.losses}L)`);
        });

        // Самые проигрышные тройки (по лузрейту)
        const topLosingComps = [...stats.teamCompositions]
            .sort((a, b) => a.winRate - b.winRate)
            .slice(0, 5);
        console.log('\nСамые проигрышные тройки (по лузрейту):');
        topLosingComps.forEach((comp, index) => {
            const loseRate = 100 - comp.winRate;
            console.log(`  ${index + 1}. ${comp.heroes.join(' + ')}`);
            console.log(`     Лузрейт: ${loseRate.toFixed(1)}% | Игр: ${comp.totalGames} (${comp.losses}L/${comp.wins}W)`);
        });
    } else {
        console.log('Недостаточно данных для анализа троек героев.');
    }

    // Статистика троек героев по картам
    console.log('\n========== СТАТИСТИКА ТРОЕК ГЕРОЕВ ПО КАРТАМ ==========');
    if (stats.teamCompositionsByMap.size > 0) {
        stats.teamCompositionsByMap.forEach((compositions, mapName) => {
            console.log(`\n--- Карта: ${mapName} ---`);
            if (compositions.length > 0) {
                console.log('Топ-5 троек по винрейту:');
                compositions.slice(0, 5).forEach((comp, index) => {
                    console.log(`  ${index + 1}. ${comp.heroes.join(' + ')}`);
                    console.log(`     Винрейт: ${comp.winRate.toFixed(1)}% | Игр: ${comp.totalGames} (${comp.wins}W/${comp.losses}L)`);
                });
            } else {
                console.log('  Нет данных');
            }
        });
    } else {
        console.log('Недостаточно данных для анализа троек по картам.');
    }

    // Винрейт и лузрейт отдельных героев
    console.log('\n========== ВИНРЕЙТ И ЛУЗРЕЙТ ГЕРОЕВ ==========');
    console.log('(Топ-15 по популярности)\n');
    
    stats.characterStats.slice(0, 15).forEach((char, index) => {
        const totalGames = char.wins + char.losses;
        console.log(`${index + 1}. ${char.characterName}`);
        console.log(`   Пиков: ${char.totalPicks}, Игр команд: ${totalGames}`);
        console.log(`   Винрейт: ${char.winRate.toFixed(1)}% (${char.wins}W), Лузрейт: ${char.loseRate.toFixed(1)}% (${char.losses}L)`);
    });
}

