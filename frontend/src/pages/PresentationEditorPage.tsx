import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEditorState } from "@/components/editor/useEditorState";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SlideList } from "@/components/editor/SlideList";
import { EditorToolbar } from "@/components/editor/EditorToolbarActions";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { LivePreview } from "@/components/editor/LivePreview";
import { SidebarContext } from "@/components/editor/SidebarContext";
import { SidebarTheme } from "@/components/editor/SidebarTheme";
import { ShareDialog } from "@/components/dialogs/ShareDialog";

export function PresentationEditorPage() {
  const state = useEditorState();

  if (state.status.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading editor...
        </div>
      </main>
    );
  }

  if (state.status.isError) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Failed to open editor.</p>
        <Button className="mt-4" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  if (!state.access.canEditContent) {
    return (
      <Navigate
        to={`/presentations/${state.presentation.id}`}
        replace
      />
    );
  }

  return (
    <main
      className="flex min-h-screen w-full flex-col gap-3 bg-background p-3 md:p-5"
      aria-label="Presentation editor"
    >
      <EditorHeader
        presentationId={state.presentation.id}
        titleDraft={state.presentation.titleDraft}
        isPreviewVisible={state.preview.isVisible}
        canManageAccess={state.access.canManageAccess}
        onTitleChange={state.presentation.onTitleChange}
        onTogglePreview={state.preview.onToggle}
        onOpenShare={state.shareDialog.onOpen}
      />

      <div className="grid flex-1 gap-3 overflow-hidden xl:grid-cols-[300px_1fr]">
        <aside className="flex flex-col gap-3 overflow-y-auto">
          <SlideList
            slides={state.slideList.slides}
            selectedSlideIndex={state.slideList.selectedSlideIndex}
            draggingSlideId={state.slideList.draggingSlideId}
            dragOverSlideId={state.slideList.dragOverSlideId}
            locksBySlideId={state.slideList.locksBySlideId}
            isGenerating={state.slideList.isGenerating}
            onSelectSlide={state.slideList.onSelectSlide}
            onDragStart={state.slideList.onDragStart}
            onDragEnd={state.slideList.onDragEnd}
            onDropSlide={state.slideList.onDropSlide}
            onDragOver={state.slideList.onDragOver}
            onDragLeave={state.slideList.onDragLeave}
          />

          <div className="flex flex-col gap-3">
            <SidebarContext
              activeContextId={state.contextPanel.activeContextId}
              effectivePromptDraft={state.contextPanel.effectivePromptDraft}
              pendingFiles={state.contextPanel.pendingFiles}
              contextFiles={state.contextPanel.contextFiles}
              isUpdating={state.contextPanel.isUpdating}
              isGenerating={state.contextPanel.isGenerating}
              numSlides={state.contextPanel.numSlides}
              onPromptChange={state.contextPanel.onPromptChange}
              onPickFiles={state.contextPanel.onPickFiles}
              onRemovePendingFile={state.contextPanel.onRemovePendingFile}
              onMarkFileForDeletion={state.contextPanel.onMarkFileForDeletion}
              onSaveContext={state.contextPanel.onSaveContext}
              onGenerateSlides={state.contextPanel.onGenerateSlides}
              onNumSlidesChange={state.contextPanel.onNumSlidesChange}
            />

            <SidebarTheme />
          </div>
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          <EditorToolbar
            hasCurrentSlide={state.toolbar.hasCurrentSlide}
            isDeleting={state.toolbar.isDeleting}
            isSaving={state.toolbar.isSaving}
            isSavedVisible={state.toolbar.isSavedVisible}
            realtimeStatus={state.toolbar.realtimeStatus}
            currentSlideLock={state.toolbar.currentSlideLock}
            isEditingCurrentSlide={state.toolbar.isEditingCurrentSlide}
            canTakeOver={state.toolbar.canTakeOver}
            onAddSlide={state.toolbar.onAddSlide}
            onDeleteSlide={state.toolbar.onDeleteSlide}
            onSave={state.toolbar.onSave}
            onStartEditing={state.toolbar.onStartEditing}
            onStopEditing={state.toolbar.onStopEditing}
            onTakeOverEditing={state.toolbar.onTakeOverEditing}
          />

          <MarkdownEditor
            markdownDraft={state.editor.markdownDraft}
            hasSlides={state.editor.hasSlides}
            isEditable={state.editor.isEditable}
            onMarkdownChange={state.editor.onMarkdownChange}
          />

          <LivePreview content={state.editor.markdownDraft} visible={state.preview.isVisible} />
        </section>
      </div>

      <ShareDialog
        presentationId={state.shareDialog.presentationId}
        open={state.shareDialog.open}
        onOpenChange={state.shareDialog.onOpenChange}
      />
    </main>
  );
}
