import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatDuration } from './dmf.js';

export function createPdfLayout(list, options) {
  const document = new jsPDF({ unit: 'mm', format: 'a4' });
  const pages = [];
  const partStarts = [0, ...list.tracks.flatMap((track, index) => index > 0 && track.startNewPart ? [index] : [])];
  let currentPart = 1;
  const total = formatDuration(list.tracks.reduce((sum, track) => sum + track.length, 0));
  const fontSize = { small: 12, medium: 15, large: 22 }[options.size];
  const numberFontSize = options.size === 'large' ? 14 : 10;
  const rowPadding = options.size === 'large' ? 2.5 : 3;
  const title = options.title.trim() || list.name;
  const date = options.date ? new Date(`${options.date}T12:00:00`).toLocaleDateString('fr-FR') : '';
  const details = [options.subtitle.trim(), date].filter(Boolean).join(' | ');
  const statistics = `${list.tracks.length} ${list.tracks.length === 1 ? 'morceau' : 'morceaux'} | ${total}`;
  const image = options.headerImage;
  const titleLines = [title.replace(/[\r\n]+/g, ' ')];
  const partFontSize = 22;
  const capHeight = 0.718;
  const titleHeight = 22 * 25.4 / 72 * capHeight;
  const partHeight = titleHeight;
  const statisticsGap = 3;
  const statisticsHeight = partHeight;
  const textX = image ? 55 : 15;
  const textWidth = 195 - textX;
  document.setFont('helvetica', 'bold');
  document.setFontSize(22);
  const titleWidth = document.getTextWidth(titleLines[0]);
  const titleFontSize = titleWidth > 0 ? Math.min(22, 22 * (textWidth - 1) / titleWidth) : 22;
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  const detailsLines = [...(details ? document.splitTextToSize(details, 140) : []), statistics];
  const titleInkHeight = titleFontSize * 25.4 / 72 * capHeight;
  const statisticsInkHeight = 9 * 25.4 / 72 * capHeight;
  const detailsHeight = Math.max(0, detailsLines.length - 2) * 3.9 + 9 * 25.4 / 72 * capHeight;
  const titleInset = 1.5;
  const statisticsOffset = titleHeight + 3 + detailsHeight + statisticsGap - titleInset;
  const statisticsVisualTop = statisticsOffset + statisticsHeight - statisticsInkHeight;
  const detailsOffset = (titleInkHeight + statisticsVisualTop - detailsHeight) / 2;
  const textHeight = statisticsOffset + statisticsHeight;
  const textTop = 15 + titleInset;
  const contentHeight = titleInset + textHeight;
  const imageCenter = textTop + textHeight / 2;
  const availableImageHeight = Math.min(22, textHeight);
  const imageScale = image ? Math.min(34 / image.width, availableImageHeight / image.height) : 0;
  const imageWidth = image ? image.width * imageScale : 0;
  const imageHeight = image ? image.height * imageScale : 0;
  const imageTop = imageCenter - imageHeight / 2;
  const imageLeft = 15 + (34 - imageWidth) / 2;
  const headerBottom = 15 + contentHeight + 3;
  const tableTop = headerBottom + 3;
  const statisticsBaseline = textTop + textHeight;
  function drawHeader() {
    document.setTextColor(20, 20, 20);
    document.setFont('helvetica', 'bold');
    document.setFontSize(titleFontSize);
    document.text(titleLines, textX, textTop + titleFontSize * 25.4 / 72 * capHeight);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    if (detailsLines.length) {
      document.setTextColor(85, 85, 85);
      detailsLines.forEach((line, index) => {
        if (index === detailsLines.length - 1) {
          document.text(line, textX, statisticsBaseline);
        } else {
          document.text(line, textX, textTop + detailsOffset + index * 3.9 + 9 * 25.4 / 72 * capHeight);
        }
      });
    }
    const partLabel = partStarts.length > 1 ? `Partie ${currentPart}/${partStarts.length}` : '';
    if (partLabel) {
      document.setFont('helvetica', 'bold');
      document.setFontSize(partFontSize);
      document.setTextColor(20, 20, 20);
      document.text(partLabel, 195, statisticsBaseline, { align: 'right' });
    }
    if (image) {
      document.addImage(image.dataUrl, 'PNG', imageLeft, imageTop, imageWidth, imageHeight, 'header-image', 'FAST');
    }
    document.setDrawColor(160);
    document.setLineWidth(0.25);
    document.line(15, headerBottom, 195, headerBottom);
    pages.push({ offset: 0, tracks: [], rows: [], headHeight: 0, part: currentPart, partLabel });
  }
  partStarts.forEach((offset, partIndex) => {
    currentPart = partIndex + 1;
    if (partIndex > 0) document.addPage();
    const head = ['', ''];
    if (options.bpm) head.push('BPM');
    if (options.key) head.push('TON.');
    if (options.duration) head.push('DUREE');
    autoTable(document, {
      startY: tableTop,
      head: [head],
      body: list.tracks.slice(offset, partStarts[partIndex + 1] ?? list.tracks.length).map((track, index) => {
        const row = [String(offset + index + 1).padStart(2, '0'), track.name];
        if (options.bpm) row.push(String(track.bpm || '-'));
        if (options.key) row.push(track.key || '-');
        if (options.duration) row.push(formatDuration(track.length));
        return row;
      }),
      theme: 'plain',
      margin: { left: 15, right: 15, bottom: 20, top: tableTop },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }, overflow: 'linebreak', textColor: 20, lineWidth: { bottom: 0.15 }, lineColor: 210 },
      bodyStyles: { cellPadding: { top: rowPadding, bottom: rowPadding, left: 2, right: 2 } },
      headStyles: { fontSize: 8, textColor: 90, fontStyle: 'normal' },
      columnStyles: Object.fromEntries(head.map((_, index) => [index, index === 0
        ? { cellWidth: 12, textColor: 100 }
        : index === 1 ? { fontSize, fontStyle: 'bold' } : { cellWidth: 17, halign: 'right' }])),
      rowPageBreak: 'avoid',
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 0) {
          Object.assign(data.cell.styles, { fontSize: numberFontSize, fontStyle: 'bold', textColor: 45 });
        }
      },
      willDrawPage: drawHeader,
      didDrawCell(data) {
        if (data.column.index !== 0) return;
        const page = pages[pages.length - 1];
        if (data.section === 'head') page.headHeight = data.row.height;
        if (data.section === 'body') {
          if (!page.tracks.length) page.offset = offset + data.row.index;
          page.tracks.push(list.tracks[offset + data.row.index]);
          page.rows.push({ height: data.row.height, cells: Object.values(data.row.cells).map(cell => cell.text) });
        }
      },
    });
  });
  const count = document.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    document.setPage(page);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(110);
    document.text(partStarts.length > 1 ? `SETLIST STUDIO / PARTIE ${pages[page - 1].part}` : 'SETLIST STUDIO', 15, 286);
    document.text(`${page} / ${count}`, 195, 286, { align: 'right' });
  }
  return { document, pages, partCount: partStarts.length, header: { titleLines, titleFontSize, titleHeight, titleInkHeight, partFontSize, partHeight, detailsLines, detailsOffset, detailsHeight, statisticsGap, statisticsOffset, statisticsHeight, statisticsInkHeight, statisticsBaseline, textTop, textHeight, textX, imageTop, imageLeft, imageWidth, imageHeight, contentHeight, headerBottom }, tableTop, fontSize, numberFontSize, rowPadding };
}

export function createPdf(list, options) {
  return createPdfLayout(list, options).document;
}

export function downloadPdf(list, options) {
  const name = (options.title.trim() || list.name).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'setlist';
  createPdf(list, options).save(`${name}.pdf`);
}