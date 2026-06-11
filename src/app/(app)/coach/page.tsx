"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpgradeModal, handleLimitReached } from "@/components/UpgradeModal";
import { Send, Zap, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageContainer } from "@/components/PageContainer";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

const STARTERS = [
  "My weight hasn't changed in 2 weeks — what should I adjust?",
  "I'm going on vacation next month. How do I prepare?",
  "I'm always hungry. Can I adjust my macros?",
  "My energy is really low. Is my deficit too aggressive?",
];

const FOLLOWUP_SENTINEL = "__FOLLOWUPS__";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      title="Copy"
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

function MessageBubble({
  message,
  isStreaming,
  isLast,
  onRegenerate,
  onFollowUp,
}: {
  message: Message;
  isStreaming: boolean;
  isLast: boolean;
  onRegenerate: () => void;
  onFollowUp: (q: string) => void;
}) {
  return (
    <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}>
        {message.role === "assistant" && (
          <div className="w-7 h-7 rounded-xl gradient-orange flex items-center justify-center mr-2 mt-1 shrink-0">
            <Zap size={13} className="text-white" fill="white" />
          </div>
        )}
        <div
          className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            message.role === "user"
              ? "gradient-orange text-white rounded-br-sm font-medium"
              : "bg-white card-shadow text-foreground rounded-bl-sm"
          }`}
        >
          {message.role === "assistant" ? (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold prose-headings:font-bold">
              {isStreaming ? (
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
          ) : (
            message.content
          )}
          {message.role === "assistant" && isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle rounded-full" />
          )}
        </div>
      </div>

      {/* Assistant message controls */}
      {message.role === "assistant" && !isStreaming && message.content && (
        <div className="ml-9 mt-1 flex items-center gap-1">
          <CopyButton text={message.content} />
          {isLast && (
            <button
              onClick={onRegenerate}
              title="Regenerate response"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>
      )}

      {/* Follow-up suggestion chips */}
      {message.role === "assistant" && !isStreaming && isLast && (message.followUps ?? []).length > 0 && (
        <div className="ml-9 mt-3 flex flex-wrap gap-2">
          {(message.followUps ?? []).map((q) => (
            <button
              key={q}
              onClick={() => onFollowUp(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:border-primary hover:bg-orange-50 transition-all font-medium text-left"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CoachPageContent() {
  const { showUpgrade } = useUpgradeModal();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const promptHandled = useRef(false);

  useEffect(() => {
    fetch("/api/coach")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt && !promptHandled.current) {
      promptHandled.current = true;
      setInput(prompt);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runStream = useCallback(async (body: Record<string, unknown>) => {
    setStreaming(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (handleLimitReached(errData, showUpgrade)) {
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }
      setMessages((prev) => {
        const withoutEmpty = prev.slice(0, -1);
        return [...withoutEmpty, { role: "assistant", content: "Sorry, something went wrong. Please try again." }];
      });
      setStreaming(false);
      return;
    }

    if (!res.body) { setStreaming(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });

      // Split off any follow-up sentinel before rendering
      const sentinelIdx = acc.indexOf(FOLLOWUP_SENTINEL);
      const displayText = sentinelIdx === -1 ? acc : acc.slice(0, sentinelIdx);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: displayText };
        return updated;
      });
    }

    // Parse follow-ups from the sentinel at the end of the stream
    const sentinelIdx = acc.indexOf(FOLLOWUP_SENTINEL);
    let followUps: string[] = [];
    if (sentinelIdx !== -1) {
      try {
        followUps = JSON.parse(acc.slice(sentinelIdx + FOLLOWUP_SENTINEL.length)) as string[];
      } catch { /* ignore */ }
    }
    const finalText = sentinelIdx === -1 ? acc : acc.slice(0, sentinelIdx).trimEnd();

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", content: finalText, followUps };
      return updated;
    });
    setStreaming(false);
  }, [showUpgrade]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    setMessages((prev) => [...prev, { role: "user", content }, { role: "assistant", content: "" }]);
    setInput("");
    await runStream({ message: content });
  }, [input, streaming, runStream]);

  const regenerate = useCallback(async () => {
    if (streaming) return;
    // Keep the last assistant bubble, reset its content
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[updated.length - 1]?.role === "assistant") {
        updated[updated.length - 1] = { role: "assistant", content: "" };
      }
      return updated;
    });
    await runStream({ regenerate: true });
  }, [streaming, runStream]);

  async function clearChat() {
    await fetch("/api/coach", { method: "DELETE" });
    setMessages([]);
    setShowClearConfirm(false);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange py-6 shrink-0">
        <PageContainer size="chat" className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">AI Coach</h1>
              <p className="text-orange-200 text-xs">Powered by Claude · knows your full profile & check-in history</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear conversation"
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            >
              <Trash2 size={15} className="text-white" />
            </button>
          )}
        </PageContainer>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="shrink-0 bg-orange-50 border-b border-orange-200 px-4 py-3">
          <PageContainer size="chat" className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-orange-900">Clear entire conversation history?</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </PageContainer>
        </div>
      )}

      {/* Messages */}
      <PageContainer size="chat" className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <p className="font-black text-2xl tracking-tight">What&apos;s on your mind?</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Ask me anything about your plan, your progress, or how to troubleshoot.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3.5 rounded-2xl border-2 border-border text-sm hover:border-primary hover:bg-orange-50 transition-all font-medium leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m}
            isStreaming={streaming && i === messages.length - 1 && m.role === "assistant"}
            isLast={i === messages.length - 1}
            onRegenerate={regenerate}
            onFollowUp={(q) => send(q)}
          />
        ))}
        <div ref={bottomRef} />
      </PageContainer>

      {/* Input */}
      <div className="border-t bg-white py-4 shrink-0">
        <PageContainer size="chat" className="flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your coach… (Enter to send)"
            rows={2}
            className="resize-none rounded-2xl border-border/60 bg-muted/40 focus:bg-white"
            disabled={streaming}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-11 h-11 rounded-2xl gradient-orange border-0 hover:opacity-90 p-0"
          >
            <Send size={16} className="text-white" />
          </Button>
        </PageContainer>
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading coach…</div>}>
      <CoachPageContent />
    </Suspense>
  );
}
