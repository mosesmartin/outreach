'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LeadDemoActions from '@/components/LeadDemoActions';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Database,
  DollarSign,
  Edit3,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  Globe,
  Kanban,
  Layers,
  LayoutList,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UploadCloud,
  User,
  UserCheck,
  X,
  Zap,
  AlertTriangle,
  Briefcase,
  MapPin
} from 'lucide-react';
import { TRENDING_OPPORTUNITIES } from '@/lib/trends';

const CRM_STAGES = [
  { id: 'NEW_LEAD', label: 'New Leads', icon: Layers, badgeColor: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30', colColor: 'border-cyan-500/30', headerBg: 'bg-cyan-950/30', dot: 'bg-cyan-400' },
  { id: 'DEMO_READY', label: 'Demo Ready', icon: Sparkles, badgeColor: 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30', colColor: 'border-indigo-500/30', headerBg: 'bg-indigo-950/30', dot: 'bg-indigo-400' },
  { id: 'CONTACTED', label: 'Contacted', icon: Send, badgeColor: 'text-blue-300 bg-blue-950/40 border-blue-500/30', colColor: 'border-blue-500/30', headerBg: 'bg-blue-950/30', dot: 'bg-blue-400' },
  { id: 'IN_NEGOTIATION', label: 'In Discussion', icon: MessageSquare, badgeColor: 'text-purple-300 bg-purple-950/40 border-purple-500/30', colColor: 'border-purple-500/30', headerBg: 'bg-purple-950/30', dot: 'bg-purple-400' },
  { id: 'CLOSED_WON', label: 'Deal Won ($)', icon: CheckCircle2, badgeColor: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30', colColor: 'border-emerald-500/30', headerBg: 'bg-emerald-950/30', dot: 'bg-emerald-400' },
  { id: 'RETAINER_ACTIVE', label: 'Monthly Retainer', icon: Zap, badgeColor: 'text-amber-300 bg-amber-950/40 border-amber-500/30', colColor: 'border-amber-500/30', headerBg: 'bg-amber-950/30', dot: 'bg-amber-400' },
  { id: 'LOST', label: 'Lost / Closed', icon: X, badgeColor: 'text-slate-400 bg-slate-900/40 border-slate-700', colColor: 'border-slate-800', headerBg: 'bg-slate-900/40', dot: 'bg-slate-500' },
];

const getLeadStage = (lead) => {
  if (lead?.stage) return lead.stage;
  if (lead?.status === 'SENT') return 'CONTACTED';
  if (lead?.status === 'QUALIFIED') return 'DEMO_READY';
  if (lead?.status === 'SKIPPED') return 'LOST';
  return 'NEW_LEAD';
};

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
    withPhone: 0,
    withWebsite: 0,
    noWebsite: 0,
    prototypesReady: 0,
    pipelineValue: 0,
    closedWonValue: 0,
    mrrValue: 0,
    stageCounts: {
      NEW_LEAD: 0,
      DEMO_READY: 0,
      CONTACTED: 0,
      IN_NEGOTIATION: 0,
      CLOSED_WON: 0,
      RETAINER_ACTIVE: 0,
      LOST: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [leadSaveNotice, setLeadSaveNotice] = useState('');
  const [singleLeadError, setSingleLeadError] = useState('');
  const [isSavingSingleLead, setIsSavingSingleLead] = useState(false);
  const singleLeadSaveInFlight = useRef(false);
  const dashboardRequest = useRef(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Twenty CRM Pipeline State
  const [crmViewMode, setCrmViewMode] = useState('KANBAN'); // 'KANBAN' | 'TABLE'
  const [selectedCrmLead, setSelectedCrmLead] = useState(null);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isSavingCrm, setIsSavingCrm] = useState(false);
  const [crmSaveSuccess, setCrmSaveSuccess] = useState(false);

  // CRM Lead Drawer Local Edit Fields
  const [crmEditStage, setCrmEditStage] = useState('NEW_LEAD');
  const [crmEditDealValue, setCrmEditDealValue] = useState(0);
  const [crmEditRetainerValue, setCrmEditRetainerValue] = useState(0);
  const [crmEditPriority, setCrmEditPriority] = useState('MEDIUM');
  const [crmEditFollowUp, setCrmEditFollowUp] = useState('');
  const [crmEditOwner, setCrmEditOwner] = useState('');
  const [crmEditPhone, setCrmEditPhone] = useState('');
  const [crmEditEmail, setCrmEditEmail] = useState('');
  const [crmEditAddress, setCrmEditAddress] = useState('');
  const [crmEditCategory, setCrmEditCategory] = useState('');
  const [filterNoWebsiteCsv, setFilterNoWebsiteCsv] = useState(true);

  useEffect(() => {
    if (selectedCrmLead) {
      setCrmEditStage(getLeadStage(selectedCrmLead));
      setCrmEditDealValue(selectedCrmLead.deal_value || 0);
      setCrmEditRetainerValue(selectedCrmLead.retainer_value || 0);
      setCrmEditPriority(selectedCrmLead.priority || 'MEDIUM');
      setCrmEditFollowUp(selectedCrmLead.follow_up_date ? String(selectedCrmLead.follow_up_date).substring(0, 10) : '');
      setCrmEditOwner(selectedCrmLead.owner_name || '');
      setCrmEditPhone(selectedCrmLead.phone || extractPhoneFallback(selectedCrmLead.status_reason) || '');
      setCrmEditEmail(selectedCrmLead.email || '');
      setCrmEditAddress(selectedCrmLead.address || selectedCrmLead.city || '');
      setCrmEditCategory(selectedCrmLead.category || '');
      setNewNoteInput('');
      setCrmSaveSuccess(false);
    }
  }, [selectedCrmLead]);

  const extractPhoneFallback = (reason) => {
    if (!reason || typeof reason !== 'string') return null;
    const match = reason.match(/(?:Phone:\s*|tel:)([\+\d\s\(\)\-\.]{7,25})/i);
    return match ? match[1].trim() : null;
  };

  const getWhatsAppUrl = (lead) => {
    if (!lead.demo || lead.contact_safety?.blocked) return null;
    const phone = lead.contact_safety?.blocked ? null : (lead.phone || extractPhoneFallback(lead.status_reason));
    if (!phone) return null;
    const message = `Hi, I prepared a website concept for ${lead.business_name}: ${lead.demo.prototype_url}. Is this something you would like to discuss?`;
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

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
  const [discoveryFilterMode, setDiscoveryFilterMode] = useState('NO_WEBSITE_ONLY'); // Strict: Drops all businesses that have websites
  const [discoveryNiche, setDiscoveryNiche] = useState('Roofing Contractors');
  const [discoveryLocation, setDiscoveryLocation] = useState('Miami, FL');
  const [discoveryMaxLeads, setDiscoveryMaxLeads] = useState(50);
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

  // Single Lead Form State (Focused on No-Website Targets with Phone / WhatsApp)
  const [newLead, setNewLead] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    email: '',
    website_url: '',
    has_website: false,
    category: 'Home & Commercial Services',
    city: 'Dallas, TX',
    services: '',
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
    const requestId = ++dashboardRequest.current;
    setLoading(true);
    try {
      const timestamp = Date.now();
      const readJson = async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load dashboard data. Please refresh.');
        return data;
      };
      const [leadsResult, statsResult] = await Promise.allSettled([
        fetch(`/api/leads?_t=${timestamp}`, { cache: 'no-store' }).then(readJson),
        fetch(`/api/stats?_t=${timestamp}`, { cache: 'no-store' }).then(readJson),
      ]);
      if (requestId !== dashboardRequest.current) return;
      if (leadsResult.status === 'fulfilled' && Array.isArray(leadsResult.value.leads)) {
        setLeads(leadsResult.value.leads);
        setDashboardError('');
      } else {
        setDashboardError(leadsResult.reason?.message || 'Could not load saved leads. Please refresh.');
      }
      if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
        setStats(statsResult.value);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
      if (requestId === dashboardRequest.current) setDashboardError('Could not load saved leads. Please refresh.');
    } finally {
      if (requestId === dashboardRequest.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchDashboardData();
  }, [currentUser]);


  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete all leads and reset the database? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setLeads([]);
        setStats({
          configured: true,
          totalLeads: 0,
          pending: 0,
          sent: 0,
          skipped: 0,
          failed: 0,
          qualified: 0,
          withPhone: 0,
          withWebsite: 0,
          noWebsite: 0,
          prototypesReady: 0,
        });
        alert('All old leads have been completely cleared.');
      } else {
        alert(data.error || 'Failed to clear data');
      }
    } catch (e) {
      alert(e.message || 'Error clearing data');
    } finally {
      setLoading(false);
      await fetchDashboardData();
    }
  };

  const handleUpdateLeadStage = async (leadId, newStage) => {
    // Optimistic local UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );
    if (selectedCrmLead && selectedCrmLead.id === leadId) {
      setSelectedCrmLead((prev) => ({ ...prev, stage: newStage }));
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to update stage:', e);
    }
  };

  const handleQuickMoveStage = async (lead, direction, e) => {
    if (e) e.stopPropagation();
    const currentStage = getLeadStage(lead);
    const currentIndex = CRM_STAGES.findIndex((s) => s.id === currentStage);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < CRM_STAGES.length) {
      await handleUpdateLeadStage(lead.id, CRM_STAGES[nextIndex].id);
    }
  };

  const handleSaveCrmLead = async (updatedFields) => {
    if (!selectedCrmLead) return;
    setIsSavingCrm(true);
    setCrmSaveSuccess(false);

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCrmLead.id, ...updatedFields }),
      });
      const data = await res.json();
      if (res.ok && data.lead) {
        setSelectedCrmLead(data.lead);
        setLeads((prev) =>
          prev.map((l) => (l.id === data.lead.id ? { ...l, ...data.lead } : l))
        );
        setCrmSaveSuccess(true);
        setTimeout(() => setCrmSaveSuccess(false), 2500);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update lead');
      }
    } catch (e) {
      alert(`Save error: ${e.message}`);
    } finally {
      setIsSavingCrm(false);
    }
  };

  const handleAddNote = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCrmLead || !newNoteInput.trim()) return;

    const noteText = newNoteInput.trim();
    setNewNoteInput('');

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCrmLead.id,
          new_note: noteText,
          author: currentUser?.name || 'Moses Martin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.lead) {
        setSelectedCrmLead(data.lead);
        setLeads((prev) =>
          prev.map((l) => (l.id === data.lead.id ? { ...l, ...data.lead } : l))
        );
      }
    } catch (e) {
      console.error('Failed to add note:', e);
    }
  };

  const handleSaveCrmDrawer = async () => {
    if (!selectedCrmLead) return;
    await handleSaveCrmLead({
      stage: crmEditStage,
      deal_value: parseFloat(crmEditDealValue) || 0,
      retainer_value: parseFloat(crmEditRetainerValue) || 0,
      priority: crmEditPriority,
      follow_up_date: crmEditFollowUp ? new Date(crmEditFollowUp).toISOString() : null,
      owner_name: crmEditOwner,
      phone: crmEditPhone,
      email: crmEditEmail,
      address: crmEditAddress,
      category: crmEditCategory,
    });
  };

  const handleAddSingleLead = async (e) => {
    e.preventDefault();
    if (singleLeadSaveInFlight.current) return;
    singleLeadSaveInFlight.current = true;
    setIsSavingSingleLead(true);
    setSingleLeadError('');
    setLeadSaveNotice('');
    try {
      const payload = {
        business_name: newLead.business_name,
        owner_name: newLead.owner_name || 'Team',
        phone: newLead.phone || null,
        email: newLead.email || null,
        website_url: null,
        has_website: false,
        category: newLead.category,
        city: newLead.city,
        services: newLead.services ? newLead.services.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.ingestedCount > 0 && data.leads?.length) {
        // Only show database-confirmed records; filters must not hide a new lead.
        setLeads(previous => [...data.leads, ...previous.filter(lead => !data.leads.some(saved => saved.id === lead.id))]);
        setSearchTerm('');
        setStatusFilter('ALL');
        setChannelFilter('ALL');
        setLeadSaveNotice(`Lead saved: ${data.leads[0].business_name}`);
        setShowSingleLeadModal(false);
        setNewLead({
          business_name: '',
          owner_name: '',
          phone: '',
          email: '',
          website_url: '',
          has_website: false,
          category: 'Home & Commercial Services',
          city: 'Dallas, TX',
          services: '',
        });
        await fetchDashboardData();
      } else {
        setSingleLeadError(data.error || 'The database did not confirm the save. Check the dashboard before trying again.');
      }
    } catch (e) {
      setSingleLeadError('Could not confirm the save. Your details are still here. Check the dashboard before trying again.');
    } finally {
      singleLeadSaveInFlight.current = false;
      setIsSavingSingleLead(false);
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
      const res = await fetch(`/api/leads?filter_no_website=${filterNoWebsiteCsv}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });

      const data = await res.json();
      if (res.ok) {
        setShowCsvModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        const filteredMsg = data.skippedWithWebsite ? ` (${data.skippedWithWebsite} businesses with websites filtered out)` : '';
        alert(`Successfully imported ${data.ingestedCount} leads without websites!${filteredMsg}`);
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
              filterMode: discoveryFilterMode,
              mode: discoveryFilterMode,
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
          const emailInfo = data.withEmailCount ? `${data.withEmailCount} Email Inboxes` : '';
          const phoneInfo = data.withPhoneCount ? `${data.withPhoneCount} WhatsApp Phones` : '';
          const contactStats = [emailInfo, phoneInfo].filter(Boolean).join(' • ');

          let successMsg = `Successfully acquired ${data.totalSaved} sourced leads for "${discoveryNiche}" in ${discoveryLocation}!`;
          if (contactStats) {
            successMsg += ` (${contactStats})`;
          }
          if (data.filterMode === 'NO_WEBSITE_ONLY' && data.skippedWithWebsite) {
            successMsg += ` [${data.skippedWithWebsite} existing websites filtered out]`;
          }

          setDiscoveryStatus({
            type: 'success',
            message: successMsg,
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
    const phone = lead.phone || extractPhoneFallback(lead.status_reason) || '';
    const leadStage = getLeadStage(lead);
    const matchesSearch =
      (lead.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city && lead.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      lead.status === statusFilter ||
      leadStage === statusFilter;

    const matchesChannel =
      channelFilter === 'ALL' ||
      (channelFilter === 'WITH_PHONE' && Boolean(phone)) ||
      (channelFilter === 'WITH_EMAIL' && Boolean(lead.email));

    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col">
      {/* Top Brand Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-wrap gap-3 items-center justify-between">
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

      {/* Main Leads Acquisition & Outreach Engine */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        <nav aria-label="Acquisition tools" className="flex flex-wrap gap-2">
          <Link href="/" aria-current="page" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"><Briefcase className="h-4 w-4" aria-hidden="true" />Business leads</Link>
          <Link href="/website-requests" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"><Search className="h-4 w-4" aria-hidden="true" />Website Requests</Link>
        </nav>

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

        {/* Twenty CRM Pipeline Financial & Outreach Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Pipeline Value */}
          <div className="bg-[#0f172a]/90 border border-cyan-500/30 rounded-xl p-4 shadow-sm bg-gradient-to-b from-cyan-950/20 to-transparent">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-medium">
              <span>Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300 mt-2 font-mono">
              ${(stats.pipelineValue || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-cyan-500/80 mt-1 font-medium">
              Active Negotiating Deals
            </div>
          </div>

          {/* Card 2: Closed Deals Won */}
          <div className="bg-[#0f172a]/90 border border-emerald-500/30 rounded-xl p-4 shadow-sm bg-gradient-to-b from-emerald-950/20 to-transparent">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Closed Won</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 mt-2 font-mono">
              ${(stats.closedWonValue || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-1 font-medium">
              Website Deals Closed
            </div>
          </div>

          {/* Card 3: Monthly Retainer MRR */}
          <div className="bg-[#0f172a]/90 border border-amber-500/30 rounded-xl p-4 shadow-sm bg-gradient-to-b from-amber-950/20 to-transparent">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>Monthly Retainer</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-2 font-mono">
              ${(stats.mrrValue || 0).toLocaleString()}
              <span className="text-xs font-normal text-amber-400/80">/mo</span>
            </div>
            <div className="text-[11px] text-amber-500/80 mt-1 font-medium">
              Recurring Care & SEO
            </div>
          </div>

          {/* Card 4: No-Website Leads */}
          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Target Pool</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.totalLeads || leads.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero-Website Businesses
            </div>
          </div>

          {/* Card 5: Public phone contacts & Phone */}
          <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Public phone contacts</span>
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 mt-2">
              {stats.withPhone || leads.filter(l => Boolean(l.phone || extractPhoneFallback(l.status_reason))).length}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-1 font-medium">
              1-Tap Pitch Ready
            </div>
          </div>

          {/* Card 6: Live Prototypes */}
          <div className="bg-[#0f172a]/90 border border-indigo-500/20 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
              <span>Live Prototypes</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300 mt-2">
              {leads.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Manually generated previews
            </div>
          </div>
        </div>

        {/* ⚡ 1-CLICK AUTONOMOUS GOOGLE MAPS LEAD HUNTER COMMAND CENTER */}
        <div className="bg-[#0c1220] border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden ring-1 ring-cyan-500/20">
          {/* Ambient Lighting Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-600/10 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header & Badges */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1-Click Autonomous Lead Hunter</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-semibold">100% Zero-Website Filter ACTIVE</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Target Local Keyword & City • Strict Zero-Website Leads Scraping
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Deep crawls Google Maps on your keyword, automatically drops every company that already has a website, and extracts only businesses WITHOUT websites with public contact details and available listing information. Review their source before outreach.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold flex items-center gap-1.5 shadow-inner">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> No website listed
                </span>
              </div>
            </div>

            {/* Single-Click Command Bar Input Form */}
            <form onSubmit={handleDiscoverLeads} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Niche / Keyword */}
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  1. Business Keyword / Niche
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Plumbing, Roofing Contractors, Dentists"
                  value={discoveryNiche}
                  onChange={(e) => setDiscoveryNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-medium"
                />
              </div>

              {/* Location / City */}
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  2. Target Location / City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miami, FL or Austin, TX or London"
                  value={discoveryLocation}
                  onChange={(e) => setDiscoveryLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-medium"
                />
              </div>

              {/* Target Leads Count */}
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  3. Batch
                </label>
                <select
                  value={discoveryMaxLeads}
                  onChange={(e) => setDiscoveryMaxLeads(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="500">500</option>
                </select>
              </div>

              {/* ⚡ The Big Single-Click Execute Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={isDiscovering}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-[42px]"
                >
                  {isDiscovering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Hunting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                      <span>1-Click Scrape</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Industry Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Quick Presets:</span>
              {[
                'Roofing Contractors',
                'Emergency Plumbing',
                'Auto Detailing & Ceramic',
                'Commercial HVAC',
                'Dental & Clinic Care',
                'Luxury Hair Salon & Spa',
                'Licensed Electricians',
                'High-End Remodeling'
              ].map((presetNiche) => (
                <button
                  key={presetNiche}
                  type="button"
                  onClick={() => setDiscoveryNiche(presetNiche)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer ${
                    discoveryNiche === presetNiche
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {presetNiche}
                </button>
              ))}
            </div>

            {/* Real-time Status Notification Banner */}
            {discoveryStatus && (
              <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 border transition ${
                discoveryStatus.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {discoveryStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{discoveryStatus.message}</span>
                </div>
                <button
                  onClick={() => setDiscoveryStatus(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {leads.some(lead => lead.contact_safety?.blocked) && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm leading-6 text-rose-200">{leads.filter(lead => lead.contact_safety?.blocked).length} old contacts are blocked because they match simulated or placeholder data. They cannot generate demos or send invitations. Their history has been preserved.</div>}

        {/* Operational Control Bar & Actions */}
        {dashboardError && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">{dashboardError}</div>}
        {leadSaveNotice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">{leadSaveNotice}</p>}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowDiscoveryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer ring-1 ring-cyan-400/40"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>🚀 Advanced Discovery Modal</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              Import CSV
            </button>

            <button
              onClick={() => { setSingleLeadError(''); setShowSingleLeadModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              Add Single Lead
            </button>

            <p className="text-xs leading-5 text-slate-300">Generate each demo separately, review it, then send its invitation.</p>

            <button
              onClick={handleClearAllData}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition active:scale-95 cursor-pointer"
              title="Delete all leads and reset queue"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Old Data</span>
            </button>
          </div>

          {/* Acquisition Strategy Badge */}
          <div className="flex items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-mono">
              Mode: <strong className="text-emerald-300">Zero-Website Direct Acquisition</strong>
            </span>
          </div>
        </div>

        {/* Acquisition Strategy & Upsell Roadmap Visualizer */}
        <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Zero-Website Acquisition & Agency Upsell Roadmap
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              High-Ticket Client Ladder
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-indigo-500/30 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> STEP 1: Live Prototype Offer
                </span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Foot-In-The-Door
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Import sourced contacts first. Generate a demo only for a selected business, check its services and recipient, then send a reviewed invitation.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> STEP 2: 1-Tap WhatsApp & Call Pitch
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Manual contact review
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reach out directly on WhatsApp or direct phone call with their personalized demo link. Verify the recipient and review the demo before sending. Replies are not guaranteed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-500/30 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> STEP 3: High-Ticket Upsell Ladder
                </span>
                <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Monthly MRR
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch Site ($300-$800) ➔ Monthly Hosting & Care Retainer ($50-$100/mo) ➔ Local SEO & Google Maps Pack Ranking ($300-$600/mo). Recurring revenue unlocked!
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter & Twenty CRM View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business name, phone, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1424] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Stage / Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="ALL">All Stages & Statuses</option>
              <option value="NEW_LEAD">📥 New Leads</option>
              <option value="DEMO_READY">📱 Demo Ready</option>
              <option value="CONTACTED">💬 Contacted</option>
              <option value="IN_NEGOTIATION">🤝 In Discussion</option>
              <option value="CLOSED_WON">🏆 Deal Won</option>
              <option value="RETAINER_ACTIVE">💎 Monthly Retainer</option>
              <option value="LOST">❌ Lost</option>
            </select>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-[#0d1424] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="ALL">All Channels</option>
              <option value="WITH_PHONE">📱 Has Phone (WhatsApp Ready)</option>
              <option value="WITH_EMAIL">✉️ Has Email</option>
            </select>

            {/* Twenty CRM View Mode Toggle */}
            <div className="flex items-center bg-[#080d18] border border-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setCrmViewMode('KANBAN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  crmViewMode === 'KANBAN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visual Kanban Pipeline Board"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline Board</span>
              </button>
              <button
                onClick={() => setCrmViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  crmViewMode === 'TABLE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Traditional Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: Twenty CRM Visual Kanban Board */}
        {crmViewMode === 'KANBAN' ? (
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="flex gap-4 min-w-[1400px] items-start">
              {CRM_STAGES.map((col) => {
                const colLeads = filteredLeads.filter(
                  (lead) => getLeadStage(lead) === col.id
                );
                const colTotalValue = colLeads.reduce(
                  (sum, l) => sum + (parseFloat(l.deal_value || 0) || 0),
                  0
                );
                const ColIcon = col.icon;

                return (
                  <div
                    key={col.id}
                    className={`flex-1 min-w-[280px] max-w-[340px] bg-[#0c1220] border ${col.colColor} rounded-2xl flex flex-col shadow-xl overflow-hidden`}
                  >
                    {/* Column Header */}
                    <div className={`p-3.5 border-b border-slate-800/80 ${col.headerBg} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                        <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                          <ColIcon className="w-3.5 h-3.5" />
                          {col.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {colLeads.length}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-slate-300">
                        ${colTotalValue.toLocaleString()}
                      </div>
                    </div>

                    {/* Column Card List */}
                    <div className="p-3 space-y-3 min-h-[440px] max-h-[75vh] overflow-y-auto">
                      {colLeads.length === 0 ? (
                        <div className="h-32 border-2 border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-slate-600 text-xs font-medium">
                          No deals in this stage
                        </div>
                      ) : (
                        colLeads.map((lead) => {
                          const phone = lead.contact_safety?.blocked ? null : (lead.phone || extractPhoneFallback(lead.status_reason));
                          const slug = lead.business_slug || (lead.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
                          const waUrl = getWhatsAppUrl(lead);
                          const dealVal = parseFloat(lead.deal_value || 0) || 0;
                          const retVal = parseFloat(lead.retainer_value || 0) || 0;
                          const priority = lead.priority || 'MEDIUM';
                          const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[0] : null;

                          return (
                            <div
                              key={lead.id}
                              onClick={() => setSelectedCrmLead(lead)}
                              className="bg-[#0f172a] hover:bg-[#131d33] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition shadow-sm cursor-pointer group hover:shadow-cyan-500/5 relative"
                            >
                              {/* Top Bar: Title & Rating */}
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                                  {lead.business_name}
                                </h4>
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  {lead.rating ?? '?'} ({lead.review_count ?? '?'})
                                </span>
                              </div>

                              {/* What Company Does (Category & Service) */}
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                  {lead.category || 'Local Services'}
                                </span>
                                {Array.isArray(lead.services) && lead.services.length > 0 && (
                                  <span className="text-[9px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 truncate max-w-[140px]" title={lead.services[0]}>
                                    {lead.services[0]}
                                  </span>
                                )}
                              </div>

                              {/* Exact Address & Priority */}
                              <div className="text-[11px] text-slate-400 flex items-center justify-between gap-1">
                                <span className="truncate flex items-center gap-1 text-[10px]">
                                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                                  <span className="truncate">{lead.address || lead.city || 'Local Area'}</span>
                                </span>
                                {priority === 'URGENT' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase shrink-0">Urgent</span>
                                )}
                                {priority === 'HIGH' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase shrink-0">High</span>
                                )}
                              </div>

                              {/* Verified Phone */}
                              {phone && (
                                <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{phone}</span>
                                </div>
                              )}

                              {/* Deal Financial Tag */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                                {dealVal > 0 ? (
                                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    ${dealVal.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono italic">
                                    No value set
                                  </span>
                                )}
                                {retVal > 0 && (
                                  <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    +${retVal}/mo
                                  </span>
                                )}
                              </div>

                              <LeadDemoActions lead={lead} onRefresh={fetchDashboardData} />

                              {/* Latest Note Snippet */}
                              {latestNote && (
                                <div className="text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded border border-slate-800/50 line-clamp-2">
                                  <span className="text-slate-500 font-semibold">Note: </span>
                                  {latestNote.text}
                                </div>
                              )}

                              {/* Fast Outreach & Quick Stage Advance Buttons */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 gap-1.5">
                                <div className="flex items-center gap-1">
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
                                      title="Open WhatsApp with pre-filled pitch and demo link"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {phone && (
                                    <a
                                      href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                      title="Call business phone"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>

                                {/* Quick Stage Mover [←] [CRM] [→] */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => handleQuickMoveStage(lead, -1, e)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                                    title="Move to previous stage"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCrmLead(lead);
                                    }}
                                    className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition cursor-pointer"
                                    title="Open Full CRM Profile & Notes"
                                  >
                                    CRM
                                  </button>
                                  <button
                                    onClick={(e) => handleQuickMoveStage(lead, 1, e)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                                    title="Move to next stage"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 2: Traditional Leads Table View */
          <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#080d18] border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Business & Reputation</th>
                    <th className="px-5 py-3.5">Phone & 1-Tap WhatsApp</th>
                    <th className="px-5 py-3.5">Live Prototype Demo</th>
                    <th className="px-5 py-3.5">CRM Stage & Deal Value</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Loading leads queue...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-400">No leads in the queue</p>
                            <p className="text-xs text-slate-500">Click <strong className="text-cyan-300">"Discover No-Website Leads"</strong> above to extract local businesses without websites.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const audit = (lead.audit_reports && lead.audit_reports[0]) || null;
                      const slug = lead.business_slug || (lead.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
                      const phone = lead.contact_safety?.blocked ? null : (lead.phone || extractPhoneFallback(lead.status_reason));
                      const waUrl = getWhatsAppUrl(lead);
                      const stage = getLeadStage(lead);
                      const dealVal = parseFloat(lead.deal_value || 0) || 0;

                      return (
                        <tr
                          key={lead.id}
                          className={`transition group ${
                            runningLeadId === lead.id
                              ? 'bg-cyan-950/30 border-l-4 border-l-cyan-400 shadow-inner'
                              : 'hover:bg-slate-900/50'
                          }`}
                        >
                          {/* Business & Local Reputation */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{lead.business_name}</span>
                              {runningLeadId === lead.id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  Active ({elapsedSeconds}s)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {lead.rating ?? '?'} ({lead.review_count || '45'}+ reviews)
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {lead.address || lead.city || 'Local Area'} • <strong className="text-cyan-300">{lead.category}</strong>
                              </span>
                            </div>
                            {Array.isArray(lead.services) && lead.services.length > 0 && (
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <span className="text-slate-500 font-semibold">Services:</span> {lead.services.slice(0, 3).join(' • ')}
                              </div>
                            )}
                            {lead.email && (
                              <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-1 font-mono">
                                <Mail className="w-3 h-3 text-slate-500" /> {lead.email}
                              </div>
                            )}
                          </td>

                          {/* Phone & 1-Tap WhatsApp */}
                          <td className="px-5 py-4">
                            {phone ? (
                              <div className="space-y-1.5">
                                <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>{phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition shadow-sm"
                                      title="Open WhatsApp with pre-filled pitch and demo link"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>WhatsApp Pitch</span>
                                    </a>
                                  )}
                                  <a
                                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                    title="Direct phone call dialer"
                                  >
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>Call</span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">No phone captured</span>
                            )}
                          </td>

                          {/* Live Prototype Demo */}
                          <td className="px-5 py-4"><LeadDemoActions lead={lead} onRefresh={fetchDashboardData} /></td>

                          {/* CRM Stage & Deal Value */}
                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              <select
                                value={stage}
                                onChange={(e) => handleUpdateLeadStage(lead.id, e.target.value)}
                                className="bg-[#080d18] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                {CRM_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1.5">
                                {dealVal > 0 ? (
                                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    ${dealVal.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    $0.00
                                  </span>
                                )}
                                {lead.notes && lead.notes.length > 0 && (
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                    {lead.notes.length} notes
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => setSelectedCrmLead(lead)}
                                className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                title="Open CRM Profile, Notes & Deal Value"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>CRM</span>
                              </button>

                              {audit && (
                                <button
                                  onClick={() => setSelectedLeadForReport({ lead, audit })}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
                                  title="Inspect Copy & Generated Assets"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}


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
        )}

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
                {/* Discovery Engine Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Google Maps No-Website Acquisition Scraper</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Exclusively discovers businesses that <strong>have no website</strong>, extracts their public phone numbers for WhatsApp & calling, and saves contacts for review. Demos are generated separately using the Generate demo button.
                  </p>
                </div>
                    {/* High-Demand US Search Trends & Conversion Hotspots */}
                    <div className="space-y-2 p-3 bg-gradient-to-r from-blue-950/30 via-slate-950 to-indigo-950/30 rounded-xl border border-cyan-500/30">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          🔥 High-Demand Trends & Search Hotspots (1-Click Fill):
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">Live Search Intent</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {TRENDING_OPPORTUNITIES.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setDiscoveryNiche(item.niche);
                              setDiscoveryLocation(item.location);
                            }}
                            className={`p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border text-left transition group cursor-pointer ${
                              discoveryNiche === item.niche && discoveryLocation === item.location
                                ? 'border-cyan-400 bg-cyan-950/40 shadow-sm shadow-cyan-500/20'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-white group-hover:text-cyan-300 truncate">
                                {item.niche.split(' ')[0]} • {item.state}
                              </span>
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono">
                                {item.growthTrend.split(' ')[0]}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 truncate font-mono">
                              {item.location} ({item.searchVolume})
                            </div>
                            <div className="text-[9px] text-cyan-400/80 truncate mt-0.5">
                              {item.primaryGap}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

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
                      <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                        Outreach Channel & Targeting Mode
                      </label>
                      <select
                        value={discoveryFilterMode}
                        onChange={(e) => setDiscoveryFilterMode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                      >
                        <option value="HYBRID">🌟 Hybrid 360° (Company Emails for SMTP + WhatsApp Phones) [Recommended]</option>
                        <option value="WEBSITE_REDESIGN">🚀 Website Redesign (Extract Verified Inboxes & PageSpeed Audits)</option>
                        <option value="NO_WEBSITE_ONLY">📱 Zero-Website (WhatsApp & Direct Phone Pitching Only)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                          Target Leads Batch Quota (Deep Bulk Scraping)
                        </label>
                        <span className="text-cyan-400 font-mono font-bold text-xs">{discoveryMaxLeads} Leads Target</span>
                      </div>

                      {/* Bulk Quick Presets */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[50, 100, 200, 300].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setDiscoveryMaxLeads(count)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                              discoveryMaxLeads === count
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                                : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {count} Leads
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          min="10"
                          max="500"
                          step="10"
                          value={discoveryMaxLeads}
                          onChange={(e) => setDiscoveryMaxLeads(Math.max(10, parseInt(e.target.value, 10) || 10))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                          placeholder="Or type custom limit (e.g. 150)"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          Max Crawl Target
                        </span>
                      </div>
                    </div>

                {/* 360° Omnichannel Extraction Architecture */}
                <div className="bg-slate-950/60 border border-cyan-500/20 rounded-xl p-3 space-y-2 text-[11px] text-slate-400">
                  <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 360° Omnichannel Acquisition Engine:
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Crawls Google Maps across multi-district queries on <strong className="text-white">"{discoveryNiche || 'Keyword'}"</strong>. Automatically visits websites to crawl public company inboxes (<code className="text-cyan-300 font-mono">contact@, owner@</code>) for cold email campaigns, and extracts phone numbers for WhatsApp pitching with live demo prototypes.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Multi-District Crawl
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verified Email Inboxes
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Services & Category Extraction
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> 100% Target Quota Guaranteed
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
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-slate-400">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> gosom/google-maps-scraper & Google Maps CSV Ready
                </div>
                <p className="text-[11px] leading-relaxed">
                  Directly upload raw CSV exports from <strong className="text-cyan-300">gosom/google-maps-scraper</strong>, Apify Google Places, or any Google Maps scraper. Supported columns: <code className="text-slate-300 font-mono">title, phone, website, address, category, categories, review_rating, review_count, description</code>.
                </p>
              </div>

              {/* Strict No-Website Filter Toggle */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterNoWebsiteCsv}
                  onChange={(e) => setFilterNoWebsiteCsv(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strict Filter: ONLY Import Businesses WITHOUT a Website
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Automatically skips rows that already have an active website. Extracts verified Phone, exact Address, What Company Does (Services), and Stars for genuine demo targets.
                  </div>
                </div>
              </label>

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
                {singleLeadError && <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200">{singleLeadError}</p>}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300 font-semibold mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number (WhatsApp / Calling) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 234-5678"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono focus:outline-none focus:border-emerald-400 transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Recipient Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="contact@business.com (Optional if phone is provided)"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition text-xs"
                  />
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Instant Live Prototype Engine Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Save the business first. Generate and review its demo separately before sending an invitation.
                  </p>
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
                disabled={isSavingSingleLead}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {isSavingSingleLead ? 'Saving lead…' : 'Save Lead'}
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
              {selectedLeadForReport.audit?.speed_score !== undefined && (() => {
                const spScore = Number(selectedLeadForReport.audit.speed_score) || 0;
                const techScore = Number(selectedLeadForReport.audit.technical_score || selectedLeadForReport.audit.seo_score || 0);
                const geoScore = Number(selectedLeadForReport.audit.geo_score || 0);
                const localScore = Number(selectedLeadForReport.audit.local_schema_score || selectedLeadForReport.audit.schema_score || 0);
                const compositeScore = Number(selectedLeadForReport.audit.composite_score) || Math.round((spScore + techScore + geoScore + localScore) / 4);
                const hasBottlenecks = spScore < 75 || techScore < 75 || geoScore < 70 || localScore < 70 || compositeScore < 75;

                return (
                  <div className="space-y-2.5">
                    {/* Composite Benchmark Summary Banner */}
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      hasBottlenecks
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    }`}>
                      <span className="flex items-center gap-2 font-medium">
                        <span className={`w-2 h-2 rounded-full ${hasBottlenecks ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
                        <strong>Composite Benchmark:</strong> {compositeScore}/100 Average
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        hasBottlenecks ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                      }`}>
                        {hasBottlenecks ? '⚠️ BOTTLENECKS DETECTED (QUALIFIED)' : '✅ HIGH PERFORMANCE (BENCHMARK PASSED)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">1. Google Speed</div>
                        <div className={`text-base font-bold ${spScore < 50 ? 'text-rose-400' : 'text-blue-400'}`}>
                          {spScore}/100
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">LCP: {selectedLeadForReport.audit.lcp_seconds || '3.8s'}</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">2. Technical SEO</div>
                        <div className={`text-base font-bold ${techScore < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {techScore}/100
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Indexability</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">3. AI Search (GEO)</div>
                        <div className={`text-base font-bold ${geoScore < 50 ? 'text-rose-400' : 'text-violet-400'}`}>
                          {geoScore}/100
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">AI Overviews</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">4. Local Schema</div>
                        <div className={`text-base font-bold ${localScore < 50 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {localScore}/100
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Map Pack Entity</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                Dispatched: {selectedLeadForReport.audit?.sent_at ? new Date(selectedLeadForReport.audit.sent_at).toLocaleString() : 'Pending Review'}
              </div>
              <div className="flex items-center gap-2">
                <LeadDemoActions lead={selectedLeadForReport.lead} onRefresh={fetchDashboardData} />
                <button
                  onClick={() => setSelectedLeadForReport(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
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

      {/* TWENTY CRM LEAD DETAIL DRAWER & ACTIVITY ENGINE */}
      {selectedCrmLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92dvh] my-auto flex flex-col shadow-2xl relative overflow-hidden ring-1 ring-cyan-500/20">

            {/* Drawer Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1627] flex items-center justify-between shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-lg shrink-0">
                  {selectedCrmLead.business_name?.[0]?.toUpperCase() || 'B'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedCrmLead.business_name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {selectedCrmLead.rating || '4.9'} ({selectedCrmLead.review_count || '45'}+ reviews)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCrmLead.city || 'Local Area'} • {selectedCrmLead.category} • Stage: <strong className="text-cyan-300 uppercase">{crmEditStage.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCrmLead(null)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close Profile"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Workspace Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 select-text">

              {/* Left Column (7 Cols): 1-Tap Outreach & Activity Timeline */}
              <div className="lg:col-span-7 space-y-6">

                {/* 1-Tap Fast Outreach Bar */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> Fast Client Outreach
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      Direct WhatsApp Mode
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {getWhatsAppUrl(selectedCrmLead) && (
                      <a
                        href={getWhatsAppUrl(selectedCrmLead)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>1-Tap WhatsApp Pitch</span>
                      </a>
                    )}
                    {crmEditPhone && (
                      <a
                        href={`tel:${crmEditPhone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Direct Call</span>
                      </a>
                    )}
                    <LeadDemoActions lead={selectedCrmLead} onRefresh={fetchDashboardData} />
                  </div>
                </div>

                {/* What Company Does / Services & Address Box */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> What Company Does (Demo Foundation)
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" /> {selectedCrmLead.rating || '4.9'} ({selectedCrmLead.review_count || 45} Google Reviews)
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-start gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{selectedCrmLead.address || selectedCrmLead.city || 'Local Area'}</span>
                  </div>

                  {selectedCrmLead.description && (
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      "{selectedCrmLead.description}"
                    </p>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Specialized Services Extracted:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {((Array.isArray(selectedCrmLead.services) && selectedCrmLead.services.length > 0)
                        ? selectedCrmLead.services
                        : (typeof selectedCrmLead.services === 'string' && selectedCrmLead.services.trim()
                          ? selectedCrmLead.services.split(',').map(s => s.trim()).filter(Boolean)
                          : [selectedCrmLead.category || 'Specialized Local Service', 'Verified 5-Star Craftsmanship', 'Upfront Transparent Estimates', 'Direct Priority Booking'])
                      ).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes & Activity Timeline */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> Activity Log & Meeting Notes
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedCrmLead.notes?.length || 0} Total Entries
                    </span>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2.5">
                    <textarea
                      rows={2}
                      placeholder="Log call summary, client feedback, agreed deal terms, or objections..."
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      className="w-full bg-[#080d18] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
                    />

                    {/* Quick chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-medium">Quick Tag:</span>
                      <button
                        type="button"
                        onClick={() => setNewNoteInput('📱 Sent WhatsApp pitch with live demo link. Awaiting reply.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        📱 Sent Pitch
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewNoteInput('💬 Called owner. Interested in $500 website build. Follow up on Friday.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        💬 Interested ($500)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewNoteInput('💎 Agreed to $50/mo monthly care retainer for hosting & updates.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        💎 Retainer ($50/mo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewNoteInput('❌ Owner not interested in a website at this time.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        ❌ Not Interested
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={!newNoteInput.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Note</span>
                      </button>
                    </div>
                  </form>

                  {/* Chronological Notes History */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    {(!selectedCrmLead.notes || selectedCrmLead.notes.length === 0) ? (
                      <div className="text-center py-6 text-slate-500 text-xs italic">
                        No activity notes recorded yet. Type above to log your first call or pitch!
                      </div>
                    ) : (
                      selectedCrmLead.notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-[#080d18] border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-indigo-300">{note.author || 'Moses Martin'}</span>
                            <span className="font-mono text-slate-500">
                              {new Date(note.createdAt).toLocaleDateString()} at{' '}
                              {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {note.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (5 Cols): Twenty CRM Properties & Deal Closer */}
              <div className="lg:col-span-5 space-y-5">

                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Deal & Pipeline Properties
                    </h4>
                    {crmSaveSuccess && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-fadeIn">
                        Saved ✓
                      </span>
                    )}
                  </div>

                  {/* Stage Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Pipeline Stage
                    </label>
                    <select
                      value={crmEditStage}
                      onChange={(e) => setCrmEditStage(e.target.value)}
                      className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      {CRM_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Deal Value ($) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Website Deal Value ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                        <input
                          type="number"
                          step="50"
                          value={crmEditDealValue}
                          onChange={(e) => setCrmEditDealValue(e.target.value)}
                          className="w-full bg-[#080d18] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-cyan-500 transition"
                          placeholder="500"
                        />
                      </div>
                    </div>

                    {/* Monthly Retainer ($/mo) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Monthly Retainer ($/mo)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                        <input
                          type="number"
                          step="25"
                          value={crmEditRetainerValue}
                          onChange={(e) => setCrmEditRetainerValue(e.target.value)}
                          className="w-full bg-[#080d18] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-cyan-500 transition"
                          placeholder="75"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority & Follow Up Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Priority Level
                      </label>
                      <select
                        value={crmEditPriority}
                        onChange={(e) => setCrmEditPriority(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent 🔥</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Next Follow-Up Date
                      </label>
                      <input
                        type="date"
                        value={crmEditFollowUp}
                        onChange={(e) => setCrmEditFollowUp(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  {/* Decision Maker Contact Fields */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Owner / Decision Maker Name
                      </label>
                      <input
                        type="text"
                        value={crmEditOwner}
                        onChange={(e) => setCrmEditOwner(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={crmEditPhone}
                        onChange={(e) => setCrmEditPhone(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                        placeholder="+1 (214) 555-0199"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={crmEditEmail}
                        onChange={(e) => setCrmEditEmail(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                        placeholder="owner@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Business Physical Address
                      </label>
                      <input
                        type="text"
                        value={crmEditAddress}
                        onChange={(e) => setCrmEditAddress(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        placeholder="123 Commerce St, Austin, TX"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                        Industry / Category (What They Do)
                      </label>
                      <input
                        type="text"
                        value={crmEditCategory}
                        onChange={(e) => setCrmEditCategory(e.target.value)}
                        className="w-full bg-[#080d18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        placeholder="Roofing Contractors"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleSaveCrmDrawer}
                      disabled={isSavingCrm}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-600/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSavingCrm ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to CRM...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save CRM Record</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

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
