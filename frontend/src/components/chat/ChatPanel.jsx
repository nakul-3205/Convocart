import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { loadChat, saveChat } from '../../lib/chatStorage';
import MessageBubble from './MessageBubble';
import ProductCard from './ProductCard';
import UpsellCard from './UpsellCard';
import TypingIndicator from './TypingIndicator';

const MAX_LEN = 1000;
const WELCOME =
  "Hey — I'm the Convocart shopping assistant. Tell me what you're looking for (running, casual, formal, a size, a budget) and I'll pull real options.";

export default function ChatPanel({ onCartChange, seedMessage }) {
  const stored = useRef(loadChat()); // read once, before first render
  const [messages, setMessages] = useState(
    stored.current || [{ id: 'welcome', role: 'assistant', content: WELCOME }],
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const seeded = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Persist every change so a refresh (or an accidental tab close) doesn't lose the thread.
  useEffect(() => {
    saveChat(messages);
  }, [messages]);

  useEffect(() => {
    // Don't auto-seed a category opener into a conversation the shopper already has going.
    if (seedMessage && !seeded.current && !stored.current) {
      seeded.current = true;
      handleSend(seedMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMessage]);

  async function handleSend(text) {
    const message = text.trim();
    if (!message || sending) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: message }]);
    setInput('');
    setSending(true);

    try {
      // /api/chat now resolves full product objects server-side — recommendedProducts
      // and upsellProduct arrive ready to render, no follow-up fetches needed here.
      const output = await api.sendMessage(message);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: output.reply,
          recommendedProducts: output.recommendedProducts || [],
          upsell:
            output.upsellProduct && output.upsellReason
              ? { product: output.upsellProduct, reason: output.upsellReason }
              : null,
        },
      ]);
      onCartChange?.();
    } catch (err) {
      const friendly =
        err instanceof ApiError && err.status !== 500
          ? err.message
          : "Something went wrong on our end. Give it another try in a moment.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: friendly }]);
    } finally {
      setSending(false);
    }
  }

  async function handleAddProduct(productId, qty) {
    await api.addToCart(productId, qty);
    onCartChange?.();
  }

  async function handleAddUpsell(productId) {
    await api.addToCart(productId, 1);
    onCartChange?.();
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-2">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              cards={
                m.recommendedProducts?.length || m.upsell ? (
                  <>
                    {m.recommendedProducts?.map((p) => (
                      <ProductCard key={p.id} product={p} onAdd={handleAddProduct} />
                    ))}
                    {m.upsell && (
                      <UpsellCard
                        reason={m.upsell.reason}
                        product={m.upsell.product}
                        onAdd={() => handleAddUpsell(m.upsell.product.id)}
                        onDecline={() => handleSend('No thanks on that.')}
                      />
                    )}
                  </>
                ) : null
              }
            >
              {m.content}
            </MessageBubble>
          ))}
          {sending && <TypingIndicator />}
        </div>
      </div>

      <div className="border-t border-line bg-paper/95 px-4 py-3 sm:px-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <div className="flex-1">
            <textarea
              rows={1}
              value={input}
              maxLength={MAX_LEN}
              placeholder="Ask for running shoes under ₹4000…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={sending}
              className="input-field max-h-32 resize-none py-2.5 disabled:bg-line/30"
            />
            {input.length > MAX_LEN - 100 && (
              <p className="mt-1 text-right text-[11px] text-faint">{input.length}/{MAX_LEN}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary h-[42px] w-[42px] flex-none rounded-full p-0"
            aria-label="Send message"
          >
            <SendHorizontal size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}
