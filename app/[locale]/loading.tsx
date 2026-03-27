import AppShell from "@/features/layout/components/AppShell";
import FeedLoading from "@/shared/components/feed/FeedLoading";
import Skeleton from "@/shared/components/ui/Skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="content-section">
        <div className="pt-8 sm:pt-12 lg:pt-16">
          <div className="card-base space-y-4 p-6" aria-hidden>
            <Skeleton className="h-8 w-4/5 max-w-md rounded-md" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-[90%] max-w-md" />
            <Skeleton className="mt-4 h-12 w-full max-w-xl rounded-md" />
          </div>
          <div className="mt-3">
            <FeedLoading />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
