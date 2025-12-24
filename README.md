


### Usage

Start local server and listen for changes in source.

```
npm run dev
```

Check for syntax errors and enforce strong typing.

```
npx tsc
```

Enforce coding style preferences defined in `estlint.config.ts`

```
npx eslint 
```

Run unit tests defined in `tests`

```
npx mocha
```


Validate .vert and .frag shaders

```
npx mocha --grep glsl
```

Test level solutions

```
npx mocha --grep simulation
```

Launch face editor with refrence images in background

```
npx ts-node tools/faces/dev-face-editor.ts
```