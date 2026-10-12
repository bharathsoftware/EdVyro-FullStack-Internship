# Screenshots Directory

Save your captured application screenshots in this directory:

1. `desktop-view.png` — Full browser window at desktop width (1200px+) showing hero, search bar, and active internship cards.
2. `mobile-360px-view.png` — Mobile view at 360px width (e.g. Chrome DevTools Device Mode -> 360x780) showing responsive single-column layout without horizontal scroll.
3. `filtered-view.png` — Internship board with an active search or domain filter applied (e.g. "Full Stack Development").
4. `modal-detail-view.png` — Accessible internship details dialog open, showing role specs and the sample application form.

### How to Capture on Windows:
1. Start the server:
   ```powershell
   npm start
   ```
2. Open `http://localhost:5000` in Google Chrome or Microsoft Edge.
3. For desktop & filtered view: Press `Win + Shift + S` or Chrome DevTools (`Ctrl + Shift + P` -> "Capture full size screenshot").
4. For mobile 360px view: Press `F12` to open DevTools, click the mobile device toggle (`Ctrl + Shift + M`), set width to `360px`, and take a screenshot.
5. Save the images with the filenames listed above directly into this `screenshots/` folder.
