// custom typings so that TypeScript knows about env variables
import "expo";

declare module "expo" {
  interface ExpoConfig {
    extra?: {
      API_URL?: string;
      GOOGLE_SCRIPT_URL?: string;
      [key: string]: any;
    };
  }
}
