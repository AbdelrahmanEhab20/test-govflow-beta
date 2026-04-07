/**
 * Minimal structured logger.
 * Writes JSON to stdout so logs can be easily ingested by any tool later.
 */
const level = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function write(lvl, message, meta = {}) {
  if (levels[lvl] > levels[level]) return;
  const entry = { ts: new Date().toISOString(), level: lvl, message, ...meta };
  if (lvl === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (msg, meta) => write('error', msg, meta),
  warn:  (msg, meta) => write('warn',  msg, meta),
  info:  (msg, meta) => write('info',  msg, meta),
  debug: (msg, meta) => write('debug', msg, meta),
};
