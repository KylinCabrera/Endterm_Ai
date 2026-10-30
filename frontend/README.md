# React + Vite

## Label photos and camera access

The dashboard's **Scan a product** drop zone opens one standard
`<input type="file" accept="image/*" />`, without `capture`. Tap or click anywhere
inside the box (including the preview), or use Enter/Space while focused, to open
the native picker. Drag-and-drop and selecting the same image again are supported.
There are no separate camera/upload buttons in this card. The browser and OS
decide which sources the picker offers: mobile devices may offer camera and
gallery choices, while desktop file pickers generally do not offer webcam capture.

The separate `ScanLabelModal` still uses `ImagePicker`. **Upload photo** uses an
`accept="image/*"` input without `capture`, allowing the system photo picker.
**Use camera** opens a separate `capture="environment"` input on Android and
iPhone/iPad, requesting the rear camera. Native menus and capture support depend
on the browser/OS; a web page cannot force every Android picker to show both
camera and gallery entries. The two explicit buttons keep both paths available.

In that separate scanner, desktop **Use camera** opens a webcam preview with a camera selector when
multiple devices are available. Captured frames become JPEG files and follow
the same validation and scan flow as uploads. Cancel, Escape, camera switching,
and navigating away release the stream, including late permission responses.

Webcam access requires **HTTPS** (or `localhost` for development), permission in
both the browser and operating system, and a connected camera. Plain HTTP LAN
addresses do not support browser webcam access. Embedded deployments must also
permit camera access in their iframe/Permissions Policy. Uploads remain available
when camera access fails. The API still accepts JPEG, PNG, and WebP up to 10 MB;
unsupported formats such as HEIC display the existing validation message.

Run `npm test`, `npm run lint`, and `npm run build` for automated checks. Before
release, also check on real devices (native system pickers cannot be verified by
desktop browser emulation):

- Dashboard on mobile and desktop: open the drop zone, select a photo, cancel the
  picker, reselect the same image, drag-and-drop, and scan the resulting photo.
  Check the native camera option on mobile browsers that offer it.
- Separate scanner on Android Chrome and iPhone/iPad Safari: take a photo or
  upload from the gallery.
- Separate scanner on desktop Chrome/Edge/Firefox/Safari over HTTPS: allow camera access, capture and
  scan, switch integrated/external cameras, and close with Cancel and Escape.
- Deny permission, unplug the camera, close while permission is pending, and
  navigate away; confirm errors allow recovery and the camera indicator stops.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
