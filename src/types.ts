import Jimp from 'jimp/es';

export type ImageSource 
  = {key: string, path: string} 
  | {key: string, image: Jimp} 
  | {key: string, buffer: Buffer};

export type Coordinates = {x: number, y: number};
export type Dimensions = {width: number, height: number};

export enum FillMode {
  VERTICAL,
  HORIZONTAL,
  ROW
}

export type Options = {
  fillMode: FillMode;
  maxWidth: number;
  dedupe: boolean;
  padding: number;
  transform: (key: string, image: Jimp) => Jimp,
}

export type Sprite = {
  mapping: {
    [key: string]: {
      x: number,
      y: number,
      width: number,
      height: number,
    }
  },
  image: Jimp,
}
