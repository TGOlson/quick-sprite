import assert from 'assert';
import Jimp from 'jimp/es';
import path from 'path';

import {createSprite} from '../src';
import { assertImagesEqual, testAsync } from './utils';

const p = (x: string): string => path.resolve(__dirname, x);
const imagePath = (fileName: string): string => p(`./images/${fileName}`);
const outputPath = (fileName: string): string => p(`./debug_output/${fileName}`);
const expectedPath = (fileName: string): string => p(`./expected/${fileName}`);

const ATL = {key: 'ATL', path: imagePath('ATL.png')};
const BOS = {key: 'BOS', path: imagePath('BOS.png')};
const CHA = {key: 'CHA', path: imagePath('CHA.png')};
const CHI = {key: 'CHI', path: imagePath('CHI.png')};
const MIN_LARGE = {key: 'MIN_large', path: imagePath('MIN_large.png')};
const MIN_SMALL = {key: 'MIN_small', path: imagePath('MIN_small.png')};

const paths = [ATL, BOS, CHA, CHI];

testAsync('Generator can create vertical sprites', async () => {
  const {image, mapping} = await createSprite(paths)
  
  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 125, height: 125 },
    BOS: { x: 0, y: 125, width: 125, height: 125 },
    CHA: { x: 0, y: 250, width: 125, height: 125 },
    CHI: { x: 0, y: 375, width: 125, height: 125 }
  });

  const expected = await Jimp.read(expectedPath('vertical_default.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can create horizontal sprites', async () => {
  const {image, mapping} = await createSprite(paths, {fillMode: 'horizontal'});

  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 125, height: 125 },
    BOS: { x: 125, y: 0, width: 125, height: 125 },
    CHA: { x: 250, y: 0, width: 125, height: 125 },
    CHI: { x: 375, y: 0, width: 125, height: 125 }
  });

  const expected = await Jimp.read(expectedPath('horizontal_default.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can create row sprites', async () => {
  const {image, mapping} = await createSprite(paths, {fillMode: 'row', maxWidth: 300});
  
  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 125, height: 125 },
    BOS: { x: 125, y: 0, width: 125, height: 125 },
    CHA: { x: 0, y: 125, width: 125, height: 125 },
    CHI: { x: 125, y: 125, width: 125, height: 125 }
  });

  const expected = await Jimp.read(expectedPath('fill_default.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can create row sprites with different size images', async () => {
  const paths = [ATL, BOS, MIN_SMALL, CHA, CHI, MIN_LARGE];
  const {image, mapping} = await createSprite(paths, {fillMode: 'row', maxWidth: 300});
  
  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 125, height: 125 },
    BOS: { x: 125, y: 0, width: 125, height: 125 },
    MIN_small: { x: 0, y: 125, width: 75, height: 75 },
    CHA: { x: 75, y: 125, width: 125, height: 125 },
    CHI: { x: 0, y: 250, width: 125, height: 125 },
    MIN_large: { x: 0, y: 375, width: 200, height: 200 }
  });

  const expected = await Jimp.read(expectedPath('fill_multisize.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can dedupe input images', async () => {
  const paths = [
    ATL, 
    {...ATL, key: 'ATL_2'}, 
    BOS, 
    MIN_SMALL, 
    {...BOS, key: 'BOS_2'},
    CHA, 
    CHI, 
    MIN_LARGE, 
    {...ATL, key: 'ATL_3'}, 
  ];

  const {image, mapping} = await createSprite(paths, {fillMode: 'row', maxWidth: 300, dedupe: true});

  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 125, height: 125 },
    ATL_2: { x: 0, y: 0, width: 125, height: 125 },
    BOS: { x: 125, y: 0, width: 125, height: 125 },
    MIN_small: { x: 0, y: 125, width: 75, height: 75 },
    BOS_2: { x: 125, y: 0, width: 125, height: 125 },
    CHA: { x: 75, y: 125, width: 125, height: 125 },
    CHI: { x: 0, y: 250, width: 125, height: 125 },
    MIN_large: { x: 0, y: 125, width: 75, height: 75 },
    ATL_3: { x: 0, y: 0, width: 125, height: 125 }
  });

  const expected = await Jimp.read(expectedPath('fill_multisize.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can transform images while making sprite', async () => {
  const transform = (_key: string, image: Jimp) => image.resize(50,50).greyscale();
  const {image, mapping} = await createSprite(paths, {transform});

  image.write(outputPath('test6.png'));
  
  assert.deepEqual(mapping, {
    ATL: { x: 0, y: 0, width: 50, height: 50 },
    BOS: { x: 0, y: 50, width: 50, height: 50 },
    CHA: { x: 0, y: 100, width: 50, height: 50 },
    CHI: { x: 0, y: 150, width: 50, height: 50 }
  });

  const expected = await Jimp.read(expectedPath('vertical_transform.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator can add padding', async () => {
  const paths = [
    {key: 'red_1', path: imagePath('red.png')},
    {key: 'red_2', path: imagePath('red.png')},
    {key: 'red_3', path: imagePath('red.png')},
    {key: 'red_4', path: imagePath('red.png')},
  ]
  const {image, mapping} = await createSprite(paths, {fillMode: 'row', maxWidth: 300, padding: 20});

  assert.deepEqual(mapping, {
    red_1: { x: 20, y: 20, width: 100, height: 100 },
    red_2: { x: 160, y: 20, width: 100, height: 100 },
    red_3: { x: 20, y: 160, width: 100, height: 100 },
    red_4: { x: 160, y: 160, width: 100, height: 100 }
  });

  const expected = await Jimp.read(expectedPath('fill_padding.png'));
  assertImagesEqual(image, expected);
});

testAsync('Generator will resize if image is greater than max width', async () => {
  const paths = [
    {key: 'red_1', path: imagePath('red.png')},
    {key: 'red_2', path: imagePath('red.png')},
    {key: 'red_3', path: imagePath('red.png')},
    {key: 'red_4', path: imagePath('red.png')},
  ]
  const {image, mapping} = await createSprite(paths, {fillMode: 'row', maxWidth: 50, padding: 10});

  assert.deepEqual(mapping, {
    red_1: { x: 10, y: 10, width: 30, height: 30 },
    red_2: { x: 10, y: 60, width: 30, height: 30 },
    red_3: { x: 10, y: 110, width: 30, height: 30 },
    red_4: { x: 10, y: 160, width: 30, height: 30 }
  });

  const expected = await Jimp.read(expectedPath('fill_resize.png'));
  assertImagesEqual(image, expected);
});
