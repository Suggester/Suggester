import {randomUUID} from 'node:crypto';

import {
  S3Client as AWSS3Client,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import {SuggestionAttachment} from '@prisma/client';
import mime from 'mime';

const SINGLE_UPLOAD_THRESHOLD = 25 * 1_024 * 1_024; // 25mb
export const MAX_FILE_SIZE = 100 * 1_024 * 1_024; // 100mb

export type S3ClientOptions = {
  [key in
    | 's3_access_key_id'
    | 's3_secret_access_key'
    | 's3_endpoint'
    | 's3_bucket']: string;
};

export class S3Client {
  #client: AWSS3Client;

  constructor(readonly options: S3ClientOptions) {
    this.#client = new AWSS3Client({
      forcePathStyle: true,
      endpoint: options.s3_endpoint,
      credentials: {
        accessKeyId: options.s3_access_key_id,
        secretAccessKey: options.s3_secret_access_key,
      },
    });
  }

  async uploadAttachment(
    file: Buffer,
    type: string,
    guildID: string,
    feedChannelID: string,
    suggestionID: number,
    userID: string
  ) {
    const key = this.keyFor(type, guildID, feedChannelID, suggestionID);
    const metadata = {'uploaded-by': userID};

    if (file.length > MAX_FILE_SIZE) {
      throw new Error('File too big');
    }

    if (file.length <= SINGLE_UPLOAD_THRESHOLD) {
      return {
        metadata: await this.upload(file, type, key, metadata),
        key,
      };
    } else {
      return {metadata: this.uploadMultiPart(file, type, key, metadata), key};
    }
  }

  private async upload(
    file: Buffer,
    type: string,
    key: string,
    metadata?: Record<string, string>
  ) {
    return this.#client.send(
      new PutObjectCommand({
        Key: key,
        Bucket: this.options.s3_bucket,
        ContentType: type,
        Body: file,
        Metadata: metadata,
      })
    );
  }

  private async uploadMultiPart(
    file: Buffer,
    type: string,
    key: string,
    metadata?: Record<string, string>
  ) {
    const parts = 5;

    let uploadID: string | undefined;
    try {
      const multipartUpload = await this.#client.send(
        new CreateMultipartUploadCommand({
          Key: key,
          ContentType: type,
          Metadata: metadata,
          Bucket: this.options.s3_bucket,
        })
      );

      uploadID = multipartUpload.UploadId;

      const partSize = Math.ceil(file.length / parts);

      const uploadParts = new Array(parts).fill(null).map((_, i) => {
        const start = partSize * i;
        const end = start + partSize;

        return this.#client.send(
          new UploadPartCommand({
            Key: key,
            Bucket: this.options.s3_bucket,
            Body: file.subarray(start, end),
            UploadId: uploadID,
            PartNumber: i + 1,
          })
        );
      });

      const uploadedParts = await Promise.all(uploadParts);

      const completedUpload = await this.#client.send(
        new CompleteMultipartUploadCommand({
          UploadId: uploadID,
          Key: key,
          Bucket: this.options.s3_bucket,
          MultipartUpload: {
            Parts: uploadedParts.map((p, i) => ({
              PartNumber: i + 1,
              ETag: p.ETag,
            })),
          },
        })
      );

      return completedUpload;
    } catch (err) {
      if (uploadID) {
        await this.#client.send(
          new AbortMultipartUploadCommand({
            Bucket: this.options.s3_bucket,
            Key: key,
            UploadId: uploadID,
          })
        );
      }

      throw err;
    }
  }

  async deleteAttachment(attachment: SuggestionAttachment) {
    console.log('deleting attachment', attachment.s3Key);
    return this.#client.send(
      new DeleteObjectCommand({
        Key: attachment.s3Key!,
        Bucket: this.options.s3_bucket,
      })
    );
  }

  private filename(type: string) {
    const uuid = randomUUID().replace(/-/g, '');
    const ext = mime.getExtension(type);
    return `${uuid}${ext ? `.${ext}` : ''}`;
  }

  private keyFor(
    type: string,
    guildID: string,
    feedChannelID: string,
    suggestionID: number
  ) {
    return [
      'attachments',
      guildID,
      feedChannelID,
      suggestionID,
      this.filename(type),
    ].join('/');
  }
}
