import * as path from 'path';
import * as fs from 'fs';
import { Player, Match, MatchData } from '../../libs/types/team.types';
import { dataFolder, scoresFilename, defaultTeamName } from '../../libs/config/config';
import { fileURLToPath } from 'url';


const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const dataFilePath = path.resolve(moduleDir, dataFolder, scoresFilename);

const teamName = defaultTeamName;


/**
 * Загружает и парсит данные из JSON-файла
 * @param jsonPath абсолютный путь к .json файлу
 */
function loadJsonData(jsonPath: string): MatchData {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(raw);
}

/**
 * Выводит статистику команды по всем матчам и суммарно
 * @param jsonPath абсолютный путь к .json файлу
 * @param teamName имя команды для анализа
 */
function displayTeamStats(jsonPath: string, teamName: string): void {
    const data = loadJsonData(jsonPath);
    let sessionTotalKills = 0;
    let sessionTotalDamage = 0;
    let sessionTotalPlayers = 0;

    data.matches.forEach((match: Match) => {
        let matchTotalKills = 0;
        let matchTotalDamage = 0;
        let matchTotalPlayers = 0;

        console.log(`\nМатч на карте: ${match.map_name}`);
        console.log(`Плейсмент команды: ${match.data[0]?.team_placement ?? "неизвестно"}`);

        match.data.forEach((player: Player) => {
            if (player.team_name === teamName) {
                matchTotalKills += player.kills;
                matchTotalDamage += player.damage_dealt;
                matchTotalPlayers++;
                console.log(`${player.player_name} на карте:`);
                console.log(`Киллы: ${player.kills}, Урон: ${player.damage_dealt}`);
            }
        });

        console.log(`\nОбщие киллы команды: ${matchTotalKills}`);
        console.log(`Общий урон команды: ${matchTotalDamage}`);
        console.log(`Общее количество игроков в команде: ${matchTotalPlayers}`);

        sessionTotalKills += matchTotalKills;
        sessionTotalDamage += matchTotalDamage;
        sessionTotalPlayers += matchTotalPlayers;
    });

    console.log('\n==== СУММАРНО за все матчи ===');
    console.log(`Суммарные киллы команды за серию матчей: ${sessionTotalKills}`);
    console.log(`Суммарный урон команды: ${sessionTotalDamage}`);
    console.log(`Общее количество учтённых записей игроков (по всем матчам): ${sessionTotalPlayers}`);
}

displayTeamStats(dataFilePath, teamName);
