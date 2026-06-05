# Recorded session — triage a customer message and reply with the right template

**User:** Read a customer message from `message.txt`, work out what they want — a refund, a complaint, or praise — and write the matching reply using our template for that intent.

**Assistant:** I'll classify the message into one of three intents (refund / complaint / praise), then write the reply from the template for that intent.

**Assistant:** Reading `message.txt`:

> "I was double-charged for my subscription this month and I'd like my money back, please."

This is a **refund** request — the customer is explicitly asking for their money back, not raising a service complaint or giving praise.

**Assistant:** Writing the refund reply to `reply.md` using the refund template:

> `$ write reply.md`
> ```markdown
> # Reply (intent: refund)
>
> Hi — thanks for flagging this. I've confirmed the duplicate charge and started your refund;
> it should land in 5–7 business days. Apologies for the hassle.
> ```

**Assistant:** Done — classified the message as a **refund** request and wrote the refund reply to `reply.md`.

**User:** Right. For a **complaint** you'd use the complaint template — apologise and give the escalation path; for **praise** you'd thank them and ask for a public review. But yes, this one is a refund. Good.
