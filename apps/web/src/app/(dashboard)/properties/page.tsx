'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  IndianRupee,
} from 'lucide-react';
import api from '@/lib/api';
import { formatIndianNumber, getPropertyStatusColor } from '@/lib/utils';

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['properties', { search, type: typeFilter, status: statusFilter }],
    queryFn: () =>
      api.get('/properties', {
        params: { search, type: typeFilter, status: statusFilter, limit: 50 },
      }),
  });

  const properties = propertiesData?.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your property inventory</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition">
          <Plus className="h-4 w-4" /> Add Property
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-background"
        >
          <option value="">All Types</option>
          <option value="FLAT">Flat</option>
          <option value="VILLA">Villa</option>
          <option value="PLOT">Plot</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="FARM_LAND">Farm Land</option>
          <option value="PENTHOUSE">Penthouse</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-background"
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="HOLD">Hold</option>
        </select>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No properties found. Add your first property to get started.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}
        >
          {properties.map((property: any) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                <Building2Icon className="h-16 w-16 text-primary/20" />
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${getPropertyStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition">
                    {property.title}
                  </h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {property.type?.replace('_', ' ')}
                  </span>
                </div>

                {property.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" /> {property.city}, {property.state}
                  </p>
                )}

                {/* Features */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5" /> {property.bedrooms} BHK
                    </span>
                  )}
                  {property.bathrooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
                    </span>
                  )}
                  {property.area && (
                    <span className="flex items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5" /> {property.area} sqft
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-bold text-lg text-primary flex items-center">
                    {formatIndianNumber(Number(property.price))}
                  </span>
                  {property.pricePerSqFt && (
                    <span className="text-xs text-muted-foreground">
                      ₹{Number(property.pricePerSqFt).toLocaleString()}/sqft
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    </svg>
  );
}
