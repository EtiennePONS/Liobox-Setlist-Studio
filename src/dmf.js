export const MAX_FILE_BYTES = 10 * 1024 * 1024;

function text(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 300) {
    throw new Error(`${label} : texte absent ou trop long (300 caracteres maximum).`);
  }
  return value.trim();
}

export function parseDmf(source) {
  let data;
  try {
    data = JSON.parse(source.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('Ce fichier ne contient pas de JSON valide.');
  }
  const lists = data?.setLists?.setList;
  if (!Array.isArray(lists) || lists.length === 0 || lists.length > 100) {
    throw new Error('Le fichier doit contenir entre 1 et 100 set-lists LioBox.');
  }
  return lists.map((list, listIndex) => {
    if (!Array.isArray(list?.tracks) || list.tracks.length > 1000) {
      throw new Error(`Set-list ${listIndex + 1} : liste de morceaux invalide.`);
    }
    return {
      name: text(list.name, `Set-list ${listIndex + 1}`),
      tracks: list.tracks.map((track, trackIndex) => {
        const label = `Morceau ${trackIndex + 1}`;
        if (!track || !Number.isFinite(track.bpm) || track.bpm < 0 || track.bpm > 1000
          || !Number.isInteger(track.length) || track.length < 0 || track.length > 86400) {
          throw new Error(`${label} : tempo ou duree invalide.`);
        }
        return {
          name: text(track.name, label),
          bpm: track.bpm,
          key: typeof track.key === 'string' && track.key.length <= 40 ? track.key : '',
          length: track.length,
        };
      }),
    };
  });
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return hours ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
}

