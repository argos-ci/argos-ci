import type { S3Client } from "@aws-sdk/client-s3";
import gm from "gm";
import { unlink } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpName as cbTmpName } from "tmp";
import type { TmpNameCallback, TmpNameOptions } from "tmp";

import { download as s3Download } from "./download.js";
import { upload as s3Upload } from "./upload.js";

const gmMagick = gm.subClass({ imageMagick: true });

function transparent(
  filepath: string,
  { width, height }: { width: number; height: number }
) {
  const gmImage = gmMagick(filepath);
  gmImage.background("transparent"); // Fill in new space with white background
  gmImage.gravity("NorthWest"); // Anchor image to upper-left
  gmImage.extent(width, height); // Specify new image size
  return gmImage;
}

export const tmpName = promisify(
  (options: TmpNameOptions, cb: TmpNameCallback) => {
    cbTmpName(options, cb);
  }
);

interface Dimensions {
  width: number;
  height: number;
}

export interface ImageFile {
  getFilepath(): Promise<string> | string;
  getDimensions(): Promise<Dimensions>;
  unlink(): Promise<void>;
  enlarge(targetDimensions: Dimensions): Promise<string>;
}

abstract class AbstractImageFile implements ImageFile {
  abstract getFilepath(): Promise<string> | string;
  abstract unlink(): Promise<void>;

  dimensions: Dimensions | null = null;
  _measurePromise: Promise<Dimensions> | null = null;

  async measure() {
    const filepath = await this.getFilepath();
    const gf = gmMagick(filepath);
    return promisify((cb: gm.GetterCallback<gm.Dimensions>) => gf.size(cb))();
  }

  async getDimensions(): Promise<Dimensions> {
    if (this.dimensions) {
      return this.dimensions;
    }
    this._measurePromise = this._measurePromise ?? this.measure();
    return this._measurePromise;
  }

  async enlarge(targetDimensions: Dimensions): Promise<string> {
    const [dimensions, filepath] = await Promise.all([
      this.getDimensions(),
      this.getFilepath(),
    ]);
    if (
      dimensions.width > targetDimensions.width ||
      dimensions.height > targetDimensions.height ||
      (dimensions.height === targetDimensions.height &&
        dimensions.width === targetDimensions.width)
    ) {
      return filepath;
    }

    const gf = transparent(filepath, targetDimensions);
    const resultFilepath = await tmpName({ postfix: ".png" });
    await promisify(gf.write.bind(gf))(resultFilepath);
    return resultFilepath;
  }
}

export class S3ImageFile extends AbstractImageFile implements ImageFile {
  s3: S3Client;
  bucket: string;
  key: string | null;
  filepath: string | null;
  downloadFromS3Promise: Promise<string> | null;

  constructor(params: {
    s3: S3Client;
    bucket: string;
    filepath?: string;
    key?: string;
    dimensions?: Dimensions | null;
  }) {
    super();
    this.filepath = params.filepath ?? null;
    this.dimensions = params.dimensions ?? null;
    this.s3 = params.s3;
    this.bucket = params.bucket;
    this.key = params.key ?? null;
    this.downloadFromS3Promise = null;
  }

  private async downloadFromS3(): Promise<string> {
    if (!this.key) {
      throw new Error("Missing key");
    }
    const outputPath = await tmpName({});
    await s3Download({
      s3: this.s3,
      Bucket: this.bucket,
      Key: this.key,
      outputPath,
    });
    this.filepath = outputPath;
    return this.filepath;
  }

  async getFilepath(): Promise<string> {
    if (this.filepath) return this.filepath;
    this.downloadFromS3Promise =
      this.downloadFromS3Promise || this.downloadFromS3();
    return this.downloadFromS3Promise;
  }

  async unlink() {
    if (!this.filepath) return;
    const filepath = await this.getFilepath();
    await unlink(filepath);
  }

  async upload(): Promise<string> {
    if (this.key) {
      throw new Error("Already uploaded");
    }
    if (!this.filepath) {
      throw new Error("No filepath");
    }
    const result = await s3Upload({
      s3: this.s3,
      Bucket: this.bucket,
      inputPath: this.filepath,
    });
    this.key = result.Key;
    return this.key;
  }
}

export class LocalImageFile extends AbstractImageFile implements ImageFile {
  filepath: string;

  constructor(params: { filepath: string }) {
    super();
    this.filepath = params.filepath;
  }

  getFilepath(): string {
    return this.filepath;
  }

  async unlink() {
    // We do not remove images from the local filesystem (used in tests)
  }
}