"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpgradeModal, handleLimitReached } from "@/components/UpgradeModal";
import { Send, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageContainer } from "@/components/PageContainer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "My weight hasn't changed in 2 weeks — what should I adjust?",
  "I'm going on vacation next month. How do I prepare?",
  "I'm always hungry. Can I adjust my macros?",
  "My energy is really low. Is my deficit too aggressive?",
];

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
  );
}

function CoachPageContent() {
  const { showUpgrade } = useUpgradeModal();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
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

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content }),
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

    if (!res.body) {
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: acc };
        return updated;
      });
    }
    setStreaming(false);
  }, [input, streaming, showUpgrade]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="gradient-orange py-6 shrink-0">
        <PageContainer size="chat" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">AI Coach</h1>
            <p className="text-orange-200 text-xs">Powered by Claude · knows your full profile & check-in history</p>
          </div>
        </PageContainer>
      </div>

      <PageContainer size="chat" className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <p className="font-black text-2xl tracking-tight">What&apos;s on your mind?</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Ask me anything about your plan, your progress, or how to troubleshoot.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
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
          />
        ))}
        <div ref={bottomRef} />
      </PageContainer>

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
