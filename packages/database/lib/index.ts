import {PrismaClient} from '../prisma-out';

export class Database {
  readonly prisma;

  constructor(postgresURL: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: postgresURL,
        },
      },
    });
  }
}

// From https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
// NOTE: this is not all error codes, just the ones we're using
export enum PrismaErrorCode {
  UniqueConstraintViolation = 'P2002',
}

export * from '../prisma-out';
export * from './constants';
export * from './contextual';
