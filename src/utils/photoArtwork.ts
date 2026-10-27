import type { PhotoItem } from '../types';

const pendingPhoto = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#e1e7d9"/><text x="450" y="575" text-anchor="middle" font-family="Georgia,serif" font-size="52" fill="#4b6049">B &amp; L</text><text x="450" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#4b6049">Fotograf&#237;a pendiente</text></svg>');

export function getPhotoSrc(photo: PhotoItem): string {
  return hasCustomPhoto(photo) ? photo.publicPath : pendingPhoto;
}

export function hasCustomPhoto(photo: PhotoItem): boolean {
  return photo.publicPath.startsWith('/api/photos/');
}
