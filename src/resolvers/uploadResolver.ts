const fs = require('fs');
import { UploadResult } from '../graphql/models/file';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { Resolver, Mutation, Arg } from 'type-graphql';
import isArray from 'lodash/isArray';

//https://github.com/MichalLytek/type-graphql/issues/37

  @Resolver()
  export class FileResolver {
    @Mutation(() => UploadResult)
    async fileUpload(@Arg('fileInput', () => GraphQLUpload) fileInput: FileUpload): Promise<UploadResult> {
      let readableStreams = [];
      if (isArray(fileInput)) {
        readableStreams = await Promise.all(fileInput);
      } else {
        readableStreams[0] = await fileInput;
      }
      const pipedStreams = readableStreams.map((readStreamInstance) => {
        const { filename, createReadStream } = readStreamInstance;
        const writableStream = fs.createWriteStream(`./${filename}`, { autoClose: true });
        return new Promise<string>((resolve, reject) => {
          createReadStream()
            .pipe(writableStream)
            .on('error', (error: any) => {
              reject(error);
            })
            .on('finish', () => {
              resolve(filename);
            });
        })
      });
      const results = await Promise.all(pipedStreams);
      return {
        uploaded: results
      }
    }
  }