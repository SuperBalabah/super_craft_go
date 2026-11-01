<p align="left"><b>English</b> | <a href="README_zh-TW.md">繁體中文</a></p>

# 🪵 Super Craft Go (弈境 · GoRealm: 3D Masame Atelier)

> *A craftsman's 3D Go atelier — authentic Japanese Kaya wood grain, tactile stone acoustics, SVG AI winrate dynamics, and local GPU KataGo integration.*

[![Go Board](https://img.shields.io/badge/Board-Three.js%203D%20%2B%202D-deb070.svg)]()
[![AI Engine](https://img.shields.io/badge/Engine-KataGo%20v1.18%20OpenCL-38bdf8.svg)]()
[![Audio](https://img.shields.io/badge/Audio-0KB%20Web%20Audio%20DSP-34d399.svg)]()
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20Traditional%20Chinese-10b981.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Overview & Core Philosophy

**Super Craft Go (弈境 · GoRealm)** is a client-side 3D Go (Weiqi / Baduk) sanctuary built on Japanese craftsmanship principles. It unites mathematical precision, physically based 3D rendering (Three.js), real-time Web Audio synthesis, and superhuman neural networks into a contemplative, distraction-free environment.

Designed for serious Go players and connoisseurs, GoRealm features authentic Japanese *Masame* (straight-grain) Kaya boards, genuine Clamshell and Slate stone optical physics, an interactive AI winrate timeline, and classical territory counting.

---

## 🎯 Key Engineering Innovations

### 1. Tactile 3D Optics & Procedural Acoustics
- **Masame Kaya Goban**: Physically modeled Japanese floor-standing Go board with traditional Gardenia pod (*Kuchinashi*) legs, straight-grain wood textures, and dynamic lighting.
- **Natural Slate & Clamshell Optics**: Clamshell ray-marching curves and obsidian black slate stones dynamically render ambient occlusion contact shadows and specular reflections across time-of-day lighting presets (*Morning, Afternoon, Evening, Night*).
- **0KB Audio Downloads (Web Audio API)**: Zero audio asset loading. Every stone placement mathematically synthesizes high-frequency impact transients, low-frequency Kaya body resonance, and stone snap in real-time.
- **Atmospheric 3D Living Worlds**: Seamlessly switch between the traditional Japanese Tea Room (*Washitsu*), the Garden Pavilion (*Pavillon*), the Historical Match Hall (*Honinbo*), and the Celestial Void (*Cosmos*).

### 2. Dual-Layer AI & Local KataGo Neural Network Bridge
- **Humanoid AI (20 Kyu to 9 Dan)**: Integrated Boltzmann probability distribution sampling over Human SL policy networks to replicate human psychological blind spots and realistic playstyles.
- **Superhuman Full GPU Compute**: Direct asynchronous Python bridge (`craft_go/bridge.py`) connecting to local GPU-accelerated `katago.exe` OpenCL daemons, supporting customizable MCTS depth (50 to 1,000 visits).
- **Historical Masters (Eras)**: Travel through Go history to challenge distinct eras, including Shusaku (1850) and Go Seigen (1935).

### 3. Interactive AI Winrate Chart & Classical Territory Counting
- **AI Winrate Trend Chart (WinrateChart)**:
  - Vector SVG responsive timeline featuring a 50% equilibrium baseline dividing Black and White advantage zones.
  - Interactive scrubbing hover displaying move number, coordinate, win-rate %, point lead, and move verdict (*Brilliant, Good, Inaccuracy, Blunder*).
  - Single-click move jumping (`goTo(moveIndex)`) to immediately inspect critical turning points.
- **Traditional Territory Grid (Scoring HUD)**:
  - Modeled after classical tournament interfaces (oro / Tygem), rendering solid black squares (■) for Black territory and framed white squares (□) for White territory, with dimmed dead stones.
  - Comprehensive floating HUD tallying raw territory, prisoners, komi, and net lead.

### 4. Comprehensive Study Atelier
- **Today's Ritual**: Daily rotating life-and-death problems (*Tsumego*), corner joseki drills, and pattern memory training.
- **The Classics**: Step-by-step interactive guess-the-move replay of historic masterpieces like the Ear-Reddening Game (1846).
- **Kifu Publishing**: Instant SGF import/export and book-style printable Kifu diagrams.

### 5. Symmetrical Bilingual Localization (i18n)
- **URL-Driven Routing**: Access with `?lang=en` forces 100% English interface (optimized for US Admissions and international reviewers); bare URL defaults to 100% Traditional Chinese for daily local use.
- **In-App Toggle**: Instant language switcher in Settings without reloading the page or losing current game state.

---

## 🚀 Quick Start

### Mode A: Web Browser Instant Play (Zero Install)
Experience the 3D Goban directly in your browser:

* **English Version (for Global & US Reviewers)**: `https://superbalabah.github.io/super_craft_go/?lang=en`
* **Traditional Chinese Version (Default)**: `https://superbalabah.github.io/super_craft_go/`

---

### Mode B: Local Desktop Setup with Full KataGo GPU Acceleration
1. Verify Node.js (>= 18) and Python 3 are installed on your workstation.
2. Launch the asynchronous KataGo bridge daemon:
   ```bash
   python craft_go/bridge.py
   ```
3. Start the Vite development frontend:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:1420` in any modern WebGL2-compatible browser.

---

## 📁 System Architecture

```
masame/
├── index.html               # Main reactive application shell
├── vite.config.ts           # Vite build configuration (relative base deployment)
├── src/
│   ├── App.tsx              # Main state machine & four-doors workbench
│   ├── board3d/             # Three.js 3D Kaya goban, stone shaders & Japanese decors
│   ├── WinrateChart.tsx     # Responsive vector SVG AI winrate graph
│   ├── GoLogo.tsx           # Dynamic vector SVG brand insignia
│   ├── i18n/                # Symmetrical translation dictionaries (zh.ts, en.ts)
│   ├── katago.ts            # KataGo Analysis Protocol client
│   ├── masameBridge.ts      # Browser-to-engine IPC bridge
│   ├── bot.ts               # Humanoid AI decision sampling
│   ├── scoring.ts           # Classical territory flood-fill algorithm
│   └── sgf.ts               # SGF parser and formatter
└── craft_go/
    ├── bridge.py            # Local async Python KataGo microservice
    ├── katago_bundle/       # KataGo binaries, config, and neural network models
    ├── start_gorealm.bat    # One-click desktop launcher
    └── start_gorealm.vbs    # Headless background launcher
```

---

## 💻 System & Hardware Requirements

For running the full local AI engine with GPU acceleration:

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **GPU** | Integrated GPU with OpenCL 1.2 support | NVIDIA GeForce RTX series (CUDA / TensorRT) or AMD Radeon (OpenCL) |
| **CPU** | x86-64 processor with AVX2 instruction set | Intel Core i5/i7 (8th Gen+) or AMD Ryzen 5000+ |
| **RAM** | 8 GB System Memory | 16 GB DDR4/DDR5 |
| **Storage** | 1.5 GB available space (including KataGo neural net models) | SSD Storage |
| **Operating System** | Windows 10/11 (64-bit), macOS 12+ (Apple Silicon), or Linux | Windows 11 / macOS (M1/M2/M3) |

> [!NOTE]
> **Web Preview Mode (GitHub Pages)**:
> The online web version runs 100% client-side in the browser, featuring full Three.js 3D rendering, tactile stone acoustics, two-player matches, SGF library viewing, and lighting themes without requiring any local installation or GPU KataGo backend. Deep MCTS KataGo analysis and humanoid neural networks are activated in the desktop application mode.

---

## 📄 License & Academic Attribution

This project is open-source under the [MIT License](LICENSE).

### Acknowledgements & Attribution
- **Original 3D Engine**: Built upon the exquisite Three.js 3D Go Goban rendering engine created by **Sylvain Rey** ([Masame](https://github.com/Slymaster/masame)).
- **System Architecture & Enhancements**: Engineered by **SuperBalabah** — including the asynchronous Python GTP KataGo microservice (`bridge.py`), interactive SVG winrate timeline (`WinrateChart.tsx`), classical territory flood-fill scoring HUD, symmetrical bilingual localization (EN/ZH), and native desktop orchestration.
- **AI Neural Networks**: Powered by [KataGo](https://github.com/lightvector/KataGo) by David J. Wu.
