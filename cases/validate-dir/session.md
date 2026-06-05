# Recorded session — find invalid JSON files

**User:** I have a folder `./data` full of `.json` files. Some are broken. Can you check each one and tell me which files don't parse as valid JSON? Write the bad ones into a report.

**Assistant:** Sure. I'll find every `.json` file under the folder, try to parse each, and list the ones that fail.

> `$ find ./data -name '*.json'`
> ```
> ./data/users.json
> ./data/config.json
> ./data/broken.json
> ```

**Assistant:** Parsing each one…

> `users.json` → valid
> `config.json` → valid
> `broken.json` → ✗ `Unexpected token , in JSON at position 13`

**Assistant:** Writing the report to `invalid.md`:

> `$ write invalid.md`
> ```markdown
> # Invalid JSON files
>
> | File | Error |
> |------|-------|
> | broken.json | Unexpected token , in JSON at position 13 |
>
> 1 of 3 files failed to parse.
> ```

**Assistant:** Done — `broken.json` is the only file that doesn't parse; the other two are valid. The report lists each bad file with its parse error.

**User:** Great.
