"use client";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-md border border-paper-line px-6 py-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="დახურვა"
            className="text-ink-soft hover:text-ink text-lg leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
