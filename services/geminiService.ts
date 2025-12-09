import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { UserProfile, ChatMessage } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const FAST_MODEL = 'gemini-2.5-flash';
const QUALITY_MODEL = 'gemini-3-pro-preview'; // Upgraded for deeper reasoning
const VISION_MODEL = 'gemini-2.5-flash';

// Helper to remove markdown code fences
const cleanText = (text: string): string => {
  if (!text) return "";
  // Remove starting ```markdown or ```
  let cleaned = text.replace(/^```(?:markdown)?\s*/i, '');
  // Remove ending ```
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
};

// --- Career Plan ---

export const generateCareerRecommendation = async (profile: UserProfile): Promise<string> => {
  const prompt = `
    You are an expert HR professional and Career Coach.
    Analyze the following student profile and recommend the single best-fit job role.
    
    PROFILE:
    Name: ${profile.name}
    Major/Academics: ${profile.major}
    Skills: ${profile.skills}
    Interests: ${profile.interests}

    Instructions:
    1. Recommend ONE specific job role title.
    2. Provide a brief 2-sentence explanation of why this fits.
    
    Output Format strictly:
    RECOMMENDED ROLE: **[Role Name]**
    EXPLANATION: [Your explanation]
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: prompt,
    config: {
      temperature: 0.2,
    }
  });

  return cleanText(response.text || "Could not generate recommendation.");
};

export const generateDetailedCareerPlan = async (profile: UserProfile, recommendedRole: string): Promise<string> => {
  const prompt = `
    You are a certified career coach.
    Based on the recommended role: "${recommendedRole}" and the student's profile below, create a detailed, actionable career preparation plan.

    PROFILE:
    Name: ${profile.name}
    Major: ${profile.major}
    Skills: ${profile.skills}
    Interests: ${profile.interests}

    The plan must use Markdown formatting and include these sections:
    ## 1. Skill Gap Analysis
    ## 2. Recommended Coursework & Certifications
    ## 3. Project Ideas
    ## 4. Interview Preparation Strategy (STAR Method)
    
    Be specific and encouraging. 
    Use **bold** syntax (double asterisks) for emphasis on key terms or labels (e.g. **Why:**, **Action:**).
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: QUALITY_MODEL,
    contents: prompt,
    config: {
      temperature: 0.5,
    }
  });

  return cleanText(response.text || "Could not generate plan.");
};

// --- Resume Tools ---

export const critiqueResume = async (base64Pdf: string): Promise<string> => {
  const prompt = `
    You are a seasoned Hiring Manager. 
    Review the attached resume PDF.
    
    Provide a critique in Markdown with these sections:
    ## 1. Impact Score (0-10)
    ## 2. Executive Summary Feedback
    ## 3. Strengths
    ## 4. Critical Improvements Needed
    ## 5. ATS Keyword Optimization

    Use **bold** for key points.
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf
          }
        },
        { text: prompt }
      ]
    }
  });

  return cleanText(response.text || "Could not analyze resume.");
};

export const reviseResumeSection = async (
  base64Pdf: string, 
  jobDescription: string
): Promise<string> => {
  const prompt = `
    You are an expert Resume Editor and ATS Specialist.
    I have attached my current resume (PDF).
    Below is a target Job Description I want to apply for.

    TARGET JOB DESCRIPTION:
    ${jobDescription}

    TASK:
    Rewrite my 'Summary' and one key 'Experience' entry to perfectly align with this job description.
    Use strong action verbs and keywords from the JD.
    
    Output Format (Markdown):
    ## Revised Summary
    [New Summary]

    ## Revised Experience Entry
    **[Role/Project Name]**
    [Bullet points]

    ## Explanation of Changes
    [Brief explanation]
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf
          }
        },
        { text: prompt }
      ]
    }
  });

  return cleanText(response.text || "Could not revise resume.");
};

// --- Chat ---

export const createCoachChat = (
  history: ChatMessage[], 
  context: string
): Chat => {
  return ai.chats.create({
    model: QUALITY_MODEL,
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    })),
    config: {
      systemInstruction: `You are a supportive, knowledgeable Career Coach. 
      You have access to the user's career plan and resume critique in the context provided below. 
      Use this context to answer questions specifically. 
      Keep answers concise, encouraging, and actionable.
      
      CONTEXT:
      ${context}`
    }
  });
};