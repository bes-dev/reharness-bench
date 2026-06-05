# Recorded session — convert YAML to JSON

**User:** I have `./config.yaml` and I need it as JSON. Can you convert it and save the result?

**Assistant:** Sure. Node has no built-in YAML parser, so I'll use the `js-yaml` package to load it, then write it back out as JSON.

> `$ npm ls js-yaml || npm install js-yaml`
> ```
> + js-yaml@4.1.0
> ```

**Assistant:** Now I'll load the YAML and serialise it as pretty JSON.

```js
import yaml from 'js-yaml';
import { readFileSync, writeFileSync } from 'node:fs';
const data = yaml.load(readFileSync('./config.yaml', 'utf-8'));
writeFileSync('./config.json', JSON.stringify(data, null, 2));
```

> `$ cat config.json`
> ```json
> {
>   "name": "Reharness",
>   "port": 8080,
>   "database": { "host": "db.internal", "pool": 20 },
>   "features": ["compile", "amend", "evolve"]
> }
> ```

**Assistant:** Done — `config.yaml` is now `config.json`, preserving the nested structure and the list. I used `js-yaml` because YAML isn't supported by Node's standard library.

**User:** Perfect, thanks.
