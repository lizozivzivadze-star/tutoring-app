"use client";

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-md border border-paper-line px-6 py-6 w-full max-w-xs">
        <p className="text-ink text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-paper-line text-ink-soft
                       py-2 text-sm font-medium hover:bg-paper transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-marker text-white py-2 text-sm
                       font-medium hover:bg-marker-dark transition-colors"
          >
            დადასტურება
          </button>
        </div>
      </div>
    </div>
  );
}
