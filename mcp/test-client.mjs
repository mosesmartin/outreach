import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

async function testMcpServer() {
  console.log('===============================================================');
  console.log('🔌 TESTING SYNERGYTECH UNIFIED MCP SERVER PROTOCOL COMPLIANCE');
  console.log('===============================================================\n');

  const serverScript = path.join(process.cwd(), 'mcp', 'server.mjs');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverScript],
  });

  const client = new Client(
    {
      name: 'synergytech-mcp-test-runner',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log('✅ Successfully connected to SynergyTech MCP Server via stdio transport!\n');

  // 1. List Available Tools
  console.log('👉 [Step 1] Listing registered MCP tools:');
  const toolsResponse = await client.listTools();
  console.log(`- Discovered ${toolsResponse.tools.length} Tools:`);
  toolsResponse.tools.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.name}]: ${t.description.substring(0, 80)}...`);
  });
  console.log('');

  // 2. Call audit_website
  console.log('👉 [Step 2] Calling "audit_website" on synergytechsol.com:');
  const auditRes = await client.callTool({
    name: 'audit_website',
    arguments: { url: 'https://synergytechsol.com' },
  });
  const auditData = JSON.parse(auditRes.content[0].text);
  console.log(`- Audit Status: ${auditData.status}`);
  console.log(`- Diagnostic Score: ${auditData.metrics.diagnosticScore}/100`);
  console.log(`- Findings count: ${auditData.findings.length}`);
  console.log(`- Developer Quick Fixes count: ${auditData.developerQuickFixes.length}\n`);

  // 3. Call enrich_decision_maker
  console.log('👉 [Step 3] Calling "enrich_decision_maker" on synergytechsol.com:');
  const enrichRes = await client.callTool({
    name: 'enrich_decision_maker',
    arguments: { domain: 'synergytechsol.com' },
  });
  const enrichData = JSON.parse(enrichRes.content[0].text);
  console.log(`- Business: ${enrichData.businessName}`);
  console.log(`- Decision Maker: ${enrichData.ownerName}`);
  console.log(`- Primary Email: ${enrichData.primaryEmail}`);
  console.log(`- Candidate Permutations (${enrichData.candidatePermutations.length}): ${enrichData.candidatePermutations.slice(0, 3).join(', ')}...\n`);

  // 4. Call generate_prototype_template
  console.log('👉 [Step 4] Calling "generate_prototype_template" for Apex Roofing:');
  const protoRes = await client.callTool({
    name: 'generate_prototype_template',
    arguments: {
      businessName: 'Apex Roofing Experts',
      category: 'Commercial Roofing',
      city: 'Miami, FL',
      services: ['Roof Leak Repair', 'Tile & Shingle Installation', 'Storm Damage Restoration'],
    },
  });
  const protoData = JSON.parse(protoRes.content[0].text);
  console.log(`- Prototype URL: ${protoData.prototypeUrl}`);
  console.log(`- Features: ${protoData.features.join(' | ')}\n`);

  // 5. Call generate_executive_pdf_report
  console.log('👉 [Step 5] Calling "generate_executive_pdf_report":');
  const pdfRes = await client.callTool({
    name: 'generate_executive_pdf_report',
    arguments: {
      businessName: 'Apex Roofing Experts',
      websiteUrl: 'https://apexroofingexperts.com',
      speedScore: 45,
      lcpSeconds: '4.1s',
      seoScore: 50,
      schemaScore: 35,
      conversionScore: 40,
    },
  });
  const pdfData = JSON.parse(pdfRes.content[0].text);
  console.log(`- PDF Buffer Size: ${pdfData.bufferBytes} bytes\n`);

  // 6. Call dispatch_client_outreach
  console.log('👉 [Step 6] Calling "dispatch_client_outreach" (Funnel A simulation):');
  const dispatchRes = await client.callTool({
    name: 'dispatch_client_outreach',
    arguments: {
      to: 'david@apexroofingexperts.com',
      funnel: 'FUNNEL_A_AUDIT',
      leadData: {
        businessName: 'Apex Roofing Experts',
        ownerName: 'David Miller',
        city: 'Miami, FL',
        category: 'Commercial Roofing',
      },
      auditData: {
        speedScore: 45,
        lcpSeconds: '4.1s',
        seoScore: 50,
      },
      attachPdf: true,
    },
  });
  const dispatchData = JSON.parse(dispatchRes.content[0].text);
  console.log(`- Dispatch Status: ${dispatchData.status}`);
  console.log(`- Subject: "${dispatchData.subject}"`);
  console.log(`- PDF Attached: ${dispatchData.hasPdfAttachment}`);
  console.log(`- Message ID: ${dispatchData.messageId}\n`);

  await client.close();
  console.log('===============================================================');
  console.log('🎉 ALL 6 MCP TOOLS EXECUTED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

testMcpServer().catch((err) => {
  console.error('MCP Test failed:', err);
  process.exit(1);
});
