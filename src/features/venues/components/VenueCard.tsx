import React from 'react'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import type { Venue } from '../../../services/venues.api'

type VenueCardProps = {
  venue: Venue
  onSelect: (venue: Venue) => void
  isSelected?: boolean
}

export default function VenueCard({ venue, onSelect, isSelected }: VenueCardProps) {
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
              <p className="text-sm text-muted">{venue.address}</p>
            )}
          </div>
        </div>
        
        <Button
          onClick={() => onSelect(venue)}
          variant={isSelected ? 'secondary' : 'primary'}
          className="w-full"
        >
          {isSelected ? 'Seleccionada' : 'Seleccionar'}
        </Button>
      </div>
    </Card>
  )
}
