// src/services/Logger.ts

import winston from 'winston';
import * as Sentry from '@sentry/node';
import { loadConfig } from '../deployment/config';

export class Logger {
  private logger: winston.Logger;
  private context: string;
  private config = loadConfig();

  constructor(context: string) {
    this.context = context;
    this.logger = winston.createLogger({
      level: this.config.LOG_LEVEL,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'dao-app', context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'combined.log'
        })
      ]
    });

    // Initialize Sentry if configured
    if (this.config.SENTRY_DSN) {
      Sentry.init({
        dsn: this.config.SENTRY_DSN,
        environment: this.config.NETWORK,
        tracesSampleRate: 1.0,
      });
    }
  }

  info(message: string, ...args: any[]) {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]) {
    this.logger.error(message, error, ...args);
    
    if (this.config.SENTRY_DSN && error) {
      Sentry.captureException(error, {
        extra: {
          context: this.context,
          args
        }
      });
    }
  }

  metrics(name: string, value: number, tags: Record<string, string> = {}) {
    this.logger.info('metric', {
      metric: name,
      value,
      tags: {
        context: this.context,
        ...tags
      }
    });
  }
}
