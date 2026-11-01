<p align="left"><a href="README.md">English</a> | <b>繁體中文</b></p>

# 🪵 弈境 · GoRealm (Super Craft Go · 柾目風)

> *A craftsman's 3D Go atelier — Japanese Kaya wood grain, tactile stone acoustics, and human-like AI companion.*  
> 秉承頂級日本匠人美學打造的純本地 3D 圍棋對弈、死活研習與深度覆盤應用。

[![Go Board](https://img.shields.io/badge/Board-Three.js%203D%20%2B%202D-deb070.svg)]()
[![AI Engine](https://img.shields.io/badge/Engine-KataGo%20v1.18%20OpenCL-38bdf8.svg)]()
[![i18n](https://img.shields.io/badge/i18n-Traditional%20Chinese%20%7C%20English-10b981.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ 核心特色 (Key Features)

### 1. 匠人級 3D 視覺與物理落子聽覺
- **日式柾目榧木棋盤**：天然平行木紋、日式栀子果實（梔子形）盤足、精緻弧度與細膩漫反射。
- **天然蛤碁石與那智黑曜石**：依照入射光線與不同時段（清晨、午後、黃昏、夜間）動態演繹雙層接觸陰影與曲面高光。
- **0KB 物理落子音效合成 (Web Audio API)**：純數學合成落子瞬間的高頻瞬態衝擊音、厚實榧木本體共鳴與石子清脆脆響。
- **四大沉浸場景**：一鍵切換和室 (Washitsu)、庭院 (Pavillon)、名局室 (Honinbo) 與宇宙天際 (Cosmos)。

### 2. 深度 AI 對弈與 KataGo 雙模型架構
- **擬人化多級段位 (20k ~ 9d)**：整合 Human SL 擬人化模型與波茲曼機率採樣，模擬真實人類思維與常見盲點。
- **超人 AI 滿血算力**：支援直連本機 GPU 加速的真實 `katago.exe`，自由設定推算深度（50 ~ 1000 Visits）。
- **歷史棋聖巡禮 (Eras)**：對弈 1850 年秀策、1935 年吳清源等大師棋風。

### 3. 野狐風格勝率走勢圖與傳統黑白點目算地
- **AI 勝率走勢圖 (WinrateChart)**：
  - 50% 基準平衡線，上半部黑優勢、下半部白優勢。
  - 即時 Hover 檢視手數、落子座標、當前勝率、領先目數與著手評價（妙手/好手/惡手）。
  - 點擊折線任意點可立即跳轉至該步盤面。
- **傳統黑白算地 (Traditional Territory Grid)**：
  - 參考 oro圍棋 與 弈城 經典樣式，以黑方塊 (■) 與白方塊 (□) 清楚標定地盤，死子降暗顯示。
  - 懸浮點目 HUD 條列黑白雙方實地、提子、貼目與勝負領先目數。

### 4. 完整的四門學習工坊
- **今日修煉 (Today)**：每日死活題 (Tsumego)、定石練習 (Joseki) 與背譜訓練。
- **古譜名局 (Classics)**：耳赤之局 (1846) 等經典歷史棋譜逐手猜子對局。
- **棋譜館與 Kifu 印刷**：支援 SGF 匯入匯出與書籍印刷風格的排版輸出。

### 5. 雙語國際化 (i18n)
- 支援 URL Query 參數導向：
  - 英文版（針對審查委員）：`?lang=en`
  - 繁體中文版（個人自用預設）：預設無參數網址
- 設定面板提供 `[繁體中文 / English]` 即時切換。

---

## 🚀 快速安裝與使用指南 (Quick Start)

### 方式一：下載官方桌面安裝包（最推薦 · 滿血 GPU AI）
無需安裝 Node.js、Vite 或 Python，開箱即用：

1. **下載安裝包**：前往 GitHub Releases 下載最新版 [`Super-Craft-Go-v1.0.0-Windows-x64.zip`](https://github.com/SuperBalabah/super_craft_go/releases/latest)。
2. **解壓縮**：將壓縮包解壓至您電腦的任意資料夾。
3. **一鍵建立桌面捷徑**：雙擊資料夾內的 `Install_Desktop_Shortcut.bat`，系統將自動為您在 Windows 桌面建立帶有日式禪意圍棋圖標的專屬捷徑。
4. **啟動對局**：雙擊桌面上的「Super Craft Go」圖標，背景即刻自動喚起 GPU 加速之 KataGo 滿血引擎並打開 3D 棋盤工坊！

*(亦可直接雙擊資料夾內的 `Super Craft Go.exe` 綠色便攜運行)*

---

### 方式二：線上免安裝預覽 (Web Instant Preview)
適合快速預覽 3D 榧木紋理、物理落子音效、和室光影切換與 SGF 打譜（無須下載任何檔案）：

* 🌐 **英文版 (Global & US Reviewers)**：[https://superbalabah.github.io/super_craft_go/?lang=en](https://superbalabah.github.io/super_craft_go/?lang=en)
* 🌐 **繁體中文版（預設）**：[https://superbalabah.github.io/super_craft_go/](https://superbalabah.github.io/super_craft_go/)

---

### 方式三：開發者原始碼編譯 (Building from Source)
若您希望深入檢視或修改原始碼：
```bash
git clone https://github.com/SuperBalabah/super_craft_go.git
cd super_craft_go
npm install
npm run build
python craft_go/bridge.py
```

---

## 📁 檔案結構 (Architecture)

```
masame/
├── index.html               # 應用主入口
├── vite.config.ts           # Vite 建置配置 (支援相對路徑部署)
├── src/
│   ├── App.tsx              # 核心狀態與頁面流程排版
│   ├── board3d/             # Three.js 3D 榧木棋盤、蛤碁石材質與和室場景
│   ├── WinrateChart.tsx     # 野狐風格向量 SVG 勝率走勢圖
│   ├── GoLogo.tsx           # 弈境向量動態 Logo
│   ├── i18n/                # 雙語在地化 (zh.ts, en.ts)
│   ├── katago.ts            # KataGo Analysis Protocol 對接
│   ├── masameBridge.ts      # 本地 HTTP 守護程序橋接
│   ├── bot.ts               # 擬人化段位機率採樣引擎
│   ├── scoring.ts           # 傳統黑白點目算地演算法
│   └── sgf.ts               # SGF 棋譜匯入匯出
└── craft_go/
    ├── bridge.py            # Python KataGo 非同步中繼微服務
    ├── katago_bundle/       # KataGo 執行檔與神經網路權重
    ├── start_gorealm.bat    # 一鍵啟動後端與前端
    └── start_gorealm.vbs    # 無黑框背景靜默啟動腳本
```

---

## 💻 系統與硬體配置建議 (Hardware Requirements)

若需在本地端體驗完整的 GPU 加速 AI 算力：

| 項目 | 最低配置要求 | 建議流暢配置 |
| :--- | :--- | :--- |
| **顯示卡 (GPU)** | 支援 OpenCL 1.2 之內顯 (如 Intel Iris Xe / AMD Radeon 680M+) | NVIDIA GeForce RTX 系列 (支援 CUDA / TensorRT) 或 AMD Radeon 獨顯 |
| **處理器 (CPU)** | 支援 AVX2 指令集之 x86-64 處理器 | Intel Core i5/i7 (8代以上) 或 AMD Ryzen 5000 系列以上 |
| **記憶體 (RAM)** | 8 GB 系統記憶體 | 16 GB DDR4/DDR5 以上 |
| **硬碟空間** | 1.5 GB 可用空間（含神經網路模型） | 固態硬碟 (SSD) |
| **作業系統** | Windows 10/11 (64-bit)、macOS 12+ (Apple Silicon) 或 Linux | Windows 11 / macOS (M系列晶片) |

> [!NOTE]
> **線上免安裝模式 (GitHub Pages)**：
> 網頁版為 100% 純前端靜態運作，提供完整的 Three.js 3D 視覺渲染、物理落子音效、雙人對弈、SGF 棋譜庫瀏覽與和室光影切換，無須在本機安裝任何環境或啟動 GPU KataGo 後端。深度 MCTS 復盤與高段位神經網路對弈則在桌面版模式下完整啟動。

---

## 📄 開源授權與學術致謝 (License & Attribution)

本專案採用 [MIT License](LICENSE) 開源授權條款。

### 致謝與原創標註
- **3D 原創引擎**：底層 3D 棋盤渲染架構奠基於 **Sylvain Rey** 打造之開源專案 ([Masame](https://github.com/Slymaster/masame))。
- **系統整合與功能擴充**：由 **SuperBalabah** 主導開發，包含 Python GTP 非同步通訊橋接微服務 (`bridge.py`)、即時向量 SVG 勝率走勢圖 (`WinrateChart.tsx`)、傳統黑白點目算地系統、中英對稱雙語國際化架構與桌面應用封裝。
- **神經網路模型**：採用 David J. Wu 主導之 [KataGo](https://github.com/lightvector/KataGo) 深度學習引擎。

