export const DATA_FOLDER = 'deployment/db';
export const BOT_DATA_FILE = 'bot-data.json';
export const DEFAULT_TEAM_NAME = 'SUPERNOVA';
export const DEFAULT_CHECK_INTERVAL = 60_000;
export const CHANNEL_STATUS_INTERVAL = 5 * 60_000;

// Список URL для парсинга лобби
export const LOBBY_URLS = [
  'https://eternalesports.club/lobbies/3/19882b',
  'https://eternalesports.club/lobbies/5/d15404',
  'https://eternalesports.club/lobbies/3/d580ee',
  'https://eternalesports.club/lobbies/4/a91cce',
  'https://eternalesports.club/lobbies/4/0ecb58',
  'https://eternalesports.club/lobbies/5/c7d30f',
  'https://eternalesports.club/lobbies/301/92bc2c',
];

// Автоматически генерируем имена файлов из URL лобби
export const SCORES_FILENAMES = LOBBY_URLS.map((url) => {
  const match = url.match(/lobbies\/(\d+)\/([a-f0-9]+)/);
  if (!match) throw new Error(`Invalid lobby URL: ${url}`);
  const [, id, hash] = match;
  return `lobbies_${id}_${hash}_scores.json`;
});
