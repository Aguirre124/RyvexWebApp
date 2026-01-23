import React from 'react'

type VenueFiltersProps = {
  cities: string[]
  zones: string[]
  selectedCity: string
  selectedZone: string
  searchQuery: string
  onCityChange: (city: string) => void
  onZoneChange: (zone: string) => void
  onSearchChange: (query: string) => void
}

export default function VenueFilters({
  cities,
  zones,
  selectedCity,
  selectedZone,
  searchQuery,
  onCityChange,
  onZoneChange,
  onSearchChange
}: VenueFiltersProps) {
  const hasCities = cities.length > 0

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o dirección..."
          className="w-full px-4 py-2.5 bg-[#071422] border border-[#1f2937] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-2 gap-3">
        {/* City filter */}
        <div>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!hasCities}
            className="w-full px-4 py-2.5 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todas las ciudades</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Zone filter */}
        <div>
          <select
            value={selectedZone}
            onChange={(e) => onZoneChange(e.target.value)}
            disabled={!selectedCity || zones.length === 0}
            className="w-full px-4 py-2.5 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todas las zonas</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
