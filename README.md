# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Environment variables

This project supports `.env` files for keeping secrets and configuration out of
source control. The repository includes an example file (`.env.example`) that you
can copy and customise.

1. Duplicate `.env.example` to `.env` and fill in real values.
2. The `.env` file is already ignored by git (`.gitignore` contains `\.env*.local`).
3. When the app starts the Expo configuration loader will read variables from
   `.env` and inject them into `Constants.expoConfig.extra`.

You can access them in code like this:

```ts
import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.API_URL as string;
```

A helper `config/constants.ts` already exports a couple of keys which are
populated from `expoConfig.extra`. Feel free to add more there as needed.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
