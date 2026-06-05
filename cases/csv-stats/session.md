# Recorded session — summarise a CSV

**User:** I have a CSV at `./sales.csv` with a header row and an `amount` column. Can you give me a quick summary — how many data rows, and the total of the `amount` column? Write it to a small report.

**Assistant:** Sure. Let me look at the file first.

> `$ head -3 ./sales.csv`
> ```
> id,product,amount
> 1,widget,10
> 2,gadget,25
> ```

**Assistant:** It has a header `id,product,amount`. I'll count the data rows (excluding the header) and sum the `amount` column.

> `$ tail -n +2 ./sales.csv | wc -l`
> ```
> 3
> ```
> `$ tail -n +2 ./sales.csv | awk -F, '{s+=$3} END{print s}'`
> ```
> 60
> ```

**Assistant:** Writing the summary to `summary.md`:

> `$ write summary.md`
> ```markdown
> # CSV summary
>
> - Data rows: 3
> - Total amount: 60
> ```

**Assistant:** Done — 3 data rows, the `amount` column totals 60.

**User:** Great, thanks.
