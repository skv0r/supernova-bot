type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const levelEmojis: Record<LogLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  debug: '🐞',
};

export class Logger {
  constructor(private scope: string) {}

  info(message: string, ...meta: unknown[]): void {
    this.log('info', message, meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.log('warn', message, meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.log('error', message, meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    if (process.env.DEBUG !== 'true') {
      return;
    }
    this.log('debug', message, meta);
  }

  private log(level: LogLevel, message: string, meta: unknown[]): void {
    const prefix = `${levelEmojis[level]} [${this.scope}]`;
    const formatted = meta.length > 0 ? `${message} ${JSON.stringify(meta)}` : message;
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`${prefix} ${formatted}`);
  }
}

