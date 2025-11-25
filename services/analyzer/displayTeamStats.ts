import * as path from 'path';
import * as fs from 'fs';
import { MatchData } from '../../libs/types/team.types';
import { dataFolder, scoresFilename, defaultTeamName } from '../../libs/config/config';
import { fileURLToPath } from 'url';
import { analyzeTeamStats, displayTeamStats as showTeamStats } from './teamAnalyzer';
import { analyzePlayerStats, displayPlayerStats } from './playerAnalyzer';
import { analyzeTeamDetailedStats, displayTeamDetailedStats } from './teamDetailedAnalyzer';


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
 * Главная функция анализа команды
 * Выводит статистику конкретной команды: командную и персональную статистику игроков
 * @param jsonPath абсолютный путь к .json файлу
 * @param teamName имя команды для анализа
 */
function runTeamAnalysis(jsonPath: string, teamName: string): void {
    console.log('='.repeat(60));
    console.log(`АНАЛИЗ КОМАНДЫ: ${teamName}`);
    console.log('='.repeat(60));

    const data = loadJsonData(jsonPath);
    const matches = data.matches;

    console.log(`\nЗагружено матчей: ${matches.length}`);

    // 1. Командная статистика
    const teamStats = analyzeTeamStats(matches, teamName);
    showTeamStats(teamStats);

    // 2. Персональная статистика игроков команды
    const playerStats = analyzePlayerStats(matches, teamName);
    displayPlayerStats(playerStats);

    // 3. Детальная статистика команды (тройки, герои, рейтинги)
    const detailedStats = analyzeTeamDetailedStats(matches, teamName);
    displayTeamDetailedStats(detailedStats, teamName);

    console.log('\n' + '='.repeat(60));
    console.log('АНАЛИЗ КОМАНДЫ ЗАВЕРШЕН');
    console.log('='.repeat(60));
}

runTeamAnalysis(dataFilePath, teamName);
