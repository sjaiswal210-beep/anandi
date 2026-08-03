'use client';

import { useQuery } from '@tanstack/react-query';
import { Globe, ExternalLink, Palette, FileText, Image, Layout } from 'lucide-react';
import api from '@/lib/api';

export default function WebsitePage() {
  const { data: websiteData } = useQuery({
    queryKey: ['website-config'],
    queryFn: () => api.get('/website/config'),
  });

  const website = websiteData?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Builder</h1>
          <p className="text-muted-foreground mt-1">Create your SEO-optimized real estate website</p>
        </div>
        <a
          href="/project"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition"
        >
          <ExternalLink className="h-4 w-4" /> View Live Site
        </a>
      </div>

      {/* Status Card */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{website?.name || 'Skyline Heights'}</p>
              <a
                href="/project"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                localhost:3000/project
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${website?.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {website?.isPublished ? 'Published' : 'Draft'}
            </span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              {website ? 'Edit Website' : 'Setup Website'}
            </button>
          </div>
        </div>
      </div>

      {/* Page Builder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Home / Hero', icon: Layout, description: 'Hero, stats, RERA badge, CTA', href: '/project' },
          { name: 'Floor Plans', icon: FileText, description: '2, 3 & 4 BHK with pricing', href: '/project#plans' },
          { name: 'Amenities', icon: Layout, description: '12 amenity tiles over hero image', href: '/project#amenities' },
          { name: 'Gallery', icon: Image, description: 'Lightbox photo gallery', href: '/project#gallery' },
          { name: 'Location', icon: FileText, description: 'Nearby places with drive times', href: '/project#location' },
          { name: 'Contact', icon: FileText, description: 'Lead capture form, WhatsApp button', href: '/project#contact' },
        ].map((page) => (
          <a
            key={page.name}
            href={page.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition block"
          >
            <page.icon className="h-8 w-8 text-primary/60 mb-3" />
            <h3 className="font-medium">{page.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
            <span className="text-xs text-primary mt-3 inline-flex items-center gap-1">
              Open section <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        ))}
      </div>

      {/* Theme Settings */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5" /> Theme & Branding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#2563eb" className="w-10 h-10 rounded cursor-pointer" />
              <input type="text" defaultValue="#2563eb" className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Font Family</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm bg-background">
              <option>Inter</option>
              <option>Poppins</option>
              <option>Roboto</option>
              <option>Open Sans</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <select className="w-full px-3 py-2 border rounded-lg text-sm bg-background">
              <option>Modern</option>
              <option>Classic</option>
              <option>Minimal</option>
              <option>Bold</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
