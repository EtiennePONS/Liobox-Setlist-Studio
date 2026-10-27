export const languages = ['fr', 'en', 'es'];

export const languageNames = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

const dictionaries = {
  fr: {
    language: 'Langue', productLabel: 'LIOBOX / CONCERT EDITION / DE LA RÉPÉTITION À LA SCÈNE',
    source: 'Source', sourceInput: 'Importer un fichier DMF', readingFile: 'Lecture en cours...', changeFile: 'Changer de fichier', importFile: 'Importer un .dmf', importedLists: count => `${count} set-list${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''}`, setList: 'Set-list',
    header: 'En-tête', imageInput: 'Importer une image d’en-tête', readingImage: 'Lecture...', replaceImage: 'Remplacer l’image', addImage: 'Ajouter une image', removeImage: 'Retirer l’image', importedImage: 'Image d’en-tête importée', imageFormats: 'PNG, JPEG, WebP / 5 Mo max.', concertTitle: 'Titre du concert', setListPlaceholder: 'Nom de la set-list', venue: 'Lieu / sous-titre', venuePlaceholder: 'Salle, festival...', date: 'Date',
    layout: 'Mise en page', titleSize: 'Taille des titres', compact: 'Compact', standard: 'Standard', stage: 'Scène', tempo: 'Tempo (BPM)', key: 'Tonalité', duration: 'Durée', portrait: '210 x 297 mm / Portrait',
    parts: 'Parties', editParts: 'Répartir en parties', part: number => `Partie ${number}`, trackRange: (start, end) => `Morceaux ${start} - ${end}`, automatic: 'Automatique', downloadPdf: 'Télécharger le PDF', print: 'Imprimer',
    preview: 'Aperçu', tracksTab: count => `Morceaux ${count}`, pageCount: count => `${count} page${count > 1 ? 's' : ''}`, pageFormat: 'A4 PORTRAIT', closeError: 'Fermer l’erreur', emptyTitle: 'La scène se prépare ici.', emptySubtitle: 'Aucune set-list importée', chooseFile: 'Choisir un fichier',
    summaryTracks: count => `${count} morceau${count > 1 ? 'x' : ''}`, trackEditor: 'Morceaux & parties', noTracks: 'Cette set-list ne contient aucun morceau.', trackTitle: number => `Titre du morceau ${number}`, startPart: 'Début du concert', newPart: 'Nouvelle partie',
    tableTrackNumber: 'Numéro du morceau', tableTrackTitle: 'Titre du morceau', tableKey: 'TON.', tableDuration: 'DURÉE',
    footerStatus: 'LIOBOX PRÊT', footerTagline: 'LE LIVE, EN TOUTES LETTRES.',
    wrongFile: 'Sélectionne un fichier .dmf exporté depuis GoorooLink.', fileTooLarge: 'Le fichier dépasse la limite de 10 Mo.', fileReadFailed: 'Impossible de lire ce fichier.', imageReadFailed: 'Impossible de charger cette image.', pdfFailed: 'La génération du PDF a échoué. Essaie une taille de texte plus petite.',
    invalidJson: 'Ce fichier ne contient pas de JSON valide.', invalidListCount: 'Le fichier doit contenir entre 1 et 100 set-lists LioBox.', invalidTracks: number => `Set-list ${number} : liste de morceaux invalide.`, setListLabel: number => `Set-list ${number}`, trackLabel: number => `Morceau ${number}`, missingText: 'texte absent ou trop long (300 caractères maximum).', invalidTrack: number => `Morceau ${number} : tempo ou durée invalide.`,
    imageTypeError: 'Choisis une image PNG, JPEG ou WebP.', imageSizeError: 'L’image doit peser entre 1 octet et 5 Mo.', imageDimensionsError: 'Image trop grande : 20 mégapixels et 10 000 pixels par côté maximum.', imageCanvasError: 'Le navigateur ne permet pas de préparer cette image.', imageDecodeError: 'Impossible de lire cette image. Le fichier est peut-être endommagé.',
    statistics: (count, total) => `${count} morceau${count > 1 ? 'x' : ''} | ${total}`, pdfPart: (number, count) => `Partie ${number}/${count}`, pdfFooterPart: number => `PARTIE ${number}`,
  },
  en: {
    language: 'Language', productLabel: 'LIOBOX / CONCERT EDITION / FROM REHEARSAL TO STAGE',
    source: 'Source', sourceInput: 'Import a DMF file', readingFile: 'Reading file...', changeFile: 'Change file', importFile: 'Import a .dmf', importedLists: count => `${count} set list${count === 1 ? '' : 's'} imported`, setList: 'Set list',
    header: 'Header', imageInput: 'Import a header image', readingImage: 'Reading...', replaceImage: 'Replace image', addImage: 'Add image', removeImage: 'Remove image', importedImage: 'Imported header image', imageFormats: 'PNG, JPEG, WebP / 5 MB max.', concertTitle: 'Concert title', setListPlaceholder: 'Set list name', venue: 'Venue / subtitle', venuePlaceholder: 'Venue, festival...', date: 'Date',
    layout: 'Layout', titleSize: 'Track title size', compact: 'Compact', standard: 'Standard', stage: 'Stage', tempo: 'Tempo (BPM)', key: 'Key', duration: 'Duration', portrait: '210 x 297 mm / Portrait',
    parts: 'Sets', editParts: 'Split into sets', part: number => `Set ${number}`, trackRange: (start, end) => `Tracks ${start} - ${end}`, automatic: 'Automatic', downloadPdf: 'Download PDF', print: 'Print',
    preview: 'Preview', tracksTab: count => `Tracks ${count}`, pageCount: count => `${count} page${count === 1 ? '' : 's'}`, pageFormat: 'A4 PORTRAIT', closeError: 'Dismiss error', emptyTitle: 'Your stage starts here.', emptySubtitle: 'No set list imported', chooseFile: 'Choose a file',
    summaryTracks: count => `${count} track${count === 1 ? '' : 's'}`, trackEditor: 'Tracks & sets', noTracks: 'This set list contains no tracks.', trackTitle: number => `Track title ${number}`, startPart: 'Concert start', newPart: 'New set',
    tableTrackNumber: 'Track number', tableTrackTitle: 'Track title', tableKey: 'KEY', tableDuration: 'DURATION',
    footerStatus: 'LIOBOX READY', footerTagline: 'EVERY TRACK, READY FOR THE STAGE.',
    wrongFile: 'Choose a .dmf file exported from GoorooLink.', fileTooLarge: 'The file exceeds the 10 MB limit.', fileReadFailed: 'Unable to read this file.', imageReadFailed: 'Unable to load this image.', pdfFailed: 'PDF generation failed. Try a smaller text size.',
    invalidJson: 'This file does not contain valid JSON.', invalidListCount: 'The file must contain between 1 and 100 LioBox set lists.', invalidTracks: number => `Set list ${number}: invalid track list.`, setListLabel: number => `Set list ${number}`, trackLabel: number => `Track ${number}`, missingText: 'text is missing or too long (300 characters maximum).', invalidTrack: number => `Track ${number}: invalid tempo or duration.`,
    imageTypeError: 'Choose a PNG, JPEG, or WebP image.', imageSizeError: 'The image must be between 1 byte and 5 MB.', imageDimensionsError: 'Image too large: 20 megapixels and 10,000 pixels per side maximum.', imageCanvasError: 'Your browser cannot prepare this image.', imageDecodeError: 'Unable to read this image. The file may be damaged.',
    statistics: (count, total) => `${count} track${count === 1 ? '' : 's'} | ${total}`, pdfPart: (number, count) => `Set ${number}/${count}`, pdfFooterPart: number => `SET ${number}`,
  },
  es: {
    language: 'Idioma', productLabel: 'LIOBOX / CONCERT EDITION / DEL ENSAYO AL ESCENARIO',
    source: 'Archivo', sourceInput: 'Importar un archivo DMF', readingFile: 'Leyendo archivo...', changeFile: 'Cambiar archivo', importFile: 'Importar un .dmf', importedLists: count => `${count} lista${count === 1 ? '' : 's'} importada${count === 1 ? '' : 's'}`, setList: 'Lista',
    header: 'Encabezado', imageInput: 'Importar una imagen de encabezado', readingImage: 'Leyendo...', replaceImage: 'Reemplazar imagen', addImage: 'Añadir imagen', removeImage: 'Quitar imagen', importedImage: 'Imagen de encabezado importada', imageFormats: 'PNG, JPEG, WebP / 5 MB máx.', concertTitle: 'Título del concierto', setListPlaceholder: 'Nombre de la lista', venue: 'Lugar / subtítulo', venuePlaceholder: 'Sala, festival...', date: 'Fecha',
    layout: 'Diseño', titleSize: 'Tamaño de los títulos', compact: 'Compacto', standard: 'Estándar', stage: 'Escenario', tempo: 'Tempo (BPM)', key: 'Tonalidad', duration: 'Duración', portrait: '210 x 297 mm / Vertical',
    parts: 'Partes', editParts: 'Dividir en partes', part: number => `Parte ${number}`, trackRange: (start, end) => `Canciones ${start} - ${end}`, automatic: 'Automático', downloadPdf: 'Descargar PDF', print: 'Imprimir',
    preview: 'Vista previa', tracksTab: count => `Canciones ${count}`, pageCount: count => `${count} página${count === 1 ? '' : 's'}`, pageFormat: 'A4 VERTICAL', closeError: 'Cerrar el error', emptyTitle: 'El escenario empieza aquí.', emptySubtitle: 'No hay ninguna lista importada', chooseFile: 'Elegir archivo',
    summaryTracks: count => `${count} canción${count === 1 ? '' : 'es'}`, trackEditor: 'Canciones y partes', noTracks: 'Esta lista no contiene canciones.', trackTitle: number => `Título de la canción ${number}`, startPart: 'Inicio del concierto', newPart: 'Nueva parte',
    tableTrackNumber: 'Número de canción', tableTrackTitle: 'Título de la canción', tableKey: 'TON.', tableDuration: 'DURACIÓN',
    footerStatus: 'LIOBOX LISTO', footerTagline: 'CADA CANCIÓN, LISTA PARA EL ESCENARIO.',
    wrongFile: 'Elige un archivo .dmf exportado desde GoorooLink.', fileTooLarge: 'El archivo supera el límite de 10 MB.', fileReadFailed: 'No se puede leer este archivo.', imageReadFailed: 'No se puede cargar esta imagen.', pdfFailed: 'No se pudo generar el PDF. Prueba con un tamaño de texto menor.',
    invalidJson: 'Este archivo no contiene un JSON válido.', invalidListCount: 'El archivo debe contener entre 1 y 100 listas de LioBox.', invalidTracks: number => `Lista ${number}: lista de canciones no válida.`, setListLabel: number => `Lista ${number}`, trackLabel: number => `Canción ${number}`, missingText: 'falta el texto o es demasiado largo (máximo 300 caracteres).', invalidTrack: number => `Canción ${number}: tempo o duración no válidos.`,
    imageTypeError: 'Elige una imagen PNG, JPEG o WebP.', imageSizeError: 'La imagen debe pesar entre 1 byte y 5 MB.', imageDimensionsError: 'Imagen demasiado grande: máximo 20 megapíxeles y 10.000 píxeles por lado.', imageCanvasError: 'El navegador no puede preparar esta imagen.', imageDecodeError: 'No se puede leer esta imagen. Es posible que el archivo esté dañado.',
    statistics: (count, total) => `${count} canción${count === 1 ? '' : 'es'} | ${total}`, pdfPart: (number, count) => `Parte ${number}/${count}`, pdfFooterPart: number => `PARTE ${number}`,
  },
};

export function getMessages(language) {
  return dictionaries[language] ?? dictionaries.fr;
}