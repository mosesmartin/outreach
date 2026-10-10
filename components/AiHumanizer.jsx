'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
  Zap,
  Sliders,
  CheckCircle2,
  FileText,
  Eye,
  GitCompare,
  ArrowRight,
  Info
} from 'lucide-react';

const SAMPLE_AI_TEXT = `In the ever-evolving landscape of modern digital business, it is a testament to technological innovation that organizations must delve deeper into the intricate tapestry of artificial intelligence. Furthermore, by leveraging the power of cutting-edge algorithms, companies can unlock their full potential and revolutionize the way they engage with customers. In conclusion, it is worth noting that navigating the complexities of modern markets requires a beacon of excellence to elevate your operational efficiency.`;

const MODES = [
  {
    id: 'ANTI_DETECTOR',
    name: '🛡️ Anti-AI Detector',
    desc: 'Maximizes burstiness & perplexity to bypass Turnitin, GPTZero & CopyLeaks',
  },
  {
    id: 'NATURAL',
    name: '💬 Natural Conversational',
    desc: 'Articulate, warm, plain-spoken peer tone with idiomatic phrasing',
  },
  {
    id: 'PROFESSIONAL',
    name: '💼 Executive B2B',
    desc: 'Crisp, authoritative, fluff-free corporate communication',
  },
  {
    id: 'ACADEMIC',
    name: '🎓 Academic & Formal',
    desc: 'Scholarly precision without repetitive formulaic AI summary tags',
  },
  {
    id: 'CASUAL',
    name: '⚡ Punchy & Snappy',
    desc: 'Short sentences, high rhythm, highly readable and engaging',
  },
];

const INTENSITIES = [
  { id: 'DEEP', name: 'Deep Restructure', desc: 'Complete sentence clause rework & cadence randomization' },
  { id: 'BALANCED', name: 'Balanced Rewrite', desc: 'Smooths robotic flow while preserving original structure' },
  { id: 'LIGHT', name: 'Light Polish', desc: 'Deterministic watermark purge & 1:1 cliché swap only' },
];

export default function AiHumanizer() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('ANTI_DETECTOR');
  const [intensity, setIntensity] = useState('DEEP');
  const [stripWatermarks, setStripWatermarks] = useState(true);
  const [removeCliches, setRemoveCliches] = useState(true);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('humanized'); // 'humanized' | 'changes'

  // Results & Metrics state
  const [resultMeta, setResultMeta] = useState(null);

  const handleLoadSample = () => {
    // Injects sample text with deliberate zero-width spaces to showcase the detector
    const sampleWithWatermarks = SAMPLE_AI_TEXT + '\u200b\u200e\ufeff';
    setInputText(sampleWithWatermarks);
    setOutputText('');
    setResultMeta(null);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setResultMeta(null);
    setErrorMsg(null);
  };

  const handleHumanize = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      alert('Please enter or paste text to humanize.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          mode,
          intensity,
          stripWatermarks,
          removeCliches,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Humanization failed');
      }

      setOutputText(data.humanizedText);
      setResultMeta(data);
    } catch (err) {
      console.error('Humanize error:', err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humanized-content-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputWords = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;
  const outputWords = outputText.trim() ? outputText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-[#070b13] text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
      {/* Top Header / Mode Selectors */}
      <div className="bg-[#0c1220]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  AI Humanizer, Paraphraser & Anti-Plagiarism Engine
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Multi-Detector Bypass
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Purges zero-width Unicode watermarks • Rewrites robotic cadence • Burstiness & Perplexity injection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Load Sample AI Text
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Tone Modes */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Mode:
            </span>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.desc}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition shrink-0 ${
                  mode === m.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* Intensity & Checkbox controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Intensity:
              </span>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500"
              >
                {INTENSITIES.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stripWatermarks}
                onChange={(e) => setStripWatermarks(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Purge Watermarks</span>
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={removeCliches}
                onChange={(e) => setRemoveCliches(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Kill AI Clichés</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
        {/* Left Pane: Raw Input Text Area */}
        <div className="flex flex-col h-full bg-[#070b13]/60 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Original AI Draft / Text
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span>{inputWords} words</span>
              <span>{inputText.length} characters</span>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text, email, essay, or blog post here... (e.g. ChatGPT, Claude, Gemini draft)"
            className="flex-1 w-full bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
          />

          <div className="pt-3 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">
              Zero-width characters, directional overrides and AI clichés detected on submission.
            </p>
            <button
              onClick={handleHumanize}
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Humanizing & Restructuring...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Humanize & Purge AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: Humanized Output & Metrics */}
        <div className="flex flex-col h-full bg-[#090e18]/80 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('humanized')}
                className={`font-semibold flex items-center gap-1 px-2 py-0.5 rounded transition ${
                  activeTab === 'humanized' ? 'text-emerald-300 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Humanized Output
              </button>
              {resultMeta?.clicheChanges && resultMeta.clicheChanges.length > 0 && (
                <button
                  onClick={() => setActiveTab('changes')}
                  className={`font-semibold flex items-center gap-1 px-2 py-0.5 rounded transition ${
                    activeTab === 'changes' ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                  Detected AI Patterns ({resultMeta.clicheChanges.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40"
                title="Copy humanized text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!outputText}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-40"
                title="Download text"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Score & Inspection Ribbon */}
          {resultMeta && (
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs font-mono">
                  {resultMeta.humanScore}%
                </div>
                <div>
                  <div className="font-semibold text-emerald-300">
                    Estimated Human Score
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Engine: {resultMeta.modelUsed}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <div className="text-center px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-emerald-400 font-bold block">{resultMeta.watermarksRemoved}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Watermarks</span>
                </div>
                <div className="text-center px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-cyan-400 font-bold block">{resultMeta.clichesReplaced}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Clichés</span>
                </div>
                <div className="text-center px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-white font-bold block">{outputWords}</span>
                  <span className="text-[9px] text-slate-400 uppercase">Words</span>
                </div>
              </div>
            </div>
          )}

          {/* Output Content */}
          <div className="flex-1 relative">
            {activeTab === 'humanized' ? (
              <textarea
                readOnly
                value={outputText}
                placeholder="Humanized, natural-sounding, plagiarism-free text will appear here with zero AI watermarks..."
                className="w-full h-full bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans leading-relaxed"
              />
            ) : (
              <div className="w-full h-full bg-slate-950/60 border border-slate-800/90 rounded-xl p-3.5 text-xs text-slate-200 overflow-y-auto space-y-2">
                <div className="text-slate-400 font-medium mb-2">
                  Robotic patterns and AI clichés cleaned from your draft:
                </div>
                {resultMeta?.clicheChanges?.map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-rose-400">{ch.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-emerald-400">
                      {ch.replacement ? `"${ch.replacement}"` : '(Removed filler)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
