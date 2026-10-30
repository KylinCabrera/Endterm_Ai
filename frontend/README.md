# React + Vite

## Label photos and camera access

The dashboard and label scanner share `ImagePicker`. In **Scan a product**, both
choices sit inside the dashed drop zone, including when a preview is shown; no
camera or upload buttons sit below it. The preview also opens the photo picker,
and drag-and-drop and keyboard access remain available. **Upload photo** uses an
`accept="image/*"` input without `capture`, allowing the system photo picker.
**Use camera** opens a separate `capture="environment"` input on Android and
iPhone/iPad, requesting the rear camera. Native menus and capture support depend
on the browser/OS; a web page cannot force every Android picker to show both
camera and gallery entries. The two explicit buttons keep both paths available.

On desktop, **Use camera** opens a webcam preview with a camera selector when
multiple devices are available. Both the live preview and captured photo preserve
the camera frame's orientation without mirroring, so label text stays readable.
Captured frames become JPEG files and follow
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

- Android Chrome and iPhone/iPad Safari: take a photo, cancel capture, upload from
  the gallery, reselect the same image, and scan the resulting photo.
- Desktop Chrome/Edge/Firefox/Safari over HTTPS: allow camera access, capture and
  scan, switch integrated/external cameras, and close with Cancel and Escape.
  Hold printed text in view and confirm it reads normally in both the live
  preview and the captured photo.
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
