import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConnectionManager, getConnectionManager } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { hasShowDebugInfo } from '.';

export const DEFAULT_CONNECTION_NAME = 'default_connection';

export function hasSynchronizeDatabase() {
  return ['1', 'true'].includes(process.env.SYNC_DB);
}

export function getPostgresOption(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    logging: hasShowDebugInfo(),
    host: process.env.DB_URL,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    entities: [__dirname + '/../entities/**{.ts,.js}'],
    synchronize: hasSynchronizeDatabase(),
    namingStrategy: new SnakeNamingStrategy(),
    subscribers: [],
  } as TypeOrmModuleOptions;
}

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const connectionManager: ConnectionManager = getConnectionManager();
    let options: any;
    if (connectionManager.has(DEFAULT_CONNECTION_NAME)) {
      const connection = connectionManager.get(DEFAULT_CONNECTION_NAME);
      options = connection.options;
      await connection.close();
    } else {
      options = getPostgresOption();
    }
    return options;
  }
}
