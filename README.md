# Resume Engine Unified

This folder is a non-destructive merged workspace created from:
- `D:\Resume Engine (1)`
- `D:\Codex First`

The original folders were not modified.

## Structure

- `apps/backend` - active backend copied from `D:\Resume Engine (1)\Backend`
- `apps/frontend` - active frontend copied from `D:\Codex First`
- `apps/legacy-frontend` - original frontend from `D:\Resume Engine (1)\Frontend`, kept for reference and safety
- `docs` - copied project documentation and reports
- `scripts` - helper launch scripts

## Recommended Run Order

Open only this folder in VS Code: `D:\Resume Engine Unified`

Terminal 1:
```powershell
npm run backend
```

Terminal 2:
```powershell
npm run frontend
```

If you prefer the old frontend from `Resume Engine (1)`, run:
```powershell
npm run legacy-frontend
```

## Notes

- Backend code and environment files were copied without functional edits.
- Frontend code was copied without functional edits.
- If dependencies are ever missing in a copied app, run `npm install` inside that app folder only.
