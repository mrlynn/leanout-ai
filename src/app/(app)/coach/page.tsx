"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Zap } from "lucide-react";

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

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    if (!res.body) { setStreaming(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: acc }]);
    }
    setStreaming(false);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="gradient-orange px-6 py-6 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">AI Coach</h1>
            <p className="text-orange-200 text-xs">Powered by Claude · knows your full profile & check-in history</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 && (
          <div className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <p className="font-black text-2xl tracking-tight">What&apos;s on your mind?</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Ask me anything about your plan, your progress, or how to troubleshoot.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
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
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl gradient-orange flex items-center justify-center mr-2 mt-1 shrink-0">
                <Zap size={13} className="text-white" fill="white" />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "gradient-orange text-white rounded-br-sm font-medium"
                  : "bg-white card-shadow text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
              {m.role === "assistant" && streaming && i === messages.length - 1 && (
                <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-middle rounded-full" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
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
        </div>
      </div>
    </div>
  );
}
