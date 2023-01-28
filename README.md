# quick-sprite

Small utility to quicky generate sprites from multiple images.

There are a lot of options for building Sprites! Use this library if you want a non-opinionated solution that is easy to call programaticaly in a `node` context (a lot of other libraries assume build pipelines or access to Browser types). 

You may also like this library if you are already using [`Jimp`](https://www.npmjs.com/package/jimp) to handle image processing.

### setup

```
npm install quick-sprite --save
```

Note: the only external dependency for this library is `Jimp`, which in turn has zero native dependencies. Most image processing calls are passed through to `Jimp`, and the final return type includes a `Jimp` instance.


### usage 

`createSprite` is the only exported method from this library. Generate sprite images by providing this method a list of input sources and an optional set of options. 

```ts
import {createSprite} from 'quick-sprite';

const sources: ImageSource[] = [
  {key: 'image1', path: '<file-path-1>'},
  {key: 'image2', path: '<file-path-2>'},
  {key: 'image3', path: '<file-path-3>'},
];

createSprite(sources).then(({image, mapping}: Sprite) => {
  // do something with `mapping`
  image.write('<output-path>');
});
```

### options

Call to `createSprite` can receive `Options` as a second arguement. Default options will work for most use cases, but can be modified for additional flexibility. 

```ts
const DEFAULT_OPTIONS: Options = {
  fillMode: 'vertical',
  maxWidth: 3072, // only used with FillMode ='row'; 3072 = max canvas width for some browsers
  dedupe: false,
  padding: 0,
  transform: (_x, y) => y,
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
  fillMode: 'vertical' | 'horizontal' | 'row';
  maxWidth: number;
  dedupe: boolean;
  padding: number;
  transform: (key: string, image: Jimp) => Jimp,
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

Most advanced usage will involve using the `transform` options, or modifying the resulting `Jimp` instance. 

For example, images can be resized by using `Options.transform`: 

```
transform: (_key, image) => image.resize(width, height)
```

Or images can be made black and white by modifying the resulting `Sprite.image`: 

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
