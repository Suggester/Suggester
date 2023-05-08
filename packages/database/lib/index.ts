import {PrismaClient} from '../prisma-out';
import {S3Client, S3ClientOptions} from './s3';

export class Database {
  readonly prisma: PrismaClient;
  readonly s3: S3Client;

  constructor(options: S3ClientOptions & {postgres_url: string}) {
    this.s3 = new S3Client(options);
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: options.postgres_url,
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
export * from './s3';
