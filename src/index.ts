import Jimp from 'jimp/es';
import { FillMode, ImageSource, Options, Sprite } from './types';

export const DEFAULT_OPTIONS: Options = {
  fillMode: FillMode.VERTICAL,
  maxWidth: 3072, // only used with FillMode.Row; 3072 = max canvas width for some browsers
  dedupe: false,
  padding: 0,
  transform: (_x, y) => y,
}

const read = (source: ImageSource): Promise<Jimp> => {
  // kind of weird type refinement required because of overloaded Jimp.read function
  if ('path' in source) {
    return Jimp.read(source.path);
  } else if ('image' in source) {
    return Jimp.read(source.image);
  } else {
    return Jimp.read(source.buffer);
  }
} 

type Spec = {
  key: string,
  image: Jimp,
  x: number,
  y: number,
};

const buildSpecs = (images: {key: string, image: Jimp}[], options: Options): Spec[] => {
  const specs: Spec[] = [];
  const dupeHash: {[key: string]: Spec} = {} // only used of options.dedupe = true
  let offsetY = options.padding;
  let offsetX = options.padding;
  let maxHeightInRow = options.padding;

  images.forEach(({image: baseImage, key}, i) => {
    const image = options.transform(key, baseImage);
    
    if (image.getWidth() + (options.padding * 2) > options.maxWidth) {
      image.resize(options.maxWidth - (options.padding * 2), Jimp.AUTO);
    }

    const width = image.getWidth();
    const height = image.getHeight();
    const imageHash = image.hash();

    if (options.dedupe && dupeHash[imageHash]) {
      const dupeSpec = dupeHash[imageHash];
      
      specs.push({...dupeSpec, key});
      return;
    }

    // check if next image will overflow the row, if so, start new row
    if (options.fillMode === FillMode.ROW && offsetX + width > options.maxWidth) {
      offsetX = options.padding;
      offsetY += maxHeightInRow + options.padding;
      maxHeightInRow = options.padding;
    }
    
    // track the largest image in the row
    if (options.fillMode === FillMode.ROW && (height + options.padding) > maxHeightInRow) {
      maxHeightInRow = height + options.padding;
    }

    const spec: Spec = {
      key,
      image,
      x: offsetX,
      y: offsetY,
    }

    specs.push(spec);
    
    if (options.fillMode === FillMode.VERTICAL) {
      offsetY += height + options.padding;
    }
      
    if (options.fillMode === FillMode.HORIZONTAL || options.fillMode === FillMode.ROW) {
      offsetX += width + (options.padding * 2);
    }

    // add hash to map if tracking dupes
    if (options.dedupe) {
      dupeHash[imageHash] = spec;
    }
  });

  return specs;
}

export async function createSprite(sources: ImageSource[], partialOptions: Partial<Options> = DEFAULT_OPTIONS): Promise<Sprite> {
  const options = {...DEFAULT_OPTIONS, ...partialOptions};

  const imagesPromises = sources.map((source) => {
    return read(source).then(image => ({key: source.key, image}));
  });

  const images = await Promise.all(imagesPromises);

  const specs = buildSpecs(images, options);

  const totalWidth = Math.max(...specs.map(({x, image}) => x + image.getWidth())) + options.padding;
  const totalHeight = Math.max(...specs.map(({y, image}) => y + image.getHeight())) + options.padding;

  const image = new Jimp(totalWidth, totalHeight, '#ffffff');

  specs.forEach(spec => {
    image.composite(spec.image, spec.x, spec.y);
  });

  const mapping = specs.reduce((map, {key, x, y, image}) => {
    return {...map, [key]: {x, y, width: image.getWidth(), height: image.getHeight()}};
  }, {});

  return {image, mapping};
}
