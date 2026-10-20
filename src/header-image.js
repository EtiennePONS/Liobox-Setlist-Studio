export async function readHeaderImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Choisis une image PNG, JPEG ou WebP.');
  }
  if (!file.size || file.size > 5 * 1024 * 1024) {
    throw new Error('L’image doit peser entre 1 octet et 5 Mo.');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 20000000 || Math.max(bitmap.width, bitmap.height) > 10000) {
      throw new Error('Image trop grande : 20 megapixels et 10 000 pixels par cote maximum.');
    }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Le navigateur ne permet pas de preparer cette image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height, name: file.name };
  } catch (failure) {
    if (!bitmap) throw new Error('Impossible de lire cette image. Le fichier est peut-etre endommage.');
    throw failure;
  } finally {
    bitmap?.close();
  }
}