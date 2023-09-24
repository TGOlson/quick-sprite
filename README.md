# quick-sprite

Small utility to quicky generate sprites from multiple images.

There are a lot of options for building Sprites! Use this library if you want a non-opinionated solution that is easy to call programaticaly in a `node` context (a lot of other libraries assume build pipelines or access to Browser types). 

You may also like this library if you are already using [`Jimp`](https://www.npmjs.com/package/jimp) to handle image processing.

### setup

```
npm install quick-sprite --save
```

### usage 

`createSprite` is the only exported method from this library. Generate sprite images by providing this method a list of input sources.

```ts
import {createSprite} from 'quick-sprite';

const sources: ImageSource[] = [
  {key: 'image1', path: '<file-path-1>'},
  {key: 'image2', path: '<file-path-2>'},
  {key: 'image3', path: '<file-path-3>'},
];

createSprite(sources).then(({image, mapping}: Sprite) => {
  image.write('<output-path>');
});
```

### options

Calls to `createSprite` can receive `Options` as a second arguement. Default options will work for most use cases, but can be modified for additional flexibility. 

```ts
const DEFAULT_OPTIONS: Options = {
  fillMode: {type: 'row', maxWidth: 4096},
  dedupe: false,
  transform: (_x, y) => y,
  debug: false,
}
```

### types

```ts
function createSprite(sources: ImageSource[], partialOptions: Partial<Options>): Promise<Sprite>

type ImageSource 
  = {key: string, path: string} 
  | {key: string, image: Jimp} 
  | {key: string, buffer: Buffer}

type Options = {
  fillMode: {type: 'row', maxWidth: number} | {type: 'vertical'} | {type: 'horizontal'};
  dedupe: false | {diffPercent: number};
  transform: (key: string, image: Jimp) => Jimp,
  debug: boolean,
}

type Sprite = {
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
```

### advanced usage

For more advanced usage, set the `transform` option, or modify the returned `Jimp` instance. 

eg. resize images by using `Options.transform`: 

```
transform: (_key, image) => image.resize(width, height)
```

eg. make image black and white:

```
createSprite(...).then(({image}) => image.greyscale())
```

Use [`Jimp`](https://www.npmjs.com/package/jimp) docs to reference all possible API calls. 

### development

Install deps

```
npm install
```

Compile and typecheck

```
npm run build

// or

npm run watch
```

Run test

```
npm run test
```
