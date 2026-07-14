# Certificate Template

Place the **blank certificate PDF** (the designed one, without any name/date
filled in) in this folder named exactly:

```
template.pdf
```

When a certificate is issued from the portal, the system automatically writes
onto this template:

- **A** — Batch number (e.g. "29th", from the program's Batch field), placed
  before the pre-printed word "BATCH"
- **B** — Trainee's full name
- **C** — Training period ("from … at"), e.g. `4 Oct 2026 – 31 Oct 2026`
- **D** — Date of issue (above the "Date of Issue" rule)
- **E** — QR code linking to the public verification page (`/verify/<ref>`)
- **F** — Reference number

If this file is missing, the portal falls back to its built-in certificate
design, so nothing breaks.

Field positions are configured in
`apps/portal/lib/certificates/templateOverlay.ts` (the `POS` block) as
fractions of the page size — adjust there if any field needs nudging after
you review a generated certificate.
