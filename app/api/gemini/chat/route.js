import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

/**
 * Sanitizes chat history for the Google Generative AI SDK.
 * Strict rules enforced by Google:
 * 1. The first item in history MUST have role 'user' (never 'model').
 * 2. Turns must strictly alternate (user -> model -> user -> model).
 * 3. History must end with 'model' because the next message sent via sendMessage() is 'user'.
 */
function buildValidGeminiHistory(previousMessages) {
  if (!Array.isArray(previousMessages) || previousMessages.length === 0) {
    return [];
  }

  const valid = [];
  for (const m of previousMessages) {
    if (!m || !m.content || typeof m.content !== 'string' || m.isError) continue;
    const role = (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user';
    valid.push({ role, content: m.content });
  }

  // Drop any leading 'model' messages (e.g. initial greeting from assistant)
  while (valid.length > 0 && valid[0].role === 'model') {
    valid.shift();
  }

  if (valid.length === 0) return [];

  // Collapse consecutive turns of the same role
  const formatted = [];
  for (const item of valid) {
    if (formatted.length > 0 && formatted[formatted.length - 1].role === item.role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${item.content}`;
    } else {
      formatted.push({
        role: item.role,
        parts: [{ text: item.content }],
      });
    }
  }

  // Must end with 'model' so that the new turn is 'user'
  while (formatted.length > 0 && formatted[formatted.length - 1].role === 'user') {
    formatted.pop();
  }

  return formatted;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages = [],
      systemPrompt = '',
      files = [],
      model = 'gemini-3.8-flash',
      customApiKey = '',
    } = body;

    const apiKey = (customApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey || apiKey === 'your-gemini-api-key') {
      return NextResponse.json(
        {
          error:
            'Gemini API Key is missing. Please set GEMINI_API_KEY in your .env.local or enter your custom key in the settings.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'At least one prompt or message is required.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Format any attached files into clear reference blocks
    let fileContextBlock = '';
    if (Array.isArray(files) && files.length > 0) {
      fileContextBlock = files
        .map((f, i) => {
          const name = f.name || `file_${i + 1}`;
          const content = f.content || '';
          return `\n--- START ATTACHED FILE: ${name} ---\n${content}\n--- END ATTACHED FILE: ${name} ---\n`;
        })
        .join('\n');
    }

    // Build the system instructions
    const defaultBaseSystemPrompt = `You are a high-intelligence AI Coding, Architecture & Research Assistant embedded inside SynergyTech Solutions Outreach Suite.
You have access to files provided by the user in this session.
Always read attached code or documents thoroughly and cite specific sections or file names when answering.
Provide direct, clean, actionable, high-quality responses. If code is requested, provide complete and working code.`;

    const effectiveSystemInstruction = systemPrompt?.trim()
      ? `${systemPrompt.trim()}\n\n${defaultBaseSystemPrompt}`
      : defaultBaseSystemPrompt;

    // Build model candidate list with user preference first
    const candidateModels = Array.from(
      new Set([model, ...DEFAULT_MODELS])
    );

    let lastError = null;
    let successfulReply = null;
    let modelUsed = null;

    // Extract the latest user message
    const latestUserMsg = messages[messages.length - 1];
    const previousHistory = messages.slice(0, -1);
    const sanitizedHistory = buildValidGeminiHistory(previousHistory);

    // Assemble the prompt content
    const combinedUserContent = fileContextBlock
      ? `${fileContextBlock}\n\nUSER PROMPT:\n${latestUserMsg.content}`
      : latestUserMsg.content;

    for (const modelCandidate of candidateModels) {
      try {
        const generativeModel = genAI.getGenerativeModel({
          model: modelCandidate,
          systemInstruction: effectiveSystemInstruction,
        });

        let result;
        if (sanitizedHistory.length > 0) {
          const chat = generativeModel.startChat({
            history: sanitizedHistory,
          });
          result = await chat.sendMessage(combinedUserContent);
        } else {
          result = await generativeModel.generateContent(combinedUserContent);
        }

        const replyText = result.response.text();
        if (replyText) {
          successfulReply = replyText;
          modelUsed = modelCandidate;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Chat] Model "${modelCandidate}" attempt failed: ${err.message}. Trying next candidate...`);
      }
    }

    if (!successfulReply) {
      return NextResponse.json(
        {
          error: `All candidate models failed. Last error: ${lastError?.message || 'Unknown Gemini error'}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: successfulReply,
      modelUsed,
      stats: {
        filesAttached: files.length,
        promptLength: combinedUserContent.length,
        responseLength: successfulReply.length,
      },
    });
  } catch (error) {
    console.error('[Gemini Chat API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error in Gemini chat route.' },
      { status: 500 }
    );
  }
}
