import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import { Match, MatchData } from '../src/modules/ai-agent/team.types.js';
import { DATA_FOLDER, SCORES_FILENAMES, DEFAULT_TEAM_NAME } from '../src/config/constants.js';
import { analyzeTeamStats, displayTeamStats } from '../src/modules/ai-agent/analyzer/teamAnalyzer.js';
import { analyzePlayerStats, displayPlayerStats } from '../src/modules/ai-agent/analyzer/playerAnalyzer.js';
import { analyzeMatchStats, displayMatchStats } from '../src/modules/ai-agent/analyzer/matchAnalyzer.js';
import { analyzeGameStats, displayGameStats } from '../src/modules/ai-agent/analyzer/gameAnalyzer.js';

/**
 * Загружает и парсит данные из JSON-файла
 */
function loadJsonData(jsonPath: string): MatchData {
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Загружает все матчи из массива JSON файлов
 */
function loadAllMatches(filenames: string[]): Match[] {
  const allMatches: Match[] = [];

  filenames.forEach((filename) => {
    const filePath = path.resolve(process.cwd(), DATA_FOLDER, filename);

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      const data = loadJsonData(filePath);
      allMatches.push(...data.matches);
    } catch (error) {
      console.error(`Ошибка загрузки ${filename}: ${error}`);
    }
  });

  return allMatches;
}

test('Team analysis runs without errors', async () => {
  const matches = loadAllMatches(SCORES_FILENAMES);

  if (matches.length === 0) {
    console.log('⏭️  Пропуск теста: нет данных для анализа (запустите парсер)');
    return;
  }

  // Проверяем, что анализ команды работает
  const teamStats = analyzeTeamStats(matches, DEFAULT_TEAM_NAME);
  assert.ok(teamStats, 'Team stats should be defined');
  assert.ok(Array.isArray(teamStats.teamCompositions), 'Team compositions should be an array');
  assert.ok(Array.isArray(teamStats.heroPerformances), 'Hero performances should be an array');
  assert.ok(Array.isArray(teamStats.playerRankings), 'Player rankings should be an array');

  // Проверяем, что отображение не падает
  assert.doesNotThrow(() => {
    displayTeamStats(teamStats, DEFAULT_TEAM_NAME);
  }, 'displayTeamStats should not throw');

  console.log(`✅ Team analysis passed (${teamStats.teamCompositions.length} compositions, ${teamStats.heroPerformances.length} heroes)`);
});

test('Player analysis runs without errors', async () => {
  const matches = loadAllMatches(SCORES_FILENAMES);

  if (matches.length === 0) {
    console.log('⏭️  Пропуск теста: нет данных для анализа (запустите парсер)');
    return;
  }

  // Проверяем, что анализ игроков работает
  const playerStats = analyzePlayerStats(matches, DEFAULT_TEAM_NAME);
  assert.ok(playerStats, 'Player stats should be defined');
  assert.ok(Array.isArray(playerStats), 'Player stats should be an array');

  // Проверяем, что отображение не падает
  assert.doesNotThrow(() => {
    displayPlayerStats(playerStats);
  }, 'displayPlayerStats should not throw');

  console.log(`✅ Player analysis passed (${playerStats.length} players)`);
});

test('Match analysis runs without errors', async () => {
  const matches = loadAllMatches(SCORES_FILENAMES);

  if (matches.length === 0) {
    console.log('⏭️  Пропуск теста: нет данных для анализа (запустите парсер)');
    return;
  }

  // Проверяем, что анализ матчей работает
  const matchStats = analyzeMatchStats(matches);
  assert.ok(matchStats, 'Match stats should be defined');
  assert.ok(Array.isArray(matchStats.topDamagePlayers), 'Top damage players should be defined');
  assert.ok(Array.isArray(matchStats.topKillsPlayers), 'Top kills players should be defined');
  assert.ok(Array.isArray(matchStats.bestTeamsByPoints), 'Best teams by points should be defined');
  assert.ok(Array.isArray(matchStats.bestTeamsByPlacement), 'Best teams by placement should be defined');

  // Проверяем, что отображение не падает
  assert.doesNotThrow(() => {
    displayMatchStats(matchStats);
  }, 'displayMatchStats should not throw');

  console.log(`✅ Match analysis passed`);
});

test('Game analysis runs without errors', async () => {
  const matches = loadAllMatches(SCORES_FILENAMES);

  if (matches.length === 0) {
    console.log('⏭️  Пропуск теста: нет данных для анализа (запустите парсер)');
    return;
  }

  // Проверяем, что игровой анализ работает
  const gameStats = analyzeGameStats(matches);
  assert.ok(gameStats, 'Game stats should be defined');
  assert.ok(typeof gameStats.totalMaps === 'number', 'Total maps should be a number');
  assert.ok(gameStats.bans instanceof Map, 'Bans should be a Map');
  assert.ok(gameStats.characterPickRate instanceof Map, 'Character pick rate should be a Map');
  assert.ok(Array.isArray(gameStats.teamCompositions), 'Team compositions should be an array');

  // Проверяем, что отображение не падает
  assert.doesNotThrow(() => {
    displayGameStats(gameStats);
  }, 'displayGameStats should not throw');

  console.log(`✅ Game analysis passed (${gameStats.totalMaps} maps)`);
});

test('All analyzers work together', async () => {
  const matches = loadAllMatches(SCORES_FILENAMES);

  if (matches.length === 0) {
    console.log('⏭️  Пропуск теста: нет данных для анализа (запустите парсер)');
    return;
  }

  console.log(`\n📊 Тестирование всех анализаторов с ${matches.length} матчами\n`);

  // Запускаем все виды анализа последовательно
  assert.doesNotThrow(() => {
    // Team analysis
    const teamStats = analyzeTeamStats(matches, DEFAULT_TEAM_NAME);
    displayTeamStats(teamStats, DEFAULT_TEAM_NAME);

    // Player analysis
    const playerStats = analyzePlayerStats(matches, DEFAULT_TEAM_NAME);
    displayPlayerStats(playerStats);

    // Match analysis
    const matchStats = analyzeMatchStats(matches);
    displayMatchStats(matchStats);

    // Game analysis
    const gameStats = analyzeGameStats(matches);
    displayGameStats(gameStats);
  }, 'All analyzers should run without errors');

  console.log(`✅ All analyzers passed successfully`);
});

