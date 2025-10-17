# RotorWise AI - Your RX-8 AI Mechanic

RotorWise AI is a specialized diagnostic assistant built for Mazda RX-8 owners and enthusiasts. Powered by the Google Gemini API, it leverages expert knowledge grounded in official workshop manuals to help you troubleshoot, diagnose, and understand your Renesis rotary engine.

![RotorWise AI Screenshot](https://storage.googleapis.com/aistudio-project-assets/Marketing/Screenshot_Rotorwise.png)

## ✨ Core Features

- **Specialized Expertise**: Get diagnostic advice exclusively for the Mazda RX-8 (Series 1 & 2), focusing on the unique challenges of the 13B-MSP Renesis engine.
- **Multimodal Diagnostics**: Describe your issue with text, or upload images of engine parts, dashboard warning lights, or fluid leaks for a more accurate, context-aware analysis.
- **Voice-to-Text Input**: Use your microphone for hands-free convenience, especially useful when you're working on your car.
- **Interactive Troubleshooting**: The AI follows a systematic process, asking crucial clarifying questions to narrow down potential causes before providing a final diagnosis.
- **Structured Reports**: Receives clear, actionable reports that include a root cause analysis, a step-by-step action plan, required parts, and safety precautions.
- **Workshop Manual Data**: The AI's knowledge base is enhanced with data extracted from the official Mazda RX-8 workshop manual.
- **Session Management**: Save, load, and delete your diagnostic chat sessions to track your car's history.
- **PDF Export**: Easily export your entire diagnostic conversation to a PDF for your records or to share with a professional mechanic.

## 🚀 Tech Stack

- **Frontend**: React with TypeScript for a robust and type-safe user interface.
- **AI Backend**: Google Gemini API (`@google/genai`) for advanced reasoning and multimodal understanding.
- **Styling**: Tailwind CSS for rapid, utility-first styling.
- **Libraries**:
    - `react-markdown`: To render the AI's structured diagnostic reports.
    - `jspdf`: For the PDF export functionality.

## 🏁 Getting Started & Configuration

This project is designed with a flexible API key configuration, supporting two primary runtime methods.

### Method 1: Static Site (User-Provided Key)
This is the simplest way to run the app, requiring no build tools.

1.  **Serve Files**: Use a simple local web server (like Python's `http.server` or the VS Code Live Server extension) from the project's root directory.
2.  **Provide Key**: Open the app in your browser. You will be prompted to enter your Google Gemini API key in the settings modal. The key is saved in your browser's local storage for future use.

### Method 2: Vite Build (Pre-configured Key)
For development or deployment, you can use Vite to pre-configure the API key. This requires a Node.js environment with the necessary dependencies (like Vite, React, etc.) installed.

1.  **Create `.env` file**: In the project root, create a file named `.env`.
2.  **Set API Key**: Add your key to the `.env` file:
    `GEMINI_API_KEY="YOUR_API_KEY_HERE"`
3.  **Run with Vite**: Start the Vite development server. The `vite.config.js` file is configured to automatically make this key available to the application. The app will detect the pre-configured key and will not prompt the user to enter one.

## 📂 File Structure

```
.
├── App.tsx                   # Main React component, state management, and UI layout.
├── index.html                # Entry point, import map, and Tailwind CSS setup.
├── index.tsx                 # Renders the React app into the DOM.
├── metadata.json             # Application metadata and permissions.
├── README.md                 # This file.
├── vite.config.js            # Configuration for the Vite build tool.
├── types.ts                  # TypeScript type definitions (Message, Session).
├── components/
│   ├── ChatMessage.tsx       # Renders a single user or AI message bubble.
│   ├── Feedback.tsx          # Thumbs up/down feedback component.
│   ├── Icons.tsx             # SVG icon components.
│   ├── SessionManager.tsx    # Core custom hook for managing chat state and API calls.
│   ├── Sidebar.tsx           # Component for managing saved chat sessions.
│   └── SuggestionPills.tsx   # Initial prompt suggestions for the user.
├── data/
│   └── troubleshootingData.ts # Contains the embedded workshop manual text.
└── utils/
    └── export.ts             # PDF export utility function.
```