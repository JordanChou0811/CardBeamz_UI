import { Injectable, signal } from '@angular/core';
import { CLOUDINARY } from './cloudinary.config';

export interface UploadedImage {
  url: string;
  publicId: string;
  name: string;
  folder: string;
  uploadedAt: string;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (pct: number) => void;
}

const GALLERY_KEY = 'cbz_uploads';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  readonly gallery = signal<UploadedImage[]>(this.load());

  private load(): UploadedImage[] {
    try {
      const raw = localStorage.getItem(GALLERY_KEY);
      return raw ? (JSON.parse(raw) as UploadedImage[]) : [];
    } catch {
      return [];
    }
  }

  private persist(list: UploadedImage[]): void {
    this.gallery.set(list);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(list));
  }

  upload(file: File, opts: UploadOptions = {}): Promise<UploadedImage> {
    const folder = opts.folder || CLOUDINARY.baseFolder;
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY.uploadPreset);
    if (folder) form.append('folder', folder);

    return new Promise<UploadedImage>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && opts.onProgress) {
          opts.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          const img: UploadedImage = {
            url: res.secure_url,
            publicId: res.public_id,
            name: file.name,
            folder: res.folder || folder,
            uploadedAt: new Date().toISOString(),
          };
          this.persist([img, ...this.gallery()]);
          resolve(img);
        } else {
          let msg = `HTTP ${xhr.status}`;
          try {
            msg = JSON.parse(xhr.responseText)?.error?.message ?? msg;
          } catch {
            /* ignore */
          }
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  }

  removeFromGallery(publicId: string): void {
    this.persist(this.gallery().filter((g) => g.publicId !== publicId));
  }
}
