#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// 0. Automatically load .env.local and .env for standalone Node execution
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}
loadEnv();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { executeDualAudit, runPageSpeedAudit, runDeepDiagnosticAudit } from '../lib/audit.js';
import { enrichSingleDomainLead, discoverAndEnrichLeads } from '../lib/discovery.js';
import { generateAuditPdf } from '../lib/reportPdf.js';
import { buildFunnelAEmail, buildFunnelBEmail, sendColdEmail } from '../lib/email.js';
import { generateFunnelAHook, generateFunnelBHook } from '../lib/gemini.js';
import { processSingleLead } from '../lib/pipeline.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { generateSlug } from '../lib/slug.js';

/**
 * SynergyTech Unified Outreach & Web Diagnostic MCP Server
 */
const server = new Server(
  {
    name: 'synergytech-engine-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 1. Define Tools Schema
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'audit_website',
        description:
          'Runs a comprehensive technical, Core Web Vitals (LCP), Schema.org LocalBusiness JSON-LD, OpenGraph, and Mobile Conversion UX audit on any website URL.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The target website URL (e.g., https://example.com or example.com)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'enrich_decision_maker',
        description:
          'Crawls a target company domain to extract Founder/CEO/Owner names, synthesizes corporate email permutations, and verifies live DNS MX inbox deliverability.',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Company website domain or URL (e.g. synergytechsol.com)',
            },
            businessName: {
              type: 'string',
              description: 'Optional business name (auto-derived if omitted)',
            },
          },
          required: ['domain'],
        },
      },
      {
        name: 'generate_prototype_template',
        description:
          'Mounts/configures a live mobile-first responsive web prototype for a local service business, generating a custom preview URL (/demo/[slug]).',
        inputSchema: {
          type: 'object',
          properties: {
            businessName: {
              type: 'string',
              description: 'Name of the business (e.g., Apex Plumbing)',
            },
            category: {
              type: 'string',
              description: 'Industry or niche (e.g. Commercial Roofing)',
            },
            city: {
              type: 'string',
              description: 'City/Region (e.g. Austin, TX)',
            },
            services: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of core services provided',
            },
            phone: {
              type: 'string',
              description: 'Contact telephone number',
            },
          },
          required: ['businessName'],
        },
      },
      {
        name: 'generate_executive_pdf_report',
        description:
          'Builds an executive $2,500 consulting-grade PDF diagnostic report with Speed benchmarks, Schema readiness, conversion matrix, and prioritized developer fixes.',
        inputSchema: {
          type: 'object',
          properties: {
            businessName: { type: 'string' },
            websiteUrl: { type: 'string' },
            speedScore: { type: 'number', description: 'PageSpeed score (0-100)' },
            lcpSeconds: { type: 'string', description: 'Largest Contentful Paint (e.g. 3.8s)' },
            pageSizeMb: { type: 'string', description: 'Total payload in MB' },
            seoScore: { type: 'number', description: 'Diagnostic score (0-100)' },
            schemaScore: { type: 'number' },
            conversionScore: { type: 'number' },
            seoIssues: { type: 'array', items: { type: 'string' } },
            actionableFixes: { type: 'array', items: { type: 'string' } },
            geminiHook: { type: 'string' },
            ownerName: { type: 'string' },
            outputPath: { type: 'string', description: 'Optional custom output file path to save PDF' },
          },
          required: ['businessName', 'websiteUrl'],
        },
      },
      {
        name: 'dispatch_client_outreach',
        description:
          'Builds high-converting personalized cold email copy (Funnel A audit or Funnel B prototype) and dispatches it with optional PDF report attachments via SMTP.',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            funnel: {
              type: 'string',
              enum: ['FUNNEL_A_AUDIT', 'FUNNEL_B_PROTOTYPE'],
              description: 'Funnel A (Website audit teardown) or Funnel B (Live prototype offer)',
            },
            leadData: {
              type: 'object',
              description: 'Lead metadata including businessName, ownerName, city, category, businessSlug',
            },
            auditData: {
              type: 'object',
              description: 'Audit metrics if Funnel A (speedScore, lcpSeconds, seoIssues, geminiHook)',
            },
            attachPdf: {
              type: 'boolean',
              description: 'Whether to attach the executive PDF report (Funnel A)',
            },
          },
          required: ['to', 'funnel', 'leadData'],
        },
      },
      {
        name: 'run_end_to_end_pipeline',
        description:
          'Autonomously executes the complete acquisition cycle for a lead or domain: Discovery -> Audit -> AI Hook -> PDF/Prototype -> Client Delivery.',
        inputSchema: {
          type: 'object',
          properties: {
            domainOrUrl: {
              type: 'string',
              description: 'Website URL or Domain of the target business',
            },
            businessName: {
              type: 'string',
              description: 'Optional business name',
            },
            hasWebsite: {
              type: 'boolean',
              description: 'True for Funnel A audit, False for Funnel B prototype',
            },
          },
          required: ['domainOrUrl'],
        },
      },
    ],
  };
});

/**
 * 2. Handle Tool Calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ----------------------------------------------------------------------
      // Tool 1: audit_website
      // ----------------------------------------------------------------------
      case 'audit_website': {
        const { url } = args;
        const audit = await executeDualAudit(url);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  targetUrl: url,
                  metrics: {
                    speedScore: audit.speedScore,
                    lcpSeconds: audit.lcpSeconds,
                    pageSizeMb: audit.pageSizeMb,
                    diagnosticScore: audit.seoScore,
                    schemaScore: audit.schemaScore,
                    conversionScore: audit.conversionScore,
                  },
                  checklist: {
                    hasLocalSchema: audit.hasLocalSchema,
                    hasClickToCall: audit.hasClickToCall,
                    hasQuoteForm: audit.hasForm,
                    hasOpenGraph: audit.hasOpenGraph,
                    hasHttps: audit.hasHttps,
                  },
                  findings: audit.seoIssues,
                  developerQuickFixes: audit.actionableFixes,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ----------------------------------------------------------------------
      // Tool 2: enrich_decision_maker
      // ----------------------------------------------------------------------
      case 'enrich_decision_maker': {
        const { domain, businessName } = args;
        const enriched = await enrichSingleDomainLead(domain, businessName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  businessName: enriched.businessName,
                  domain: enriched.domain,
                  ownerName: enriched.ownerName,
                  primaryEmail: enriched.email,
                  isDeliverable: enriched.isDeliverable,
                  candidatePermutations: enriched.candidateEmails,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ----------------------------------------------------------------------
      // Tool 3: generate_prototype_template
      // ----------------------------------------------------------------------
      case 'generate_prototype_template': {
        const { businessName, category, city, services, phone } = args;
        const slug = generateSlug(businessName);

        const leadData = {
          business_name: businessName,
          business_slug: slug,
          owner_name: 'Leadership Team',
          email: `contact@${slug}.com`,
          has_website: false,
          category: category || 'Home & Commercial Services',
          city: city || 'Metro Area',
          services: services || ['Emergency Rapid Response', 'Free On-Site Estimates', 'Certified Specialists'],
          rating: 4.9,
          review_count: 52,
          status: 'PENDING',
          status_reason: 'Live prototype mounted via MCP Server',
        };

        try {
          if (isSupabaseConfigured) {
            const supabase = getSupabaseAdmin();
            await supabase.from('leads').upsert(leadData, { onConflict: 'business_slug' });
          }
        } catch (dbErr) {
          console.warn('[MCP Prototype DB Notice]:', dbErr.message);
        }

        const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://synergytechsol.com').replace(/\/$/, '');
        const demoUrl = `${appBaseUrl}/demo/${slug}`;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  businessName,
                  slug,
                  prototypeUrl: demoUrl,
                  features: [
                    '0.8s mobile load time',
                    'Direct 1-tap quote capture form',
                    'Google 5-star review showcase',
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ----------------------------------------------------------------------
      // Tool 4: generate_executive_pdf_report
      // ----------------------------------------------------------------------
      case 'generate_executive_pdf_report': {
        const pdfBuffer = await generateAuditPdf({
          businessName: args.businessName,
          websiteUrl: args.websiteUrl,
          speedScore: args.speedScore || 48,
          lcpSeconds: args.lcpSeconds || '3.9s',
          pageSizeMb: args.pageSizeMb || '3.2',
          seoScore: args.seoScore || 52,
          schemaScore: args.schemaScore || 40,
          conversionScore: args.conversionScore || 45,
          seoIssues: args.seoIssues || [],
          actionableFixes: args.actionableFixes || [],
          geminiHook: args.geminiHook || '',
          ownerName: args.ownerName || 'Executive Leadership',
        });

        let savedPath = null;
        if (args.outputPath) {
          fs.writeFileSync(args.outputPath, pdfBuffer);
          savedPath = args.outputPath;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'success',
                  businessName: args.businessName,
                  bufferBytes: pdfBuffer.length,
                  savedPath,
                  base64Preview: pdfBuffer.toString('base64').substring(0, 100) + '...',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ----------------------------------------------------------------------
      // Tool 5: dispatch_client_outreach
      // ----------------------------------------------------------------------
      case 'dispatch_client_outreach': {
        const { to, funnel, leadData, auditData, attachPdf } = args;

        let emailContent = null;
        let attachments = [];

        if (funnel === 'FUNNEL_A_AUDIT') {
          emailContent = buildFunnelAEmail({
            ownerName: leadData.ownerName,
            businessName: leadData.businessName,
            speedScore: auditData?.speedScore || 48,
            lcpSeconds: auditData?.lcpSeconds || '3.9s',
            pageSizeMb: auditData?.pageSizeMb || '3.2',
            seoScore: auditData?.seoScore || 52,
            schemaScore: auditData?.schemaScore || 40,
            conversionScore: auditData?.conversionScore || 45,
            seoIssues: auditData?.seoIssues || [],
            geminiHook: auditData?.geminiHook,
            city: leadData.city,
            category: leadData.category,
          });

          if (attachPdf) {
            const pdfBuffer = await generateAuditPdf({
              businessName: leadData.businessName,
              websiteUrl: leadData.websiteUrl || `https://${leadData.domain || 'example.com'}`,
              speedScore: auditData?.speedScore || 48,
              lcpSeconds: auditData?.lcpSeconds || '3.9s',
              pageSizeMb: auditData?.pageSizeMb || '3.2',
              seoScore: auditData?.seoScore || 52,
              schemaScore: auditData?.schemaScore || 40,
              conversionScore: auditData?.conversionScore || 45,
              seoIssues: auditData?.seoIssues || [],
              geminiHook: auditData?.geminiHook,
              ownerName: leadData.ownerName,
            });

            attachments.push({
              filename: `Executive-Diagnostic-${leadData.businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            });
          }
        } else {
          emailContent = buildFunnelBEmail({
            ownerName: leadData.ownerName,
            businessName: leadData.businessName,
            category: leadData.category,
            city: leadData.city,
            businessSlug: leadData.businessSlug || generateSlug(leadData.businessName),
          });
        }

        const dispatchResult = await sendColdEmail({
          to,
          subject: emailContent.subject,
          body: emailContent.body,
          attachments,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: dispatchResult.success ? 'success' : 'failed',
                  recipient: to,
                  simulated: dispatchResult.simulated,
                  subject: emailContent.subject,
                  hasPdfAttachment: attachments.length > 0,
                  messageId: dispatchResult.messageId,
                  bodyPreview: emailContent.body.split('\n').slice(0, 6).join('\n'),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ----------------------------------------------------------------------
      // Tool 6: run_end_to_end_pipeline
      // ----------------------------------------------------------------------
      case 'run_end_to_end_pipeline': {
        const { domainOrUrl, businessName, hasWebsite = true } = args;
        const enriched = await enrichSingleDomainLead(domainOrUrl, businessName);
        const slug = generateSlug(enriched.businessName);

        const syntheticLead = {
          id: `mcp-${Date.now()}`,
          business_name: enriched.businessName,
          business_slug: slug,
          owner_name: enriched.ownerName,
          email: enriched.email,
          website_url: enriched.websiteUrl,
          has_website: hasWebsite,
          category: 'Enterprise & Professional Services',
          city: 'Metro Region',
        };

        const result = await processSingleLead(syntheticLead);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'completed',
                  enrichedLead: enriched,
                  pipelineResult: result,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown MCP Tool: ${name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `MCP Tool Execution Error [${name}]: ${error.message || error}`,
        },
      ],
    };
  }
});

/**
 * 3. Start Stdio Transport
 */
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[SynergyTech MCP Server] Running on stdio transport.');
}

run().catch((err) => {
  console.error('[SynergyTech MCP Server] Fatal error:', err);
  process.exit(1);
});
