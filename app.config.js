// Expo will load this configuration instead of app.json when present.
// We read the static JSON then merge in any environment variables so that
// we can keep secrets out of source control and switch values for
// development/production builds.

const baseConfig = require("./app.json");

export default baseConfig;
