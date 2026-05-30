import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '@expo/config';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const appDisplayName = getConfig(root).exp?.name ?? 'Сообща';
const brandDir = path.join(root, 'assets', 'brand');
const assetsDir = path.join(root, 'assets');
const androidResDir = path.join(root, 'android', 'app', 'src', 'main', 'res');

const BRAND_GREEN = '#1E7A4F';

const assetOutputs = [
  { input: 'logo-mark.svg', output: 'icon.png', size: 1024 },
  { input: 'logo-splash.svg', output: 'splash-icon.png', size: 512, fit: 'contain' },
  { input: 'logo-foreground.svg', output: 'android-icon-foreground.png', size: 1024 },
  { input: 'logo-background.svg', output: 'android-icon-background.png', size: 1024 },
  { input: 'logo-monochrome.svg', output: 'android-icon-monochrome.png', size: 1024 },
  { input: 'logo-mark.svg', output: 'favicon.png', size: 48 },
];

const splashLogoSizes = {
  'drawable-mdpi': 288,
  'drawable-hdpi': 432,
  'drawable-xhdpi': 576,
  'drawable-xxhdpi': 864,
  'drawable-xxxhdpi': 1152,
};

const mipmapSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function writePng(inputPath, outputPath, size, fit = 'cover') {
  const png = await sharp(inputPath)
    .resize(size, size, { fit, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(outputPath, png);
}

async function writeWebp(inputPath, outputPath, size) {
  const webp = await sharp(inputPath).resize(size, size).webp({ quality: 95 }).toBuffer();
  await writeFile(outputPath, webp);
}

await mkdir(brandDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

for (const item of assetOutputs) {
  const inputPath = path.join(brandDir, item.input);
  const outputPath = path.join(assetsDir, item.output);
  await writePng(inputPath, outputPath, item.size, item.fit);
  console.log(`wrote assets/${item.output} (${item.size}px)`);
}

const markSvg = path.join(brandDir, 'logo-mark.svg');
const splashSvg = path.join(brandDir, 'logo-splash.svg');
const foregroundSvg = path.join(brandDir, 'logo-foreground.svg');
const backgroundSvg = path.join(brandDir, 'logo-background.svg');
const monochromeSvg = path.join(brandDir, 'logo-monochrome.svg');

for (const [folder, size] of Object.entries(splashLogoSizes)) {
  const dir = path.join(androidResDir, folder);
  await mkdir(dir, { recursive: true });
  await writePng(splashSvg, path.join(dir, 'splashscreen_logo.png'), size, 'contain');
  console.log(`wrote android/${folder}/splashscreen_logo.png (${size}px)`);
}

for (const [folder, size] of Object.entries(mipmapSizes)) {
  const dir = path.join(androidResDir, folder);
  await mkdir(dir, { recursive: true });
  await writeWebp(markSvg, path.join(dir, 'ic_launcher.webp'), size);
  await writeWebp(markSvg, path.join(dir, 'ic_launcher_round.webp'), size);
  await writeWebp(foregroundSvg, path.join(dir, 'ic_launcher_foreground.webp'), size);
  await writeWebp(backgroundSvg, path.join(dir, 'ic_launcher_background.webp'), size);
  await writeWebp(monochromeSvg, path.join(dir, 'ic_launcher_monochrome.webp'), size);
  console.log(`wrote android/${folder}/ic_launcher*.webp (${size}px)`);
}

const colorsXml = `<resources>
  <color name="splashscreen_background">${BRAND_GREEN}</color>
  <color name="iconBackground">${BRAND_GREEN}</color>
  <color name="colorPrimary">${BRAND_GREEN}</color>
</resources>
`;
await writeFile(path.join(androidResDir, 'values', 'colors.xml'), colorsXml);

const stringsXml = `<resources>
  <!-- app_name задаётся в app/build.gradle из app.config.ts (resValue) -->
</resources>
`;
await writeFile(path.join(androidResDir, 'values', 'strings.xml'), stringsXml);
console.log(`app display name: ${appDisplayName} (from app.config.ts)`);

const splashscreenXml = `<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/splashscreen_logo"/>
  </item>
</layer-list>
`;
await writeFile(path.join(androidResDir, 'drawable', 'splashscreen.xml'), splashscreenXml);

const stylesXml = `<resources xmlns:tools="http://schemas.android.com/tools">
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen</item>
  </style>
</resources>
`;
await writeFile(path.join(androidResDir, 'values', 'styles.xml'), stylesXml);

console.log('Brand assets synced to assets/ and android/app/src/main/res/');
