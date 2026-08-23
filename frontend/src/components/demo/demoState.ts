export type DemoGuideItemId = "edit" | "generate" | "theme" | "collab";

export type DemoSlide = {
  id: string;
  content: string;
  slideOrder: number;
};

export type DemoSavedFile = {
  id: string;
  originalName: string;
  fileName: string;
};

export type DemoCollaborationPhase =
  | "idle"
  | "joining"
  | "locked"
  | "updated"
  | "released";

export type DemoPresentationState = {
  version: 1;
  title: string;
  slides: DemoSlide[];
  selectedSlideIndex: number;
  prompt: string;
  savedFiles: DemoSavedFile[];
  numSlides: string;
  completedGuideItems: Record<DemoGuideItemId, boolean>;
};

export const DEMO_STORAGE_KEY = "markdeck.demo.state.v1";

export const DEMO_PRESENTATION_ID = "recruiter-demo";

export const DEMO_GUIDE_ITEMS: Array<{
  id: DemoGuideItemId;
  title: string;
  description: string;
}> = [
  {
    id: "edit",
    title: "Edit markdown",
    description: "The content format is the interface; the preview uses the real slide renderer.",
  },
  {
    id: "generate",
    title: "Generate from context",
    description: "Demo-safe generation uses your prompt and file names; production uses authenticated AI.",
  },
  {
    id: "theme",
    title: "Theme and present",
    description: "Themes affect only the slide canvas, so the editor chrome stays quiet.",
  },
  {
    id: "collab",
    title: "Share and collaborate",
    description: "Roles and slide locks show teamwork behavior in this one tab.",
  },
];

export function createInitialDemoState(): DemoPresentationState {
  return {
    version: 1,
    title: "MarkDeck recruiter demo",
    selectedSlideIndex: 0,
    prompt:
      "Create a short technical recruiter demo for MarkDeck. Emphasize markdown editing, AI-assisted slide generation, theme switching, sharing, and live collaboration signals.",
    numSlides: "5",
    savedFiles: [
      {
        id: "demo-file-product",
        originalName: "product-notes.md",
        fileName: "product-notes.md",
      },
    ],
    completedGuideItems: {
      edit: false,
      generate: false,
      theme: false,
      collab: false,
    },
    slides: [
      {
        id: "demo-intro",
        slideOrder: 0,
        content:
          "# MarkDeck\n\nTurn markdown notes into clean slides without leaving the editor.\n\n- Write in plain markdown\n- Preview instantly\n- Present when ready",
      },
      {
        id: "demo-editor",
        slideOrder: 1,
        content:
          "# Markdown-first workflow\n\nThe editor stays text-based, so students and educators can move fast.\n\n```md\n# Topic\n- Point one\n- Point two\n```\n\nNo drag handles. No design canvas.",
      },
      {
        id: "demo-ai",
        slideOrder: 2,
        content:
          "# Context-aware generation\n\nMarkDeck can turn a prompt and source files into a structured first draft.\n\n- Prompt sets intent\n- Files provide source material\n- Slides remain editable markdown",
      },
      {
        id: "demo-theme",
        slideOrder: 3,
        content:
          "# Presentation-ready themes\n\nTheme changes apply to the slide canvas, not the editor shell.\n\nThat keeps the workspace stable while the deck gains visual range.",
      },
      {
        id: "demo-collab",
        slideOrder: 4,
        content:
          "# Collaboration signals\n\nShared editing needs clear ownership.\n\n- Role-based access\n- Slide-level locks\n- Visible handoff when another editor is active",
      },
    ],
  };
}

export function normalizeDemoSlides(slides: DemoSlide[]) {
  return slides.map((slide, index) => ({
    ...slide,
    slideOrder: index,
  }));
}

function getPromptTopic(prompt: string) {
  const firstUsefulLine = prompt
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstUsefulLine) return "MarkDeck demo";
  return firstUsefulLine.length > 90
    ? `${firstUsefulLine.slice(0, 87)}...`
    : firstUsefulLine;
}

export function buildGeneratedDemoSlides({
  prompt,
  files,
  count,
}: {
  prompt: string;
  files: DemoSavedFile[];
  count: number;
}): DemoSlide[] {
  const topic = getPromptTopic(prompt);
  const fileNames = files.map((file) => file.originalName);
  const fileSummary = fileNames.length > 0 ? fileNames.join(", ") : "no files selected";
  const safeCount = Math.min(Math.max(count, 3), 6);
  const baseSlides: DemoSlide[] = [
    {
      id: "generated-overview",
      slideOrder: 0,
      content: `# ${topic}\n\nA recruiter can see the full MarkDeck loop in about a minute.\n\n- Edit markdown\n- Generate a draft\n- Present and share`,
    },
    {
      id: "generated-context",
      slideOrder: 1,
      content: `# Context in, slides out\n\nDemo-safe generation used these local signals:\n\n- Prompt: ${topic}\n- Files: ${fileSummary}\n\nFile contents are not uploaded in demo mode.`,
    },
    {
      id: "generated-editor",
      slideOrder: 2,
      content:
        "# Real editing surface\n\nThe generated draft lands back in the same markdown editor.\n\nThat makes the AI assist reversible, inspectable, and easy to refine.",
    },
    {
      id: "generated-theme",
      slideOrder: 3,
      content:
        "# Themes stay scoped\n\nThe deck can change visual style while the editor remains minimal.\n\nRecruiters see product polish without a design-tool detour.",
    },
    {
      id: "demo-collab",
      slideOrder: 4,
      content:
        "# Collaboration-ready\n\nA shared deck needs visible control.\n\n- Link access has roles\n- Active editors lock a slide\n- Remote updates appear without leaving the page",
    },
    {
      id: "generated-source",
      slideOrder: 5,
      content:
        "# Engineering signal\n\nThe demo runs without auth or backend writes.\n\nThe production editor keeps authenticated APIs, AI generation, sharing, and realtime collaboration separate.",
    },
  ];

  return normalizeDemoSlides(baseSlides.slice(0, safeCount));
}
