import dotenv from 'dotenv';

dotenv.config();

export interface AppEnv {
  botToken: string;
  dataDir: string;
  checkIntervalMs: number;
  adminIds: number[];
}

function parseAdminIds(value?: string): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => !Number.isNaN(id));
}

export function loadEnv(): AppEnv {
  const token = process.env.ADMIN_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('ADMIN_BOT_TOKEN is not set');
  }

  const dataDir = process.env.BOT_DATA_DIR || './data/bot';
  const checkIntervalMs = Number(process.env.CHECK_INTERVAL_MS ?? 60000);

  return {
    botToken: token,
    dataDir,
    checkIntervalMs: Number.isNaN(checkIntervalMs) ? 60000 : checkIntervalMs,
    adminIds: parseAdminIds(process.env.ADMIN_IDS),
  };
}

