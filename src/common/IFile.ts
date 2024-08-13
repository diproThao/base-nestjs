'use strict';

export interface IFile {
  encoding: string;
  buffer: Buffer;
  fieldName: string;
  mimetype: string;
  originalname: string;
  size: number;
}
