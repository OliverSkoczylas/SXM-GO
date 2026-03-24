import { logger, consoleTransport } from 'react-native-logs';

const config = {
  transport: consoleTransport,
  severity: __DEV__ ? 'debug' : 'warn',
  async: true,
  printLevel: false,
  printDate: true,
  dateFormat: 'time',
};

export const log = logger.createLogger(config);
