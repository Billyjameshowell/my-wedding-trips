'use client';

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-4">💒</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No weddings yet</h2>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Add your first wedding to start tracking flights, hotels, and gifts all in one place.
        Wedding season doesn&apos;t stand a chance.
      </p>
      <button
        onClick={onAdd}
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white
          hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/10"
      >
        + Add Your First Wedding
      </button>
    </div>
  );
}
