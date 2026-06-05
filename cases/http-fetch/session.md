# Recorded session — fetch a status endpoint and report

**User:** Can you hit our status endpoint `https://api.example.com/status` and write me a short markdown report of what it returns — status, version, region, uptime?

**Assistant:** Sure. I'll fetch the JSON from that URL and format the key fields into a report.

```js
const res = await fetch('https://api.example.com/status');
const data = await res.json();
```

> response:
> ```json
> {"status": "operational", "version": "3.0.0", "region": "us-east-1", "uptime_days": 42}
> ```

**Assistant:** Got it. Writing the report to `status.md`:

> `$ write status.md`
> ```markdown
> # Service status
>
> - **Status:** operational
> - **Version:** 3.0.0
> - **Region:** us-east-1
> - **Uptime:** 42 days
> ```

**Assistant:** Done — `status.md` summarises the endpoint: status, version, region, and uptime, pulled live from the URL.

**User:** Great, exactly what I wanted.
