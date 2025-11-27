import * as path from 'path';
import * as fs from 'fs';
import { Match, MatchData } from '../team.types.js';
import { DATA_FOLDER, SCORES_FILENAMES, DEFAULT_TEAM_NAME } from '../../../config/constants.js';
import { analyzeTeamStats, displayTeamStats as showTeamStats } from './teamAnalyzer.js';
import { analyzePlayerStats, displayPlayerStats } from './playerAnalyzer.js';


const teamName = DEFAULT_TEAM_NAME;


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
        const filePath = path.resolve(process.cwd(), DATA_FOLDER, filename);
        
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            console.log(`  ⏭️  [${index + 1}/${filenames.length}] ${filename}: Файл не найден (еще не спарсен)`);
            return;
        }
        
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
 * Главная функция анализа команды
 * Выводит статистику конкретной команды: командную и персональную статистику игроков
 * @param filenames массив имен JSON файлов
 * @param teamName имя команды для анализа
 */
function runTeamAnalysis(filenames: string[], teamName: string): void {
    console.log('='.repeat(60));
    console.log(`АНАЛИЗ КОМАНДЫ: ${teamName}`);
    console.log('='.repeat(60));
    console.log();

    const matches = loadAllMatches(filenames);

    console.log(`\n📊 Всего загружено матчей: ${matches.length}\n`);

    if (matches.length === 0) {
        console.log('❌ Нет данных для анализа!');
        return;
    }

    // 1. Командная статистика (расширенная: включает тройки, героев, рейтинги)
    const teamStats = analyzeTeamStats(matches, teamName);
    showTeamStats(teamStats, teamName);

    // 2. Персональная статистика игроков команды
    const playerStats = analyzePlayerStats(matches, teamName);
    displayPlayerStats(playerStats);

    console.log('\n' + '='.repeat(60));
    console.log('АНАЛИЗ КОМАНДЫ ЗАВЕРШЕН');
    console.log('='.repeat(60));
}

runTeamAnalysis(SCORES_FILENAMES, teamName);
