import path from 'path';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

export class AiProviderError extends Error {
  constructor(message, { quotaExceeded = false } = {}) {
    super(message);
    this.name = 'AiProviderError';
    this.quotaExceeded = quotaExceeded;
  }
}

function normalizeQuestion(raw) {
  if (!raw?.text || !Array.isArray(raw.options) || raw.options.length < 2) return null;
  const options = raw.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 4);
  if (options.length < 2) return null;
  while (options.length < 4) {
    options.push(`Option ${options.length + 1}`);
  }
  let correctIndex = Number(raw.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }
  return { text: String(raw.text).trim(), options, correctIndex };
}

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
  };
  return map[ext] || 'video/mp4';
}

function isValidKey(key) {
  return Boolean(key && !key.includes('your_'));
}

function failFromApi(status, errText, provider) {
  const lower = errText.toLowerCase();
  const quotaExceeded =
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit');

  const message = quotaExceeded
    ? `${provider} free quota exceeded — quiz built from lesson titles instead. Wait until tomorrow or use "Regenerate from lessons".`
    : `${provider} is temporarily unavailable — quiz built from lesson titles instead.`;

  throw new AiProviderError(message, { quotaExceeded });
}

export function isGeminiConfigured() {
  return isValidKey(config.gemini.apiKey);
}

export function isOpenAiConfigured() {
  return isValidKey(config.openai.apiKey);
}

export function isVideoAiConfigured() {
  return isGeminiConfigured() || isOpenAiConfigured();
}

export function getActiveAiProvider() {
  if (isGeminiConfigured()) return 'gemini';
  if (isOpenAiConfigured()) return 'openai';
  return null;
}

async function transcribeWithGemini(buffer, filename) {
  const mimeType = mimeFromFilename(filename);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: buffer.toString('base64') } },
              {
                text: 'Transcribe all spoken words from this lecture video. Return only the transcript text in the same language as the speaker. No timestamps or commentary.',
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    failFromApi(res.status, errText, 'Gemini');
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  return text || null;
}

async function transcribeWithOpenAi(buffer, filename) {
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  form.append('model', config.openai.whisperModel);
  form.append('response_format', 'text');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openai.apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    failFromApi(res.status, errText, 'OpenAI');
  }

  const text = (await res.text()).trim();
  return text || null;
}

const QUIZ_PROMPT = (courseTitle, combined) => `Course: ${courseTitle}

Lecture transcripts:
${combined}

Create 8-10 multiple-choice questions based ONLY on the teaching content above.
Each question: exactly 4 distinct options, one clearly correct answer, correctIndex 0-3.
Return JSON: {"questions":[{"text":"...","options":["A","B","C","D"],"correctIndex":0}]}`;

async function generateQuestionsWithGemini(lessonTranscripts, courseTitle) {
  const combined = lessonTranscripts
    .filter((l) => l.transcript?.trim())
    .map((l) => `### ${l.title}\n${l.transcript.trim()}`)
    .join('\n\n')
    .slice(0, 14000);

  if (!combined.trim()) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You write clear multiple-choice quiz questions for an online course. Questions must test concepts explained in the lecture transcripts, not lesson titles or durations. Return valid JSON only.\n\n${QUIZ_PROMPT(courseTitle, combined)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    failFromApi(res.status, errText, 'Gemini');
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!content) return null;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const questions = (parsed.questions || []).map(normalizeQuestion).filter(Boolean).slice(0, 12);
  return questions.length ? questions : null;
}

async function generateQuestionsWithOpenAi(lessonTranscripts, courseTitle) {
  const combined = lessonTranscripts
    .filter((l) => l.transcript?.trim())
    .map((l) => `### ${l.title}\n${l.transcript.trim()}`)
    .join('\n\n')
    .slice(0, 14000);

  if (!combined.trim()) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openai.chatModel,
      response_format: { type: 'json_object' },
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content:
            'You write clear multiple-choice quiz questions for an online course. Questions must test concepts explained in the lecture transcripts, not lesson titles or durations. Return valid JSON only.',
        },
        { role: 'user', content: QUIZ_PROMPT(courseTitle, combined) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    failFromApi(res.status, errText, 'OpenAI');
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const questions = (parsed.questions || []).map(normalizeQuestion).filter(Boolean).slice(0, 12);
  return questions.length ? questions : null;
}

export async function transcribeVideoBuffer(buffer, filename = 'lesson.mp4') {
  const provider = getActiveAiProvider();
  if (!provider) {
    throw new AppError(
      'Add GEMINI_API_KEY (free) or OPENAI_API_KEY in server/.env for video quiz generation',
      400
    );
  }
  if (buffer.length > MAX_MEDIA_BYTES) {
    throw new AppError(`Video "${filename}" is too large (max 20 MB). Use a shorter clip.`, 400);
  }

  if (provider === 'gemini') return transcribeWithGemini(buffer, filename);
  return transcribeWithOpenAi(buffer, filename);
}

export async function generateQuestionsFromTranscripts(lessonTranscripts, courseTitle) {
  const provider = getActiveAiProvider();
  if (!provider) return null;

  if (provider === 'gemini') {
    return generateQuestionsWithGemini(lessonTranscripts, courseTitle);
  }
  return generateQuestionsWithOpenAi(lessonTranscripts, courseTitle);
}
