# WebAPKify

**webapkify** turns an existing client-side web build into a native Android APK by generating a minimal Kotlin + WebView Android project around your static files. It is designed for apps that already ship as a finished frontend build, such as a Vite `dist/` directory, and need a clean Android wrapper instead of a larger hybrid runtime.

Unlike Capacitor and similar tools, `webapkify` is intentionally **Android-only**, **WebView-first**, and **runtime-light**. It focuses on generating readable Android project files and loading bundled assets through `WebView`, while tools like Capacitor are built around a cross-platform native runtime and bridge model for broader device integration.

## Why it exists

Many web apps do not need a cross-platform runtime, a JavaScript-native bridge, or a plugin ecosystem. They simply need:

- A native Android shell
- A generated Gradle + Kotlin project
- Configurable app metadata, icons, permissions, and signing
- A direct way to build an APK from an existing static frontend

That is the exact problem `webapkify` solves.

## Why use webapkify

### Minimal by design

`webapkify` does not inject a hybrid runtime into your web app. It generates plain Android project files and serves your bundled frontend from Android assets inside a native `WebView`, which keeps the result inspectable and easy to modify.

### Built for static apps

If your app already builds to static files, `webapkify` fits naturally. Build the frontend once, point `webapkify` at the output directory, and it creates the Android shell around it.

### Native Android output

The generated result is a standard Android project with Kotlin, Gradle files, resources, `AndroidManifest.xml`, and signing configuration. The output stays close to the platform instead of hiding native files behind a framework abstraction.

### No framework lock-in

Use Vite, vanilla TypeScript, React, Vue, Svelte, Solid, or any other frontend stack that outputs static client files. `webapkify` only cares about the built directory.

### Better when you do not need a bridge

Capacitor is a good fit when a project needs a plugin system and a JavaScript bridge into native APIs. `webapkify` is the better fit when the app should stay as close as possible to a plain embedded web app with a thin native Android wrapper.

## When webapkify is a better fit than Capacitor

Use `webapkify` when:

- The target is Android only
- The app already exists as a client-side web build
- The app mainly lives inside `WebView`
- You want generated native files you can read and edit directly
- You want the smallest possible wrapper around the web app
- You do not want to add a hybrid runtime layer into the web code

Use Capacitor instead when:

- You need Android **and** iOS from the same runtime model
- You want a mature plugin ecosystem for camera, filesystem, notifications, and other device APIs
- Your frontend must call native functionality through a JavaScript bridge
- Your team intentionally wants a cross-platform native runtime approach

## Features

- Android-only CLI focused on packaging existing web apps
- Generates a complete Android project in a local working directory
- Uses a root config file for app metadata and build behavior
- Supports app name, app ID, versioning, icons, permissions, cleartext rules, artifact naming, and signing
- Generates Kotlin, Android resources, Gradle files, and manifest entries
- Loads bundled frontend assets from `file:///android_asset/www/index.html` inside `WebView`.
- Requests runtime-requestable Android permissions on launch when enabled in config, using the modern Activity Result API approach.
- Works well with npm, pnpm, Bun, and Yarn workflows when installed or invoked through their CLI runners.

## How it works

1. Build your frontend app.
2. Create `webapkify.config.ts` in the project root.
3. Run `webapkify build`.
4. `webapkify` creates a generated Android project under `./webapkify`.
5. Your built web files are copied into Android assets.
6. The generated Kotlin `MainActivity` loads the app inside a native `WebView`.
7. Gradle builds the final APK.

This model stays close to the underlying Android platform instead of hiding it behind a larger runtime.

## Installation

### Run directly

With npm:

```bash
npx webapkify init
```

With pnpm:

```bash
pnpm dlx webapkify init
```

`npx` runs a package executable from a local or remote npm package, selecting the exposed binary from the package `bin` field by npm’s executable-resolution rules.

`pnpm dlx` fetches a package without adding it as a dependency and runs its default exposed binary, which makes it a good fit for one-off CLI usage.

### Install globally

With npm:

```bash
npm install -g webapkify
```

With pnpm:

```bash
pnpm add -g webapkify
```

After a global install, the `webapkify` command is exposed through the package executable entry defined in `package.json`.

## Requirements

You need:

- Node.js 20+
- A package manager such as npm, pnpm, Bun, or Yarn
- Java (JDK)
- Android SDK
- A built client-side web app, such as a Vite `dist/` directory

## Quick start

Project structure:

```text
my-app/
├── dist/
├── webapkify.config.ts
└── package.json
```

Example config:

```ts
import type { WebAPKifyConfig } from 'webapkify'

export default {
  // -- Identity --------------------------------------------------------------
  appName: 'My App',
  appId: 'com.example.myapp',
  versionCode: 1,
  versionName: '1.0.0',
  artifact: 'my-app',

  // -- Source ----------------------------------------------------------------
  webDir: './dist',

  // -- SDK -------------------------------------------------------------------
  minSdk: 26,
  compileSdk: 35,
  targetSdk: 35,
  buildToolsVersion: '35.0.0',

  // -- Icons -----------------------------------------------------------------
  icon: './icon.png',
  adaptiveIconForeground: './icon-fg.png',
  monochromeIcon: './icon-mono.png',
  adaptiveIconBackground: '#FFFFFF',

  // -- App -------------------------------------------------------------------
  orientation: 'unspecified',
  statusBar: 'default',
  themeColor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
  allowBackup: true,
  hardwareAccelerated: true,
  keepScreenOn: false,
  supportsRtl: false,

  // clearTextDomains: ['localhost'],
  // allowAllClearText: false,

  // -- Native Bridge ---------------------------------------------------------
  bridge: {
    enabled: true,
    name: 'WebAPKifyAndroid',
  },

  // -- WebView ---------------------------------------------------------------
  webview: {
    javaScriptEnabled: true,
    javaScriptCanOpenWindowsAutomatically: false,
    domStorageEnabled: true,
    databaseEnabled: false,
    geolocationEnabled: false,
    allowMixedContent: false,
    builtInZoomControls: true,
    displayZoomControls: false,
    allowFileAccessFromFileURLs: false,
    allowUniversalAccessFromFileURLs: false,
    textZoom: 100,
    loadsImagesAutomatically: true,
    blockNetworkImage: false,
    blockNetworkLoads: false,
    cacheMode: 'DEFAULT',
    loadWithOverviewMode: false,
    useWideViewPort: true,
    mediaPlaybackRequiresUserGesture: true,
    safeBrowsingEnabled: true,
    forceDark: 'AUTO',
    algorithmicDarkeningAllowed: false,
    acceptCookies: true,
    acceptThirdPartyCookies: false,
  },

  // -- Permissions -----------------------------------------------------------
  permissions: {
    internet: true,
    networkState: true,
    // camera: true,
    // fineLocation: true,
    // postNotifications: true,
  },

  // -- Signing ---------------------------------------------------------------
  signing: {
    storeFile: './release.jks',
    storePassword: 'change-me',
    keyAlias: 'release',
    keyPassword: 'change-me',
    v1SigningEnabled: true,
    v2SigningEnabled: true,
    v3SigningEnabled: true,
  },

  // -- Build -----------------------------------------------------------------
  build: {
    minifyEnabled: false,
    shrinkResources: false,
    jvmTarget: '17',
    kotlinVersion: '2.0.21',
    agpVersion: '8.7.3',
  },
} satisfies WebAPKifyConfig
```

Build a debug APK:

```bash
webapkify build
```

Build a release APK:

```bash
webapkify build --release
```

For more details about the config options, see the [Config guide](./CONFIG.md).

## Commands

### `webapkify init`

Creates a starter `webapkify.config.ts` in the current directory.

```bash
webapkify init
```

### `webapkify build`

Generates the Android project and builds a debug APK.

```bash
webapkify build
```

### `webapkify build --release`

Generates the Android project and builds a release APK.

```bash
webapkify build --release
```

### `webapkify clean`

Removes the generated Android working directory.

```bash
webapkify clean
```

## Permissions behavior

When permissions are enabled in config, `webapkify` declares them in `AndroidManifest.xml`. Permissions that Android treats as runtime permissions can also be requested on launch before the initial `WebView` load, using `RequestMultiplePermissions()` from the Activity Result API.

That does **not** mean every manifest permission shows a popup. Android only displays runtime dialogs for permissions that are runtime-requestable on that API level, such as camera, microphone, location, notifications on Android 13+, and media permissions on API 33+.

Examples:

- `INTERNET` and `ACCESS_NETWORK_STATE` are manifest permissions and do not produce a runtime dialog.
- `POST_NOTIFICATIONS` only behaves as a runtime permission on Android 13 and above.
- `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, and `READ_MEDIA_AUDIO` are the Android 13+ media permissions that replaced older external-storage read flows for those media categories.

## Generated output

```text
webapkify/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/www/
│       ├── kotlin/<your/package>/MainActivity.kt
│       └── res/
├── build.gradle.kts
├── gradle.properties
├── local.properties
├── settings.gradle.kts
└── gradle/
    └── wrapper/
        └── gradle-wrapper.properties
```

The generated output is intentionally readable. Edit the Kotlin, manifest, Gradle files, or resources directly when a project needs custom native behavior.

## Philosophy

`webapkify` is not trying to be a full cross-platform app runtime. Its goal is the opposite: keep the wrapper small, generate direct Android project files, and stay out of the web app’s internal architecture as much as possible.

That makes it a strong fit for:

- Internal apps
- Kiosk apps
- Game wrappers
- Tools built with Vite or similar bundlers
- Android-only distributions
- Teams that want generated native files instead of framework-managed native projects

## License

[MIT License](./LICENSE)