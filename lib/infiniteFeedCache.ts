import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import { PAGE_SIZE } from "@/lib/constants";

export interface FeedPagination {
  page: number;
  total: number;
  totalPages: number;
}

export type InfiniteFeedPage<TItem, TItemsKey extends string> = {
  [K in TItemsKey]: TItem[];
} & {
  pagination: FeedPagination;
};

export function createInfiniteFeedData<TItem, TItemsKey extends string>(
  itemsKey: TItemsKey,
  items: TItem[],
  pagination: FeedPagination,
  pageParam: number = pagination.page,
): InfiniteData<InfiniteFeedPage<TItem, TItemsKey>, unknown> {
  return {
    pages: [
      {
        [itemsKey]: items,
        pagination,
      } as InfiniteFeedPage<TItem, TItemsKey>,
    ],
    pageParams: [pageParam],
  };
}

export function flattenInfiniteFeedItems<TItem, TItemsKey extends string>(
  data: InfiniteData<InfiniteFeedPage<TItem, TItemsKey>, unknown> | undefined,
  itemsKey: TItemsKey,
): TItem[] {
  return data?.pages.flatMap((page) => page[itemsKey]) ?? [];
}

export function updateInfiniteFeedItems<TItem, TItemsKey extends string>(
  queryClient: QueryClient,
  options: {
    queryKey: QueryKey;
    itemsKey: TItemsKey;
    pageSize?: number;
    updater: (items: TItem[]) => TItem[];
  },
): void {
  const { queryKey, itemsKey, pageSize = PAGE_SIZE, updater } = options;

  queryClient.setQueryData<InfiniteData<InfiniteFeedPage<TItem, TItemsKey>, unknown>>(
    queryKey,
    (current) => {
      if (!current) return current;

      const currentItems = flattenInfiniteFeedItems(current, itemsKey);
      const nextItems = updater(currentItems);
      if (nextItems === currentItems) return current;

      const lastKnownTotal = current.pages.at(-1)?.pagination.total ?? currentItems.length;
      const total = Math.max(0, lastKnownTotal + (nextItems.length - currentItems.length));
      const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
      const pageParams = current.pageParams.length > 0
        ? current.pageParams
        : current.pages.map((page) => page.pagination.page);

      let cursor = 0;
      const pages = current.pages.map((page, index) => {
        const isLastPage = index === current.pages.length - 1;
        const chunkSize = isLastPage ? undefined : page[itemsKey].length;
        const nextChunk =
          chunkSize == null
            ? nextItems.slice(cursor)
            : nextItems.slice(cursor, cursor + chunkSize);
        cursor += nextChunk.length;

        return {
          ...page,
          [itemsKey]: nextChunk,
          pagination: {
            page:
              typeof pageParams[index] === "number"
                ? pageParams[index]
                : page.pagination.page,
            total,
            totalPages,
          },
        } as InfiniteFeedPage<TItem, TItemsKey>;
      });

      return {
        pages,
        pageParams,
      };
    },
  );
}
