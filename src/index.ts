import Jimp from 'jimp';

export type ImageSource 
  = {key: string, path: string} 
  | {key: string, image: Jimp} 
  | {key: string, buffer: Buffer};

export type Options = {
  fillMode: 'vertical' | 'horizontal' | 'row';
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

export const DEFAULT_OPTIONS: Options = {
  fillMode: 'vertical',
  maxWidth: 3072, // only used with FillMode ='row'; 3072 = max canvas width for some browsers
  dedupe: false,
  padding: 0,
  transform: (_x, y) => y,
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

const buildSpecs = (images: {key: string, image: Jimp}[], options: Options): Spec[] => {
  const {padding, fillMode, dedupe, maxWidth} = options;
  
  const specs: Spec[] = [];
  const dupeHash: {[key: string]: Spec} = {} // only used of options.dedupe = true
  
  let offsetY = padding;
  let offsetX = padding;
  let maxHeightInRow = padding;

  images.forEach(({image: baseImage, key}) => {
    const image = options.transform(key, baseImage);
    
    // if this image w/ padding is wider than the total max width, size it down
    if (image.getWidth() + (padding * 2) > maxWidth) {
      image.resize(maxWidth - (padding * 2), Jimp.AUTO);
    }

    const width = image.getWidth();
    const height = image.getHeight();
    const imageHash = image.hash();

    // if this image is a duplicate, use previous spec and return
    const dupeSpec = dupeHash[imageHash]
    if (dedupe && dupeSpec) {
      specs.push({...dupeSpec, key});
      return;
    }

    // check if next image will overflow the row, if so, start new row
    if (fillMode === 'row' && offsetX + width + padding > maxWidth) {
      offsetX = padding;
      offsetY += maxHeightInRow + padding;
      maxHeightInRow = padding;
    }
    
    // track the largest image in the row
    if (fillMode === 'row' && height + padding > maxHeightInRow) {
      maxHeightInRow = height + padding;
    }

    const spec: Spec = {
      key,
      image,
      x: offsetX,
      y: offsetY,
    }

    specs.push(spec);
    
    // update offsets for next image
    if (fillMode === 'vertical') {
      offsetY += height + padding;
    }
      
    if (fillMode === 'horizontal' || fillMode === 'row') {
      offsetX += width + (padding * 2);
    }

    // add hash to map if tracking dupes
    if (dedupe) {
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
