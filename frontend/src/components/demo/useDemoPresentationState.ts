import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import {
  buildGeneratedDemoSlides,
  createInitialDemoState,
  DEMO_STORAGE_KEY,
  type DemoCollaborationPhase,
  type DemoGuideItemId,
  type DemoPresentationState,
  type DemoSavedFile,
  type DemoSlide,
} from "@/components/demo/demoState";

function readDemoState(): DemoPresentationState {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return createInitialDemoState();

    const parsed = JSON.parse(raw) as Partial<DemoPresentationState>;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.slides) ||
      typeof parsed.title !== "string"
    ) {
      return createInitialDemoState();
    }

    const fallback = createInitialDemoState();
    return {
      ...fallback,
      ...parsed,
      selectedSlideIndex: Math.min(
        Math.max(parsed.selectedSlideIndex ?? 0, 0),
        Math.max(parsed.slides.length - 1, 0),
      ),
      completedGuideItems: {
        ...fallback.completedGuideItems,
        ...parsed.completedGuideItems,
      },
    };
  } catch {
    return createInitialDemoState();
  }
}

function fileToSavedFile(file: File): DemoSavedFile {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    originalName: file.name,
    fileName: file.name,
  };
}

function moveItem(items: DemoSlide[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return items;
  next.splice(toIndex, 0, item);
  return next.map((entry, index) => ({ ...entry, slideOrder: index }));
}

export function useDemoPresentationState() {
  const [state, setState] = useState(readDemoState);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedVisible, setIsSavedVisible] = useState(false);
  const [isUpdatingContext, setIsUpdatingContext] = useState(false);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [collaborationPhase, setCollaborationPhase] =
    useState<DemoCollaborationPhase>("idle");
  const [lockedSlideId, setLockedSlideId] = useState<string | null>(null);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [dragOverSlideId, setDragOverSlideId] = useState<string | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const currentSlide = state.slides[state.selectedSlideIndex] ?? null;
  const isLockedByAmina = Boolean(currentSlide && lockedSlideId === currentSlide.id);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    timeoutsRef.current.push(timeoutId);
  }, []);

  const markGuideItemComplete = useCallback((itemId: DemoGuideItemId) => {
    setState((current) => ({
      ...current,
      completedGuideItems: {
        ...current.completedGuideItems,
        [itemId]: true,
      },
    }));
  }, []);

  const flashSaved = useCallback(() => {
    setIsSavedVisible(true);
    schedule(() => setIsSavedVisible(false), 1200);
  }, [schedule]);

  const setSelectedSlideIndex = useCallback((index: number) => {
    setState((current) => ({
      ...current,
      selectedSlideIndex: Math.min(Math.max(index, 0), current.slides.length - 1),
    }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setState((current) => ({ ...current, title }));
  }, []);

  const updateMarkdown = useCallback(
    (content: string) => {
      if (isLockedByAmina) return;
      setState((current) => ({
        ...current,
        slides: current.slides.map((slide, index) =>
          index === current.selectedSlideIndex ? { ...slide, content } : slide,
        ),
      }));
      markGuideItemComplete("edit");
    },
    [isLockedByAmina, markGuideItemComplete],
  );

  const addSlide = useCallback(() => {
    setState((current) => {
      const insertAt = current.selectedSlideIndex + 1;
      const nextSlides = [...current.slides];
      nextSlides.splice(insertAt, 0, {
        id: `demo-slide-${Date.now()}`,
        slideOrder: insertAt,
        content: "# New slide\n\nAdd the next thought here.",
      });

      return {
        ...current,
        slides: nextSlides.map((slide, index) => ({ ...slide, slideOrder: index })),
        selectedSlideIndex: insertAt,
      };
    });
  }, []);

  const deleteSlide = useCallback(() => {
    if (isLockedByAmina) return;
    setState((current) => {
      if (current.slides.length <= 1) return current;
      const nextSlides = current.slides.filter(
        (_, index) => index !== current.selectedSlideIndex,
      );

      return {
        ...current,
        slides: nextSlides.map((slide, index) => ({ ...slide, slideOrder: index })),
        selectedSlideIndex: Math.min(
          current.selectedSlideIndex,
          nextSlides.length - 1,
        ),
      };
    });
  }, [isLockedByAmina]);

  const saveSlide = useCallback(() => {
    setIsSaving(true);
    schedule(() => {
      setIsSaving(false);
      flashSaved();
    }, 350);
  }, [flashSaved, schedule]);

  const stopEditing = useCallback(() => {
    setLockedSlideId(currentSlide?.id ?? null);
  }, [currentSlide?.id]);

  const startEditing = useCallback(() => {
    setLockedSlideId(null);
  }, []);

  const updatePrompt = useCallback((prompt: string) => {
    setState((current) => ({ ...current, prompt }));
  }, []);

  const pickFiles = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPendingFiles((current) => [
      ...current,
      ...Array.from(event.target.files ?? []),
    ]);
    event.target.value = "";
  }, []);

  const removePendingFile = useCallback((file: File) => {
    setPendingFiles((current) => current.filter((item) => item !== file));
  }, []);

  const removeSavedFile = useCallback((fileId: string) => {
    setState((current) => ({
      ...current,
      savedFiles: current.savedFiles.filter((file) => file.id !== fileId),
    }));
  }, []);

  const saveContext = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      setIsUpdatingContext(true);
      schedule(() => {
        setState((current) => ({
          ...current,
          savedFiles: [...current.savedFiles, ...pendingFiles.map(fileToSavedFile)],
        }));
        setPendingFiles([]);
        setIsUpdatingContext(false);
        flashSaved();
      }, 300);
    },
    [flashSaved, pendingFiles, schedule],
  );

  const setNumSlides = useCallback((numSlides: string) => {
    setState((current) => ({ ...current, numSlides }));
  }, []);

  const generateSlides = useCallback(() => {
    const requestedCount = Number.parseInt(state.numSlides, 10);
    setIsGenerating(true);
    schedule(() => {
      setState((current) => ({
        ...current,
        slides: buildGeneratedDemoSlides({
          prompt: current.prompt,
          files: current.savedFiles,
          count: Number.isFinite(requestedCount) ? requestedCount : 5,
        }),
        selectedSlideIndex: 0,
        completedGuideItems: {
          ...current.completedGuideItems,
          generate: true,
        },
      }));
      setIsGenerating(false);
      flashSaved();
    }, 850);
  }, [flashSaved, schedule, state.numSlides]);

  const startDrag = useCallback(
    (slideId: string) => (event: DragEvent<HTMLButtonElement>) => {
      setDraggingSlideId(slideId);
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const endDrag = useCallback(() => {
    setDraggingSlideId(null);
    setDragOverSlideId(null);
  }, []);

  const dropSlide = useCallback(
    (targetSlideId: string) => {
      if (!draggingSlideId || draggingSlideId === targetSlideId) {
        endDrag();
        return;
      }

      setState((current) => {
        const fromIndex = current.slides.findIndex(
          (slide) => slide.id === draggingSlideId,
        );
        const toIndex = current.slides.findIndex(
          (slide) => slide.id === targetSlideId,
        );
        if (fromIndex === -1 || toIndex === -1) return current;

        return {
          ...current,
          slides: moveItem(current.slides, fromIndex, toIndex),
          selectedSlideIndex: toIndex,
        };
      });
      endDrag();
    },
    [draggingSlideId, endDrag],
  );

  const runCollaborationScene = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
    setIsSharePanelOpen(true);
    setCollaborationPhase("joining");

    const collaborationSlideIndex = state.slides.findIndex(
      (slide) => slide.id === "demo-collab",
    );
    const targetSlideIndex =
      collaborationSlideIndex === -1
        ? Math.max(state.slides.length - 1, 0)
        : collaborationSlideIndex;
    const targetSlide = state.slides[targetSlideIndex];
    if (!targetSlide) return;

    setState((current) => ({ ...current, selectedSlideIndex: targetSlideIndex }));

    schedule(() => {
      setLockedSlideId(targetSlide.id);
      setCollaborationPhase("locked");
    }, 450);

    schedule(() => {
      setState((current) => ({
        ...current,
        slides: current.slides.map((slide) =>
          slide.id === targetSlide.id
            ? {
                ...slide,
                content:
                  "# Collaboration signals\n\nAmina is editing this shared slide.\n\n- Your editor becomes read-only while her lock is active\n- The slide list shows who owns the lock\n- Her update appears in the same preview",
              }
            : slide,
        ),
      }));
      setCollaborationPhase("updated");
    }, 1500);

    schedule(() => {
      setLockedSlideId(null);
      setCollaborationPhase("released");
      markGuideItemComplete("collab");
      flashSaved();
    }, 2700);
  }, [flashSaved, markGuideItemComplete, schedule, state.slides]);

  const resetDemo = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    setState(createInitialDemoState());
    setPendingFiles([]);
    setIsGenerating(false);
    setIsSaving(false);
    setIsSavedVisible(false);
    setIsUpdatingContext(false);
    setIsSharePanelOpen(false);
    setCollaborationPhase("idle");
    setLockedSlideId(null);
    setDraggingSlideId(null);
    setDragOverSlideId(null);
  }, []);

  const locksBySlideId = useMemo(
    () =>
      lockedSlideId
        ? {
            [lockedSlideId]: {
              username: "Amina",
            },
          }
        : {},
    [lockedSlideId],
  );

  return {
    state,
    currentSlide,
    pendingFiles,
    locksBySlideId,
    isGenerating,
    isSaving,
    isSavedVisible,
    isUpdatingContext,
    isSharePanelOpen,
    collaborationPhase,
    isLockedByAmina,
    draggingSlideId,
    dragOverSlideId,
    setSelectedSlideIndex,
    updateTitle,
    updateMarkdown,
    addSlide,
    deleteSlide,
    saveSlide,
    stopEditing,
    startEditing,
    updatePrompt,
    pickFiles,
    removePendingFile,
    removeSavedFile,
    saveContext,
    setNumSlides,
    generateSlides,
    startDrag,
    endDrag,
    dropSlide,
    setDragOverSlideId,
    setIsSharePanelOpen,
    runCollaborationScene,
    resetDemo,
    markGuideItemComplete,
  };
}
