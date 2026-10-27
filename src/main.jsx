import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AudioLines, Upload, Download, Printer, FileMusic, Check, Music2, X, ImagePlus, Trash2, Scissors, RotateCcw } from 'lucide-react';
import { MAX_FILE_BYTES, parseDmf, formatDuration } from './dmf.js';
import { createPdfLayout, downloadPdf } from './pdf.js';
import { readHeaderImage } from './header-image.js';
import { getMessages, languages, languageNames } from './i18n.js';
import './styles.css';

const initialOptions = { title: '', subtitle: '', date: '', size: 'medium', bpm: true, key: true, duration: true, headerImage: null };
const languageStorageKey = 'setlist-studio-language';

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(languageStorageKey);
    if (languages.includes(saved)) return saved;
  } catch {}
  const browserLanguage = navigator.language?.slice(0, 2).toLowerCase();
  return languages.includes(browserLanguage) ? browserLanguage : 'fr';
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const t = getMessages(language);
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(0);
  const [filename, setFilename] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState('preview');
  const fileInput = useRef(null);
  const imageInput = useRef(null);
  const sheetContainer = useRef(null);
  const [sheetScale, setSheetScale] = useState(1);
  const list = lists[selected];
  const total = list?.tracks.reduce((sum, track) => sum + track.length, 0) ?? 0;
  const layout = useMemo(() => list ? createPdfLayout(list, options, language) : null, [list, options, language]);
  const pages = layout?.pages ?? [];
  const parts = list?.tracks.reduce((result, track, index) => {
    if (index === 0 || track.startNewPart) result.push({ start: index, end: index });
    else result[result.length - 1].end = index;
    return result;
  }, []) ?? [];
  const hasList = Boolean(list);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(languageStorageKey, language);
    } catch {}
  }, [language]);

  useEffect(() => {
    const container = sheetContainer.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setSheetScale(entry.contentRect.width / (210 * 96 / 25.4));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasList, view]);

  function changeOption(key, value) {
    setOptions(current => ({ ...current, [key]: value }));
  }

  async function importFile(file) {
    if (!file || busy) return;
    setError('');
    if (!/\.dmf$/i.test(file.name)) {
      setError(t.wrongFile);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t.fileTooLarge);
      return;
    }
    setBusy(true);
    try {
      const imported = parseDmf(await file.text(), language);
      setLists(imported);
      setSelected(0);
      setFilename(file.name);
      setOptions(current => ({ ...current, title: imported[0].name }));
    } catch (failure) {
      setError(failure.message || t.fileReadFailed);
    } finally {
      setBusy(false);
    }
  }

  function editTrack(index, changes) {
    setLists(current => current.map((item, listIndex) => listIndex === selected
      ? { ...item, tracks: item.tracks.map((track, trackIndex) => trackIndex === index ? { ...track, ...changes } : track) }
      : item));
  }

  function resetParts() {
    setLists(current => current.map((item, listIndex) => listIndex === selected
      ? { ...item, tracks: item.tracks.map(track => ({ ...track, startNewPart: false })) }
      : item));
  }

  async function importImage(file) {
    if (!file || imageBusy) return;
    setImageBusy(true);
    setError('');
    try {
      changeOption('headerImage', await readHeaderImage(file, language));
    } catch (failure) {
      setError(failure.message || t.imageReadFailed);
    } finally {
      setImageBusy(false);
    }
  }

  function exportPdf() {
    try {
      downloadPdf(list, options, language);
      setError('');
    } catch {
      setError(t.pdfFailed);
    }
  }

  return <>
    <header className="topbar">
      <a className="brand" href="./"><span className="brand-icon"><AudioLines size={23} /></span><span>Setlist<span className="brand-light"> Studio</span></span></a>
      <div className="product-lockup"><span className="product-label">{t.productLabel}</span></div>
      <div className="language-switch" role="group" aria-label={t.language}>{languages.map(code => <button key={code} type="button" aria-label={languageNames[code]} title={languageNames[code]} aria-pressed={language === code} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}</div>
      {/* <span className="local-status"><span /> Local & prive</span> */}
    </header>
    <main>
      <div className="workspace">
        <aside className="sidebar">
          <section>
            <h2><span className="step">01</span> {t.source}</h2>
            <input ref={fileInput} className="visually-hidden" type="file" accept=".dmf" aria-label={t.sourceInput} disabled={busy} onChange={event => { importFile(event.target.files?.[0]); event.target.value = ''; }} />
            <button className={`import-zone ${dragging ? 'dragging' : ''}`} disabled={busy} onClick={() => fileInput.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); importFile(event.dataTransfer.files[0]); }}>
              {filename ? <FileMusic size={28} /> : <Upload size={28} />}<strong>{busy ? t.readingFile : filename ? t.changeFile : t.importFile}</strong><span>{filename || 'GoorooLink'}</span>
            </button>
            {filename && <p className="import-status"><Check size={14} /> {t.importedLists(lists.length)}</p>}
            {list && <label className="field">{t.setList}<select value={selected} onChange={event => { const index = Number(event.target.value); setSelected(index); changeOption('title', lists[index].name); }}>{lists.map((item, index) => <option key={index} value={index}>{item.name} ({item.tracks.length})</option>)}</select></label>}
          </section>
          <section className={!list ? 'inactive' : ''}>
            <h2><span className="step">02</span> {t.header}</h2>
            <div className="header-image-control">
              <input ref={imageInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label={t.imageInput} disabled={imageBusy} onChange={event => { importImage(event.target.files?.[0]); event.target.value = ''; }} />
              <div className="header-image-actions"><button className="secondary" disabled={imageBusy} onClick={() => imageInput.current?.click()}><ImagePlus size={17} /> {imageBusy ? t.readingImage : options.headerImage ? t.replaceImage : t.addImage}</button>{options.headerImage && <button className="image-remove" disabled={imageBusy} title={t.removeImage} aria-label={t.removeImage} onClick={() => changeOption('headerImage', null)}><Trash2 size={17} /></button>}</div>
              {options.headerImage && <div className="header-image-thumbnail"><img src={options.headerImage.dataUrl} alt={t.importedImage} /><span>{options.headerImage.name}</span></div>}
              <span className="image-formats">{t.imageFormats}</span>
            </div>
            <label className="field">{t.concertTitle}<input disabled={!list} maxLength={80} placeholder={t.setListPlaceholder} value={options.title} onChange={event => changeOption('title', event.target.value)} /></label>
            <label className="field">{t.venue}<input disabled={!list} maxLength={100} placeholder={t.venuePlaceholder} value={options.subtitle} onChange={event => changeOption('subtitle', event.target.value)} /></label>
            <label className="field">{t.date}<input disabled={!list} type="date" value={options.date} onChange={event => changeOption('date', event.target.value)} /></label>
          </section>
          <section className={!list ? 'inactive' : ''}>
            <h2><span className="step">03</span> {t.layout}</h2>
            <span className="field-label" id="size-label">{t.titleSize}</span>
            <div className="segments" role="group" aria-labelledby="size-label">{[['small', t.compact], ['medium', t.standard], ['large', t.stage]].map(([size, label]) => <button key={size} disabled={!list} aria-pressed={options.size === size} onClick={() => changeOption('size', size)}>{label}</button>)}</div>
            <div className="column-toggles">{[['bpm', t.tempo], ['key', t.key], ['duration', t.duration]].map(([key, label]) => <label key={key}><span>{label}</span><input type="checkbox" disabled={!list} checked={options[key]} onChange={event => changeOption(key, event.target.checked)} /></label>)}</div>
            <div className="format-badge">A4 <span>{t.portrait}</span></div>
          </section>
          <section className="parts-section">
            <h2><span className="step">04</span> {t.parts}</h2>
            <button className="secondary parts-edit" disabled={!list?.tracks.length} onClick={() => setView('edit')}><Scissors size={17} /> {t.editParts}</button>
            {parts.length > 1 ? <ol className="parts-summary">{parts.map((part, index) => <li key={part.start}><span>{t.part(index + 1)}</span><span>{String(part.start + 1).padStart(2, '0')} - {String(part.end + 1).padStart(2, '0')}</span></li>)}</ol> : <p className="parts-mode">{t.automatic}</p>}
          </section>
          <div className="export-actions"><button className="primary" disabled={!list?.tracks.length || busy || imageBusy} onClick={exportPdf}><Download size={17} /> {t.downloadPdf}</button><button className="secondary" disabled={!list?.tracks.length || busy || imageBusy} onClick={() => window.print()}><Printer size={17} /> {t.print}</button></div>
        </aside>
        <div className="preview-area">
          <div className="preview-toolbar"><div className="view-tabs" role="group" aria-label={t.preview}><button aria-pressed={view === 'preview'} onClick={() => setView('preview')}>{t.preview}</button><button aria-pressed={view === 'edit'} disabled={!list} onClick={() => setView('edit')}>{t.tracksTab(list?.tracks.length ?? 0)}</button></div><span className="page-info">{list ? t.pageCount(pages.length) : t.pageFormat}</span></div>
          {error && <div className="error" role="alert"><span>{error}</span><button aria-label={t.closeError} title={t.closeError} onClick={() => setError('')}><X size={16} /></button></div>}
          {!list ? <div className="empty-state"><div className="empty-sheet"><FileMusic size={46} strokeWidth={1.2} /><div /><div /><div /><div /><div /></div><h2>{t.emptyTitle}</h2><p>{t.emptySubtitle}</p><button className="primary" onClick={() => fileInput.current?.click()} disabled={busy}><Upload size={17} /> {t.chooseFile}</button></div>
            : <>
              <div className="concert-summary"><span><Music2 size={16} /> {t.summaryTracks(list.tracks.length)}</span><span>{formatDuration(total)}</span><span className="summary-name">{list.name}</span></div>
              {view === 'edit' && <div className="track-editor">
                <div className="editor-heading"><h2>{t.trackEditor}</h2><button className="secondary" disabled={parts.length <= 1} onClick={resetParts}><RotateCcw size={15} /> {t.automatic}</button></div>
                {list.tracks.length === 0 && <p>{t.noTracks}</p>}
                {parts.map((part, partIndex) => <React.Fragment key={part.start}>
                  <h3 className="part-heading"><span>{t.part(partIndex + 1)}</span><span>{t.trackRange(part.start + 1, part.end + 1)}</span></h3>
                  {list.tracks.slice(part.start, part.end + 1).map((track, localIndex) => {
                    const index = part.start + localIndex;
                    return <div className="editor-row" key={index}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <input aria-label={t.trackTitle(index + 1)} value={track.name} maxLength={150} onChange={event => editTrack(index, { name: event.target.value })} />
                      <span>{track.bpm} BPM</span><span className="editor-key">{track.key || '-'}</span><span className="editor-duration">{formatDuration(track.length)}</span>
                      <label className="part-toggle"><input type="checkbox" aria-label={index === 0 ? t.startPart : t.newPart} disabled={index === 0} checked={index === 0 || Boolean(track.startNewPart)} onChange={event => editTrack(index, { startNewPart: event.target.checked })} /><span>{index === 0 ? t.startPart : t.newPart}</span></label>
                    </div>;
                  })}
                </React.Fragment>)}
              </div>}
              <div ref={sheetContainer} className={`sheets ${view === 'edit' ? 'print-only' : ''}`} style={{ '--sheet-scale': sheetScale }}>
                {pages.map((page, pageIndex) => <div className="sheet-frame" key={pageIndex}><article className="sheet" style={{ '--track-font': `${layout.fontSize}pt`, '--number-font': `${layout.numberFontSize}pt`, '--row-padding': `${layout.rowPadding}mm` }}>
                  <header className="sheet-header" style={{ height: `${layout.header.headerBottom - 15}mm` }}>
                    {options.headerImage && <img className="sheet-logo" style={{ top: `${layout.header.imageTop - 15}mm`, left: `${layout.header.imageLeft - 15}mm`, width: `${layout.header.imageWidth}mm`, height: `${layout.header.imageHeight}mm` }} src={options.headerImage.dataUrl} alt={t.importedImage} />}
                    <div className="sheet-heading" style={{ left: `${layout.header.textX - 15}mm`, top: `${layout.header.textTop - 15}mm`, height: `${layout.header.textHeight}mm` }}><h2 className="sheet-title" style={{ fontSize: `${layout.header.titleFontSize}pt` }}>{layout.header.titleLines.join('\n')}</h2>
                      {layout.header.detailsLines.length > 1 && <p className="sheet-details" style={{ top: `${layout.header.detailsOffset}mm` }}>{layout.header.detailsLines.slice(0, -1).join('\n')}</p>}
                      <div className="sheet-statistics" style={{ top: `${layout.header.statisticsOffset}mm`, bottom: 'auto', height: `${layout.header.statisticsHeight}mm` }}><span>{layout.header.detailsLines.at(-1)}</span>{page.partLabel && <strong className="sheet-part" style={{ fontSize: `${layout.header.partFontSize}pt` }}>{page.partLabel}</strong>}</div>
                    </div>
                  </header>
                  <table><colgroup><col style={{ width: '12mm' }} /><col />{['bpm', 'key', 'duration'].filter(key => options[key]).map(key => <col key={key} style={{ width: '17mm' }} />)}</colgroup><thead><tr style={{ height: `${page.headHeight}mm` }}><th className="number" aria-label={t.tableTrackNumber} /><th aria-label={t.tableTrackTitle} />{options.bpm && <th className="metadata">BPM</th>}{options.key && <th className="metadata">{t.tableKey}</th>}{options.duration && <th className="metadata">{t.tableDuration}</th>}</tr></thead><tbody>{page.rows.map((row, index) => <tr key={index} style={{ height: `${row.height}mm` }}>{row.cells.map((lines, cellIndex) => <td key={cellIndex} className={cellIndex === 0 ? 'number' : cellIndex === 1 ? 'track-title' : 'metadata'}>{lines.join('\n')}</td>)}</tr>)}</tbody></table>
                  <footer className="sheet-footer"><span>SETLIST STUDIO{layout.partCount > 1 ? ` / ${t.pdfFooterPart(page.part)}` : ''}</span><span>{pageIndex + 1} / {pages.length}</span></footer>
                </article></div>)}
              </div>
            </>}
          <div className="workspace-footer"><span><span className="status-dot" /> {t.footerStatus}</span><span>{t.footerTagline}</span></div>
        </div>
      </div>
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);