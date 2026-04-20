# FAQs

## 1. Why am I signed out or why didn’t my session restore when I reopened the app?

SXM GO relies on authenticated sessions and secure local storage. If your session does not restore, it may be due to an expired session, a failed token refresh, or an issue with secure storage on the device. Close and reopen the app first. If that does not work, sign in again. If the issue keeps happening, test the account with email/password login to determine whether the problem is specific to a social login provider.

---

## 2. Why is social login not working with Google, Apple, or Facebook?

Social login depends on both the app and the external provider being configured correctly. Problems can happen if Play Services are unavailable, the provider returns no token, the user cancels the login flow, or the provider rejects the request. Try again with a stable internet connection. If the issue continues, use email/password login if available and verify that the provider account is active on the device.

---

## 3. Why can’t I use the map, location-based features, or check-in-related functionality?

Most map and visit-related features require location permission. If location access is denied, blocked, or restricted, some features may not work correctly. If you previously denied access, go to your device settings and re-enable location permission for the app. After changing permissions, fully reopen the app and try again.

---

## 4. Why is my profile photo not changing or why won’t the image picker open?

Profile photo updates usually depend on photo library permission and image picker access. If the app cannot open your photos or save the selected image, check your device permissions for photo or media access. If permission was denied earlier, enable it in system settings and try again. If the image picker opens but the photo still does not update, retry after refreshing the profile screen.

---

## 5. Why didn’t my changes to profile, settings, privacy options, or itineraries update immediately?

Some updates rely on backend requests and may not appear instantly if the network is slow or the save does not complete. Try refreshing the screen, leaving and reopening the page, or restarting the app. If the change still does not appear, assume the save may not have completed and submit it again.

---

## 6. Why am I getting validation errors when signing up or changing my password?

SXM GO validates account information before submitting it. Email addresses must be properly formatted, display names must meet allowed character rules, and passwords must meet security requirements such as length and character complexity. During sign-up, required consent fields also need to be accepted. If a form will not submit, check every field carefully and fix the validation message shown on screen.

---

## 7. Why do privacy-related actions like account deletion or data export take longer than normal actions?

Privacy actions such as requesting account deletion or exporting user data may involve backend processing rather than an immediate UI-only change. These requests can take longer because they may call server-side functions and wait for a response. If you do not see immediate confirmation, check for an error message, then retry only if the first request clearly failed.

---

## 8. Why does the app ask for permissions more than once?

The app may ask again when a feature depends on a permission that was previously denied, only partially granted, or not fully completed. This is most common with location, camera, or photo library access. Repeated prompts usually mean the app still does not have the level of access needed for that feature.

---

## 9. Why does a feature appear in the app but not seem to do anything?

Some screens or components may render correctly even if the related backend data, permissions, or supporting service call is missing or incomplete. This is especially possible during development builds. If a screen opens but no data appears, check whether you are signed in, whether the device has network access, and whether the feature depends on permissions or existing saved data.

---

## 10. What should I check first before reporting a bug?

Before reporting a bug, check these basics first:
- confirm you are signed in
- confirm your internet connection is working
- confirm the required permission is enabled
- refresh the screen or restart the app
- try to reproduce the issue a second time

If the problem still happens, record which screen you were on, what action you took, and what result you expected.