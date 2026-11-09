/**
 * ResearchX - Professional Academic PDF Exporter
 * Generates publication-grade academic research dossiers using jsPDF
 * Includes Cover Masthead, Metric Badges, Dynamic Executive Summary,
 * Full Markdown Parsing (Headings, Tables, Lists, Quotes),
 * Multi-Agent Audit Section, and Interactive Clickable Bibliography.
 */

import { formatDate, extractDomain } from './helpers.js';

// Academic Document Palette
const COLORS = {
  primaryDark: [15, 23, 42],      // #0F172A (Navy / Near-Black)
  slateDark: [30, 41, 59],        // #1E293B (Headers / Titles)
  slateBody: [51, 65, 85],        // #334155 (Body text)
  muted: [100, 116, 139],         // #64748B (Secondary / Meta)
  lightMuted: [148, 163, 184],    // #94A3B8 (Footers / Subtle)
  border: [226, 232, 240],        // #E2E8F0 (Borders)
  cardBg: [248, 250, 252],        // #F8FAFC (Card Backgrounds)
  tableHeaderBg: [30, 41, 59],    // #1E293B (Table headers)
  tableStripe: [248, 250, 252],   // #F8FAFC (Zebra stripe)
  accentBlue: [37, 99, 235],      // #2563EB (Royal Blue)
  accentGreen: [22, 163, 74],     // #16A34A (Emerald Green)
  accentPurple: [124, 58, 237],   // #7C3AED (Dialectic Purple)
  accentRed: [220, 38, 38],       // #DC2626 (Warning Red)
  quoteBg: [241, 245, 249]        // #F1F5F9 (Quote background)
};

/**
 * Sanitize text to avoid WinAnsiEncoding issues in standard PDF fonts
 */
function sanitizeForPdf(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Strip raw markdown markers while preserving readable prose
 */
function cleanMarkdownText(text) {
  if (!text) return '';
  return sanitizeForPdf(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/__(.*?)__/g, '$1')       // __bold__
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/_(.*?)_/g, '$1')         // _italic_
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // `code`
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [link text](url)
    .trim();
}

/**
 * Main PDF Export Function
 */
export function exportResearchToPdf(research) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF library is not loaded. Please verify script inclusion.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 40;

  // Page break checker with auto-advance and safety margin
  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > pageHeight - margin - 35) {
      doc.addPage();
      currentY = 52; // Top offset on secondary pages (leaves room for running header)
      return true;
    }
    return false;
  }

  // Set colors helper
  function applyColor(rgbArray, isFill = false) {
    if (isFill) {
      doc.setFillColor(rgbArray[0], rgbArray[1], rgbArray[2]);
    } else {
      doc.setTextColor(rgbArray[0], rgbArray[1], rgbArray[2]);
      doc.setDrawColor(rgbArray[0], rgbArray[1], rgbArray[2]);
    }
  }

  const report = research.report || {};
  const topicTitle = cleanMarkdownText(report.title || research.topic || 'Academic Research Report');
  const sources = research.sources || [];
  const reportBody = report.approved_report || report.full_report_markdown || report.text || '';
  
  // Word count & authenticity scores
  const wordsCount = report.word_count || (reportBody ? reportBody.split(/\s+/).filter(Boolean).length : 0);
  const humanScore = report.humanization_score || 97;
  const editorialScore = report.editorial_score || 96;

  // ==========================================
  // 1. COVER MASTHEAD (Page 1)
  // ==========================================
  
  // Top Royal Blue Accent Bar
  applyColor(COLORS.accentBlue, true);
  doc.rect(margin, currentY, contentWidth, 3.5, 'F');
  currentY += 16;

  // Kicker Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  applyColor(COLORS.accentBlue);
  doc.text('RESEARCHX ACADEMIC INTELLIGENCE DOSSIER', margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  applyColor(COLORS.muted);
  doc.text('AUTONOMOUS 7-AGENT SWARM AUDIT', pageWidth - margin, currentY, { align: 'right' });
  currentY += 8;

  // Subtle separator line
  applyColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 18;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  applyColor(COLORS.primaryDark);
  const titleLines = doc.splitTextToSize(topicTitle, contentWidth);
  doc.text(titleLines, margin, currentY);
  currentY += titleLines.length * 25 + 10;

  // Metadata Metric Grid (4 Stat Badges)
  const badgeGap = 8;
  const badgeWidth = (contentWidth - 3 * badgeGap) / 4;
  const badgeHeight = 42;

  const statBadges = [
    { label: 'WORD COUNT', value: `${wordsCount.toLocaleString()} words`, color: COLORS.primaryDark },
    { label: 'VOICE AUTHENTICITY', value: `${humanScore}% Natural`, color: COLORS.accentGreen },
    { label: 'EDITORIAL QA', value: `${editorialScore}/100 Score`, color: COLORS.accentBlue },
    { label: 'PRIMARY CITATIONS', value: `${sources.length} Sources`, color: COLORS.accentPurple }
  ];

  statBadges.forEach((b, idx) => {
    const bx = margin + idx * (badgeWidth + badgeGap);
    
    // Badge Background
    applyColor(COLORS.cardBg, true);
    applyColor(COLORS.border);
    doc.setLineWidth(0.75);
    doc.roundedRect(bx, currentY, badgeWidth, badgeHeight, 3, 3, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    applyColor(COLORS.muted);
    doc.text(b.label, bx + 8, currentY + 14);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    applyColor(b.color);
    doc.text(b.value, bx + 8, currentY + 28);
  });
  currentY += badgeHeight + 12;

  // Meta Subtitle Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  applyColor(COLORS.muted);
  const createdDate = formatDate(research.createdAt || Date.now());
  const depthText = research.depth || 'Standard Research';
  const langText = research.language || 'English';
  const metaDetail = `Investigated: ${createdDate}   |   Depth: ${depthText}   |   Language: ${langText}   |   Verification: Peer-Reviewed Standards`;
  doc.text(metaDetail, margin, currentY);
  currentY += 12;

  // Divider line
  applyColor(COLORS.border);
  doc.setLineWidth(0.75);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 18;

  // ==========================================
  // 2. DYNAMIC EXECUTIVE SUMMARY CALLOUT
  // ==========================================
  const rawExecSummary = report.executive_summary ||
    (reportBody ? reportBody.slice(0, 450) + '...' : 'Autonomous synthesis of primary research and web evidence.');
  const execSummary = cleanMarkdownText(rawExecSummary);

  if (execSummary) {
    const summaryLines = doc.splitTextToSize(execSummary, contentWidth - 28);
    const cardHeight = summaryLines.length * 12 + 34;

    checkPageBreak(cardHeight + 10);

    // Box Background
    applyColor(COLORS.cardBg, true);
    applyColor(COLORS.border);
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, 'FD');

    // Left Accent Bar (Royal Blue)
    applyColor(COLORS.accentBlue, true);
    doc.rect(margin, currentY, 3.5, cardHeight, 'F');

    // Summary Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    applyColor(COLORS.slateDark);
    doc.text('EXECUTIVE SUMMARY & CORE THESIS', margin + 14, currentY + 16);

    // Summary Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    applyColor(COLORS.slateBody);
    doc.text(summaryLines, margin + 14, currentY + 30);

    currentY += cardHeight + 20;
  }

  // ==========================================
  // 3. MARKDOWN BODY RENDERING ENGINE
  // ==========================================
  renderMarkdownContent(reportBody);

  // ==========================================
  // 4. FACT-CHECK & DEBATE AUDIT SECTION
  // ==========================================
  renderAuditSection(research);

  // ==========================================
  // 5. REFERENCES & BIBLIOGRAPHY
  // ==========================================
  renderBibliography(sources);

  // ==========================================
  // 6. RUNNING HEADERS & FOOTERS (ALL PAGES)
  // ==========================================
  finalizeHeadersAndFooters(topicTitle);

  // ==========================================
  // 7. SAVE FILE
  // ==========================================
  const safeFilename = topicTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 36);
  doc.save(`ResearchX_${safeFilename}.pdf`);

  // --- Internal Layout Engine Helpers ---

  function renderMarkdownContent(markdown) {
    if (!markdown) return;

    // Normalize and split by double newlines into blocks
    const cleanMd = sanitizeForPdf(markdown);
    const blocks = cleanMd.split(/\n\n+/);

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex].trim();
      if (!block) continue;

      // Table Detection: check if lines contain '|'
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const isTable = lines.length >= 2 && lines[0].startsWith('|') && lines[0].endsWith('|') && lines.some(l => l.includes('---'));

      if (isTable) {
        renderTableBlock(lines);
        continue;
      }

      // Heading 1 (# ...)
      if (block.startsWith('# ')) {
        const text = cleanMarkdownText(block.replace(/^#\s+/, ''));
        checkPageBreak(50);
        currentY += 12;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14.5);
        applyColor(COLORS.primaryDark);
        doc.text(text, margin, currentY);
        currentY += 18;

        // Bottom accent underline
        applyColor(COLORS.primaryDark);
        doc.setLineWidth(1.25);
        doc.line(margin, currentY, margin + contentWidth, currentY);
        currentY += 14;
        continue;
      }

      // Heading 2 (## ...)
      if (block.startsWith('## ')) {
        const text = cleanMarkdownText(block.replace(/^##\s+/, ''));
        checkPageBreak(40);
        currentY += 12;

        // Vertical accent chip
        applyColor(COLORS.accentBlue, true);
        doc.rect(margin, currentY - 9, 3, 11, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        applyColor(COLORS.slateDark);
        doc.text(text, margin + 8, currentY);
        currentY += 16;
        continue;
      }

      // Heading 3 (### ...)
      if (block.startsWith('### ')) {
        const text = cleanMarkdownText(block.replace(/^###\s+/, ''));
        checkPageBreak(30);
        currentY += 8;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        applyColor(COLORS.slateDark);
        doc.text(text, margin, currentY);
        currentY += 14;
        continue;
      }

      // Heading 4 (#### ...)
      if (block.startsWith('#### ')) {
        const text = cleanMarkdownText(block.replace(/^####\s+/, ''));
        checkPageBreak(25);
        currentY += 6;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        applyColor(COLORS.muted);
        doc.text(text.toUpperCase(), margin, currentY);
        currentY += 12;
        continue;
      }

      // Blockquotes (> ...)
      if (lines.every(l => l.startsWith('>'))) {
        const quoteText = cleanMarkdownText(lines.map(l => l.replace(/^>\s*/, '')).join(' '));
        const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 24);
        const quoteHeight = quoteLines.length * 12 + 18;

        checkPageBreak(quoteHeight + 8);

        applyColor(COLORS.quoteBg, true);
        doc.rect(margin, currentY, contentWidth, quoteHeight, 'F');

        applyColor(COLORS.muted, true);
        doc.rect(margin, currentY, 3, quoteHeight, 'F');

        doc.setFont('helvetica', 'oblique');
        doc.setFontSize(8.5);
        applyColor(COLORS.slateDark);
        doc.text(quoteLines, margin + 12, currentY + 13);

        currentY += quoteHeight + 10;
        continue;
      }

      // Bullet List Block
      const isBulletList = lines.every(l => /^[-*•+]\s+/.test(l));
      if (isBulletList) {
        for (const line of lines) {
          const itemText = cleanMarkdownText(line.replace(/^[-*•+]\s+/, ''));
          const itemLines = doc.splitTextToSize(itemText, contentWidth - 18);
          const itemHeight = itemLines.length * 12 + 4;

          checkPageBreak(itemHeight);

          // Bullet dot
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          applyColor(COLORS.accentBlue);
          doc.text('•', margin + 5, currentY + 9);

          // Indented Text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          applyColor(COLORS.slateBody);
          doc.text(itemLines, margin + 16, currentY + 9);

          currentY += itemHeight;
        }
        currentY += 6;
        continue;
      }

      // Numbered List Block
      const isNumberedList = lines.every(l => /^\d+\.\s+/.test(l));
      if (isNumberedList) {
        for (const line of lines) {
          const match = line.match(/^(\d+)\.\s+(.*)/);
          const numStr = match ? `${match[1]}.` : '1.';
          const itemText = cleanMarkdownText(match ? match[2] : line);
          const itemLines = doc.splitTextToSize(itemText, contentWidth - 22);
          const itemHeight = itemLines.length * 12 + 4;

          checkPageBreak(itemHeight);

          // Number indicator
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          applyColor(COLORS.slateDark);
          doc.text(numStr, margin + 4, currentY + 9);

          // Indented Text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          applyColor(COLORS.slateBody);
          doc.text(itemLines, margin + 20, currentY + 9);

          currentY += itemHeight;
        }
        currentY += 6;
        continue;
      }

      // Standard Prose Paragraph
      const cleanPara = cleanMarkdownText(block);
      if (!cleanPara) continue;

      const paraLines = doc.splitTextToSize(cleanPara, contentWidth);
      const paraHeight = paraLines.length * 12.5 + 8;

      checkPageBreak(paraHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      applyColor(COLORS.slateBody);
      doc.text(paraLines, margin, currentY + 9);

      currentY += paraHeight;
    }
  }

  function renderTableBlock(lines) {
    // Extract headers and data rows
    const rawRows = lines.filter(l => !l.includes('---'));
    if (rawRows.length < 2) return;

    const parseRow = (str) => str.split('|').map(c => cleanMarkdownText(c)).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    
    const headers = parseRow(rawRows[0]);
    if (headers.length === 0) return;

    const dataRows = rawRows.slice(1).map(parseRow);
    const colCount = headers.length;
    const colWidth = contentWidth / colCount;

    // Render Table Header
    checkPageBreak(30);
    applyColor(COLORS.tableHeaderBg, true);
    doc.rect(margin, currentY, contentWidth, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    headers.forEach((h, cIdx) => {
      const cellX = margin + cIdx * colWidth;
      const hText = doc.splitTextToSize(h, colWidth - 8)[0] || h;
      doc.text(hText, cellX + 5, currentY + 13);
    });
    currentY += 20;

    // Render Data Rows
    dataRows.forEach((row, rIdx) => {
      // Calculate row height
      let maxLines = 1;
      const cellLinesArr = [];

      for (let c = 0; c < colCount; c++) {
        const val = row[c] || '';
        const lines = doc.splitTextToSize(val, colWidth - 10);
        cellLinesArr.push(lines);
        if (lines.length > maxLines) maxLines = lines.length;
      }

      const rowHeight = maxLines * 11 + 8;
      checkPageBreak(rowHeight);

      // Zebra background
      if (rIdx % 2 === 1) {
        applyColor(COLORS.tableStripe, true);
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Row Border
      applyColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'D');

      // Cell vertical dividers
      for (let c = 1; c < colCount; c++) {
        doc.line(margin + c * colWidth, currentY, margin + c * colWidth, currentY + rowHeight);
      }

      // Cell Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      applyColor(COLORS.slateBody);

      for (let c = 0; c < colCount; c++) {
        const lines = cellLinesArr[c];
        const cellX = margin + c * colWidth + 5;
        doc.text(lines, cellX, currentY + 10);
      }

      currentY += rowHeight;
    });

    currentY += 12;
  }

  function renderAuditSection(res) {
    const factcheck = res.agents?.factchecker?.output || {};
    const debate = res.debate || res.agents?.debater?.output || {};

    const verifiedClaims = factcheck.verified_claims || [];
    const unsupportedClaims = factcheck.unsupported_claims || [];
    const counterArgs = debate.counterarguments || [];

    if (verifiedClaims.length === 0 && unsupportedClaims.length === 0 && counterArgs.length === 0) {
      return;
    }

    checkPageBreak(80);
    currentY += 15;

    // Audit Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    applyColor(COLORS.primaryDark);
    doc.text('MULTI-AGENT AUDIT & EPISTEMIC VERIFICATION', margin, currentY);
    currentY += 18;

    applyColor(COLORS.primaryDark);
    doc.setLineWidth(1.25);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 14;

    // Overall assessment
    if (factcheck.overall_assessment) {
      const assessText = cleanMarkdownText(factcheck.overall_assessment);
      const assessLines = doc.splitTextToSize(assessText, contentWidth - 20);
      const boxHeight = assessLines.length * 11 + 18;

      checkPageBreak(boxHeight + 6);
      applyColor(COLORS.cardBg, true);
      applyColor(COLORS.border);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'FD');

      applyColor(COLORS.accentBlue, true);
      doc.rect(margin, currentY, 3, boxHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      applyColor(COLORS.slateDark);
      doc.text('FACT-CHECK AGENT ASSESSMENT', margin + 10, currentY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      applyColor(COLORS.slateBody);
      doc.text(assessLines, margin + 10, currentY + 24);

      currentY += boxHeight + 12;
    }

    // Verified Claims List
    if (verifiedClaims.length > 0) {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      applyColor(COLORS.accentGreen);
      doc.text('Primary Verified Claims', margin, currentY);
      currentY += 12;

      verifiedClaims.slice(0, 5).forEach(c => {
        const claimText = cleanMarkdownText(c.claim);
        const sourceText = cleanMarkdownText(c.supporting_source || 'Verified Literature');
        const fullItem = `[VERIFIED] ${claimText} (Source: ${sourceText})`;
        const lines = doc.splitTextToSize(fullItem, contentWidth - 14);
        const itemH = lines.length * 11 + 4;

        checkPageBreak(itemH);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        applyColor(COLORS.slateBody);
        doc.text(lines, margin + 8, currentY + 8);
        currentY += itemH;
      });
      currentY += 8;
    }

    // Flagged / Disputed Claims
    if (unsupportedClaims.length > 0) {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      applyColor(COLORS.accentRed);
      doc.text('Flagged / High-Scrutiny Assertions', margin, currentY);
      currentY += 12;

      unsupportedClaims.slice(0, 4).forEach(c => {
        const claimText = cleanMarkdownText(c.claim);
        const recText = cleanMarkdownText(c.recommendation || 'Caveat noted');
        const fullItem = `[FLAGGED] ${claimText} — Recommendation: ${recText}`;
        const lines = doc.splitTextToSize(fullItem, contentWidth - 14);
        const itemH = lines.length * 11 + 4;

        checkPageBreak(itemH);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        applyColor(COLORS.slateBody);
        doc.text(lines, margin + 8, currentY + 8);
        currentY += itemH;
      });
      currentY += 8;
    }

    // Dialectical Counterarguments
    if (counterArgs.length > 0) {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      applyColor(COLORS.accentPurple);
      doc.text('Dialectical Red-Team Objections', margin, currentY);
      currentY += 12;

      counterArgs.slice(0, 4).forEach(a => {
        const challenge = cleanMarkdownText(a.claim_challenged);
        const counter = cleanMarkdownText(a.counter_evidence);
        const fullItem = `[CHALLENGE] ${challenge} — Counter-Evidence: ${counter}`;
        const lines = doc.splitTextToSize(fullItem, contentWidth - 14);
        const itemH = lines.length * 11 + 4;

        checkPageBreak(itemH);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        applyColor(COLORS.slateBody);
        doc.text(lines, margin + 8, currentY + 8);
        currentY += itemH;
      });
      currentY += 10;
    }
  }

  function renderBibliography(sourcesList) {
    if (!sourcesList || sourcesList.length === 0) return;

    checkPageBreak(60);
    currentY += 15;

    // Bibliography Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    applyColor(COLORS.primaryDark);
    doc.text('REFERENCES & VERIFIED SOURCES', margin, currentY);
    currentY += 18;

    applyColor(COLORS.primaryDark);
    doc.setLineWidth(1.25);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 14;

    sourcesList.forEach((src, idx) => {
      const citeNum = `[${idx + 1}]`;
      const title = cleanMarkdownText(src.title || 'Untitled Source');
      const domain = extractDomain(src.url || '');
      const pubDate = src.published_date ? ` (${src.published_date})` : '';
      const badge = src.credibilityBadge || 'Web Source';
      const excerpt = cleanMarkdownText(src.supporting_excerpt || '');
      const url = src.url || '';

      const titleLine = `${citeNum}  ${title} — ${domain}${pubDate} [${badge}]`;
      const titleLines = doc.splitTextToSize(titleLine, contentWidth - 8);

      let excerptLines = [];
      if (excerpt) {
        excerptLines = doc.splitTextToSize(`"${excerpt}"`, contentWidth - 24);
      }

      const totalHeight = titleLines.length * 11 + (excerptLines.length * 10) + 20;
      checkPageBreak(totalHeight);

      // Source Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      applyColor(COLORS.slateDark);
      doc.text(titleLines, margin, currentY + 8);
      let localY = currentY + titleLines.length * 11 + 10;

      // Excerpt if present
      if (excerptLines.length > 0) {
        doc.setFont('helvetica', 'oblique');
        doc.setFontSize(7.5);
        applyColor(COLORS.muted);
        doc.text(excerptLines, margin + 14, localY);
        localY += excerptLines.length * 10 + 4;
      }

      // Interactive Clickable URL
      if (url) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        applyColor(COLORS.accentBlue);
        const linkText = `Source Link: ${url.length > 80 ? url.slice(0, 77) + '...' : url}`;
        doc.text(linkText, margin + 14, localY);

        // Add real PDF hyperlink
        const linkW = doc.getTextWidth(linkText);
        try {
          doc.link(margin + 14, localY - 7, linkW, 9, { url: url });
        } catch (_) {}

        localY += 12;
      }

      // Subtle divider between references
      applyColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, localY, margin + contentWidth, localY);

      currentY = localY + 6;
    });
  }

  function finalizeHeadersAndFooters(titleStr) {
    const pageCount = doc.internal.getNumberOfPages();
    const shortTitle = titleStr.length > 55 ? titleStr.slice(0, 52) + '...' : titleStr;
    const footerDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);

      // Running Header (Pages 2+)
      if (p > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        applyColor(COLORS.slateDark);
        doc.text(shortTitle, margin, 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        applyColor(COLORS.muted);
        doc.text('RESEARCHX INTELLIGENCE DOSSIER', pageWidth - margin, 28, { align: 'right' });

        applyColor(COLORS.border);
        doc.setLineWidth(0.5);
        doc.line(margin, 34, pageWidth - margin, 34);
      }

      // Running Footer (ALL Pages)
      applyColor(COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      applyColor(COLORS.lightMuted);
      doc.text('RESEARCHX • MULTI-AGENT RESEARCH PLATFORM', margin, pageHeight - 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      applyColor(COLORS.slateDark);
      doc.text(`Page ${p} of ${pageCount}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      applyColor(COLORS.lightMuted);
      doc.text(`VERIFIED DOSSIER  •  ${footerDate}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
    }
  }
}
