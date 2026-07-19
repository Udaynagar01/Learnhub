import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_SVG = path.join(__dirname, '../../assets/learnhub-logo.svg');

/** Website brand — matches Navbar (primary-600 + GraduationCap). */
const BRAND = '#4f46e5';
const NAVY = '#1a2f4a';
const GOLD = '#c9a227';
const GOLD_DARK = '#a67c00';
const GRAY = '#5c6b7a';
const CREAM = '#faf8f5';

function formatDate(date) {
  return new Date(date || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function drawWavyBackground(doc, pageW, pageH) {
  doc.save();
  doc.strokeColor('#e8e4dc').lineWidth(0.6).opacity(0.45);
  for (let i = 0; i < 10; i++) {
    const y = 36 + i * 52;
    doc.moveTo(0, y);
    for (let x = 0; x <= pageW; x += 20) {
      doc.lineTo(x, y + Math.sin(x / 55 + i) * 5);
    }
    doc.stroke();
  }
  doc.opacity(1).restore();
}

function drawDoubleBorder(doc, m, w, h) {
  doc.save();
  doc.lineWidth(2.5).strokeColor(GOLD).roundedRect(m, m, w, h, 2).stroke();
  doc.lineWidth(0.75).strokeColor(GOLD_DARK).roundedRect(m + 8, m + 8, w - 16, h - 16, 2).stroke();
  doc.restore();
}

function drawCornerAccent(doc, x, y, flipX, flipY) {
  doc.save();
  doc.translate(x, y);
  doc.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  doc.moveTo(0, 0).lineTo(72, 0).lineTo(0, 72).closePath().fill(NAVY);
  doc.moveTo(0, 0).lineTo(44, 0).lineTo(0, 44).closePath().fill(GOLD);
  doc.restore();
}

/** Same look as site: indigo cap icon + LearnHub wordmark. */
function drawWebsiteLogo(doc, cx, topY) {
  const iconX = cx - 72;
  const iconY = topY;

  doc.save();
  try {
    if (fs.existsSync(LOGO_SVG)) {
      doc.image(LOGO_SVG, iconX, iconY, { width: 44, height: 44 });
    } else {
      throw new Error('no svg');
    }
  } catch {
    doc.fillColor(BRAND);
    doc.moveTo(iconX + 22, iconY + 6).lineTo(iconX + 6, iconY + 14).lineTo(iconX + 38, iconY + 14).closePath().fill();
    doc.rect(iconX + 18, iconY + 14, 8, 12).fill(BRAND);
    doc.moveTo(iconX + 22, iconY + 28).lineTo(iconX + 14, iconY + 34).lineTo(iconX + 30, iconY + 34).closePath().fill();
  }

  doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(28);
  doc.text('LearnHub', iconX + 50, iconY + 4, { width: 160 });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10);
  doc.text('Online Learning Platform', iconX + 50, iconY + 34, { width: 200 });
  doc.restore();
}

function drawCertifiedBadge(doc, x, y) {
  doc.save();
  doc.translate(x, y);
  doc.circle(0, 0, 34).fill(GOLD);
  doc.circle(0, 0, 28).fill(BRAND);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7);
  doc.text('VERIFIED', -20, -10, { width: 40, align: 'center' });
  doc.fontSize(10).text(String(new Date().getFullYear()), -20, 2, { width: 40, align: 'center' });
  doc.restore();
}

function drawGoldDivider(doc, cx, y, w) {
  doc.save();
  doc.strokeColor(GOLD).lineWidth(1);
  doc.moveTo(cx - w / 2, y).lineTo(cx - 20, y).stroke();
  doc.moveTo(cx + 20, y).lineTo(cx + w / 2, y).stroke();
  doc.fillColor(GOLD).circle(cx, y, 3).fill();
  doc.restore();
}

function drawFooter(doc, { margin, pageW, pageH, certificateId, completedAt }) {
  // Bottom corners — above decorative corner triangles (~72px)
  const footerY = pageH - margin - 32;
  const sidePad = 32;

  doc.save();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);

  if (certificateId) {
    doc.text(`Certificate ID: ${certificateId}`, margin + sidePad, footerY, {
      lineBreak: false,
      width: 320,
      align: 'left',
    });
  }

  const dateStr = `Date: ${formatDate(completedAt)}`;
  const dateWidth = doc.widthOfString(dateStr) + 4;
  doc.text(dateStr, pageW - margin - sidePad - dateWidth, footerY, {
    lineBreak: false,
    width: dateWidth,
    align: 'left',
  });
  doc.restore();
}

/**
 * @param {{
 *   studentName: string;
 *   courseTitle: string;
 *   certificateId?: string;
 *   completedAt?: Date;
 *   instructorName?: string;
 * }} opts
 */
export function generateCertificatePDF(opts) {
  const {
    studentName,
    courseTitle,
    certificateId,
    completedAt,
    instructorName = 'Course Instructor',
  } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const margin = 36;
    const innerW = pageW - margin * 2;
    const cx = pageW / 2;

    doc.rect(0, 0, pageW, pageH).fill(CREAM);
    drawWavyBackground(doc, pageW, pageH);
    drawDoubleBorder(doc, margin, innerW, pageH - margin * 2);
    drawCornerAccent(doc, margin + 10, margin + 10, false, false);
    drawCornerAccent(doc, pageW - margin - 10, pageH - margin - 10, true, true);

    drawWebsiteLogo(doc, cx, margin + 28);
    drawCertifiedBadge(doc, pageW - margin - 50, margin + 48);

    let y = margin + 92;

    doc.fillColor(NAVY).font('Times-Bold').fontSize(40);
    doc.text('CERTIFICATE', margin, y, { width: innerW, align: 'center', characterSpacing: 2 });
    y += 44;

    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(13);
    doc.text('OF COMPLETION', margin, y, { width: innerW, align: 'center', characterSpacing: 3 });
    y += 18;
    drawGoldDivider(doc, cx, y, innerW * 0.5);
    y += 20;

    doc.fillColor(GRAY).font('Times-Roman').fontSize(12);
    doc.text('This is to certify that', margin, y, { width: innerW, align: 'center' });
    y += 24;

    doc.fillColor(NAVY).font('Times-BoldItalic').fontSize(32);
    doc.text(studentName, margin + 50, y, { width: innerW - 100, align: 'center' });
    y += doc.heightOfString(studentName, { width: innerW - 100 }) + 10;
    drawGoldDivider(doc, cx, y, innerW * 0.35);
    y += 18;

    doc.fillColor(GRAY).font('Times-Roman').fontSize(12);
    doc.text('has successfully completed the online course', margin, y, { width: innerW, align: 'center' });
    y += 22;

    doc.fillColor(NAVY).font('Times-Bold').fontSize(21);
    doc.text(courseTitle, margin + 40, y, { width: innerW - 80, align: 'center' });
    y += doc.heightOfString(courseTitle, { width: innerW - 80 }) + 12;

    doc.fillColor(GRAY).font('Times-Roman').fontSize(10);
    doc.text(
      'on the LearnHub platform and has met all requirements for this course.',
      margin + 70,
      y,
      { width: innerW - 140, align: 'center', lineGap: 2 }
    );

    const sigY = pageH - margin - 100;
    const sigW = 200;
    const sigX = cx - sigW / 2;

    doc.fillColor('#333').font('Times-Italic').fontSize(16);
    doc.text(instructorName, sigX, sigY, { width: sigW, align: 'center' });
    doc.moveTo(sigX + 20, sigY + 26).lineTo(sigX + sigW - 20, sigY + 26).strokeColor(GRAY).lineWidth(0.5).stroke();
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
    doc.text(instructorName, sigX, sigY + 32, { width: sigW, align: 'center' });
    doc.fillColor(GRAY).font('Helvetica').fontSize(9);
    doc.text('Course Instructor', sigX, sigY + 46, { width: sigW, align: 'center' });

    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(8);
    doc.text('Issued by LearnHub · Online Learning Platform', margin, sigY + 64, {
      width: innerW,
      align: 'center',
    });

    drawFooter(doc, { margin, pageW, pageH, certificateId, completedAt });

    doc.end();
  });
}
