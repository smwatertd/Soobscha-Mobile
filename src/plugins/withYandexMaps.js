const { withAndroidManifest, withGradleProperties, AndroidConfig } = require('expo/config-plugins');

const YANDEX_MIN_SDK = 26;

function setMinSdkVersion(properties, minSdk) {
  const key = 'android.minSdkVersion';
  const existing = properties.find((item) => item.type === 'property' && item.key === key);

  if (existing) {
    existing.value = String(Math.max(Number(existing.value) || 0, minSdk));
  } else {
    properties.push({ type: 'property', key, value: String(minSdk) });
  }
}

function withYandexMaps(config) {
  config = withGradleProperties(config, (cfg) => {
    setMinSdkVersion(cfg.modResults, YANDEX_MIN_SDK);
    return cfg;
  });

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const apiKey = cfg.extra?.yandexMapsApiKey ?? process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY ?? '';

    if (apiKey) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        app,
        'com.yandex.maps.apikey',
        apiKey,
      );
    }

    return cfg;
  });
}

module.exports = withYandexMaps;
