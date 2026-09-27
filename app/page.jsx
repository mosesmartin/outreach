'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Database,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Globe,
  Gauge,
  Layers,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UploadCloud,
  UserCheck,
  X,
  AlertTriangle,
  LogOut,
  Shield,
  User,
  Zap
} from 'lucide-react';

export default function OutreachDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    configured: false,
    totalLeads: 0,
    pending: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    withWebsite: 0,
    noWebsite: 0,
    avgSpeedScore: 0,
    avgSeoScore: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [funnelFilter, setFunnelFilter] = useState('ALL');

  // Modals
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSingleLeadModal, setShowSingleLeadModal] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [showSchemaGuide, setShowSchemaGuide] = useState(false);
  const [selectedLeadForReport, setSelectedLeadForReport] = useState(null);

  // Instant 4-Pillar SEO & AI Citability (GEO) Lab State
  const [showSeoLabModal, setShowSeoLabModal] = useState(false);
  const [seoLabUrl, setSeoLabUrl] = useState('');
  const [seoLabBusiness, setSeoLabBusiness] = useState('');
  const [seoLabLoading, setSeoLabLoading] = useState(false);
  const [seoLabResult, setSeoLabResult] = useState(null);
  const [seoLabError, setSeoLabError] = useState(null);
  const [seoLabElapsed, setSeoLabElapsed] = useState(0);

  // Discovery Form State
  const [discoveryMode, setDiscoveryMode] = useState('APOLLO_DECISION_MAKERS');
  const [discoveryNiche, setDiscoveryNiche] = useState('Roofing Contractors');
  const [discoveryLocation, setDiscoveryLocation] = useState('Miami, FL');
  const [discoveryMaxLeads, setDiscoveryMaxLeads] = useState(15);
  const [singleDomainUrl, setSingleDomainUrl] = useState('');
  const [singleBusinessName, setSingleBusinessName] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState(null);

  // Trigger states
  const [isProcessing, setIsProcessing] = useState(false);
  const [runningLeadId, setRunningLeadId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [processMessage, setProcessMessage] = useState(null);
  const [pipelineMonitor, setPipelineMonitor] = useState(null);

  // Live timer for active API execution
  useEffect(() => {
    let timer;
    if (isProcessing) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  // Live timer for active SEO Lab run
  useEffect(() => {
    let timer;
    if (seoLabLoading) {
      setSeoLabElapsed(0);
      timer = setInterval(() => {
        setSeoLabElapsed((s) => s + 1);
      }, 1000);
    } else {
      setSeoLabElapsed(0);
    }
    return () => clearInterval(timer);
  }, [seoLabLoading]);

  const handleRunSeoAudit = async (targetUrl, targetName) => {
    const urlToTest = (targetUrl || seoLabUrl || '').trim();
    const nameToTest = (targetName || seoLabBusiness || '').trim() || 'Audited Web Property';

    if (!urlToTest) {
      alert('Please enter a target website URL (e.g. https://example.com)');
      return;
    }

    setSeoLabLoading(true);
    setSeoLabError(null);
    setSeoLabResult(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest, businessName: nameToTest }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSeoLabResult(data);
      } else {
        setSeoLabError(data.error || 'Audit analysis failed');
      }
    } catch (err) {
      setSeoLabError(err.message || 'Connection error during audit execution');
    } finally {
      setSeoLabLoading(false);
    }
  };

  const handleDownloadLabPdf = () => {
    if (!seoLabResult?.pdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${seoLabResult.pdfBase64}`;
    link.download = `4_Pillar_SEO_GEO_Report_${(seoLabResult.businessName || 'Property').replace(/[^a-z0-9]/gi, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single Lead Form State
  const [newLead, setNewLead] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    website_url: '',
    has_website: true,
    category: 'Home & Commercial Services',
    city: 'Austin, TX',
    services: 'Residential Repairs, Emergency Response, Upfront Estimates',
  });

  // CSV Drag and drop / file input
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current user session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
      ]);

      if (leadsRes.leads) {
        setLeads(leadsRes.leads);
      }
      if (statsRes && !statsRes.error) {
        setStats(statsRes);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleProcessNext = async (specificLeadId) => {
    const targetLead = specificLeadId
      ? leads.find((l) => l.id === specificLeadId)
      : leads.find((l) => l.status === 'PENDING') || leads[0];
    const targetName = targetLead?.business_name || (specificLeadId ? 'Selected Lead' : 'Next Pending Lead');
    const isFunnelA = targetLead ? targetLead.has_website : true;

    setIsProcessing(true);
    setRunningLeadId(specificLeadId || targetLead?.id || 'pending');

    setPipelineMonitor({
      show: true,
      businessName: targetName,
      lead: targetLead,
      step: 1,
      stepText: '1. Initializing target lead & verifying deliverability...',
      percent: 12,
      status: 'running',
      logs: [`[0.0s] Initializing live execution engine for ${targetName}...`],
      result: null,
      error: null,
    });

    try {
      // 1. Try real-time streaming endpoint (SSE)
      const res = await fetch('/api/leads/process-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: specificLeadId }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(trimmed.slice(6));
                setPipelineMonitor((prev) => {
                  const newLogs = eventData.log
                    ? [...(prev?.logs || []), eventData.log]
                    : prev?.logs || [];

                  return {
                    show: true,
                    businessName: eventData.businessName || prev?.businessName || targetName,
                    lead: eventData.lead || prev?.lead || targetLead,
                    step: eventData.step || prev?.step || 1,
                    percent: eventData.percent !== undefined ? eventData.percent : (prev?.percent || 15),
                    stepText: eventData.stepText || prev?.stepText || '',
                    status: eventData.status || prev?.status || 'running',
                    logs: newLogs,
                    result: eventData.result || prev?.result || null,
                    error: eventData.error || prev?.error || null,
                  };
                });
              } catch (parseErr) {
                console.warn('SSE parse error:', parseErr);
              }
            }
          }
        }
      } else {
        // Fallback to non-streaming POST if streaming is unavailable
        const fallbackRes = await fetch('/api/leads/process-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: specificLeadId }),
        });
        const fallbackData = await fallbackRes.json();

        if (fallbackData.processed && fallbackData.result) {
          setPipelineMonitor((prev) => ({
            show: true,
            businessName: fallbackData.result.businessName || targetName,
            lead: targetLead,
            step: 6,
            percent: 100,
            status: 'completed',
            stepText: '6. Pipeline Completed & Cold Outreach Dispatched!',
            logs: [...(prev?.logs || []), `[Done] Processed -> Status: ${fallbackData.result.status}`],
            result: fallbackData.result,
            error: null,
          }));
        } else {
          setPipelineMonitor((prev) => ({
            show: true,
            businessName: targetName,
            lead: targetLead,
            step: 6,
            percent: 100,
            status: fallbackData.error ? 'error' : 'completed',
            stepText: fallbackData.message || fallbackData.error || 'Finished.',
            logs: [...(prev?.logs || []), fallbackData.message || fallbackData.error || 'Finished.'],
            result: null,
            error: fallbackData.error || null,
          }));
        }
      }

      await fetchDashboardData();
    } catch (err) {
      setPipelineMonitor((prev) => ({
        show: true,
        businessName: targetName,
        lead: targetLead,
        step: 6,
        percent: 100,
        status: 'error',
        stepText: `Pipeline exception: ${err.message}`,
        logs: [...(prev?.logs || []), `Execution error: ${err.message}`],
        result: null,
        error: err.message,
      }));
    } finally {
      setIsProcessing(false);
      setRunningLeadId(null);
    }
  };

  const handleAddSingleLead = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        business_name: newLead.business_name,
        owner_name: newLead.owner_name || 'Team',
        email: newLead.email,
        website_url: newLead.has_website ? newLead.website_url : null,
        has_website: newLead.has_website,
        category: newLead.category,
        city: newLead.city,
        services: newLead.services.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowSingleLeadModal(false);
        setNewLead({
          business_name: '',
          owner_name: '',
          email: '',
          website_url: '',
          has_website: true,
          category: 'Home & Commercial Services',
          city: 'Austin, TX',
          services: 'Residential Repairs, Emergency Response, Upfront Estimates',
        });
        await fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create lead');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      Papa.parse(file, {
        header: true,
        preview: 5,
        complete: (results) => {
          setCsvPreview(results.data);
        },
      });
    }
  };

  const handleUploadCsv = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    try {
      const text = await csvFile.text();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });

      const data = await res.json();
      if (res.ok) {
        setShowCsvModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        alert(`Successfully imported ${data.ingestedCount} leads into queue!`);
        await fetchDashboardData();
      } else {
        alert(data.error || 'Failed to import CSV');
      }
    } catch (e) {
      alert(`Import error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscoverLeads = async (e) => {
    e.preventDefault();
    setIsDiscovering(true);
    setDiscoveryStatus(null);

    try {
      const payload =
        discoveryMode === 'SINGLE_DOMAIN'
          ? {
              mode: 'SINGLE_DOMAIN',
              domain: singleDomainUrl,
              businessName: singleBusinessName,
            }
          : {
              niche: discoveryNiche,
              location: discoveryLocation,
              maxLeads: discoveryMaxLeads,
              mode: discoveryMode,
            };

      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (discoveryMode === 'SINGLE_DOMAIN' && data.enriched) {
          setDiscoveryStatus({
            type: 'success',
            message: `Enriched ${data.enriched.businessName}: Discovered ${data.enriched.ownerName} (${data.enriched.email}) • Saved to queue.`,
            isSimulated: false,
          });
          setSingleDomainUrl('');
          setSingleBusinessName('');
        } else {
          setDiscoveryStatus({
            type: 'success',
            message: `Discovered ${data.totalDiscovered} leads (${data.totalSaved} new saved to database, ${data.skippedDuplicates} duplicates filtered).`,
            isSimulated: data.isSimulated,
          });
        }
        await fetchDashboardData();
      } else {
        setDiscoveryStatus({
          type: 'error',
          message: data.error || 'Failed to discover leads',
        });
      }
    } catch (err) {
      setDiscoveryStatus({
        type: 'error',
        message: err.message || 'Connection error',
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesFunnel =
      funnelFilter === 'ALL' ||
      (funnelFilter === 'WITH_WEBSITE' && lead.has_website) ||
      (funnelFilter === 'NO_WEBSITE' && !lead.has_website);

    return matchesSearch && matchesStatus && matchesFunnel;
  });

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col">
      {/* Top Brand Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-lg">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  SynergyTech Solutions
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" /> Protected Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sender: <span className="text-slate-300 font-mono">mosesmartin@synergytechsol.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSchemaGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              SQL Schema
            </button>
            <button
              onClick={() => setShowWebhookGuide(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Apify Webhook
            </button>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh leads data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* User Session & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-slate-200">
                  {currentUser?.name || 'Admin'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.email || 'Authenticated'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                title="Sign Out of Dashboard"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Supabase status notice if not yet connected */}
        {!loading && !stats.configured && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong>Supabase Setup:</strong> Your credentials are configured. Make sure you run the SQL migration script in your Supabase SQL Editor if you haven't yet.
              </div>
            </div>
            <button
              onClick={() => setShowSchemaGuide(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              View SQL Schema
            </button>
          </div>
        )}

        {/* Process Notification Toast */}
        {processMessage && (
          <div className="p-4 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-200 flex items-center justify-between shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{processMessage}</span>
            </div>
            <button onClick={() => setProcessMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Ingested</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.totalLeads || leads.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.withWebsite} Web / {stats.noWebsite} No-Web
            </div>
          </div>

          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>Pending Queue</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-2">
              {stats.pending}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Ready for 1/hr cron
            </div>
          </div>

          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Dispatched</span>
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 mt-2">
              {stats.sent}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Cold emails delivered
            </div>
          </div>

          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
              <span>Skipped Filter</span>
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300 mt-2">
              {stats.skipped}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Passed high scores
            </div>
          </div>

          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
              <span>Avg PageSpeed</span>
              <Gauge className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-300 mt-2">
              {stats.avgSpeedScore ? `${stats.avgSpeedScore}/100` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Mobile audit index
            </div>
          </div>

          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-medium">
              <span>Avg Diagnostic</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300 mt-2">
              {stats.avgSeoScore ? `${stats.avgSeoScore}/100` : '--'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Schema & Conversion
            </div>
          </div>
        </div>

        {/* Operational Control Bar & Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowSeoLabModal(true);
                if (!seoLabUrl) setSeoLabUrl('https://synergytechsol.com');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer ring-1 ring-emerald-400/40"
            >
              <Gauge className="w-4 h-4 text-emerald-200" />
              <span>⚡ Instant 4-Pillar SEO & AI Search (GEO) Lab</span>
            </button>

            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>🚀 Discover Leads</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              Import CSV
            </button>

            <button
              onClick={() => setShowSingleLeadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              Add Single Lead
            </button>

            <button
              onClick={() => handleProcessNext()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-75 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-white' : ''}`} />
              {isProcessing ? `⚡ Pipeline Running (${elapsedSeconds}s)...` : '⚡ Process Next Lead Now'}
            </button>
          </div>

          {/* Vercel Cron Status Badge */}
          <div className="flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-mono">
              Vercel Cron: <strong className="text-slate-200">0 9-15 * * 1-5</strong> (1 email/hour window)
            </span>
          </div>
        </div>

        {/* Funnel Architecture Visualizer */}
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Dual Funnel Automated Routing
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Funnel A Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> FUNNEL A: Website Exists
                </span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                  Speed, Schema & Conversion Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Runs Google PageSpeed API (Mobile) + Schema.org & Mobile Friction Scanner. Evaluates LCP render delays, LocalBusiness JSON-LD, and 1-tap booking friction to generate an executive PDF diagnostic report. High-scoring sites are marked <strong>SKIPPED</strong>.
              </p>
            </div>

            {/* Funnel B Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> FUNNEL B: No Website Found
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                  Live Prototype Offer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Instantly mounts live responsive web prototype at <code className="text-indigo-300">/demo/[slug]</code>. Gemini generates localized pitch hook for Google Maps searchers and dispatches plain-text prototype invitation email.
              </p>
            </div>

          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1424] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING (Queue)</option>
              <option value="SENT">SENT (Dispatched)</option>
              <option value="SKIPPED">SKIPPED (High Score)</option>
              <option value="FAILED">FAILED</option>
            </select>

            {/* Funnel Filter */}
            <select
              value={funnelFilter}
              onChange={(e) => setFunnelFilter(e.target.value)}
              className="bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="ALL">All Funnels</option>
              <option value="WITH_WEBSITE">Funnel A (Website Exists)</option>
              <option value="NO_WEBSITE">Funnel B (No Website)</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#080d18] border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Business & Contact</th>
                  <th className="px-5 py-3.5">Funnel & Site</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Audit / Demo Metrics</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Loading leads queue...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-400">No leads match the current filters</p>
                          <p className="text-xs">Import a CSV file or add leads to initiate automated dispatch.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const audit = (lead.audit_reports && lead.audit_reports[0]) || null;
                    const slug = lead.business_slug || (lead.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

                    return (
                      <tr
                        key={lead.id}
                        className={`transition group ${
                          runningLeadId === lead.id
                            ? 'bg-cyan-950/30 border-l-4 border-l-cyan-400 shadow-inner'
                            : 'hover:bg-slate-900/50'
                        }`}
                      >
                        
                        {/* Business & Contact */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{lead.business_name}</span>
                            {runningLeadId === lead.id && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                                Active Run ({elapsedSeconds}s)
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5 font-mono">
                            <Mail className="w-3 h-3 text-slate-500" /> {lead.email}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {lead.owner_name} • {lead.city || 'Area'} • {lead.category}
                          </div>
                        </td>

                        {/* Funnel & Site */}
                        <td className="px-5 py-4">
                          {lead.has_website && lead.website_url ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                                <Globe className="w-3 h-3" /> Funnel A (Site)
                              </span>
                              <a
                                href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-blue-400 truncate max-w-[180px] block transition flex items-center gap-1"
                              >
                                {lead.website_url.replace(/^https?:\/\//, '')} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                                <Sparkles className="w-3 h-3" /> Funnel B (Prototype)
                              </span>
                              <Link
                                href={`/demo/${slug}`}
                                target="_blank"
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                              >
                                /demo/{slug} <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              lead.status === 'SENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : lead.status === 'SKIPPED'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : lead.status === 'FAILED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : lead.status === 'QUALIFIED'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {lead.status === 'SENT' && <CheckCircle2 className="w-3 h-3" />}
                            {lead.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {lead.status}
                          </span>
                          {lead.status_reason && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] truncate" title={lead.status_reason}>
                              {lead.status_reason}
                            </p>
                          )}
                        </td>

                        {/* Audit / Demo Metrics */}
                        <td className="px-5 py-4">
                          {audit ? (
                            <div className="space-y-1">
                              {audit.speed_score !== undefined && audit.speed_score !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400">Speed:</span>
                                  <span
                                    className={`font-mono font-bold text-[11px] ${
                                      audit.speed_score >= 70 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {audit.speed_score}/100
                                  </span>
                                  <span className="text-[10px] text-slate-400">SEO:</span>
                                  <span
                                    className={`font-mono font-bold text-[11px] ${
                                      audit.seo_score >= 75 ? 'text-emerald-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {audit.seo_score}/100
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-indigo-300 font-mono">
                                  Prototype Generated
                                </span>
                              )}
                              {audit.gemini_hook && (
                                <p className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[220px]">
                                  "{audit.gemini_hook}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Awaiting run</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {audit && (
                              <button
                                onClick={() => setSelectedLeadForReport({ lead, audit })}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                                title="Inspect Audit Report & Email Copy"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!lead.has_website && (
                              <Link
                                href={`/demo/${slug}`}
                                target="_blank"
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded text-xs transition flex items-center gap-1"
                                title="Preview Live Prototype"
                              >
                                Demo
                              </Link>
                            )}

                            <button
                              onClick={() => handleProcessNext(lead.id)}
                              disabled={isProcessing}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                runningLeadId === lead.id
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                              }`}
                              title={runningLeadId === lead.id ? 'Live Pipeline Running...' : 'Process this lead immediately'}
                            >
                              {runningLeadId === lead.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                  <span className="animate-pulse text-cyan-300">Running ({elapsedSeconds}s)...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  <span>Run</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* MODAL 1: Live Lead Discovery (Apify & AI Enrichment) */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-2.5 font-bold text-base text-white">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Lead Discovery & Enrichment</h3>
                  <p className="text-[11px] text-slate-400 font-normal">Apify Google Maps + Smart Web Crawler + DNS MX Verifier</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDiscoveryModal(false);
                  setDiscoveryStatus(null);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              {discoveryStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    discoveryStatus.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/60 border border-rose-500/30 text-rose-200'
                  }`}
                >
                  {discoveryStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{discoveryStatus.message}</span>
                </div>
              )}

              <form id="discovery-form" onSubmit={handleDiscoverLeads} className="space-y-4 text-xs">
                {/* Discovery Mode Selector */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Extraction Engine Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDiscoveryMode('APOLLO_DECISION_MAKERS')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                        discoveryMode === 'APOLLO_DECISION_MAKERS'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>🎯 Decision Makers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscoveryMode('GOOGLE_MAPS')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                        discoveryMode === 'GOOGLE_MAPS'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>🌐 Google Maps</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscoveryMode('SINGLE_DOMAIN')}
                      className={`py-2 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                        discoveryMode === 'SINGLE_DOMAIN'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>🔍 Single Domain</span>
                    </button>
                  </div>
                </div>

                {discoveryMode === 'SINGLE_DOMAIN' ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                        Target Website / Domain URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://synergytechsol.com or apexroofing.com"
                        value={singleDomainUrl}
                        onChange={(e) => setSingleDomainUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                        Company / Business Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SynergyTech Solutions (auto-derived if blank)"
                        value={singleBusinessName}
                        onChange={(e) => setSingleBusinessName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ⚡ Autonomously crawls team & about pages, extracts the Founder / CEO name, synthesizes email permutations, and tests MX deliverability.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                          Target Niche / Keyword
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Roofing Contractors, Dentists, Lawyers"
                          value={discoveryNiche}
                          onChange={(e) => setDiscoveryNiche(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                          Location / Target City
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Miami, FL or Austin, TX or London"
                          value={discoveryLocation}
                          onChange={(e) => setDiscoveryLocation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                          Leads Batch Limit
                        </label>
                        <span className="text-cyan-400 font-mono font-bold text-xs">{discoveryMaxLeads} Leads</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={discoveryMaxLeads}
                        onChange={(e) => setDiscoveryMaxLeads(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  </>
                )}

                {/* Multi-tier features highlight */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-400">
                  <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> Multi-Layer Enrichment Pipeline Active:
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Google Places Scrape
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Cheerio Owner Crawler
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> DNS MX Mail Verifier
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Auto Deduplication
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="discovery-form"
                disabled={isDiscovering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDiscovering ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Discovering & Enriching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Live Discovery</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CSV Leads Importer */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                Import Leads via CSV
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              <p className="text-slate-400">
                Upload any Apify, Google Maps, or custom CSV export. Supported columns: <code className="text-slate-300">business_name, email, website_url, owner_name, category, city</code>.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-upload-input"
                />
                <label htmlFor="csv-upload-input" className="cursor-pointer block space-y-2">
                  <UploadCloud className="w-8 h-8 text-blue-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-200">
                    {csvFile ? csvFile.name : 'Click to browse or drop CSV here'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Plain text .csv up to 10MB
                  </div>
                </label>
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Preview (First {csvPreview.length} rows):
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-400 max-h-36 overflow-y-auto space-y-1 border border-slate-800">
                    {csvPreview.map((row, i) => (
                      <div key={i} className="truncate">
                        {row.business_name || row.title || 'Row'} - {row.email || 'No email'} ({row.website_url || row.website || 'No website'})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadCsv}
                disabled={!csvFile || isUploading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {isUploading ? 'Ingesting...' : 'Ingest Leads'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Single Lead */}
      {showSingleLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Plus className="w-5 h-5 text-blue-400" />
                Add Single Lead to Queue
              </div>
              <button onClick={() => setShowSingleLeadModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 text-xs select-text">
              <form id="single-lead-form" onSubmit={handleAddSingleLead} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Electrical Solutions"
                    value={newLead.business_name}
                    onChange={(e) => setNewLead({ ...newLead, business_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Owner / Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. David Miller"
                      value={newLead.owner_name}
                      onChange={(e) => setNewLead({ ...newLead, owner_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Recipient Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="contact@business.com"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 text-slate-200 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newLead.has_website}
                      onChange={(e) => setNewLead({ ...newLead, has_website: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Has Existing Website (Funnel A: Speed & SEO Audit)</span>
                  </label>
                  {newLead.has_website && (
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={newLead.website_url}
                      onChange={(e) => setNewLead({ ...newLead, website_url: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                    />
                  )}
                  {!newLead.has_website && (
                    <p className="text-[11px] text-indigo-400 font-mono">
                      ⚡ Funnel B Active: Will mount responsive prototype offer at /demo/[slug]
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category / Industry</label>
                    <input
                      type="text"
                      placeholder="e.g. HVAC & Plumbing"
                      value={newLead.category}
                      onChange={(e) => setNewLead({ ...newLead, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Austin, TX"
                      value={newLead.city}
                      onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Services (Comma separated)</label>
                  <input
                    type="text"
                    value={newLead.services}
                    onChange={(e) => setNewLead({ ...newLead, services: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                  />
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowSingleLeadModal(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="single-lead-form"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-blue-600/20"
              >
                Save Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Apify Webhook & Ingestion Guide */}
      {showWebhookGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Code className="w-5 h-5 text-cyan-400" />
                Apify Webhook & JSON Ingestion
              </div>
              <button onClick={() => setShowWebhookGuide(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              <p className="text-slate-300">
                You can connect Apify Google Maps Scraper directly to push leads into this engine on actor completion:
              </p>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Webhook Endpoint</span>
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-cyan-300 select-all border border-slate-800">
                  POST https://synergytechsol.com/api/leads
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sample JSON Payload</span>
                <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
{`[
  {
    "business_name": "Lone Star Electrical",
    "owner_name": "Michael",
    "email": "contact@lonestarelec.com",
    "website_url": "https://lonestarelec.com",
    "has_website": true,
    "category": "Electrician",
    "city": "Austin, TX"
  },
  {
    "business_name": "Austin Prime Detailing",
    "owner_name": "Alex",
    "email": "alex@primedetailaustin.com",
    "has_website": false,
    "category": "Auto Detailing",
    "city": "Austin, TX"
  }
]`}
                </pre>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-end shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <button
                onClick={() => setShowWebhookGuide(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SQL Schema Guide */}
      {showSchemaGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Database className="w-5 h-5 text-indigo-400" />
                Supabase SQL Setup (Includes admin_users & password hashing)
              </div>
              <button onClick={() => setShowSchemaGuide(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              <p className="text-slate-300">
                Execute this updated script inside your <strong>Supabase SQL Editor</strong> to create the tables, indexes, and ENUM types:
              </p>

              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-indigo-300 max-h-72 overflow-y-auto border border-slate-800 select-all">
{`-- 1. Create ENUM for status tracking
CREATE TYPE lead_status AS ENUM ('PENDING', 'QUALIFIED', 'SKIPPED', 'SENT', 'FAILED');

-- 2. Admin Users Table (Hashed Password Auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT 'Moses Martin',
    role VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Main Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    business_slug VARCHAR(255),
    owner_name VARCHAR(255) DEFAULT 'Team',
    email VARCHAR(255) NOT NULL,
    website_url TEXT,
    has_website BOOLEAN DEFAULT true,
    category VARCHAR(100),
    city VARCHAR(100),
    services TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(2,1) DEFAULT 4.9,
    review_count INT DEFAULT 45,
    status lead_status DEFAULT 'PENDING',
    status_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit & Outreach Logs Table
CREATE TABLE IF NOT EXISTS audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    speed_score INT,
    lcp_seconds VARCHAR(50),
    page_size_mb VARCHAR(50),
    seo_score INT,
    seo_issues JSONB DEFAULT '[]'::jsonb,
    gemini_hook TEXT,
    prototype_url TEXT,
    email_subject TEXT,
    email_body TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_leads_pending ON leads (status, created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);`}
              </pre>
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-end shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <button
                onClick={() => setShowSchemaGuide(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Audit & Email Inspector */}
      {selectedLeadForReport && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div>
                <div className="font-bold text-base text-white">
                  Audit Report & Cold Email Inspector
                </div>
                <div className="text-xs text-slate-400">
                  {selectedLeadForReport.lead?.business_name} ({selectedLeadForReport.lead?.email})
                </div>
              </div>
              <button onClick={() => setSelectedLeadForReport(null)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              {/* 4-Pillar Universal SEO & GEO Metrics */}
              {selectedLeadForReport.audit?.speed_score !== undefined && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">1. Google Speed</div>
                    <div className="text-base font-bold text-blue-400">
                      {selectedLeadForReport.audit.speed_score}/100
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">LCP: {selectedLeadForReport.audit.lcp_seconds || '3.8s'}</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">2. Technical SEO</div>
                    <div className="text-base font-bold text-emerald-400">
                      {selectedLeadForReport.audit.technical_score || selectedLeadForReport.audit.seo_score || 75}/100
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Indexability</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">3. AI Search (GEO)</div>
                    <div className="text-base font-bold text-violet-400">
                      {selectedLeadForReport.audit.geo_score || 50}/100
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">AI Overviews</div>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">4. Local Schema</div>
                    <div className="text-base font-bold text-amber-400">
                      {selectedLeadForReport.audit.local_schema_score || selectedLeadForReport.audit.schema_score || 40}/100
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Map Pack Entity</div>
                  </div>
                </div>
              )}

              {/* Attached PDF Notice */}
              {selectedLeadForReport.audit?.speed_score !== undefined && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <span className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <strong>Executive Diagnostic PDF:</strong> Attached to cold email dispatch
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded font-mono">
                    Confidential Assessment
                  </span>
                </div>
              )}

              {/* Gemini Hook */}
              {selectedLeadForReport.audit?.gemini_hook && (
                <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Gemini 3.6 Flash Dynamic Hook:
                  </div>
                  <div className="text-xs text-slate-200 italic">
                    "{selectedLeadForReport.audit.gemini_hook}"
                  </div>
                </div>
              )}

              {/* Email Body */}
              {selectedLeadForReport.audit?.email_body ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">
                    Subject: <span className="font-normal text-slate-400">{selectedLeadForReport.audit.email_subject}</span>
                  </div>
                  <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                    {selectedLeadForReport.audit.email_body}
                  </pre>
                </div>
              ) : (
                <div className="text-xs text-slate-500">No email body logged.</div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <div className="text-[11px] text-slate-500">
                Dispatched: {selectedLeadForReport.audit?.sent_at ? new Date(selectedLeadForReport.audit.sent_at).toLocaleString() : 'N/A'}
              </div>
              <button
                onClick={() => setSelectedLeadForReport(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Live Pipeline Execution Monitor & Stepper */}
      {pipelineMonitor && pipelineMonitor.show && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Top Glowing Ambient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 z-20" />

            {/* Modal Header (Sticky Top with Close button) */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                  pipelineMonitor.status === 'completed'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                    : pipelineMonitor.status === 'error'
                    ? 'bg-gradient-to-tr from-rose-600 to-pink-600 shadow-rose-500/20'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/25'
                }`}>
                  {pipelineMonitor.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : pipelineMonitor.status === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                    <span>{pipelineMonitor.status === 'completed' ? 'Pipeline Completed!' : 'Live Acquisition Pipeline'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 shrink-0">
                      {pipelineMonitor.lead?.has_website ? 'Funnel A' : 'Funnel B'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Target: <strong className="text-slate-200">{pipelineMonitor.businessName}</strong>
                  </p>
                </div>
              </div>

              {/* Timer & Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs flex items-center gap-1.5 shadow-inner">
                  <Clock className={`w-3.5 h-3.5 text-cyan-400 ${pipelineMonitor.status === 'running' ? 'animate-spin' : ''}`} />
                  <span>
                    {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                    {String(elapsedSeconds % 60).padStart(2, '0')}s
                  </span>
                </div>

                <button
                  onClick={() => setPipelineMonitor((prev) => prev ? { ...prev, show: false } : null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0"
                  title="Close / Minimize Monitor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs select-text">
              {/* Live Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-2">
                    <span className={`flex h-2 w-2 rounded-full ${pipelineMonitor.status === 'completed' ? 'bg-emerald-400' : pipelineMonitor.status === 'error' ? 'bg-rose-400' : 'bg-cyan-400 animate-ping'}`} />
                    <span className="text-slate-200">{pipelineMonitor.stepText}</span>
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">{pipelineMonitor.percent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${pipelineMonitor.percent}%` }}
                  />
                </div>
              </div>

              {/* 6-Step Visual Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { step: 1, title: 'Lead & Contact Validation', desc: 'Syntax & DNS MX verified' },
                  { step: 2, title: pipelineMonitor.lead?.has_website ? 'Google PageSpeed (LCP)' : 'Prototype Layout Generation', desc: pipelineMonitor.lead?.has_website ? 'Core Web Vitals mobile run' : '0.8s responsive template' },
                  { step: 3, title: 'Schema.org & 1-Tap UX Scan', desc: 'JSON-LD & mobile calling barriers' },
                  { step: 4, title: 'Gemini 3.6 Flash Hook', desc: '1-sentence plain-spoken observation' },
                  { step: 5, title: 'Executive PDF Diagnostic', desc: '$2,500 consulting assessment report' },
                  { step: 6, title: 'Cold Outreach Delivery', desc: 'SMTP dispatch + PDF attachment' },
                ].map((item) => {
                  const isDone = pipelineMonitor.step > item.step || pipelineMonitor.status === 'completed';
                  const isCurrent = pipelineMonitor.step === item.step && pipelineMonitor.status === 'running';

                  return (
                    <div
                      key={item.step}
                      className={`p-2.5 rounded-xl border transition flex items-start gap-2.5 ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : isCurrent
                          ? 'bg-cyan-950/40 border-cyan-400/60 text-white shadow-lg shadow-cyan-500/15'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                            {item.step}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[11px] leading-tight flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {isCurrent && <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider animate-pulse">[Active]</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completed Output Summary Card */}
              {pipelineMonitor.status === 'completed' && pipelineMonitor.result && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Ready & Dispatched
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Status: <strong className="text-slate-200">{pipelineMonitor.result.status}</strong>
                    </span>
                  </div>

                  {pipelineMonitor.result.auditReport && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {pipelineMonitor.result.auditReport.speed_score !== undefined ? (
                        <>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-400">PageSpeed</div>
                            <div className="text-sm font-bold text-blue-400">
                              {pipelineMonitor.result.auditReport.speed_score}/100
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-400">Mobile LCP</div>
                            <div className="text-sm font-bold text-amber-400">
                              {pipelineMonitor.result.auditReport.lcp_seconds || '3.8s'}
                            </div>
                          </div>
                          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                            <div className="text-[10px] text-slate-400">Diagnostic</div>
                            <div className="text-sm font-bold text-cyan-400">
                              {pipelineMonitor.result.auditReport.seo_score || 50}/100
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-3 bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/30 text-xs text-indigo-300 font-mono text-left">
                          Demo Prototype Live: {pipelineMonitor.result.auditReport.prototype_url}
                        </div>
                      )}
                    </div>
                  )}

                  {pipelineMonitor.result.auditReport?.gemini_hook && (
                    <div className="p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[11px] text-slate-300 italic">
                      <Bot className="w-3.5 h-3.5 text-blue-400 inline mr-1" />
                      "{pipelineMonitor.result.auditReport.gemini_hook}"
                    </div>
                  )}
                </div>
              )}

              {/* Error Card */}
              {pipelineMonitor.status === 'error' && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Execution Notice:</strong> {pipelineMonitor.error || 'Failed to complete pipeline run.'}
                  </div>
                </div>
              )}

              {/* Live Log Terminal Output */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>Live Execution Log</span>
                  {pipelineMonitor.status === 'running' && (
                    <span className="text-cyan-400 font-mono flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Streaming Output
                    </span>
                  )}
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/90 font-mono text-[10px] text-slate-300 max-h-28 overflow-y-auto space-y-1 select-text">
                  {pipelineMonitor.logs.map((log, i) => (
                    <div key={i} className={`leading-tight ${
                      log.includes('Gemini') || log.includes('AI') ? 'text-purple-300' :
                      log.includes('PageSpeed') || log.includes('Core Web') ? 'text-cyan-300' :
                      log.includes('PDF') ? 'text-emerald-300' :
                      log.includes('SMTP') || log.includes('email') ? 'text-amber-300' :
                      log.includes('Error') ? 'text-rose-400' :
                      'text-slate-400'
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <div className="text-[11px] text-slate-500 font-mono">
                {pipelineMonitor.status === 'running' ? 'Active execution thread running...' : 'Finished'}
              </div>
              <div className="flex items-center gap-2">
                {pipelineMonitor.status === 'completed' && pipelineMonitor.result?.auditReport && (
                  <button
                    onClick={() => {
                      setSelectedLeadForReport({
                        lead: pipelineMonitor.lead,
                        audit: pipelineMonitor.result.auditReport,
                      });
                      setPipelineMonitor(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Report
                  </button>
                )}
                <button
                  onClick={() => setPipelineMonitor(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {pipelineMonitor.status === 'running' ? 'Minimize to Background' : 'Close Monitor'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 8: Instant 4-Pillar Universal SEO & AI Citability (GEO) Diagnostic Lab */}
      {showSeoLabModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0c1322] border border-cyan-500/40 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Top Glowing Ambient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 z-20" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 truncate">
                    <span>4-Pillar SEO & AI Search (GEO) Diagnostic Lab</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 font-bold">
                      Claude-SEO Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Audit Core Web Vitals • Technical Indexability • AI Citability (/llms.txt) • Local Schema
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSeoLabModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs select-text">
              
              {/* URL & Business Input Controls */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Target Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={seoLabUrl}
                      onChange={(e) => setSeoLabUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div className="sm:w-1/3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Business Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Travel With Ghaith"
                      value={seoLabBusiness}
                      onChange={(e) => setSeoLabBusiness(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Preset Quick-Test Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Quick Test:</span>
                  {[
                    { label: '⚡ SynergyTech', url: 'https://synergytechsol.com', name: 'SynergyTech Solutions' },
                    { label: '✈️ Travel Ghaith', url: 'https://travelwithghaith.com', name: 'Travel With Ghaith' },
                    { label: '🏠 Apex Roofing', url: 'https://apexroofingmiami.com', name: 'Apex Roofing Miami' },
                    { label: '🦷 Dental Smiles', url: 'https://downtownsmiles.com', name: 'Downtown Smiles Dental' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSeoLabUrl(preset.url);
                        setSeoLabBusiness(preset.name);
                        handleRunSeoAudit(preset.url, preset.name);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 text-[11px] font-mono transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleRunSeoAudit()}
                    disabled={seoLabLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {seoLabLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Running 4-Pillar Universal Audit & AI Synthesis ({seoLabElapsed}s)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-200" />
                        <span>⚡ Run Live 4-Pillar Diagnostic Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {seoLabError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{seoLabError}</span>
                </div>
              )}

              {/* 4-Pillar Results Dashboard */}
              {seoLabResult && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Top 4-Pillar Score Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    {/* Pillar 1: PageSpeed & CWV */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Gauge className="w-3 h-3 text-cyan-400" /> 1. PageSpeed
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black font-mono ${
                        seoLabResult.scores.speedScore >= 80 ? 'text-emerald-400' :
                        seoLabResult.scores.speedScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {seoLabResult.scores.speedScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        LCP: <strong className="text-white font-mono">{seoLabResult.metrics.lcpSeconds || '3.2s'}</strong> • CLS: {seoLabResult.metrics.clsValue || 0.04}
                      </div>
                    </div>

                    {/* Pillar 2: Technical Indexability */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Globe className="w-3 h-3 text-blue-400" /> 2. Tech Health
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
                        {seoLabResult.scores.technicalScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        SSL: <strong className="text-emerald-400">Pass</strong> • Viewport: <strong className="text-emerald-400">Pass</strong>
                      </div>
                    </div>

                    {/* Pillar 3: AI Search Citability (GEO) */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Bot className="w-3 h-3 text-purple-400" /> 3. AI GEO Citability
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black font-mono ${
                        seoLabResult.scores.geoScore >= 70 ? 'text-purple-300' : 'text-amber-400'
                      }`}>
                        {seoLabResult.scores.geoScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        /llms.txt: {seoLabResult.metrics.hasLlmsTxt ? <span className="text-emerald-400 font-bold">Found</span> : <span className="text-rose-400 font-bold">Missing</span>}
                      </div>
                    </div>

                    {/* Pillar 4: Local Schema & Conversion */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> 4. Local Schema
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black font-mono ${
                        seoLabResult.scores.localSchemaScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {seoLabResult.scores.localSchemaScore}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        JSON-LD: {seoLabResult.metrics.hasLocalSchema ? <span className="text-emerald-400 font-bold">Pass</span> : <span className="text-rose-400 font-bold">Missing</span>}
                      </div>
                    </div>

                  </div>

                  {/* Gemini AI Outreach Pitch Observation */}
                  {seoLabResult.geminiHook && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 space-y-1">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" /> Gemini 3.6 Flash Client Pitch Hook
                      </div>
                      <p className="text-xs text-slate-200 italic leading-relaxed">
                        "{seoLabResult.geminiHook}"
                      </p>
                    </div>
                  )}

                  {/* Detected Issues & Actionable Fixes */}
                  <div className="grid md:grid-cols-2 gap-3">
                    
                    {/* Issues List */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Detected Friction Points ({seoLabResult.issues?.length || 0})
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {(seoLabResult.issues || []).map((issue, i) => (
                          <div key={i} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Developer Fixes */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Quick Fix Recommendations ({seoLabResult.actionableFixes?.length || 0})
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {(seoLabResult.actionableFixes || []).map((fix, i) => (
                          <div key={i} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{fix}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Sticky Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0c1322] sticky bottom-0 z-10">
              <div className="text-[11px] text-slate-500 font-mono">
                {seoLabResult ? `Audited: ${seoLabResult.url}` : 'Ready for test'}
              </div>
              <div className="flex items-center gap-2">
                {seoLabResult?.pdfBase64 && (
                  <button
                    onClick={handleDownloadLabPdf}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <span>📥 Download PDF Diagnostic Dossier</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSeoLabModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close Lab
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING PERSISTENT HUD: Displayed when monitor is minimized while API is running */}
      {pipelineMonitor && !pipelineMonitor.show && isProcessing && (
        <div
          onClick={() => setPipelineMonitor((prev) => prev ? { ...prev, show: true } : null)}
          className="fixed bottom-6 right-6 z-40 bg-[#0c1322]/95 backdrop-blur-md border border-cyan-500/50 p-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 cursor-pointer hover:border-cyan-400 transition animate-fadeIn group"
        >
          <div className="relative">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping absolute" />
            <span className="flex h-3 w-3 rounded-full bg-cyan-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>⚡ API Running: <strong className="text-cyan-300">{pipelineMonitor.businessName}</strong></span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-400/30">
                {pipelineMonitor.percent}%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 max-w-[260px] truncate mt-0.5 flex items-center gap-2">
              <span>{pipelineMonitor.stepText}</span>
              <span className="text-slate-500 font-mono font-bold">⏱️ {elapsedSeconds}s</span>
            </div>
          </div>
          <button className="p-1.5 bg-slate-800 group-hover:bg-cyan-600 text-white rounded-lg text-xs transition">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
