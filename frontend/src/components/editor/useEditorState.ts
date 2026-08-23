"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  usePresentationDetailQuery,
  useUpdatePresentationMutation,
} from "@/hooks/queries/usePresentations";
import {
  type SlideRecord,
  usePresentationSlidesQuery,
  useCreateSlideMutation,
  useDeleteSlideMutation,
  useReorderSlidesMutation,
  useUpdateSlideContentMutation,
  useGenerateSlidesFromContextMutation,
} from "@/hooks/queries/useSlides";
import {
  useContextByPresentationQuery,
  useContextFilesQuery,
  useUpdateContextMutation,
} from "@/hooks/queries/useContextsFiles";
import { queryKeys } from "@/lib/queryKeys";
import { useSlideLocks } from "./useSlideLocks";

export function useEditorState() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const detailQuery = usePresentationDetailQuery(id ?? null, Boolean(id));
  const slidesQuery = usePresentationSlidesQuery(id ?? null, Boolean(id));
  const linkedContextQuery = useContextByPresentationQuery(id ?? null);

  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [draftById, setDraftById] = useState<Record<string, string>>({});
  const [lastSavedById, setLastSavedById] = useState<Record<string, string>>({});
  const [isSavedVisible, setIsSavedVisible] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [draggingSlideId, setDraggingSlideId] = useState<string | null>(null);
  const [dragOverSlideId, setDragOverSlideId] = useState<string | null>(null);
  const [numSlides, setNumSlides] = useState<string>("");

  const autosaveTimersRef = useRef<Record<string, number>>({});
  const savingSlidesRef = useRef<Set<string>>(new Set());
  const savedTimerRef = useRef<number | null>(null);

  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const updateContextMutation = useUpdateContextMutation();
  const updatePresentationMutation = useUpdatePresentationMutation();
  const createSlideMutation = useCreateSlideMutation(id ?? null);
  const updateSlideMutation = useUpdateSlideContentMutation(id ?? null);
  const deleteSlideMutation = useDeleteSlideMutation(id ?? null);
  const reorderSlidesMutation = useReorderSlidesMutation(id ?? null);
  const generateSlidesMutation = useGenerateSlidesFromContextMutation(id ?? null);

  const activeContextId = linkedContextQuery.data?.id ?? null;
  const contextFilesQuery = useContextFilesQuery(activeContextId, Boolean(activeContextId));

  const slides = useMemo(() => {
    const mappedSlides =
      slidesQuery.data?.map((slide) => ({
        id: slide.id,
        content: slide.content ?? "",
        slideOrder: slide.slideOrder,
      })) ?? [];
    return [...mappedSlides].sort((a, b) => a.slideOrder - b.slideOrder);
  }, [slidesQuery.data]);

  const titleDraft = titleOverride ?? detailQuery.data?.title ?? "";
  const safeSelectedSlideIndex = Math.min(selectedSlideIndex, Math.max(slides.length - 1, 0));
  const currentSlide = slides[safeSelectedSlideIndex];
  const markdownDraft = currentSlide
    ? (draftById[currentSlide.id] ?? currentSlide.content)
    : "";
  const effectivePromptDraft = promptDraft ?? linkedContextQuery.data?.prompt ?? "";

  // Sync slide data into draft/lastSaved state
  useEffect(() => {
    if (!slidesQuery.data) return;
    queueMicrotask(() => {
      setDraftById((current) => {
        const next = { ...current };
        slidesQuery.data.forEach((slide) => {
          if (next[slide.id] === undefined) next[slide.id] = slide.content ?? "";
        });
        return next;
      });
      setLastSavedById((current) => {
        const next = { ...current };
        slidesQuery.data.forEach((slide) => {
          if (next[slide.id] === undefined) next[slide.id] = slide.content ?? "";
        });
        return next;
      });
    });
  }, [slidesQuery.data]);

  // Clamp selected slide index
  useEffect(() => {
    queueMicrotask(() => {
      if (slides.length === 0) {
        setSelectedSlideIndex(0);
        return;
      }
      setSelectedSlideIndex((current) => Math.min(current, Math.max(slides.length - 1, 0)));
    });
  }, [slides.length]);

  // Cleanup timers on unmount
  useEffect(() => {
    const autosaveTimers = autosaveTimersRef.current;
    return () => {
      Object.values(autosaveTimers).forEach((timer) =>
        window.clearTimeout(timer),
      );
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    };
  }, []);

  // ResizeObserver to keep preview scale accurate
  useEffect(() => {
    const el = previewWrapperRef.current;
    if (!el) return;
    const update = () => setPreviewScale(el.offsetWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isPreviewVisible]);

  const showSavedNotice = useCallback(() => {
    setIsSavedVisible(true);
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => setIsSavedVisible(false), 1500);
  }, []);

  const handleRealtimeSlideSaved = useCallback(
    ({ slideId, content }: { slideId: string; content: string }) => {
      if (!id) return;
      queryClient.setQueryData<SlideRecord[]>(
        queryKeys.slides.byPresentation(id),
        (current) =>
          (current ?? []).map((slide) =>
            slide.id === slideId ? { ...slide, content } : slide,
          ),
      );
      setLastSavedById((current) => ({ ...current, [slideId]: content }));
      setDraftById((current) => ({ ...current, [slideId]: content }));
    },
    [id, queryClient],
  );

  const handleRealtimeSlidesChanged = useCallback(() => {
    if (!id) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.slides.byPresentation(id),
    });
  }, [id, queryClient]);

  const slideLocks = useSlideLocks({
    presentationId: id ?? null,
    enabled: Boolean(id && detailQuery.data?.capabilities.editContent),
    onSlideSaved: handleRealtimeSlideSaved,
    onSlidesChanged: handleRealtimeSlidesChanged,
  });

  const currentSlideLock = currentSlide
    ? slideLocks.locksBySlideId[currentSlide.id] ?? null
    : null;
  const isEditingCurrentSlide =
    Boolean(currentSlide) && slideLocks.ownedLock?.slideId === currentSlide?.id;

  const saveSlideContent = useCallback(async (slideId: string, content: string, { showNotice }: { showNotice: boolean }) => {
    const ownedLock = slideLocks.ownedLock;
    if (ownedLock?.slideId !== slideId) {
      toast.error("Start editing this slide before saving");
      return false;
    }
    if (lastSavedById[slideId] === content) return true;
    if (savingSlidesRef.current.has(slideId)) return false;
    savingSlidesRef.current.add(slideId);
    try {
      await updateSlideMutation.mutateAsync({
        slideId,
        content,
        lockToken: ownedLock.lockToken,
      });
      setLastSavedById((current) => ({ ...current, [slideId]: content }));
      if (showNotice) showSavedNotice();
      return true;
    } catch {
      // error handled by mutation onError toast
      return false;
    } finally {
      savingSlidesRef.current.delete(slideId);
    }
  }, [lastSavedById, showSavedNotice, slideLocks.ownedLock, updateSlideMutation]);

  const scheduleAutosave = (slideId: string, content: string) => {
    if (slideLocks.ownedLock?.slideId !== slideId) return;
    const existingTimer = autosaveTimersRef.current[slideId];
    if (existingTimer) window.clearTimeout(existingTimer);
    autosaveTimersRef.current[slideId] = window.setTimeout(() => {
      void saveSlideContent(slideId, content, { showNotice: true });
    }, 1200);
  };

  const saveAndReleaseCurrentLock = useCallback(async () => {
    if (!currentSlide || slideLocks.ownedLock?.slideId !== currentSlide.id) {
      return true;
    }

    const pendingTimer = autosaveTimersRef.current[currentSlide.id];
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      delete autosaveTimersRef.current[currentSlide.id];
    }

    const saved = await saveSlideContent(currentSlide.id, markdownDraft, {
      showNotice: true,
    });
    if (!saved) return false;
    await slideLocks.releaseLock();
    return true;
  }, [currentSlide, markdownDraft, saveSlideContent, slideLocks]);

  const onAddSlide = async () => {
    try {
      const createdSlide = await createSlideMutation.mutateAsync({
        content: "# New Slide",
        slideOrder: slides.length + 1,
      });
      setDraftById((current) => ({
        ...current,
        [createdSlide.id]: createdSlide.content ?? "",
      }));
      setLastSavedById((current) => ({
        ...current,
        [createdSlide.id]: createdSlide.content ?? "",
      }));
      setSelectedSlideIndex(slides.length);
    } catch {
      // error handled by mutation onError toast
    }
  };

  const onDeleteSlide = async () => {
    if (!currentSlide) return;
    if (slideLocks.ownedLock?.slideId !== currentSlide.id) {
      toast.error("Start editing this slide before deleting it");
      return;
    }
    const deletingIndex = safeSelectedSlideIndex;
    try {
      await deleteSlideMutation.mutateAsync({
        slideId: currentSlide.id,
        lockToken: slideLocks.ownedLock.lockToken,
      });
      setDraftById((current) => {
        const next = { ...current };
        delete next[currentSlide.id];
        return next;
      });
      setLastSavedById((current) => {
        const next = { ...current };
        delete next[currentSlide.id];
        return next;
      });
      await slideLocks.releaseLock();
      setSelectedSlideIndex(Math.max(deletingIndex - 1, 0));
    } catch {
      // error handled by mutation onError toast
    }
  };

  const handleDragStart = (slideId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", slideId);
    setDraggingSlideId(slideId);
  };

  const handleDragEnd = () => {
    setDraggingSlideId(null);
    setDragOverSlideId(null);
  };

  const onSelectSlide = async (index: number) => {
    if (index === safeSelectedSlideIndex) return;
    const released = await saveAndReleaseCurrentLock();
    if (!released) return;
    setSelectedSlideIndex(index);
  };

  const onDropSlide = async (targetId: string) => {
    if (!draggingSlideId || draggingSlideId === targetId) return;
    const draggedIndex = slides.findIndex((slide) => slide.id === draggingSlideId);
    const targetIndex = slides.findIndex((slide) => slide.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const draggedSlide = slides[draggedIndex];
    const targetSlide = slides[targetIndex];
    const selectedId = currentSlide?.id ?? null;
    try {
      await reorderSlidesMutation.mutateAsync({
        first: [
          { id: draggedSlide.id, order: draggedSlide.slideOrder },
          { id: targetSlide.id, order: targetSlide.slideOrder },
        ],
        second: [
          { id: draggedSlide.id, order: targetSlide.slideOrder },
          { id: targetSlide.id, order: draggedSlide.slideOrder },
        ],
      });
      if (selectedId) {
        const nextSlides = [...slides];
        nextSlides[draggedIndex] = targetSlide;
        nextSlides[targetIndex] = draggedSlide;
        const nextIndex = nextSlides.findIndex((slide) => slide.id === selectedId);
        if (nextIndex >= 0) setSelectedSlideIndex(nextIndex);
      }
    } catch {
      // error handled by mutation onError toast
    } finally {
      setDraggingSlideId(null);
      setDragOverSlideId(null);
    }
  };

  const onSaveSelectedSlide = useCallback(async () => {
    if (!currentSlide) return;
    const pendingTimer = autosaveTimersRef.current[currentSlide.id];
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      delete autosaveTimersRef.current[currentSlide.id];
    }
    const saved = await saveSlideContent(currentSlide.id, markdownDraft, { showNotice: true });
    if (!saved) return;
    if (!id) return;
    const normalizedTitle = titleDraft.trim();
    if (normalizedTitle && normalizedTitle !== (detailQuery.data?.title ?? "")) {
      await updatePresentationMutation
        .mutateAsync({ presentationId: id, title: normalizedTitle })
        .catch(() => undefined);
    }
  }, [currentSlide, detailQuery.data?.title, id, markdownDraft, saveSlideContent, titleDraft, updatePresentationMutation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void onSaveSelectedSlide();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSaveSelectedSlide]);

  const onPickFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setPendingFiles((current) => [...current, ...nextFiles]);
    event.target.value = "";
  };

  const onSaveContext = async (event: React.FormEvent) => {
    event.preventDefault();
    if (activeContextId) {
      await updateContextMutation
        .mutateAsync({
          contextId: activeContextId,
          prompt: effectivePromptDraft,
          files: pendingFiles,
          deletedFileIds,
        })
        .catch(() => undefined);
    }
    setPendingFiles([]);
    setDeletedFileIds([]);
  };

  const onGenerateSlides = async () => {
    if (!activeContextId) return;
    if (Object.keys(slideLocks.locksBySlideId).length > 0) {
      toast.error("Stop editing before generating slides");
      return;
    }
    const parsed = numSlides.trim() !== "" ? Number(numSlides) : undefined;
    try {
      await generateSlidesMutation.mutateAsync({
        contextId: activeContextId,
        numSlides: parsed,
      });
      setDraftById({});
      setLastSavedById({});
      setSelectedSlideIndex(0);
    } catch {
      // error handled by mutation onError toast
    }
  };

  const onMarkdownChange = (next: string) => {
    if (!currentSlide) return;
    if (!isEditingCurrentSlide) return;
    setDraftById((current) => ({
      ...current,
      [currentSlide.id]: next,
    }));
    scheduleAutosave(currentSlide.id, next);
  };

  const onTogglePreview = () => {
    setIsPreviewVisible((current) => !current);
  };

  const onOpenShare = () => {
    setIsShareDialogOpen(true);
  };

  const onStartEditing = async () => {
    if (!currentSlide) return;
    const response = await slideLocks.acquireLock(currentSlide.id);
    if (!response.ok) {
      toast.error(response.message);
    }
  };

  const onTakeOverEditing = async () => {
    if (!currentSlide) return;
    const response = await slideLocks.acquireLock(currentSlide.id, true);
    if (!response.ok) {
      toast.error(response.message);
    }
  };

  const onStopEditing = async () => {
    const released = await saveAndReleaseCurrentLock();
    if (!released) {
      toast.error("Could not save the slide before stopping editing");
    }
  };

  const onRemovePendingFile = (file: File) => {
    setPendingFiles((current) => current.filter((candidate) => candidate !== file));
  };

  const onMarkFileForDeletion = (fileId: string) => {
    setDeletedFileIds((current) => [...current, fileId]);
  };

  return {
    status: {
      isPending: detailQuery.isPending || slidesQuery.isPending,
      isError: detailQuery.isError || slidesQuery.isError || !detailQuery.data,
    },
    access: {
      canEditContent: detailQuery.data?.capabilities.editContent ?? false,
      canManageAccess: detailQuery.data?.capabilities.manageAccess ?? false,
    },
    presentation: {
      id: detailQuery.data?.id ?? id ?? "",
      titleDraft,
      onTitleChange: setTitleOverride,
    },
    preview: {
      isVisible: isPreviewVisible,
      ref: previewWrapperRef,
      scale: previewScale,
      onToggle: onTogglePreview,
    },
    slideList: {
      slides,
      selectedSlideIndex: safeSelectedSlideIndex,
      draggingSlideId,
      dragOverSlideId,
      locksBySlideId: slideLocks.locksBySlideId,
      isGenerating: generateSlidesMutation.isPending,
      onSelectSlide: (index: number) => void onSelectSlide(index),
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDropSlide,
      onDragOver: () => {},
      onDragLeave: () => {},
    },
    contextPanel: {
      activeContextId,
      effectivePromptDraft,
      pendingFiles,
      contextFiles: contextFilesQuery.data,
      isUpdating: updateContextMutation.isPending,
      isGenerating: generateSlidesMutation.isPending,
      numSlides,
      onPromptChange: setPromptDraft,
      onPickFiles,
      onRemovePendingFile,
      onMarkFileForDeletion,
      onSaveContext,
      onGenerateSlides,
      onNumSlidesChange: setNumSlides,
    },
    toolbar: {
      hasCurrentSlide: Boolean(currentSlide),
      isDeleting: deleteSlideMutation.isPending,
      isSaving: updateSlideMutation.isPending,
      isSavedVisible,
      realtimeStatus: slideLocks.status,
      currentSlideLock,
      isEditingCurrentSlide,
      canTakeOver:
        slideLocks.lastAcquireError?.code === "PRESENTATION_LOCK_ALREADY_HELD",
      onAddSlide,
      onDeleteSlide,
      onSave: onSaveSelectedSlide,
      onStartEditing,
      onStopEditing,
      onTakeOverEditing,
    },
    editor: {
      markdownDraft,
      hasSlides: slides.length > 0,
      isEditable: isEditingCurrentSlide && slideLocks.status === "connected",
      onMarkdownChange,
    },
    shareDialog: {
      presentationId: detailQuery.data?.id ?? id ?? "",
      open: isShareDialogOpen,
      onOpen: onOpenShare,
      onOpenChange: setIsShareDialogOpen,
    },
  };
}
