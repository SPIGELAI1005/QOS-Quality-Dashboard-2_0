"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Send, Loader2, Mic, MicOff, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildIAmQContext, type IAmQContext } from "@/lib/iamq/contextBuilder";
import type { FilterState } from "@/components/dashboard/filter-panel";
import { getDatasetHealthSummary, type UploadHistoryEntry } from "@/lib/data/datasetHealth";
import { useToast } from "@/components/ui/use-toast";
import type { MonthlySiteKpi } from "@/lib/domain/types";
import ReactMarkdown from "react-markdown";

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface IAmQChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: FilterState;
  metrics?: {
    customerComplaints?: number;
    supplierComplaints?: number;
    customerDeliveries?: number;
    supplierDeliveries?: number;
    customerDefective?: number;
    supplierDefective?: number;
    customerPpm?: number;
    supplierPpm?: number;
    selectedSitesCount?: number;
  };
  monthlySiteKpis?: MonthlySiteKpi[]; // Full KPI data for deep analysis (like AI Summary)
  globalPpm?: {
    customerPpm: number | null;
    supplierPpm: number | null;
  };
  selectedSites?: string[];
  selectedMonths?: string[];
}


// Starter prompts/questions for users to click
const STARTER_PROMPTS = [
  "What are the key trends in my quality data?",
  "Which sites have the highest PPM and need attention?",
  "Compare customer PPM vs supplier PPM across all sites",
  "What recommendations do you have to improve quality?",
  "Explain what PPM means and how it's calculated",
  "Why is my PPM zero or showing no data?",
  "Which sites are performing best and why?",
  "What are the main risks and anomalies in my data?",
  "How do I interpret the complaint trends chart?",
  "What actions should I take based on current metrics?",
  "Explain the difference between Q1, Q2, and Q3 complaints",
  "Which months show the most quality issues?",
  "What does the dataset health status mean?",
  "How can I improve supplier quality performance?",
  "What are the top opportunities for quality improvement?",
];

export function IAmQChatPanel({ 
  open, 
  onOpenChange, 
  filters, 
  metrics,
  monthlySiteKpis,
  globalPpm,
  selectedSites,
  selectedMonths,
}: IAmQChatPanelProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);
  const [showMorePrompts, setShowMorePrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Get page name from pathname
  const getPageName = (): string | undefined => {
    if (!pathname) return undefined;
    // Extract page name from path (e.g., "/dashboard" -> "dashboard", "/complaints" -> "complaints")
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'dashboard';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      // Focus input when panel opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (!open) {
      // Reset state when panel closes
      setShowMorePrompts(false);
    }
    
    // Initialize speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      synthesisRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [open]);

  const handleSend = async (questionOverride?: string) => {
    const questionToSend = questionOverride || input.trim();
    if (!questionToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: questionToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create a draft assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const draftMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, draftMessage]);

    try {
      // Get dataset health from localStorage
      let datasetHealth = undefined;
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("qos-et-upload-history");
          if (stored) {
            const uploadHistory = JSON.parse(stored) as UploadHistoryEntry[];
            datasetHealth = getDatasetHealthSummary(uploadHistory, 30);
          }
        } catch (e) {
          console.error("[IAmQ] Failed to parse upload history for health:", e);
        }
      }

      // Build context snapshot from current dashboard state
      const context = buildIAmQContext({
        page: getPageName(),
        filters,
        metrics,
        monthlySiteKpis, // Full KPI data for deep analysis
        globalPpm,
        selectedSites,
        selectedMonths,
        datasetHealth,
      });

      const response = await fetch("/api/iamq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionToSend,
          context,
        }),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorData: { error?: string; errorType?: string; retryAfter?: number } = {};
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use status text
        }

        // Create user-friendly error message
        let errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        // Special handling for rate limit errors
        if (response.status === 429) {
          if (errorData.retryAfter) {
            const minutes = Math.ceil(errorData.retryAfter / 60);
            errorMessage = `Too many requests. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
          } else {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          }
        }

        const error = new Error(errorMessage);
        (error as any).errorType = errorData.errorType;
        (error as any).retryAfter = errorData.retryAfter;
        throw error;
      }

      // Check if response is streaming (text/plain) or JSON
      const contentType = response.headers.get("content-type") || "";
      const isStreaming = contentType.includes("text/plain");

      if (isStreaming && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";
        let firstChunkReceived = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            // Decode chunk and append to accumulated content
            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;

            // Hide loading indicator once first chunk arrives
            if (!firstChunkReceived && accumulatedContent.trim()) {
              firstChunkReceived = true;
              setIsLoading(false);
            }

            // Update the draft message with accumulated content
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
          }

          // Finalize message
          if (accumulatedContent.trim()) {
            // Speak the complete response
            if (synthesisRef.current) {
              speakText(accumulatedContent);
            }
          } else {
            // If stream was empty, remove the draft message and show error
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
            throw new Error("Empty response from server");
          }
        } catch (streamError) {
          // If streaming fails, remove draft and fall through to error handling
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
          throw streamError;
        } finally {
          reader.releaseLock();
        }
      } else {
        // Non-streaming fallback (JSON response)
        const data = await response.json();
        const finalContent = data.answer || "Sorry, I couldn't generate a response.";
        
        // Update the draft message with final content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: finalContent }
              : msg
          )
        );

        // Speak the assistant's response
        if (synthesisRef.current && finalContent) {
          speakText(finalContent);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove draft message if it exists
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      
      // Create user-friendly error message
      let errorContent = "Sorry, there was an error processing your question. Please try again.";
      
      if (error instanceof Error) {
        // Use the error message directly (it's already user-friendly from our API)
        errorContent = error.message;
        
        // Special styling for rate limit errors
        const errorType = (error as any).errorType;
        if (errorType === 'rate_limit') {
          errorContent = `⏱️ ${error.message}`;
        } else if (errorType === 'validation') {
          errorContent = `⚠️ ${error.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: errorContent,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gather diagnostics data
  const diagnosticsData = useMemo(() => {
    // Get upload history from localStorage
    let uploadHistory: UploadHistoryEntry[] = [];
    let lastSuccessfulUpload: UploadHistoryEntry | null = null;
    let datasetHealth: Record<string, { lastSuccessIso: string | null; stale: boolean; hasData: boolean }> = {};

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("qos-et-upload-history");
        if (stored) {
          uploadHistory = JSON.parse(stored) as UploadHistoryEntry[];
          lastSuccessfulUpload = uploadHistory.find((h) => h.success) || null;
        }

        // Calculate dataset health per section
        const now = Date.now();
        const staleDays = 30;
        const sections: Array<UploadHistoryEntry["section"]> = ["plants", "complaints", "deliveries", "ppap", "deviations", "audit"];
        
        sections.forEach((section) => {
          const sectionHistory = uploadHistory.filter((h) => h.section === section && h.success);
          const last = sectionHistory.sort(
            (a, b) => new Date(b.uploadedAtIso).getTime() - new Date(a.uploadedAtIso).getTime()
          )[0];
          
          const lastSuccessIso = last?.uploadedAtIso || null;
          let stale = true;
          if (lastSuccessIso) {
            const t = new Date(lastSuccessIso).getTime();
            if (Number.isFinite(t)) {
              const days = (now - t) / (1000 * 60 * 60 * 24);
              stale = days > staleDays;
            }
          }
          
          datasetHealth[section] = {
            lastSuccessIso,
            stale,
            hasData: !!last,
          };
        });
      } catch (e) {
        console.error("[IAmQ] Failed to parse upload history:", e);
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      page: {
        route: pathname || undefined,
        name: getPageName(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
      filters: filters
        ? {
            selectedPlants: filters.selectedPlants || [],
            dateFrom: filters.dateFrom ? filters.dateFrom.toISOString() : null,
            dateTo: filters.dateTo ? filters.dateTo.toISOString() : null,
            selectedNotificationTypes: filters.selectedNotificationTypes || [],
            selectedComplaintTypes: filters.selectedComplaintTypes || [],
          }
        : null,
      metrics: metrics || null,
      datasetHealth: {
        lastSuccessfulUpload: lastSuccessfulUpload?.uploadedAtIso || null,
        sections: datasetHealth,
        uploadHistoryCount: uploadHistory.length,
      },
    };
  }, [pathname, filters, metrics]);

  const handleCopyDiagnostics = async () => {
    try {
      const jsonString = JSON.stringify(diagnosticsData, null, 2);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
        setCopiedDiagnostics(true);
        setTimeout(() => setCopiedDiagnostics(false), 2000);
        
        toast({
          variant: "success",
          title: "Diagnostics copied",
          description: "Diagnostics JSON has been copied to your clipboard.",
        });
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = jsonString;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        
        setCopiedDiagnostics(true);
        setTimeout(() => setCopiedDiagnostics(false), 2000);
        
        toast({
          variant: "success",
          title: "Diagnostics copied",
          description: "Diagnostics JSON has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error("[IAmQ] Failed to copy diagnostics:", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy diagnostics to clipboard. Please try again.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle>I A:M Q</SheetTitle>
            <Button
              onClick={handleCopyDiagnostics}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-border/40"
              title="Copy diagnostics JSON"
            >
              {copiedDiagnostics ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy diagnostics
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center text-muted-foreground text-sm mb-4">
                Ask me anything about quality management, KPIs, or your data.
              </div>
              
              {/* Starter prompts */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-3 text-center">
                  Or try one of these questions:
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PROMPTS.slice(0, 10).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSend(prompt);
                      }}
                      className="text-left px-4 py-2.5 rounded-lg text-sm bg-muted/50 hover:bg-muted/80 border border-border/40 hover:border-primary/40 transition-all text-foreground hover:text-primary cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                  
                  {/* Show more button */}
                  {!showMorePrompts && STARTER_PROMPTS.length > 10 && (
                    <button
                      onClick={() => setShowMorePrompts(true)}
                      className="text-left px-4 py-2.5 rounded-lg text-sm bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-primary/40 transition-all text-muted-foreground hover:text-primary cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Show more...
                    </button>
                  )}
                  
                  {/* Remaining prompts (shown when "Show more" is clicked) */}
                  {showMorePrompts && STARTER_PROMPTS.slice(10).map((prompt, index) => (
                    <button
                      key={index + 10}
                      onClick={() => {
                        handleSend(prompt);
                      }}
                      className="text-left px-4 py-2.5 rounded-lg text-sm bg-muted/50 hover:bg-muted/80 border border-border/40 hover:border-primary/40 transition-all text-foreground hover:text-primary cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 text-sm backdrop-blur-sm",
                  message.role === "user"
                    ? "bg-primary/80 text-primary-foreground border border-primary/20"
                    : message.isError
                    ? "bg-destructive/20 text-destructive-foreground border border-destructive/40"
                    : "bg-muted/80 text-foreground border border-border/40"
                )}
              >
                {message.role === "assistant" && !message.isError ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-2 first:mt-0">{children}</h3>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 italic my-2">{children}</blockquote>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/80 backdrop-blur-sm border border-border/40 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              disabled={isLoading || isListening}
              className="flex-1 bg-background/60 backdrop-blur-sm border-border/40"
            />
            <Button
              onClick={toggleListening}
              disabled={isLoading}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className={cn(
                "border-border/40",
                isListening && "animate-pulse"
              )}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="border-border/40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isSpeaking && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Speaking...</span>
              <Button
                onClick={stopSpeaking}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Stop
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

