// app/sitemap.ts
import { MetadataRoute } from 'next';
import { locales } from './i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tonkatsu-niimura.vercel.app';
  
  // Tạo danh sách các đường dẫn cho từng ngôn ngữ
  return locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}