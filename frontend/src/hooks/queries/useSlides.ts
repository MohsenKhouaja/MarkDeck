import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "@/hooks/useApiClient";
import { queryKeys } from "@/lib/queryKeys";

export interface SlideRecord {
  id: string;
  presentationId: string;
  content: string | null;
  slideOrder: number;
}

export type SlideOrderUpdate = Array<{ id: string; order: number }>;

interface CreateSlideInput {
  content: string;
  slideOrder?: number;
}

interface UpdateSlideContentInput {
  slideId: string;
  content: string;
  lockToken: string;
}

interface ReorderSlidesInput {
  first: SlideOrderUpdate;
  second: SlideOrderUpdate;
}

interface GenerateSlidesInput {
  contextId: string;
  numSlides?: number;
}

export function usePresentationSlidesQuery(
  presentationId: string | null,
  enabled = true,
) {
  const api = useApiClient();

  return useQuery({
    queryKey: queryKeys.slides.byPresentation(presentationId ?? ""),
    queryFn: () =>
      api.get<SlideRecord[]>(
        `/api/presentations/${presentationId ?? ""}/slides`,
      ),
    enabled: enabled && Boolean(presentationId),
  });
}

export function useCreateSlideMutation(presentationId: string | null) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, slideOrder }: CreateSlideInput) => {
      if (!presentationId) {
        throw new Error("E055: Missing presentation id");
      }

      return api.post<SlideRecord>(
        `/api/presentations/${presentationId}/slides`,
        {
          content,
          slideOrder,
        },
      );
    },
    onSuccess: (createdSlide) => {
      if (!presentationId) {
        return;
      }

      queryClient.setQueryData<SlideRecord[]>(
        queryKeys.slides.byPresentation(presentationId),
        (current) => {
          const next = [...(current ?? []), createdSlide];
          return next.sort((a, b) => a.slideOrder - b.slideOrder);
        },
      );
    },
    onError: () => toast.error("Could not add slide"),
  });
}

export function useUpdateSlideContentMutation(presentationId: string | null) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slideId, content, lockToken }: UpdateSlideContentInput) => {
      if (!presentationId) {
        throw new Error("E056: Missing presentation id");
      }

      return api.put<SlideRecord>(
        `/api/presentations/${presentationId}/slides/${slideId}`,
        {
          content,
        },
        {
          headers: {
            "X-Slide-Lock-Token": lockToken,
          },
        },
      );
    },
    onSuccess: (updatedSlide) => {
      if (!presentationId) {
        return;
      }

      queryClient.setQueryData<SlideRecord[]>(
        queryKeys.slides.byPresentation(presentationId),
        (current) =>
          (current ?? []).map((slide) =>
            slide.id === updatedSlide.id ? updatedSlide : slide,
          ),
      );
    },
    onError: () => toast.error("Could not save slide"),
  });
}

export function useDeleteSlideMutation(presentationId: string | null) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { slideId: string; lockToken: string }) => {
      if (!presentationId) {
        throw new Error("E057: Missing presentation id");
      }

      return api.del<{ id: string; deleted: true }>(
        `/api/presentations/${presentationId}/slides/${input.slideId}`,
        {
          headers: {
            "X-Slide-Lock-Token": input.lockToken,
          },
        },
      );
    },
    onSuccess: async () => {
      if (!presentationId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.slides.byPresentation(presentationId),
      });
    },
    onError: () => toast.error("Could not delete slide"),
  });
}

export function useReorderSlidesMutation(presentationId: string | null) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ first, second }: ReorderSlidesInput) => {
      if (!presentationId) {
        throw new Error("E058: Missing presentation id");
      }

      return api.put<{ updated: SlideOrderUpdate[] }>(
        `/api/presentations/${presentationId}/slides/order`,
        {
          first,
          second,
        },
      );
    },
    onSuccess: (_result, variables) => {
      if (!presentationId) {
        return;
      }

      queryClient.setQueryData<SlideRecord[]>(
        queryKeys.slides.byPresentation(presentationId),
        (current) => {
          if (!current) {
            return current ?? [];
          }

          const orderMap = new Map(
            variables.second.map((entry) => [entry.id, entry.order]),
          );

          return [...current]
            .map((slide) => ({
              ...slide,
              slideOrder: orderMap.get(slide.id) ?? slide.slideOrder,
            }))
            .sort((a, b) => a.slideOrder - b.slideOrder);
        },
      );
    },
    onError: () => toast.error("Could not reorder slides"),
  });
}

export function useGenerateSlidesFromContextMutation(
  presentationId: string | null,
) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contextId, numSlides }: GenerateSlidesInput) => {
      if (!presentationId) {
        throw new Error("E059: Missing presentation id");
      }

      return api.post<SlideRecord[]>(
        `/api/presentations/${presentationId}/slides/generate`,
        {
          contextId,
          numSlides,
        },
      );
    },
    onSuccess: (generatedSlides) => {
      if (!presentationId) {
        return;
      }

      queryClient.setQueryData(
        queryKeys.slides.byPresentation(presentationId),
        generatedSlides,
      );
    },
    onError: () => toast.error("Could not generate slides"),
  });
}
