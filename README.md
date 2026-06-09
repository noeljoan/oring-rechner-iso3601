# O‑Ring Rechner

A modern web‑based calculator for O‑ring dimensions and tolerances based on **DIN ISO 3601**.

## Screenshoot

![Dashboard](screenshot.png)

![Report Example](Report-example.png)

## ✨ Features
- Compute O‑ring inner diameter, cross‑section, compression and groove fill percentages.
- Temperature compensation for common elastomers (FPM, NBR, EPDM, HNBR, steel, stainless steel).
- Supports tolerance classes **A** (industrial) and **B** (standard) using ISO‑derived tables.
- Interactive UI built with **React** – live updates as you change inputs.
- Fully client‑side – can be hosted on GitHub Pages.

## 🚀 Quick Start
```bash
# Clone the repository
git clone https://github.com/your‑username/oring-rechner.git
cd oring-rechner

# Install dependencies (Node.js ≥ 18)
npm install

# Run the development server
npm start
```
Open http://localhost:3000 in your browser.

## 📦 Build for Production
```bash
npm run build
```
The static files are emitted to the `build/` folder – ready to be deployed.

## 🛠️ Development
- **React** with hooks (`useState`, `useCallback`).
- Core calculations live in `src/App.js`.
- Tolerance tables and ISO formulas are implemented directly in JavaScript.

## 📚 Reference
- **DIN ISO 3601** – O‑ring dimensions and tolerance tables.
- **ISO 286** – Fundamental tolerance standards used for shaft and hole tolerances.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

*Created on 2026‑06‑06.*
