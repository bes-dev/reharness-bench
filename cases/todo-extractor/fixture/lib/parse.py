def parse(rows):
    # FIXME: validate schema before parsing
    return [r.split(",") for r in rows if r]
