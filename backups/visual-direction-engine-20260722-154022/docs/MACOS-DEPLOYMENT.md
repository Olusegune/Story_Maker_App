# macOS deployment

Storymaker now declares macOS `dmg` and `zip` targets in `package.json` for Intel (`x64`) and Apple Silicon (`arm64`). A universal build is also configured through `npm run build:mac:universal`.

## Required build environment

Build macOS artifacts on a macOS machine or a macOS CI runner. Windows cannot produce a trustworthy, signed macOS application bundle. Install the project dependencies and Electron Builder there, then run one of:

```sh
npm run build:mac
npm run build:mac:universal
```

Artifacts are written to `dist-release` and should be versioned as:

- `Wheelbarrow Studios Story Maker-<version>-x64.dmg`
- `Wheelbarrow Studios Story Maker-<version>-arm64.dmg`
- matching `.zip` application archives
- or a universal `.dmg` and `.zip`

## Before a signed public release

1. Confirm the checked-in `assets/app-icon.icns` renders correctly in Finder and the macOS Dock.
2. Provide an Apple Developer Application certificate and Developer ID Installer certificate through secure CI secrets or the macOS keychain.
3. Provide Apple notarization credentials using an app-specific password or App Store Connect API key.
4. Enable hardened runtime and notarization in the release environment.
5. Test installation on a clean Apple Silicon Mac and a clean Intel Mac.
6. Verify that a saved `.storymaker` project opens, generated media previews, project export works, and Gatekeeper accepts the notarized bundle.

This repository is macOS-package ready, but no macOS build, signing, or notarization is claimed from this Windows environment.
