# 🤖 Career Path Recommender

A comprehensive, AI-powered career development platform built with React and Google's Gemini API. This application serves as a personalized career counselor, helping users discover their ideal career path, optimize their resumes using vision capabilities, and prepare for interviews through intelligent, context-aware coaching.

## ✨ Key Features

### 1. Career Plan Generator
*   **Smart Role Recommendation**: Analyzes your academic background, skills, and personal interests to recommend the single best-fit job role using the speed of **Gemini 2.5 Flash**.
*   **Strategic Action Plans**: Leverages the deep reasoning of **Gemini 3 Pro** to generate a detailed roadmap, including:
    *   Skill Gap Analysis
    *   Recommended Coursework & Certifications
    *   Portfolio Project Ideas
    *   Interview Preparation Strategies (STAR Method)

### 2. Resume Intelligence Suite
*   **PDF Analysis**: Uses Gemini's multimodal capabilities to directly read and analyze uploaded PDF resumes.
*   **AI Critique**: Provides an "Impact Score" (0-10), identifies strengths/weaknesses, and suggests ATS keyword improvements.
*   **Targeted Revision**: Rewrites your "Summary" and "Experience" sections to align perfectly with a specific Job Description you provide, maximizing your chances of passing screening.

### 3. Context-Aware Chat Coach
*   **Integrated Memory**: The Chat Coach automatically retrieves your generated Career Plan and Resume Critique.
*   **Personalized Guidance**: Ask follow-up questions like *"How do I learn the skills mentioned in my plan?"* or *"Help me rewrite this resume bullet point,"* and get answers tailored specifically to your data.

## 🛠️ Technology Stack

*   **Frontend**: React (TypeScript)
*   **Styling**: Tailwind CSS
*   **AI Model Integration**: Google GenAI SDK (`@google/genai`)
*   **Markdown Rendering**: Custom renderer with support for tables, lists, and rich text.

## 🧠 AI Models Used

This application utilizes a multi-model architecture to balance speed and intelligence:

| Feature | Model | Reasoning |
| :--- | :--- | :--- |
| **Initial Role Recommendation** | `gemini-2.5-flash` | Fast, low-latency response for initial analysis. |
| **Detailed Career Planning** | `gemini-3-pro-preview` | Superior reasoning for complex planning and strategy. |
| **Resume Analysis (Vision)** | `gemini-2.5-flash` | Efficient processing of PDF documents (Multimodal). |
| **Chat Coach** | `gemini-3-pro-preview` | High-context window and reasoning for conversational guidance. |

## 🚀 Getting Started

1.  **API Key**: Ensure you have a valid Google Gemini API Key.
2.  **Environment**: The app expects the key to be available via `process.env.API_KEY`.
3.  **Run**: Launch the application in your browser or development server.

## 💡 How to Use

1.  **Start with the Career Plan**: Navigate to the first tab, fill in your profile, and generate your roadmap.
2.  **Refine your Resume**: Switch to "Resume Tools", upload your PDF, and get an instant critique. If you have a specific job in mind, use the "Targeted Revision" tab.
3.  **Consult the Coach**: Go to "Chat Coach". The AI has already read your plan and critique. ask specific questions to get actionable advice.