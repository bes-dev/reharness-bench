# Recorded session — extract names from JSON

**User:** There's a `./users.json` file — it's an array of objects, each with a `name` and `email`. Can you pull out just the names into a plain list, one per line, and save it?

**Assistant:** Sure. Let me check the shape first.

> `$ head -c 200 ./users.json`
> ```json
> [{"name":"Ada Lovelace","email":"ada@x.io"},{"name":"Alan Turing","email":"alan@x.io"}]
> ```

**Assistant:** Array of `{name, email}`. I'll read it, map to the `name` field, and write one name per line to `names.txt`.

> `$ write names.txt`
> ```
> Ada Lovelace
> Alan Turing
> ```

**Assistant:** Done — `names.txt` lists each `name` from the array, one per line (2 names here). Emails are dropped, as asked.

**User:** Perfect.
