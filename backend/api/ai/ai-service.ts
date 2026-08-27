import {
  badGateway,
  serviceUnavailable,
} from "../../errors/http-error.js";

type GeneratedSlide = {
  markdown: string;
};

type ContextFileForPrompt = {
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  base64File?: string;
};

type AiGenerationInput = {
  title: string;
  contextPrompt: string;
  files: ContextFileForPrompt[];
  numSlides?: number;
};

const AI_BASE_URL =
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
const AI_CHAT_COMPLETIONS_URL = `${AI_BASE_URL}/chat/completions`;

const extractJsonObject = (text: string): string => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw badGateway(
      "Slide generation returned an invalid response",
      "SLIDE_GENERATION_FAILED",
    );
  }
  return text.slice(start, end + 1);
};

const generateSlides = async (
  input: AiGenerationInput,
): Promise<GeneratedSlide[]> => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw serviceUnavailable(
      "Slide generation is unavailable",
      "SLIDE_GENERATION_UNAVAILABLE",
    );
  }

  const model = process.env.AI_MODEL || "openai/gpt-oss-120b";
  const maxCompletionTokens = Number(process.env.AI_MAX_COMPLETION_TOKENS || 6_000);

  const stripThinkBlocks = (text: string): string =>
    text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  const system = `You generate slide decks rendered via React Markdown with GFM support. Output must be valid JSON only.

You have these Markdown elements available — USE THEM LIBERALLY and vary which ones appear across slides:

- **Headings**: # h1 (title slide), ## h2 (section headers), ### h3 (sub-headers)
- **Bold text**: **word** for emphasis on key terms
- **Unordered lists**: - item for bullet points
- **Blockquotes**: > text — rendered as styled "Insight" callout boxes, perfect for key takeaways, quotes, or highlight statements
- **Tables**: | col | col | — rendered as styled data tables, great for comparisons, feature matrices, pros/cons, schedules
- **Task lists**: - [ ] item — rendered as checkboxes, ideal for action items, checklists, steps
- **Horizontal rules**: --- — rendered as visual separators between sections within a slide
- **Images**: ![alt](url) — rendered in a styled card with caption
- **Links**: [text](url) — rendered with a hover preview card

RULES FOR VARIETY:
- Across the deck, use at least 4 different element types (don't just do headings + bullets every slide).
- At least 2 slides should use blockquotes for key insights or takeaways.
- At least 2 slides should use tables for structured/comparative data.
- Use task lists for action items, roadmaps, or step-by-step processes wherever appropriate.
- Use horizontal rules to visually separate distinct ideas within a slide.
- Use bold text to highlight key terms and concepts.`;

  const maxBase64Chars = Number(
    process.env.AI_MAX_FILE_BASE64_CHARS || 50_000,
  );

  const filesForPrompt = (input.files ?? []).map((file, index) => {
    const base64 = typeof file.base64File === "string" ? file.base64File : "";
    const truncated =
      maxBase64Chars > 0 && base64.length > maxBase64Chars
        ? base64.slice(0, maxBase64Chars)
        : base64;

    return {
      index: index + 1,
      originalName: file.originalName ?? "",
      mimeType: file.mimeType ?? "",
      sizeBytes: typeof file.sizeBytes === "number" ? file.sizeBytes : null,
      base64File: truncated,
      base64Truncated: truncated.length !== base64.length,
    };
  });

  const slideCountRule =
    typeof input.numSlides === "number"
      ? `- Generate exactly ${input.numSlides} slides.`
      : "- Prefer 6 to 12 slides depending on content.";

  const user = `Create a slide deck in Markdown for the following presentation.

Title: ${input.title}

Context:
${input.contextPrompt}

Files (base64, may be truncated):
${JSON.stringify(filesForPrompt, null, 2)}

Return ONLY a JSON object of the form:
{
  "slides": [
    { "markdown": "# Slide title\\n- bullet" }
  ]
}

Rules:
- Each slide must be self-contained Markdown.
${slideCountRule}
- Slide 1 is a title slide.
- Use concise bullets; no giant paragraphs.
- Vary Markdown elements across slides — mix headings, bold text, blockquotes, tables, task lists, and horizontal rules. Do NOT use the same structure on every slide.
- Use blockquotes (> text) for key insights, quotes, or important callouts.
- Use tables for comparisons, feature lists, or structured data.
- Use task lists (- [ ] item) for action items, steps, or checklists.
- Use horizontal rules (---) to separate sections within a slide when a slide covers multiple distinct ideas.
- Use **bold** to highlight key terms.
`;

  let response: Response;
  try {
    response = await fetch(AI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_completion_tokens: maxCompletionTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    throw badGateway(
      "Slide generation provider is unreachable",
      "SLIDE_GENERATION_FAILED",
    );
  }

  if (!response.ok) {
    throw badGateway(
      `Slide generation provider failed with status ${response.status}`,
      "SLIDE_GENERATION_FAILED",
    );
  }

  let data: {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw badGateway(
      "Slide generation returned an invalid response",
      "SLIDE_GENERATION_FAILED",
    );
  }

  const content = stripThinkBlocks(
    data.choices?.[0]?.message?.content ?? "",
  );
  if (!content) {
    throw badGateway(
      "Slide generation returned an empty response",
      "SLIDE_GENERATION_FAILED",
    );
  }

  const jsonText = extractJsonObject(content);
  let parsed: { slides?: GeneratedSlide[] };
  try {
    parsed = JSON.parse(jsonText) as { slides?: GeneratedSlide[] };
  } catch {
    throw badGateway(
      "Slide generation returned invalid JSON",
      "SLIDE_GENERATION_FAILED",
    );
  }

  const slidesArray = Array.isArray(parsed.slides) ? parsed.slides : [];
  let normalized = slidesArray
    .map((s) => ({
      markdown: typeof s?.markdown === "string" ? s.markdown : "",
    }))
    .filter((s) => s.markdown.trim().length > 0);

  if (typeof input.numSlides === "number" && input.numSlides > 0) {
    normalized = normalized.slice(0, input.numSlides);
  }

  if (normalized.length === 0) {
    throw badGateway(
      "Slide generation returned no usable slides",
      "SLIDE_GENERATION_FAILED",
    );
  }

  return normalized;
};

export const aiService = {
  generateSlides,
} as const;
