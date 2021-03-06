const fs = require("fs");
import { GraphQLUpload } from "graphql-upload";
import { Resolver, Mutation, Arg, ObjectType, Field } from "type-graphql";
import { Stream } from "stream";
import { Storage } from "@google-cloud/storage";
import uniqid from "uniqid";

/*const credentials = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key
    ? process.env.private_key.replace(/\\n/g, "\n")
    : "",
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url
};*/

export interface Upload {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
}

//https://github.com/MichalLytek/type-graphql/issues/37

@ObjectType()
export class UploadResult {
  @Field(() => [String], { nullable: true })
  uploaded: string;
}

@Resolver()
export class UploadResolver {
  @Mutation(() => UploadResult)
  async fileUpload(
    @Arg("fileInput", () => GraphQLUpload)
    { filename, createReadStream }: Upload
  ): Promise<string> {
    const results = new Promise<string>((resolve, reject) =>
      createReadStream().pipe(
        fs
          .createWriteStream(__dirname + `/../images/${filename}`)
          .on("error", (error: any) => {
            reject(error);
          })
          .on("finish", () => {
            resolve(filename);
          })
      )
    );
    return await results;
  }

  @Mutation(() => String)
  async uploadToCloud(
    @Arg("fileInput", () => GraphQLUpload)
    { createReadStream, encoding }: Upload
  ): Promise<string> {
    const newMimetype = "image/webp";
    const extension = ".webp";
    const storage = new Storage({
      projectId: process.env.project_id,
      credentials: {
        client_email: process.env.client_email,
        private_key: process.env.private_key
          ? process.env.private_key.replace(/\\n/g, "\n")
          : ""
      }
    });
    const newFilename = (uniqid() + extension).toLowerCase();

    const writeStream = storage
      .bucket("hvlskape.appspot.com")
      .file("post-pictures/" + newFilename)
      .createWriteStream({
        gzip: true,
        metadata: {
          cacheControl: "public, max-age=31536000",
          contentEncoding: encoding,
          contentType: newMimetype
        },
        public: true
      });

    const result  = new Promise<string>((resolve, reject) =>
      createReadStream()
        .pipe(writeStream)
        .on("error", (error: any) => {
          reject(error);
        })
        .on("finish", () => {
          resolve(`https://storage.cloud.google.com/hvlskape.appspot.com/post-pictures/${newFilename}`);
        })
    );

    return await result

  }
}
