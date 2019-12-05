const fs = require("fs");
import { GraphQLUpload, FileUpload } from "graphql-upload";
import { Resolver, Mutation, Arg, ObjectType, Field } from "type-graphql";
import isArray from "lodash/isArray";

//https://github.com/MichalLytek/type-graphql/issues/37

@ObjectType()
export class UploadResult {
  @Field(() => [String], {nullable: true })
  uploaded: string[];
}

@Resolver()
export class UploadResolver {
  @Mutation(() => UploadResult)
  async fileUpload(
    @Arg("fileInput", () => GraphQLUpload) fileInput: FileUpload
  ): Promise<string[]> {
    let readableStreams: FileUpload[] = [];
    if (isArray(fileInput)) {
      readableStreams = await Promise.all(fileInput as any);
    } else {
      readableStreams[0] = await fileInput;
    }
    const pipedStreams = readableStreams.map(readStreamInstance => {
      const { filename, createReadStream } = readStreamInstance;
      const writableStream = fs.createWriteStream(__dirname +`/../${filename}`, {
        autoClose: true
      });
      return new Promise<string>((resolve, reject) => {
        createReadStream()
          .pipe(writableStream)
          .on("error", (error: any) => {
            reject(error);
          })
          .on("finish", () => {
            resolve(filename);
          });
      });
    });
    const results = await Promise.all(pipedStreams);
    return results;
  }
}
