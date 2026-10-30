"use client";

type ConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}: ConfirmDialogProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirmation"
            onClick={onCancel}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="px-5 py-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <h3
                  id="confirm-dialog-title"
                  className="text-sm font-semibold text-slate-900"
                >
                  {title}
                </h3>
              </div>
              <p
                id="confirm-dialog-message"
                className="mb-6 text-sm leading-relaxed text-slate-600"
              >
                {message}
              </p>
            </div>
            <div className="flex flex-row-reverse gap-3 px-5 py-3">
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  danger
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
