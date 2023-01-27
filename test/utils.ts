import assert from 'assert';
import Jimp from "jimp/es";

export const testAsync = (label: string, cb: () => Promise<void>): void => {
  cb()
    .then(() => console.log(`[success]: ${label}`))
    .catch(err => console.error(`[fail]: ${label}\n\n${err}`));
}

export const assertImagesEqual = (actual: Jimp, expected: Jimp): void => {
  const diff = Jimp.diff(actual, expected);
  assert.equal(diff.percent, 0, 'Images are not identical');
}
