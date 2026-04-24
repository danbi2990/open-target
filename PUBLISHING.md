# Publishing

## Current status

- GitHub repository: `https://github.com/danbi2990/open-target`
- Extension package name: `open-target`
- Current publisher in `package.json`: `danbi2990`

## One-time setup

1. Create or choose an Azure DevOps organization
   - `https://dev.azure.com`
2. Create a Personal Access Token (PAT)
   - In Azure DevOps, go to User Settings -> Personal Access Tokens
   - Create a token with `Marketplace > Manage`
3. Create a Visual Studio Marketplace publisher
   - `https://marketplace.visualstudio.com/manage`
   - The publisher ID must match `package.json`

## Local publish flow

```bash
npm test
npm run package
npx @vscode/vsce login <publisher-id>
npm run publish:marketplace
```

`vsce publish` uses the publisher from `package.json`.

## Notes

- If you prefer not to store a login locally, you can also publish with a PAT
  via the `VSCE_PAT` environment variable.
- Before the first Marketplace release, it is worth considering a version bump
  from `0.0.4` to `0.1.0`.
