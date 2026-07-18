# AMO Source Build Instructions

This source package is for Mozilla Add-ons reviewers. The submitted add-on uses Webpack, so the files in `extension/dist/` inside the add-on package are generated from readable source files in `src/`.

## Build Environment

The add-on package submitted for version `1.0.11` was built on Linux with:

- Ubuntu-compatible Linux shell environment
- Node.js `22.22.1`
- npm `9.2.0`
- Info-ZIP `3.0`

Install Node.js and npm from the official Node.js downloads page:

https://nodejs.org/en/download

After installation, verify:

```sh
node --version
npm --version
```

## Build Steps

From the root of this source tree, run:

```sh
npm install
npm run build-for-amo
```

`npm run build-for-amo` runs the same build script used to create the submitted add-on package. It compiles the Webpack bundles and then packages the extension with `web-ext`.

Expected output:

```text
secure_password_generator-1.0.11.zip
```

## Source And Generated Files

Readable first-party source files are in:

- `src/background.js`
- `src/popup.jsx`
- `src/constants.js`
- `extension/manifest.json`
- `extension/popup.html`
- `extension/popup.css`
- `extension/_locales/`

Generated files are created under `extension/dist/` during the build and are intentionally not included in this source package.

Third-party dependencies are installed from npm using `package.json` and `npm-shrinkwrap.json`.
