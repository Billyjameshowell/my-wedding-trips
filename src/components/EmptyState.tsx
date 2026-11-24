'use client';

interface EmptyStateProps {
  action: React.ReactNode;
}

export default function EmptyState({ action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="mb-4 text-6xl" aria-hidden="true">💒</div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">No weddings yet</h2>
      <p className="mb-8 max-w-md text-center text-gray-600">
        Add your first wedding to start tracking flights, hotels, and gifts all in one place.
        Wedding season doesn&apos;t stand a chance.
      </p>
      {action}
    </div>
  );
}
