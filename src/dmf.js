export const MAX_FILE_BYTES = 10 * 1024 * 1024;

import { getMessages } from './i18n.js';

function text(value, label, messages) {
  if (typeof value !== 'string' || !value.trim() || value.length > 300) {
    throw new Error(`${label}: ${messages.missingText}`);
  }
  return value.trim();
}

export function parseDmf(source, language = 'fr') {
  const messages = getMessages(language);
  let data;
  try {
    data = JSON.parse(source.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error(messages.invalidJson);
  }
  const lists = data?.setLists?.setList;
  if (!Array.isArray(lists) || lists.length === 0 || lists.length > 100) {
    throw new Error(messages.invalidListCount);
  }
  return lists.map((list, listIndex) => {
    if (!Array.isArray(list?.tracks) || list.tracks.length > 1000) {
      throw new Error(messages.invalidTracks(listIndex + 1));
    }
    return {
      name: text(list.name, messages.setListLabel(listIndex + 1), messages),
      tracks: list.tracks.map((track, trackIndex) => {
        if (!track || !Number.isFinite(track.bpm) || track.bpm < 0 || track.bpm > 1000
          || !Number.isInteger(track.length) || track.length < 0 || track.length > 86400) {
          throw new Error(messages.invalidTrack(trackIndex + 1));
        }
        return {
          name: text(track.name, messages.trackLabel(trackIndex + 1), messages),
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

