export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine">
        C
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faint" />
      </div>
    </div>
  );
}
