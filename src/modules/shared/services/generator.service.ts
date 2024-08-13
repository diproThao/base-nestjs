import { Injectable } from '@nestjs/common';
import Crypto from 'crypto';
import slug from 'slug';
import { v1 as uuid } from 'uuid';

@Injectable()
export class GeneratorService {
  public uuid(): string {
    return uuid();
  }
  public fileName(ext: string): string {
    return this.uuid() + '.' + ext;
  }

  getDateString(): string {
    const now = new Date();
    const day = now.getDate() < 10 ? `0${now.getDate()}` : now.getDate();
    const month =
      now.getMonth() < 9 ? `0${now.getMonth() + 1}` : now.getMonth() + 1;
    return `${day}-${month}-${now.getFullYear()}`;

    //
  }

  getRandomString(): string {
    return Crypto.randomBytes(8).toString('hex');
  }

  getFileName(fileName: string, prependDate = false): string {
    const index = fileName.indexOf('.');
    const file = fileName.substring(0, index);
    const extension = fileName.substring(index);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const name = `${slug(`${file}-${this.getRandomString()}`)}${extension}`;

    if (prependDate) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `${this.getDateString()}/${name}`;
    }
    return name;
  }
}
