[LIVE](https://car-diagnosis-app1.web.app/)

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
- **Styling**: Tailwind CSS (loaded via CDN) for rapid, utility-first styling.
- **Architecture**: A "buildless" development setup using native ES Modules and an **Import Map** in `index.html`. This allows the browser to load dependencies directly from a CDN without requiring a bundler like Webpack or Vite.
- **Libraries**:
    - `react-markdown`: To render the AI's structured diagnostic reports.
    - `jspdf`: For the PDF export functionality.

## 🏁 Getting Started

This project is configured to run without a build step. You just need a way to serve the static files and provide the necessary API key.

### Prerequisites

1.  A modern web browser (Chrome, Firefox, Edge, etc.).
2.  A local web server. A simple one can be started with Python or a VS Code extension:
    - **Using Python**: `python -m http.server`
    - **VS Code Extension**: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

### Configuration

The application requires a Google Gemini API key to function. This key must be available to the application in the execution environment.

- **API Key**: The application is hardcoded to look for the API key in `process.env.API_KEY`. Your serving environment must make this variable accessible to the client-side code.

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Set up the API Key:**
    Ensure your local server or deployment environment injects the `API_KEY`.

3.  **Serve the project root:**
    Start your local web server from the root directory of the project (the one containing `index.html`).

4.  **Open in browser:**
    Navigate to the local address provided by your server (e.g., `http://localhost:8000`). The application should load and be ready to use.

## 📂 File Structure

```
.
├── App.tsx                   # Main React component, state management, and UI layout.
├── index.html                # Entry point, import map, and Tailwind CSS setup.
├── index.tsx                 # Renders the React app into the DOM.
├── metadata.json             # Application metadata and permissions.
├── README.md                 # This file.
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
