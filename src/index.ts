import Jimp from 'jimp';

export type ImageSource 
  = {key: string, path: string} 
  | {key: string, image: Jimp} 
  | {key: string, buffer: Buffer};

export type Options = {
  fillMode: {type: 'row', maxWidth: number} | {type: 'vertical'} | {type: 'horizontal'};
  dedupe: false | {diffPercent: number};
  transform: (key: string, image: Jimp) => Jimp,
  debug: boolean,
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

export const DEFAULT_OPTIONS: Options = {
  // Rough stats on max texture size support
  // > 99.9% of devices support 4096x4096
  // ~80% of devices support 8192x8192
  // ~70% of devices support 16384x16384
  fillMode: {type: 'row', maxWidth: 4096},
  dedupe: false,
  transform: (_x, y) => y,
  debug: false,
}

const read = (source: ImageSource): Promise<Jimp> => {
  // kind of weird type refinement required because of overloaded Jimp.read function
  if ('path' in source) return Jimp.read(source.path);
  if ('image' in source) return Jimp.read(source.image);
  
  return Jimp.read(source.buffer);
} 

type Spec = {
  key: string,
  image: Jimp,
  x: number,
  y: number,
};

const debug = (opts: Options, msg: string) => opts.debug ? console.log(`[DEBUG/quick-sprite]: ${msg}`) : null;

const buildSpecs = (images: {key: string, image: Jimp}[], options: Options): Spec[] => {
  const {fillMode, dedupe} = options;
  
  const specs: Spec[] = [];
  const dupeHash: {[key: string]: Spec[]} = {} // only used if options.dedupe = true
  
  let offsetY = 0;
  let offsetX = 0;
  let maxHeightInRow = 0;

  images.forEach(({image: baseImage, key}) => {
    const image = options.transform(key, baseImage);

    const width = image.getWidth();
    const height = image.getHeight();
    const imageHash = image.hash();

    if (dedupe) {
      const dupeSpecs = dupeHash[imageHash] || [];

      // just checking the hash isn't enough as sometimes we'll get collisions (on small images especially)
      // if hashes are the same, then do an actual diff to determine if this is a dupe
      const dupeSpec = dupeSpecs.find(({image: dupeImage}) => Jimp.diff(image, dupeImage).percent <= dedupe.diffPercent);

      if (dupeSpec) {
        specs.push({...dupeSpec, key});
        return;
      }

      // if no dupe found, just continue on...
    }

    // check if next image will overflow the row, if so, start new row
    if (fillMode.type === 'row' && offsetX + width > fillMode.maxWidth) {
      offsetX = 0;
      offsetY += maxHeightInRow;
      maxHeightInRow = 0;
    }
    
    // track the largest image in the row
    if (fillMode.type === 'row') maxHeightInRow = Math.max(maxHeightInRow, height);

    const spec: Spec = {
      key,
      image,
      x: offsetX,
      y: offsetY,
    }

    specs.push(spec);
    
    // update offsets for next image
    if (fillMode.type === 'vertical') offsetY += height;
    if (fillMode.type === 'horizontal' || fillMode.type === 'row') offsetX += width;

    // add hash to map if tracking dupes
    if (dedupe) {
      dupeHash[imageHash] = dupeHash[imageHash] || []
      dupeHash[imageHash]?.push(spec);
    }
  });

  return specs;
}

export async function createSprite(sources: ImageSource[], partialOptions: Partial<Options> = DEFAULT_OPTIONS): Promise<Sprite> {
  const options = {...DEFAULT_OPTIONS, ...partialOptions};

  debug(options, 'reading image sources...');
  const images = await Promise.all(sources.map((source) => {
    return read(source).then(image => ({key: source.key, image}));
  }));
  
  debug(options, 'building specs...');
  const specs = buildSpecs(images, options);
  
  const totalWidth = Math.max(...specs.map(({x, image}) => x + image.getWidth()));
  const totalHeight = Math.max(...specs.map(({y, image}) => y + image.getHeight()));
  
  const image = new Jimp(totalWidth, totalHeight, '#ffffff');
  
  debug(options, 'generating composite image...');
  specs.forEach(spec => {
    image.composite(spec.image, spec.x, spec.y);
  });
  
  debug(options, 'creating image mapping...');
  const mapping = specs.reduce((map, {key, x, y, image}) => {
    return {...map, [key]: {x, y, width: image.getWidth(), height: image.getHeight()}};
  }, {});
  
  debug(options, 'done!');
  return {image, mapping};
}
