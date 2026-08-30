export default function MessageBubble({ role, children, cards }) {
  const isUser = role === 'user';

  return (
    <div className="fade-in-up flex flex-col gap-2.5">
      <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && (
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine">
            C
          </div>
        )}
        <div
          className={
            isUser
              ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-pine px-4 py-2.5 text-sm text-white shadow-sm sm:max-w-[75%]'
              : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-sm sm:max-w-[75%]'
          }
        >
          {children}
        </div>
      </div>
      {/* Cards get the full chat-column width (not the bubble's 75% cap) so several
          can actually sit side by side instead of each forcing a line wrap. Indented
          under the assistant's avatar to stay visually attached to its message. */}
      {cards && <div className={`flex w-full flex-wrap gap-2.5 ${!isUser ? 'pl-9' : ''}`}>{cards}</div>}
    </div>
  );
}
