# vite-plugin-importmap

I call this SASS at the code level.

我称之为代码层面的 SASS 化。

## 使用

```js
import importmap from 'vite-plugin-importmap'

const mark = process.env.VITE_OPEN_TYPE

export default defineConfig({
  plugins: [importmap(mark)]
})
```

## Example

[More](examples)

vite.config.js

```js
import importmap from 'vite-plugin-importmap'

const mark = 'v1'

export default defineConfig({
  plugins: [importmap(mark)]
})

```

### String

``` text
src
├─ main.js
├─ test.js
├─ test.v1.js
└─ test.v2.js
```

``` js
import test from 'test.js' // test.v1.js
```

### Array

``` text
src
├─ main.js
├─ test.js
└─ test[v1,v2].js
```

``` js
import test from 'test.js' // test[v1,v2].js
```

### JSON

``` text
├─ assets
│  ├─ cat.jpg
│  ├─ cat.other.jpg
│  ├─ cat.v3.jpg
│  └─ import.config.json
├─ src
│  ├─ import.config.json
│  ├─ main.js
│  ├─ test.js
│  ├─ test.other.js
│  └─ test.v3.js
├─ index.html
├─ package.json
├─ pnpm-lock.yaml
└─ vite.config.js
```

assets/import.config.json

``` json
{
  "cat.jpg": {
    "cat.other.jpg": ["v1", "v2"],
    "cat.v3.jpg": ["v3"]
  }
}
```

``` js
import imgUrl from '../assets/cat.jpg' // ../assets/cat.other.jpg
```

src/import.config.json

``` json
{
  "test.js": {
    "test.other.js": ["v1", "v2"],
    "test.v3.js": ["v3"]
  }
}
```

``` js
import test from './test' // ./test.other.js
```

## License

[License MIT](LICENSE)