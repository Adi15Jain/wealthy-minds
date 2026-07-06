import {
    Skeleton,
    SkeletonCard,
    SkeletonChart,
    SkeletonTable,
} from "@/components/ui";

export default function DashboardLoading() {
    return (
        <div className="space-y-6 p-1">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SkeletonChart className="lg:col-span-2" />
                <SkeletonCard className="h-full" />
            </div>

            {/* Holdings table */}
            <div className="card-surface p-6">
                <SkeletonTable rows={5} cols={4} />
            </div>
        </div>
    );
}
