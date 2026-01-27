import React from 'react'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import type { Venue } from '../../../services/venues.api'
import { formatCOP, calculateEstimatedPrice } from '../../../shared/utils/money'

type VenueCardProps = {
  venue: Venue
  onSelect: (venue: Venue) => void
  isSelected?: boolean
  durationMin?: number | null
  disabled?: boolean
}

export default function VenueCard({ venue, onSelect, isSelected, durationMin, disabled }: VenueCardProps) {
  const hourlyRate = venue.pricing?.hourlyRate
  const currency = venue.pricing?.currency || 'COP'
  
  // Calculate estimated price if duration is provided
  const estimatedPrice = hourlyRate && durationMin 
    ? calculateEstimatedPrice(hourlyRate, durationMin)
    : null

  return (
    <Card className={isSelected ? 'border-2 border-primary' : ''}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-2">{venue.name}</h3>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {venue.city ? (
                <Badge variant="info">{venue.city}</Badge>
              ) : (
                <Badge variant="warning">Ciudad no disponible</Badge>
              )}
              {venue.zone && (
                <Badge variant="secondary">{venue.zone}</Badge>
              )}
            </div>
            
            {venue.address && (
              <p className="text-sm text-muted mb-2">{venue.address}</p>
            )}

            {/* Pricing Information */}
            <div className="space-y-1 mt-2">
              {hourlyRate ? (
                <>
                  <p className="text-xs text-muted">
                    Desde {formatCOP(hourlyRate)} / hora
                  </p>
                  {estimatedPrice && (
                    <p className="text-sm font-semibold text-primary">
                      Estimado: {formatCOP(estimatedPrice)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted">Precio por definir</p>
              )}
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => onSelect(venue)}
          variant={isSelected ? 'secondary' : 'primary'}
          className="w-full"
          disabled={disabled}
        >
          {isSelected ? 'Seleccionada' : 'Seleccionar'}
        </Button>
      </div>
    </Card>
  )
}
