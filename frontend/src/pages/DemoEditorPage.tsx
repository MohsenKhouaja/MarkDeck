import { useEffect, useRef, useState } from "react";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorToolbar } from "@/components/editor/EditorToolbarActions";
import { LivePreview } from "@/components/editor/LivePreview";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { SidebarContext } from "@/components/editor/SidebarContext";
import { SidebarTheme } from "@/components/editor/SidebarTheme";
import { SlideList } from "@/components/editor/SlideList";
import { DemoGuide } from "@/components/demo/DemoGuide";
import { DemoShareCollaborationPanel } from "@/components/demo/DemoShareCollaborationPanel";
import { DEMO_PRESENTATION_ID, type DemoGuideItemId } from "@/components/demo/demoState";
import { useDemoPresentationState } from "@/components/demo/useDemoPresentationState";
import { useTheme } from "@/context/ThemeContext";

function scrollToDemoTarget(target: string) {
  document
    .querySelector(`[data-demo-target="${target}"]`)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function DemoEditorPage() {
  const demo = useDemoPresentationState();
  const { theme, tone } = useTheme();
  const firstThemeValueRef = useRef(`${theme}:${tone}`);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const isThemeGuideComplete = demo.state.completedGuideItems.theme;
  const markGuideItemComplete = demo.markGuideItemComplete;

  useEffect(() => {
    if (!isThemeGuideComplete && `${theme}:${tone}` !== firstThemeValueRef.current) {
      markGuideItemComplete("theme");
    }
  }, [isThemeGuideComplete, markGuideItemComplete, theme, tone]);

  const handleOpenShare = () => {
    demo.setIsSharePanelOpen(true);
    window.setTimeout(() => scrollToDemoTarget("collab"), 0);
  };

  const handleGuideSelect = (itemId: DemoGuideItemId) => {
    if (itemId === "edit") {
      demo.setSelectedSlideIndex(0);
      setIsPreviewVisible(true);
      window.setTimeout(() => {
        scrollToDemoTarget("editor");
        document
          .querySelector<HTMLTextAreaElement>(
            '[aria-label="Slide markdown content"]',
          )
          ?.focus();
      }, 0);
      return;
    }

    if (itemId === "generate") {
      scrollToDemoTarget("context");
      document.querySelector<HTMLTextAreaElement>('[aria-label="Context prompt"]')?.focus();
      return;
    }

    if (itemId === "theme") {
      scrollToDemoTarget("theme");
      return;
    }

    demo.runCollaborationScene();
    window.setTimeout(() => scrollToDemoTarget("collab"), 0);
  };

  return (
    <main
      className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 p-4 md:p-6"
      aria-label="Recruiter demo editor"
    >
      <EditorHeader
        presentationId={DEMO_PRESENTATION_ID}
        titleDraft={demo.state.title}
        isPreviewVisible={isPreviewVisible}
        canManageAccess
        viewHref="/demo/present"
        showBackButton={false}
        onTitleChange={demo.updateTitle}
        onTogglePreview={() => setIsPreviewVisible((visible) => !visible)}
        onOpenShare={handleOpenShare}
      />

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="flex min-w-0 flex-col gap-4">
          <SlideList
            slides={demo.state.slides}
            selectedSlideIndex={demo.state.selectedSlideIndex}
            draggingSlideId={demo.draggingSlideId}
            dragOverSlideId={demo.dragOverSlideId}
            locksBySlideId={demo.locksBySlideId}
            isGenerating={demo.isGenerating}
            onSelectSlide={demo.setSelectedSlideIndex}
            onDragStart={demo.startDrag}
            onDragEnd={demo.endDrag}
            onDropSlide={demo.dropSlide}
            onDragOver={demo.setDragOverSlideId}
            onDragLeave={() => demo.setDragOverSlideId(null)}
          />

          <div data-demo-target="context">
            <SidebarContext
              activeContextId="demo-context"
              effectivePromptDraft={demo.state.prompt}
              pendingFiles={demo.pendingFiles}
              contextFiles={demo.state.savedFiles}
              isUpdating={demo.isUpdatingContext}
              isGenerating={demo.isGenerating}
              numSlides={demo.state.numSlides}
              onPromptChange={demo.updatePrompt}
              onPickFiles={demo.pickFiles}
              onRemovePendingFile={demo.removePendingFile}
              onMarkFileForDeletion={demo.removeSavedFile}
              onSaveContext={demo.saveContext}
              onGenerateSlides={demo.generateSlides}
              onNumSlidesChange={demo.setNumSlides}
            />
          </div>

          <div data-demo-target="theme">
            <SidebarTheme />
          </div>

          <DemoShareCollaborationPanel
            open={demo.isSharePanelOpen}
            phase={demo.collaborationPhase}
            onClose={() => demo.setIsSharePanelOpen(false)}
            onReplay={demo.runCollaborationScene}
          />
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <EditorToolbar
            hasCurrentSlide={Boolean(demo.currentSlide)}
            isDeleting={false}
            isSaving={demo.isSaving}
            isSavedVisible={demo.isSavedVisible}
            realtimeStatus="connected"
            currentSlideLock={
              demo.isLockedByAmina ? { username: "Amina" } : null
            }
            isEditingCurrentSlide={!demo.isLockedByAmina}
            canTakeOver={false}
            onAddSlide={demo.addSlide}
            onDeleteSlide={demo.deleteSlide}
            onSave={demo.saveSlide}
            onStartEditing={demo.startEditing}
            onStopEditing={demo.stopEditing}
            onTakeOverEditing={demo.startEditing}
          />

          <div data-demo-target="editor">
            <MarkdownEditor
              markdownDraft={demo.currentSlide?.content ?? ""}
              hasSlides={demo.state.slides.length > 0}
              isEditable={!demo.isLockedByAmina}
              onMarkdownChange={demo.updateMarkdown}
            />
          </div>

          <LivePreview
            content={demo.currentSlide?.content ?? ""}
            visible={isPreviewVisible}
          />
        </section>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <DemoGuide
            completedItems={demo.state.completedGuideItems}
            onSelectItem={handleGuideSelect}
            onReset={demo.resetDemo}
          />
        </div>
      </div>
    </main>
  );
}
