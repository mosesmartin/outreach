'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  UploadCloud,
  FileCode,
  FileText,
  File,
  X,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Settings,
  RefreshCw,
  HelpCircle,
  Download,
  AlertCircle,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SYSTEM_PRESETS = [
  {
    id: 'architect',
    name: '🛠️ Full Codebase Architect',
    prompt: `You are an expert Full-Stack Software Architect and Staff Engineer. Analyze provided files, identify bugs, suggest performance optimizations, and provide clean, robust, and maintainable code solutions with thorough technical explanations.`
  },
  {
    id: 'reviewer',
    name: '🧐 Senior Code Reviewer',
    prompt: `You are a meticulous Senior Code Reviewer. Audit attached code files for edge cases, memory leaks, performance bottlenecks, security vulnerabilities, and bad patterns. Format your audit with Severity (High/Med/Low), Location, Problem, and Exact Fix.`
  },
  {
    id: 'analyst',
    name: '📊 Document & Data Analyst',
    prompt: `You are a Senior Data Analyst and Technical Researcher. Synthesize provided documents, CSVs, or text files into structured executive summaries, key trends, risk vectors, and actionable next steps.`
  },
  {
    id: 'outreach',
    name: '✉️ B2B Outreach & Cold Copywriter',
    prompt: `You are an elite B2B Cold Outreach Specialist. Write highly targeted, personalized cold email angles and teardown hooks based on the provided website data or client profiles. Keep tone natural, punchy, and under 90 words.`
  },
  {
    id: 'custom',
    name: '✍️ Custom System Prompt',
    prompt: ''
  }
];

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Latest & Fastest)', tag: 'Recommended' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tag: 'Fast' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', tag: 'Stable' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', tag: 'Auto' },
];

export default function GeminiFileChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello! I am your **Gemini AI Workspace Assistant**.\n\nYou can attach code files, configs, documentation, or CSVs below, set your custom system prompt or role, and ask me anything. I read all attached files directly inside my large context window to give precise, contextual answers.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [selectedPreset, setSelectedPreset] = useState('architect');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PRESETS[0].prompt);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handlePresetChange = (presetId) => {
    setSelectedPreset(presetId);
    const found = SYSTEM_PRESETS.find((p) => p.id === presetId);
    if (found && presetId !== 'custom') {
      setSystemPrompt(found.prompt);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttached = [];
    for (const file of files) {
      try {
        const textContent = await file.text();
        newAttached.push({
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: textContent,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    setAttachedFiles((prev) => [...prev, ...newAttached]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setAttachedFiles([]);
  };

  const clearChat = () => {
    if (confirm('Clear chat history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat cleared. Attach your files and ask your question whenever you are ready!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setErrorMsg(null);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputPrompt.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFilesSnapshot: attachedFiles.map((f) => ({ name: f.name, size: f.size })),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt,
        files: attachedFiles,
        model: selectedModel,
        customApiKey: customApiKey.trim() || undefined,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini API call failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          modelUsed: data.modelUsed,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMsg(err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isError: true,
          content: `⚠️ **Request failed:** ${err.message}\n\nPlease verify your Gemini API key in settings or try selecting another Gemini model.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportChat = () => {
    const textData = messages
      .map((m) => `[${m.time}] ${m.role.toUpperCase()}:\n${m.content}\n\n`)
      .join('---\n');
    const blob = new Blob([textData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-[#070b13] text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
      {/* Top Bar / Controls */}
      <div className="bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Gemini Workspace & File Intelligence
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {selectedModel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-file context ingestion • Custom system instructions • Zero hallucination reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 transition"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Settings / Prompt toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              showSettings
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Prompt & Role</span>
            {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Export */}
          <button
            onClick={handleExportChat}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Export chat as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear */}
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Prompt & Settings Drawer */}
      {showSettings && (
        <div className="bg-[#0b101c] border-b border-slate-800 p-4 shrink-0 transition animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Select AI Role / Persona Preset:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SYSTEM_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetChange(p.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition ${
                      selectedPreset === p.id
                        ? 'bg-cyan-600 text-white font-medium shadow-md shadow-cyan-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 mb-1 block">
                Active System Prompt (Directly injected into Gemini's cognitive layer):
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setSelectedPreset('custom');
                }}
                rows={3}
                placeholder="Write custom instructions or rules for how Gemini should answer..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block">
                  Custom Gemini API Key (Optional override - leave empty to use server default):
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use .env.local GEMINI_API_KEY)"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="self-end px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md shadow-cyan-600/20 text-white font-bold text-xs">
                AI
              </div>
            )}

            <div
              className={`group relative rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 rounded-tr-none'
                  : msg.isError
                  ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-tl-none'
                  : 'bg-slate-900 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {/* Attached files indicator on user messages */}
              {msg.attachedFilesSnapshot && msg.attachedFilesSnapshot.length > 0 && (
                <div className="mb-2 pb-2 border-b border-white/20 flex flex-wrap gap-1.5">
                  {msg.attachedFilesSnapshot.map((f, fi) => (
                    <span
                      key={fi}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-700 text-blue-100 text-[10px] font-mono"
                    >
                      <FileCode className="w-3 h-3 text-cyan-200" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans space-y-2">
                {msg.content}
              </div>

              {/* Footer info & Copy button */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">{msg.time}</span>
                {msg.modelUsed && (
                  <span className="text-cyan-400/80 font-mono">via {msg.modelUsed}</span>
                )}
                <button
                  onClick={() => handleCopyMessage(msg.content, idx)}
                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white rounded"
                  title="Copy message"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-4xl mx-auto justify-start items-center">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Gemini is reading files and analyzing prompt...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Attachment Ribbon */}
      {attachedFiles.length > 0 && (
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Attached Context ({attachedFiles.length}):
              </span>
              {attachedFiles.map((f, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs shrink-0"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px] truncate max-w-[140px]">{f.name}</span>
                  <span className="text-[9px] text-slate-400">({formatFileSize(f.size)})</span>
                  <button
                    onClick={() => removeAttachedFile(i)}
                    className="p-0.5 hover:text-rose-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={clearAllFiles}
              className="text-[11px] text-slate-400 hover:text-rose-400 shrink-0 underline"
            >
              Remove All
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-[#0b101c] border-t border-slate-800/90 p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <div className="flex items-end gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30 transition shadow-inner">
            {/* Hidden File Input */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/60 transition shrink-0"
              title="Attach code files, configs, csv, or markdown"
            >
              <UploadCloud className="w-4 h-4" />
            </button>

            {/* Prompt Textarea */}
            <textarea
              ref={textareaRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder="Ask anything about the attached files or provide a prompt... (Shift+Enter for newline)"
              className="flex-1 bg-transparent border-0 p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-cyan-500/20 transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Supports .js, .jsx, .ts, .tsx, .py, .json, .csv, .md, .txt, .sql, .html</span>
            <span>Enter to Send • Shift + Enter for newline</span>
          </div>
        </form>
      </div>
    </div>
  );
}
