import { getMessages } from './i18n.js';

export async function readHeaderImage(file, language = 'fr') {
  const messages = getMessages(language);
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error(messages.imageTypeError);
  }
  if (!file.size || file.size > 5 * 1024 * 1024) {
    throw new Error(messages.imageSizeError);
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 20000000 || Math.max(bitmap.width, bitmap.height) > 10000) {
      throw new Error(messages.imageDimensionsError);
    }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error(messages.imageCanvasError);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, name: file.name };
  } catch (failure) {
    if (!bitmap) throw new Error(messages.imageDecodeError);
    throw failure;
  } finally {
    bitmap?.close();
  }
}