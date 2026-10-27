import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseDmf, formatDuration } from './dmf.js';
import { createPdf, createPdfLayout } from './pdf.js';
import { readHeaderImage } from './header-image.js';

const sample = (tracks = [{ name: 'Titre test', bpm: 120, key: 'Fa', length: 238 }]) =>
  JSON.stringify({ setLists: { setList: [{ name: 'Concert test', tracks }] } });

test('lit les champs utiles sans reprendre la configuration du controleur', () => {
  assert.deepEqual(parseDmf(sample())[0].tracks[0], { name: 'Titre test', bpm: 120, key: 'Fa', length: 238 });
  assert.equal(parseDmf('\uFEFF' + sample()).length, 1);
});

test('rejette le JSON et les structures invalides', () => {
  for (const source of ['texte', 'null', '{}', sample([null]), sample([{ name: 'Test', bpm: -1, length: 12 }])]) {
    assert.throws(() => parseDmf(source));
  }
});

test('accepte plusieurs set-lists et les listes vides', () => {
  const data = JSON.parse(sample([]));
  data.setLists.setList.push({ name: 'Autre concert', tracks: [] });
  assert.equal(parseDmf(JSON.stringify(data)).length, 2);
});

test('formate les durees', () => {
  assert.equal(formatDuration(238), '3:58');
  assert.equal(formatDuration(3651), '1:00:51');
  assert.equal(formatDuration(0), '0:00');
});

const fixture = new URL('../../Set-List Bunker-Paillettes.dmf', import.meta.url);
test('valide le format et la taille des images avant decodage', async () => {
  await assert.rejects(readHeaderImage({ type: 'image/svg+xml', size: 100 }), /PNG, JPEG ou WebP/);
  await assert.rejects(readHeaderImage({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 Mo/);
  await assert.rejects(readHeaderImage({ type: 'image/png', size: 0 }), /5 Mo/);
});

test('integre l’image dans un cartouche compact sans perdre de morceaux par page', () => {
  const list = parseDmf(sample(Array.from({ length: 16 }, () => ({ name: 'Titre test', bpm: 120, key: 'Fa', length: 238 }))))[0];
  const options = { title: list.name, subtitle: '', date: '', size: 'medium', bpm: true, key: true, duration: true };
  assert.equal(createPdf(list, options).getNumberOfPages(), 1);
  options.headerImage = { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', width: 1, height: 1 };
  const { document, header } = createPdfLayout(list, options);
  assert.ok(header.headerBottom - (header.imageTop + header.imageHeight) >= 2.999);
  assert.equal(document.getNumberOfPages(), 1);
  assert.ok(document.lastAutoTable.finalY < 277);
  assert.match(document.output(), /\/Subtype \/Image/);
  assert.ok(document.output().startsWith('%PDF-'));
});

test('le cartouche conserve la casse, le lieu et la date sans modifier les options', () => {
  const list = parseDmf(sample())[0];
  const options = { title: 'Concert de Printemps', subtitle: 'Salle de concert', date: '2026-10-16', size: 'medium', bpm: true, key: true, duration: true };
  const original = structuredClone(options);
  const document = createPdf(list, options);
  const content = document.output();
  assert.ok(content.includes('Concert de Printemps'));
  assert.ok(content.includes('Salle de concert | 16/10/2026'));
  assert.deepEqual(options, original);
  const longTitle = 'Concert de Printemps '.repeat(4);
  const longDocument = createPdf(list, { ...options, title: longTitle, subtitle: 'Salle de concert '.repeat(6) });
  assert.equal(longDocument.getNumberOfPages(), 1);
  assert.ok(longDocument.lastAutoTable.finalY < 277);
});

test('ajuste le titre sur une ligne sans agrandir les titres courts ni modifier la saisie', () => {
  const list = parseDmf(sample())[0];
  const options = { title: 'Concert test', subtitle: '', date: '', size: 'medium', bpm: true, key: true, duration: true };
  assert.equal(createPdfLayout(list, options).header.titleFontSize, 22);
  const longTitle = 'Concert de Printemps et les grandes retrouvailles sur la scene du festival';
  for (const headerImage of [null, { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', width: 1, height: 1 }]) {
    const settings = { ...options, title: longTitle, headerImage };
    const original = structuredClone(settings);
    const layout = createPdfLayout(list, settings);
    assert.deepEqual(layout.header.titleLines, [longTitle]);
    assert.ok(layout.header.titleFontSize < 22);
    layout.document.setFont('helvetica', 'bold');
    layout.document.setFontSize(layout.header.titleFontSize);
    assert.ok(layout.document.getTextWidth(longTitle) <= (headerImage ? 140 : 180));
    assert.deepEqual(settings, original);
  }
});

test('remplit les pages en mode scene selon la hauteur reelle des lignes', () => {
  const list = parseDmf(sample(Array.from({ length: 40 }, (_, index) => ({ name: `Titre test ${index + 1}`, bpm: 120, key: 'Fa', length: 238 }))))[0];
  const options = { title: 'Concert test', subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true };
  const layout = createPdfLayout(list, options);
  assert.ok(layout.pages[0].tracks.length > 12);
  assert.deepEqual(layout.pages.flatMap(page => page.tracks), list.tracks);
  assert.equal(layout.pages.length, layout.document.getNumberOfPages());
  layout.pages.forEach((page, index) => {
    const bottom = layout.tableTop + page.headHeight + page.rows.reduce((sum, row) => sum + row.height, 0);
    assert.ok(bottom <= 277.01);
    if (layout.pages[index + 1]) assert.ok(bottom + layout.pages[index + 1].rows[0].height > 277);
  });
  const multiline = createPdfLayout({ ...list, tracks: list.tracks.map(track => ({ ...track, name: 'Un titre volontairement tres long qui occupe plusieurs lignes dans la feuille de concert' })) }, options);
  assert.ok(multiline.pages[0].tracks.length < layout.pages[0].tracks.length);
  assert.deepEqual(multiline.pages.flatMap(page => page.tracks).map(track => track.bpm), list.tracks.map(track => track.bpm));
  const tallHeader = createPdfLayout(list, { ...options, title: 'Un titre de concert assez long pour prendre plusieurs lignes dans le cartouche', subtitle: 'Une grande salle de concert avec un sous-titre detaille '.repeat(3), headerImage: { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', width: 1, height: 1 } });
  assert.ok(tallHeader.tableTop > layout.tableTop);
  assert.ok(tallHeader.pages[0].tracks.length <= layout.pages[0].tracks.length);
  tallHeader.pages.forEach((page, index) => {
    const bottom = tallHeader.tableTop + page.headHeight + page.rows.reduce((sum, row) => sum + row.height, 0);
    assert.ok(bottom <= 277.01);
    if (tallHeader.pages[index + 1]) assert.ok(bottom + tallHeader.pages[index + 1].rows[0].height > 277);
  });
  assert.deepEqual(tallHeader.pages.flatMap(page => page.tracks), list.tracks);
});

test('integre le nombre de morceaux et la duree dans le cartouche sans ligne supplementaire', () => {
  const list = parseDmf(sample())[0];
  const options = { title: 'Concert test', subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true };
  const layout = createPdfLayout(list, options);
  assert.equal(layout.header.detailsLines.join(' '), '1 morceau | 3:58');
  assert.equal(layout.header.statisticsGap, 3);
  assert.equal(layout.tableTop - layout.header.headerBottom, 3);
  assert.ok(layout.tableTop < 41);
  const fullHeader = createPdfLayout(list, { ...options, subtitle: 'Salle de concert', date: '2026-10-16' });
  assert.deepEqual(fullHeader.header.detailsLines, ['Salle de concert | 16/10/2026', '1 morceau | 3:58']);
  assert.equal(layout.tableTop, fullHeader.tableTop);
  assert.equal(fullHeader.header.statisticsGap, 3);
  const longSubtitle = createPdfLayout(list, { ...options, subtitle: 'Un lieu de concert avec un sous-titre tres detaille '.repeat(3) });
  assert.ok(longSubtitle.header.detailsLines.length > 2);
  assert.equal(longSubtitle.header.detailsLines.at(-1), '1 morceau | 3:58');
  assert.equal(longSubtitle.header.statisticsGap, 3);
});

test('reserve la deuxieme ligne pour garder les positions quand le lieu et la date sont effaces', () => {
  const list = parseDmf(sample(Array.from({ length: 4 }, (_, index) => ({ name: `Titre test ${index + 1}`, bpm: 120, key: 'Fa', length: 180 }))))[0];
  const options = { title: 'Concert test', subtitle: 'Salle de concert', date: '2026-10-17', size: 'large', bpm: true, key: true, duration: true };
  for (const withParts of [false, true]) {
    list.tracks[2].startNewPart = withParts;
    const reference = createPdfLayout(list, options);
    for (const fields of [{ subtitle: '' }, { date: '' }, { subtitle: '', date: '' }]) {
      const layout = createPdfLayout(list, { ...options, ...fields });
      for (const key of ['textTop', 'detailsHeight', 'detailsOffset', 'statisticsOffset', 'statisticsBaseline', 'headerBottom']) {
        assert.equal(layout.header[key], reference.header[key]);
      }
      assert.equal(layout.tableTop, reference.tableTop);
    }
  }
});

test('masque les deux premiers libelles sans retirer les entetes des metadonnees', () => {
  const list = parseDmf(sample())[0];
  const options = { title: list.name, subtitle: '', date: '', size: 'medium', bpm: true, key: true, duration: true };
  const document = createPdf(list, options);
  const cells = document.lastAutoTable.head[0].cells;
  assert.deepEqual(Object.values(cells).map(cell => cell.text.join('')), ['', '', 'BPM', 'TON.', 'DURÉE']);
  assert.equal(document.lastAutoTable.body[0].cells[0].text.join(''), '01');
  assert.equal(document.lastAutoTable.body[0].cells[1].text.join(''), 'Titre test');
});

test('garde un rythme de texte independant du logo et conserve ses proportions', () => {
  const list = parseDmf(sample())[0];
  const options = { title: 'Concert test', subtitle: 'Salle de concert', date: '2026-10-16', size: 'large', bpm: true, key: true, duration: true, headerImage: { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', width: 1, height: 1 } };
  for (const settings of [
    options,
    { ...options, title: 'Un titre de concert tres long qui reste sur une seule ligne', subtitle: 'Un lieu de concert avec un sous-titre tres detaille '.repeat(3) },
    { ...options, headerImage: { ...options.headerImage, width: 600, height: 260 } },
    { ...options, headerImage: { ...options.headerImage, width: 180, height: 540 } },
    { ...options, subtitle: '', date: '' },
  ]) {
    const { header } = createPdfLayout(list, settings);
    const imageCenter = header.imageTop + header.imageHeight / 2;
    const textCenter = header.textTop + header.textHeight / 2;
    assert.ok(Math.abs(imageCenter - textCenter) < 0.001);
    assert.ok(header.imageTop >= header.textTop - 0.001);
    assert.ok(header.imageTop + header.imageHeight <= header.statisticsBaseline + 0.001);
    assert.ok(header.imageHeight <= 22.001 && header.imageWidth <= 34.001);
    assert.ok(Math.abs(header.statisticsBaseline - header.textTop - header.textHeight) < 0.001);
    assert.ok(Math.abs(header.imageWidth / header.imageHeight - settings.headerImage.width / settings.headerImage.height) < 0.001);
    const above = header.detailsOffset - header.titleInkHeight;
    const below = header.statisticsOffset + header.statisticsHeight - header.statisticsInkHeight - header.detailsOffset - header.detailsHeight;
    assert.ok(above > 0 && below > 0);
    assert.ok(Math.abs(above - below) < 0.001);
    assert.equal(header.statisticsGap, 3);
    assert.ok(header.headerBottom - (header.imageTop + header.imageHeight) >= 2.999);
    assert.ok(header.headerBottom - (header.textTop + header.textHeight) >= 2.999);
  }
  const filled = createPdfLayout(list, options);
  const cleared = createPdfLayout(list, { ...options, subtitle: '', date: '' });
  for (const key of ['imageTop', 'imageHeight', 'textTop', 'detailsOffset', 'statisticsBaseline', 'headerBottom']) {
    assert.equal(cleared.header[key], filled.header[key]);
  }
});

test('repartit les morceaux en parties 1-8, 9-10, puis le reste sans changer leur ordre', () => {
  const list = parseDmf(sample(Array.from({ length: 16 }, (_, index) => ({ name: `Titre test ${index + 1}`, bpm: 120, key: 'Fa', length: 180 }))))[0];
  list.tracks[8].startNewPart = true;
  list.tracks[10].startNewPart = true;
  const original = structuredClone(list);
  const options = { title: list.name, subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true };
  const layout = createPdfLayout(list, options);
  assert.equal(layout.partCount, 3);
  assert.equal(layout.document.getNumberOfPages(), 3);
  assert.deepEqual(layout.pages.map(page => page.tracks.length), [8, 2, 6]);
  assert.deepEqual(layout.pages.map(page => page.offset), [0, 8, 10]);
  assert.deepEqual(layout.pages.map(page => page.part), [1, 2, 3]);
  assert.deepEqual(layout.pages.map(page => page.partLabel), ['Partie 1/3', 'Partie 2/3', 'Partie 3/3']);
  assert.equal(layout.header.statisticsHeight, layout.header.titleHeight);
  assert.ok(layout.document.output().includes('Partie 1/3'));
  assert.ok(layout.document.output().includes('Partie 2/3'));
  assert.ok(layout.document.output().includes('Partie 3/3'));
  assert.deepEqual(layout.pages.map(page => page.rows[0].cells[0].join('')), ['01', '09', '11']);
  assert.deepEqual(layout.pages.flatMap(page => page.tracks), list.tracks);
  assert.deepEqual(list, original);
  assert.ok(layout.document.output().includes('PARTIE 3'));
  const automatic = createPdfLayout({ ...list, tracks: list.tracks.map(track => ({ ...track, startNewPart: false })) }, options);
  assert.equal(automatic.partCount, 1);
  assert.equal(automatic.pages.length, 1);
  assert.equal(automatic.pages[0].partLabel, '');
  assert.equal(automatic.header.statisticsHeight, automatic.header.partHeight);
  for (const key of ['detailsOffset', 'statisticsInkHeight', 'statisticsOffset', 'statisticsBaseline', 'headerBottom']) {
    assert.equal(automatic.header[key], layout.header[key]);
  }
  assert.ok(!automatic.document.output().includes('Partie 1/1'));
});

test('le repere de partie reste a 22 points et la grille reste stable quand le titre retrecit', () => {
  const list = parseDmf(sample(Array.from({ length: 4 }, (_, index) => ({ name: `Titre test ${index + 1}`, bpm: 120, key: 'Fa', length: 180 }))))[0];
  list.tracks[2].startNewPart = true;
  const options = { title: 'Concert test', subtitle: 'Salle de concert', date: '2026-10-17', size: 'large', bpm: true, key: true, duration: true };
  const short = createPdfLayout(list, options);
  const long = createPdfLayout(list, { ...options, title: 'Concert de Printemps et les grandes retrouvailles sur la scene du festival' });
  const automatic = createPdfLayout({ ...list, tracks: list.tracks.map(track => ({ ...track, startNewPart: false })) }, options);
  assert.deepEqual(automatic.header, short.header);
  assert.ok(long.header.titleFontSize < short.header.titleFontSize);
  assert.equal(short.header.partFontSize, 22);
  assert.equal(long.header.partFontSize, 22);
  for (const key of ['titleHeight', 'partHeight', 'statisticsHeight', 'statisticsOffset', 'headerBottom']) {
    assert.equal(long.header[key], short.header[key]);
  }
  assert.ok(long.header.detailsOffset < short.header.detailsOffset);
  for (const { header } of [short, long]) {
    const above = header.detailsOffset - header.titleInkHeight;
    const below = header.statisticsOffset + header.statisticsHeight - header.statisticsInkHeight - header.detailsOffset - header.detailsHeight;
    assert.ok(Math.abs(above - below) < 0.001);
  }
  assert.equal(long.header.statisticsGap, 3);
  assert.equal(long.header.headerBottom - (15 + long.header.contentHeight), 3);
  assert.deepEqual(long.pages.map(page => page.partLabel), ['Partie 1/2', 'Partie 2/2']);
});

test('une partie trop longue continue automatiquement avant la partie suivante', () => {
  const list = parseDmf(sample(Array.from({ length: 40 }, (_, index) => ({ name: `Titre test ${index + 1}`, bpm: 120, key: 'Fa', length: 180 }))))[0];
  list.tracks[0].startNewPart = true;
  list.tracks[30].startNewPart = true;
  list.tracks[31].startNewPart = true;
  list.tracks[39].startNewPart = true;
  const layout = createPdfLayout(list, { title: list.name, subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true });
  assert.equal(layout.partCount, 4);
  assert.ok(layout.pages.filter(page => page.part === 1).length > 1);
  assert.ok(layout.pages.filter(page => page.part === 1).every(page => page.partLabel === 'Partie 1/4'));
  assert.equal(layout.pages.find(page => page.part === 2).offset, 30);
  assert.equal(layout.pages.find(page => page.part === 3).offset, 31);
  assert.equal(layout.pages.at(-1).offset, 39);
  assert.ok(layout.pages.every(page => page.tracks.length > 0));
  assert.deepEqual(layout.pages.flatMap(page => page.tracks), list.tracks);
  assert.equal(layout.pages.length, layout.document.getNumberOfPages());
});

test('charger un logo ne deplace jamais le separateur ou le tableau', () => {
  const list = parseDmf(sample())[0];
  const options = { title: 'Concert test', subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true };
  const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  for (const subtitle of ['', 'Salle de concert', 'Un lieu de concert avec un sous-titre tres detaille '.repeat(3)]) {
    const settings = { ...options, subtitle };
    const reference = createPdfLayout(list, settings);
    for (const [width, height] of [[1, 1], [600, 260], [180, 540]]) {
      const layout = createPdfLayout(list, { ...settings, headerImage: { dataUrl, width, height } });
      assert.equal(layout.header.headerBottom, reference.header.headerBottom);
      assert.equal(layout.tableTop, reference.tableTop);
      assert.equal(layout.header.statisticsBaseline, reference.header.statisticsBaseline);
      assert.deepEqual(layout.header.detailsLines, reference.header.detailsLines);
      assert.ok(layout.header.imageTop >= layout.header.textTop - 0.001);
      assert.ok(layout.header.imageTop + layout.header.imageHeight <= layout.header.statisticsBaseline + 0.001);
      assert.ok(layout.header.imageTop + layout.header.imageHeight <= layout.header.headerBottom - 2.999);
      assert.ok(Math.abs(layout.header.imageTop + layout.header.imageHeight / 2 - layout.header.textTop - layout.header.textHeight / 2) < 0.001);
    }
  }
});

test('renforce les numeros sans modifier les titres ni la hauteur des lignes', () => {
  const list = parseDmf(sample())[0];
  for (const [size, expectedSize] of [['small', 10], ['medium', 10], ['large', 14]]) {
    const layout = createPdfLayout(list, { title: list.name, subtitle: '', date: '', size, bpm: true, key: true, duration: true });
    const table = layout.document.lastAutoTable;
    const number = table.body[0].cells[0];
    assert.equal(layout.numberFontSize, expectedSize);
    assert.equal(number.styles.fontSize, expectedSize);
    assert.equal(number.styles.fontStyle, 'bold');
    assert.equal(number.styles.textColor, 45);
    assert.deepEqual(number.text, ['01']);
    assert.equal(table.head[0].cells[0].styles.fontSize, 8);
    const expectedHeight = layout.fontSize * 1.15 * 25.4 / 72 + 2 * layout.rowPadding;
    assert.ok(Math.abs(table.body[0].height - expectedHeight) < 0.001);
  }
});

test('lit l’export local fourni sans le modifier', { skip: !existsSync(fixture) }, () => {
  const lists = parseDmf(readFileSync(fixture, 'utf8'));
  assert.equal(lists[0].tracks.length, 16);
  assert.equal(lists[0].tracks.reduce((sum, track) => sum + track.length, 0), 3651);
  const layout = createPdfLayout(lists[0], { title: lists[0].name, subtitle: '', date: '', size: 'large', bpm: true, key: true, duration: true });
  assert.equal(layout.pages.length, 1);
  assert.equal(layout.pages[0].tracks.length, 16);
  assert.equal(layout.fontSize, 22);
  assert.equal(layout.rowPadding, 2.5);
  const withHeader = createPdfLayout(lists[0], { title: lists[0].name, subtitle: 'Salle de concert', date: '2026-10-16', size: 'large', bpm: true, key: true, duration: true, headerImage: { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', width: 1, height: 1 } });
  assert.equal(withHeader.pages.length, 1);
  assert.equal(withHeader.pages[0].tracks.length, 16);
  assert.ok(withHeader.document.lastAutoTable.finalY < 277);
  for (const [size, fontSize] of [['small', 12], ['medium', 15]]) {
    const unchanged = createPdfLayout(lists[0], { title: lists[0].name, subtitle: '', date: '', size, bpm: true, key: true, duration: true });
    assert.equal(unchanged.fontSize, fontSize);
    assert.equal(unchanged.rowPadding, 3);
  }
});

test('localise les erreurs du fichier selon la langue choisie', () => {
  assert.throws(() => parseDmf('texte', 'en'), /valid JSON/);
  assert.throws(() => parseDmf('texte', 'es'), /JSON válido/);
});

test('localise les dates, statistiques et libellés du PDF', () => {
  const list = parseDmf(sample())[0];
  const options = { title: list.name, subtitle: 'Venue', date: '2026-10-16', size: 'medium', bpm: true, key: true, duration: true };
  const english = createPdf(list, options, 'en').output();
  const spanish = createPdf(list, options, 'es').output();
  assert.ok(english.includes('Venue | 16/10/2026'));
  assert.ok(english.includes('1 track | 3:58'));
  assert.ok(english.includes('KEY'));
  assert.ok(spanish.includes('Venue | 16/10/2026'));
  assert.ok(spanish.includes('1 canción | 3:58'));
  assert.ok(spanish.includes('TON.'));
});