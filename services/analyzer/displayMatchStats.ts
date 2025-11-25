import * as path from 'path';
import * as fs from 'fs';
import { MatchData } from '../../libs/types/team.types';
import { dataFolder, scoresFilename } from '../../libs/config/config';
import { fileURLToPath } from 'url';
import { analyzeGameStats, displayGameStats } from './gameAnalyzer';
import { analyzeMatchStats, displayMatchStats as showMatchStats } from './matchAnalyzer';


const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const dataFilePath = path.resolve(moduleDir, dataFolder, scoresFilename);


/**
 * Загружает и парсит данные из JSON-файла
 * @param jsonPath абсолютный путь к .json файлу
 */
function loadJsonData(jsonPath: string): MatchData {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(raw);
}

/**
 * Главная функция анализа общей статистики матчей
 * Выводит статистику по всем командам и игрокам, игровую статистику
 * @param jsonPath абсолютный путь к .json файлу
 */
function runMatchAnalysis(jsonPath: string): void {
    console.log('='.repeat(60));
    console.log(`ОБЩАЯ СТАТИСТИКА МАТЧЕЙ`);
    console.log('='.repeat(60));

    const data = loadJsonData(jsonPath);
    const matches = data.matches;

    console.log(`\nЗагружено матчей: ${matches.length}`);

    // 1. Общая статистика матчей (топ игроков, лучшие команды)
    const matchStats = analyzeMatchStats(matches);
    showMatchStats(matchStats);

    // 2. Игровая статистика (баны, пикрейт, тройки героев, винрейт)
    const gameStats = analyzeGameStats(matches);
    displayGameStats(gameStats);

    console.log('\n' + '='.repeat(60));
    console.log('АНАЛИЗ ЗАВЕРШЕН');
    console.log('='.repeat(60));
}

runMatchAnalysis(dataFilePath);

