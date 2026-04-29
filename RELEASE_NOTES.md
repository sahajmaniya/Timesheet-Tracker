# Release Notes

## v1.0.0 (2026-04-29)

### Summary
- Stabilized authentication flows (OTP + password reset).
- Improved entries UX and responsive behavior across mobile/desktop.
- Finalized SA/ISA role-based PDF generation flow.
- Added SEO metadata + structured data improvements.
- Added conservative API rate limits for free-tier safety.
- Added database index optimization and backup script workflow.

### Included Commits
- `8a1f0fb` chore(scale): add conservative rate limits, db indexes, and backup workflow
- `260182a` refactor(timesheet): temporarily remove full-time role and related copy
- `9dc1700` docs(readme): sync auth, role-based PDF, SEO, and API updates
- `d550034` feat(seo): enrich homepage metadata/json-ld and clean sitemap
- `1df91bd` fix(dates): prevent timezone day shifts in entry defaults and PDF generated date
- `5e8589c` refactor(entries): declutter PDF autofill section with responsive split layout
- `09fa259` fix(ui): resolve iPhone input overflow and clean Tailwind class warnings
- `6f4cb92` chore(perf): add bundle/lighthouse tooling and API benchmark scripts

### Database Migration Applied
- `20260429093000_add_scaling_indexes`

### Rollback Plan
- Code rollback target: commit `8a1f0fb^` (or previous stable reference).
- Quick rollback command:

```bash
git checkout 8a1f0fb^
```

- If using Vercel, prefer redeploying the previous successful deployment from dashboard for faster recovery.

### Post-Release Validation Checklist
- Sign in works
- Excel import works
- CSV export works
- PDF generation works
- Forgot/reset password works

