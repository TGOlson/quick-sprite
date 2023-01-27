# sprite-generator

Small utility to quicky generate sprites from multiple images. 

### usage

This library exports a single function: `createSprite`. This function takes in an array of sources along with a set of options, and returns a promise of a `Sprite`. For the majority of cases the default options will work fine. 

Note: this function does not save the result by default. Saving or other image processing can be done using the returned [`Jimp`](https://www.npmjs.com/package/jimp) instance. 

```js
function createSprite(sources: ImageSource[], partialOptions: Partial<Options>): Promise<Sprite>
```

Example of common usage:

```js
const sources = [
  {key: 'image1', path: '<file-path-1>'},
  {key: 'image2', path: '<file-path-2>'},
  {key: 'image3', path: '<file-path-3>'},
];

createSprite(sources).then(({image, mapping}) => {
  image.write('<output-path>');
});
```

Types

```js
type ImageSource = {key: string, path: string} | {key: string, image: Jimp} | {key: string, buffer: Buffer};

type Options = {
  fillMode: FillMode;
  maxWidth: number;
  dedupe: boolean;
  padding: number;
  transform: (key: string, image: Jimp) => Jimp,
}

enum FillMode {
  VERTICAL,
  HORIZONTAL,
  ROW
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
