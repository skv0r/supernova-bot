import * as path from 'path';
import * as fs from 'fs';
import { Match, MatchData } from '../../libs/types/team.types';
import { dataFolder, scoresFilenames } from '../../libs/config/config';
import { fileURLToPath } from 'url';
import { analyzeGameStats, displayGameStats } from './gameAnalyzer';
import { analyzeMatchStats, displayMatchStats as showMatchStats } from './matchAnalyzer';


const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);


/**
 * Загружает и парсит данные из JSON-файла
 * @param jsonPath абсолютный путь к .json файлу
 */
function loadJsonData(jsonPath: string): MatchData {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(raw);
}

/**
 * Загружает все матчи из массива JSON файлов
 * @param filenames массив имен файлов
 * @returns объединенный массив матчей
 */
function loadAllMatches(filenames: string[]): Match[] {
    const allMatches: Match[] = [];
    
    console.log(`📂 Загрузка данных из ${filenames.length} файлов...\n`);
    
    filenames.forEach((filename, index) => {
        const filePath = path.resolve(moduleDir, dataFolder, filename);
        
        try {
            const data = loadJsonData(filePath);
            allMatches.push(...data.matches);
            console.log(`  ✅ [${index + 1}/${filenames.length}] ${filename}: ${data.matches.length} матчей`);
        } catch (error) {
            console.error(`  ❌ [${index + 1}/${filenames.length}] ${filename}: Ошибка загрузки - ${error}`);
        }
    });
    
    return allMatches;
}

/**
 * Главная функция анализа общей статистики матчей
 * Выводит статистику по всем командам и игрокам, игровую статистику
 * @param filenames массив имен JSON файлов
 */
function runMatchAnalysis(filenames: string[]): void {
    console.log('='.repeat(60));
    console.log(`ОБЩАЯ СТАТИСТИКА МАТЧЕЙ`);
    console.log('='.repeat(60));
    console.log();

    const matches = loadAllMatches(filenames);

    console.log(`\n📊 Всего загружено матчей: ${matches.length}\n`);

    if (matches.length === 0) {
        console.log('❌ Нет данных для анализа!');
        return;
    }

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

runMatchAnalysis(scoresFilenames);

