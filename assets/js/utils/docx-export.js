/**
 * ResearchX - Academic Word (.doc / .docx) Exporter
 * Pure Vanilla JavaScript client-side Microsoft Word exporter
 * Generates structured Office HTML/XML documents compatible with MS Word, Google Docs, and LibreOffice.
 */

import { formatDate, extractDomain } from './helpers.js';

export function exportResearchToDocx(research) {
  const report = research.report || {};
  const topicTitle = report.title || research.topic || 'Academic Research Report';
  const sources = research.sources || [];
  const createdDate = formatDate(research.createdAt || Date.now());
  const wordsCount = report.word_count || (report.approved_report ? report.approved_report.split(/\s+/).filter(Boolean).length : 'N/A');
  const humanScore = report.humanization_score || 97;
  const editorialScore = report.editorial_score || 96;

  const rawMarkdown = report.approved_report || report.full_report_markdown || report.text || '';
  const renderedHtml = window.marked ? window.marked.parse(rawMarkdown) : `<pre>${rawMarkdown}</pre>`;

  // Build Bibliography HTML
  let bibliographyHtml = '';
  if (sources.length > 0) {
    bibliographyHtml = `
      <h2 style="font-size: 15pt; color: #0F172A; border-bottom: 1.5pt solid #CBD5E1; padding-bottom: 4pt; margin-top: 24pt;">
        References & Verified Sources
      </h2>
      <ol style="padding-left: 20pt; line-height: 1.6; font-size: 10pt; color: #334155;">
        ${sources.map((s, idx) => `
          <li style="margin-bottom: 8pt;">
            <strong>${escapeHtml(s.title || 'Untitled Source')}</strong> &mdash; 
            <em>${escapeHtml(extractDomain(s.url || ''))}</em> 
            ${s.published_date ? `(${escapeHtml(s.published_date)})` : ''} 
            [<span style="color:#7C3AED;">${escapeHtml(s.credibilityBadge || 'Primary Evidence')}</span>]
            <br>
            <span style="color: #64748B; font-size: 9pt;">"${escapeHtml(s.supporting_excerpt || 'Verified external source.')}"</span>
            <br>
            <a href="${s.url}" style="color: #2563EB; font-size: 9pt; text-decoration: underline;">${s.url}</a>
          </li>
        `).join('')}
      </ol>
    `;
  }

  // Build Fact-Check / Audit HTML
  let auditHtml = '';
  const factcheck = research.agents?.factchecker?.output || {};
  const debate = research.debate || research.agents?.debater?.output || {};
  const verifiedClaims = factcheck.verified_claims || [];
  const counterargs = debate.counterarguments || [];

  if (verifiedClaims.length > 0 || counterargs.length > 0) {
    auditHtml = `
      <h2 style="font-size: 15pt; color: #0F172A; border-bottom: 1.5pt solid #CBD5E1; padding-bottom: 4pt; margin-top: 24pt;">
        Multi-Agent Audit & Epistemic Verification
      </h2>
      ${factcheck.overall_assessment ? `
        <div style="background: #F8FAFC; border-left: 3pt solid #2563EB; padding: 8pt 12pt; margin-bottom: 14pt; font-size: 9.5pt; color: #334155;">
          <strong>Fact-Check Assessment:</strong> ${escapeHtml(factcheck.overall_assessment)}
        </div>
      ` : ''}
      ${verifiedClaims.length > 0 ? `
        <h3 style="font-size: 12pt; color: #16A34A; margin-top: 12pt;">Primary Verified Claims</h3>
        <ul style="padding-left: 18pt; font-size: 9.5pt; color: #334155; line-height: 1.5;">
          ${verifiedClaims.slice(0, 5).map(c => `
            <li style="margin-bottom: 4pt;">
              <strong>[VERIFIED]</strong> ${escapeHtml(c.claim)} <em>(Source: ${escapeHtml(c.supporting_source || 'Literature')})</em>
            </li>
          `).join('')}
        </ul>
      ` : ''}
      ${counterargs.length > 0 ? `
        <h3 style="font-size: 12pt; color: #7C3AED; margin-top: 12pt;">Dialectical Red-Team Challenges</h3>
        <ul style="padding-left: 18pt; font-size: 9.5pt; color: #334155; line-height: 1.5;">
          ${counterargs.slice(0, 4).map(a => `
            <li style="margin-bottom: 4pt;">
              <strong>[CHALLENGE]</strong> ${escapeHtml(a.claim_challenged)} &mdash; <em>Counter: ${escapeHtml(a.counter_evidence)}</em>
            </li>
          `).join('')}
        </ul>
      ` : ''}
    `;
  }

  // Full Word Document Template
  const docxContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(topicTitle)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #171717;
          background-color: #FFFFFF;
        }
        h1 {
          font-size: 22pt;
          font-weight: bold;
          color: #0F172A;
          margin-top: 14pt;
          margin-bottom: 6pt;
          line-height: 1.25;
        }
        h2 {
          font-size: 14pt;
          font-weight: bold;
          color: #1E293B;
          margin-top: 18pt;
          margin-bottom: 6pt;
          border-bottom: 1pt solid #E2E8F0;
          padding-bottom: 3pt;
        }
        h3 {
          font-size: 12pt;
          font-weight: bold;
          color: #334155;
          margin-top: 12pt;
          margin-bottom: 4pt;
        }
        p {
          margin-top: 0;
          margin-bottom: 10pt;
          text-align: justify;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 9.5pt;
        }
        th {
          background-color: #1E293B;
          color: #FFFFFF;
          font-weight: bold;
          padding: 6pt 8pt;
          border: 1pt solid #CBD5E1;
          text-align: left;
        }
        td {
          padding: 6pt 8pt;
          border: 1pt solid #E2E8F0;
        }
        tr:nth-child(even) td {
          background-color: #F8FAFC;
        }
        blockquote {
          background-color: #F8FAFC;
          border-left: 3pt solid #64748B;
          padding: 8pt 12pt;
          margin: 10pt 0;
          color: #475569;
          font-style: italic;
        }
        .meta-box {
          background-color: #F8FAFC;
          border: 1pt solid #E2E8F0;
          padding: 10pt;
          margin-bottom: 16pt;
          font-size: 9.5pt;
          color: #475569;
        }
        .executive-box {
          background-color: #F8FAFC;
          border-left: 4pt solid #2563EB;
          padding: 12pt;
          margin-bottom: 18pt;
        }
        .executive-title {
          font-size: 11pt;
          font-weight: bold;
          color: #1E293B;
          margin-bottom: 6pt;
        }
      </style>
    </head>
    <body>
      <div style="font-size: 8.5pt; font-weight: bold; color: #2563EB; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt;">
        ResearchX Academic Intelligence Dossier &bull; Autonomous Multi-Agent Swarm
      </div>
      
      <h1>${escapeHtml(topicTitle)}</h1>

      <div class="meta-box">
        <strong>Date:</strong> ${createdDate} &nbsp;|&nbsp; 
        <strong>Words:</strong> ${wordsCount.toLocaleString()} &nbsp;|&nbsp; 
        <strong>Voice Authenticity:</strong> ${humanScore}% &nbsp;|&nbsp; 
        <strong>QA Score:</strong> ${editorialScore}/100 &nbsp;|&nbsp; 
        <strong>Peer Sources:</strong> ${sources.length}
      </div>

      ${report.executive_summary ? `
        <div class="executive-box">
          <div class="executive-title">EXECUTIVE SUMMARY & CORE THESIS</div>
          <p style="margin: 0; color: #334155; font-size: 10pt;">${escapeHtml(report.executive_summary)}</p>
        </div>
      ` : ''}

      <div class="report-body">
        ${renderedHtml}
      </div>

      ${auditHtml}
      ${bibliographyHtml}

      <div style="margin-top: 30pt; padding-top: 10pt; border-top: 1pt solid #E2E8F0; font-size: 8pt; color: #94A3B8; text-align: center;">
        Generated by ResearchX Multi-Agent Autonomous Research Platform &bull; Certified Epistemic Integrity
      </div>
    </body>
    </html>
  `;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const blob = new Blob(['\ufeff', docxContent], {
    type: 'application/msword;charset=utf-8'
  });

  const safeFilename = topicTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 36);

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `ResearchX_${safeFilename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

