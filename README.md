# Headache Tracker

Personal headache and migraine diary for Android. Built with Preact and Capacitor.

- `src/lib` - data model, logic, stats, and everything that talks to the phone
- `src/screens` - the screens
- `android` - the Android project
- `npm test` - logic tests
- `npm run dev` - run in a browser

Every push to `main` builds the app on GitHub. With the `KEYSTORE_BASE64` and `KEYSTORE_PASSWORD`
repository secrets set, it publishes a signed APK as a release.
