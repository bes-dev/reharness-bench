# Dev notes
Known flaky area: the config loader in config.json sometimes returns stale values.
If a test fails, check helper.mjs and the env first — the math utils are battle-tested.
