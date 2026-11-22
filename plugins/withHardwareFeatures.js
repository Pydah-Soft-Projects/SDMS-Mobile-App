const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to explicitly mark screen orientation hardware features as optional.
 * 
 * When android:screenOrientation is set to 'portrait', the Android manifest merger and 
 * Google Play Console implicitly assume:
 *   <uses-feature android:name="android.hardware.screen.portrait" android:required="true" />
 * 
 * Declaring android:required="false" ensures that devices without fixed portrait hardware
 * (such as tablets, desktops, foldables, and Android XR) are not restricted by Google Play.
 */
const withHardwareFeatures = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-feature']) {
      androidManifest['uses-feature'] = [];
    }

    const featuresToAdd = [
      { name: 'android.hardware.screen.portrait', required: 'false' },
      { name: 'android.hardware.screen.landscape', required: 'false' },
    ];

    for (const feature of featuresToAdd) {
      const existing = androidManifest['uses-feature'].find(
        (f) => f.$ && f.$['android:name'] === feature.name
      );

      if (existing) {
        existing.$['android:required'] = feature.required;
      } else {
        androidManifest['uses-feature'].push({
          $: {
            'android:name': feature.name,
            'android:required': feature.required,
          },
        });
      }
    }

    return config;
  });
};

module.exports = withHardwareFeatures;
