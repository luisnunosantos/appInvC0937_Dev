import "dotenv/config";

// Expo will load this configuration instead of app.json when present.
// We read the static JSON then merge in any environment variables so that
// we can keep secrets out of source control and switch values for
// development/production builds.

const baseConfig = require("./app.json");

export default () => {
  // List the environment variables you want to expose to the app here.
  // They will be available at runtime via `Constants.expoConfig?.extra`.
  const {
    GOOGLE_SCRIPT_URL,
    API_URL,
    // add more keys as needed
  } = process.env;

  return {
    ...baseConfig,
    expo: {
      ...baseConfig.expo,
      extra: {
        ...baseConfig.expo.extra,
        GOOGLE_SCRIPT_URL,
        API_URL,
      },
    },
  };
};
