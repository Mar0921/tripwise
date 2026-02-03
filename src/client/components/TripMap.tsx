import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DayItinerary, Location } from '@/client/types/tripwise';

interface TripMapProps {
  itinerary: DayItinerary[];
  destination: string;
  selectedDay?: number;
  onDaySelect?: (day: number) => void;
  numberOfTravelers?: number;
  hotelLocation?: Location | null;
}


// Create custom marker for activity
function createActivityMarkerIcon(
  timeOfDay: 'daytime' | 'nighttime',
  isMain: boolean,
  isSelected: boolean
): L.DivIcon {
  const baseColor = timeOfDay === 'daytime' ? '#f59e0b' : '#6366f1';
  const size = isSelected ? 32 : 24;
  const opacity = isMain ? 1 : 0.6;
  const borderStyle = isMain ? 'solid' : 'dashed';

  return L.divIcon({
    className: 'activity-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${isSelected ? baseColor : 'white'};
        border: 2px ${borderStyle} ${baseColor};
        border-radius: ${timeOfDay === 'daytime' ? '50%' : '4px'};
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: ${opacity};
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        cursor: pointer;
      ">
        <svg viewBox="0 0 24 24" fill="${isSelected ? 'white' : baseColor}" style="width: ${size * 0.6}px; height: ${size * 0.6}px;">
          ${timeOfDay === 'daytime'
            ? '<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z"/>'
            : '<path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>'
          }
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Create hotel marker icon
function createHotelMarkerIcon(): L.DivIcon {
  const size = 40;
  return L.divIcon({
    className: 'hotel-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <svg viewBox="0 0 24 24" fill="white" style="width: ${size * 0.5}px; height: ${size * 0.5}px;">
          <path d="M12 2L2 7v15h20V7L12 2zm8 18H4V8.5l8-4 8 4V20z"/>
          <path d="M12 10v4M9 13h6"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function formatPrice(price: number): string {
  return `${price}`;
}

export default function TripMap({ itinerary, destination, selectedDay, onDaySelect, numberOfTravelers = 1, hotelLocation }: TripMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || itinerary.length === 0) return;

    // Get all coordinates for centering
    const allCoords: [number, number][] = [];
    itinerary.forEach(day => {
      allCoords.push([day.daytimeActivityLocation.lat, day.daytimeActivityLocation.lng]);
      allCoords.push([day.daytimeAlternativeActivityLocation.lat, day.daytimeAlternativeActivityLocation.lng]);
      allCoords.push([day.nighttimeActivityLocation.lat, day.nighttimeActivityLocation.lng]);
      allCoords.push([day.nighttimeAlternativeActivityLocation.lat, day.nighttimeAlternativeActivityLocation.lng]);
    });

    const centerLat = allCoords.reduce((a, b) => a + b[0], 0) / allCoords.length;
    const centerLng = allCoords.reduce((a, b) => a + b[1], 0) / allCoords.length;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear existing markers and lines
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    linesRef.current.forEach(line => line.remove());
    linesRef.current = [];

    // Add markers for selected day only (show all 4 activities)
    const selectedDayData = selectedDay
      ? itinerary.find(d => d.dayNumber === selectedDay)
      : itinerary[0];

    if (selectedDayData) {
      const day = selectedDayData;

      // Create popup content helper
      const createPopupContent = (
        title: string,
        activity: string,
        activityType: string,
        duration: number,
        location: { name: string; address: string },
        price: number,
        isSelected: boolean,
        isAlternative: boolean
      ) => `
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 600;
              background: ${title.includes('Day') ? '#fef3c7' : '#e0e7ff'};
              color: ${title.includes('Day') ? '#92400e' : '#3730a3'};
            ">
              ${title}
            </span>
            ${isSelected ? `
              <span style="
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 10px;
                font-weight: 600;
                background: #dcfce7;
                color: #166534;
              ">
                Selected
              </span>
            ` : ''}
            ${isAlternative ? `
              <span style="
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 10px;
                font-weight: 500;
                background: #f3f4f6;
                color: #6b7280;
              ">
                Alternative
              </span>
            ` : ''}
          </div>
          <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">
            ${activity}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            ${location.name}
          </div>
          <div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">
            ${location.address}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 500;
                background: ${activityType === 'outdoor' ? '#dcfce7' : '#e0e7ff'};
                color: ${activityType === 'outdoor' ? '#166534' : '#3730a3'};
              ">
                ${activityType}
              </span>
              <span style="font-size: 11px; color: #6b7280;">
                ${duration}h
              </span>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 14px; color: #059669;">
                ${formatPrice(price)}
              </div>
              <div style="font-size: 10px; color: #9ca3af;">
                per person
              </div>
              ${numberOfTravelers > 1 ? `
                <div style="font-size: 10px; color: #6b7280;">
                  ${formatPrice(price * numberOfTravelers)} total
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Daytime Main Activity
      const daytimeMainMarker = L.marker(
        [day.daytimeActivityLocation.lat, day.daytimeActivityLocation.lng],
        { icon: createActivityMarkerIcon('daytime', true, day.selectedDaytimeActivity === 'main') }
      );
      daytimeMainMarker.bindPopup(
        createPopupContent(
          'Daytime Activity',
          day.daytimeActivity,
          day.daytimeActivityType,
          day.daytimeActivityDuration,
          day.daytimeActivityLocation,
          day.daytimeActivityPrice,
          day.selectedDaytimeActivity === 'main',
          false
        ),
        { closeButton: true, className: 'custom-popup' }
      );
      daytimeMainMarker.on('click', () => {
        if (onDaySelect) onDaySelect(day.dayNumber);
      });
      daytimeMainMarker.addTo(mapRef.current!);
      markersRef.current.push(daytimeMainMarker);

      // Daytime Alternative Activity
      const daytimeAltMarker = L.marker(
        [day.daytimeAlternativeActivityLocation.lat, day.daytimeAlternativeActivityLocation.lng],
        { icon: createActivityMarkerIcon('daytime', false, day.selectedDaytimeActivity === 'alternative') }
      );
      daytimeAltMarker.bindPopup(
        createPopupContent(
          'Daytime Activity',
          day.daytimeAlternativeActivity,
          day.daytimeAlternativeActivityType,
          day.daytimeAlternativeActivityDuration,
          day.daytimeAlternativeActivityLocation,
          day.daytimeAlternativeActivityPrice,
          day.selectedDaytimeActivity === 'alternative',
          true
        ),
        { closeButton: true, className: 'custom-popup' }
      );
      daytimeAltMarker.on('click', () => {
        if (onDaySelect) onDaySelect(day.dayNumber);
      });
      daytimeAltMarker.addTo(mapRef.current!);
      markersRef.current.push(daytimeAltMarker);

      // Nighttime Main Activity
      const nighttimeMainMarker = L.marker(
        [day.nighttimeActivityLocation.lat, day.nighttimeActivityLocation.lng],
        { icon: createActivityMarkerIcon('nighttime', true, day.selectedNighttimeActivity === 'main') }
      );
      nighttimeMainMarker.bindPopup(
        createPopupContent(
          'Nighttime Activity',
          day.nighttimeActivity,
          day.nighttimeActivityType,
          day.nighttimeActivityDuration,
          day.nighttimeActivityLocation,
          day.nighttimeActivityPrice,
          day.selectedNighttimeActivity === 'main',
          false
        ),
        { closeButton: true, className: 'custom-popup' }
      );
      nighttimeMainMarker.on('click', () => {
        if (onDaySelect) onDaySelect(day.dayNumber);
      });
      nighttimeMainMarker.addTo(mapRef.current!);
      markersRef.current.push(nighttimeMainMarker);

      // Nighttime Alternative Activity
      const nighttimeAltMarker = L.marker(
        [day.nighttimeAlternativeActivityLocation.lat, day.nighttimeAlternativeActivityLocation.lng],
        { icon: createActivityMarkerIcon('nighttime', false, day.selectedNighttimeActivity === 'alternative') }
      );
      nighttimeAltMarker.bindPopup(
        createPopupContent(
          'Nighttime Activity',
          day.nighttimeAlternativeActivity,
          day.nighttimeAlternativeActivityType,
          day.nighttimeAlternativeActivityDuration,
          day.nighttimeAlternativeActivityLocation,
          day.nighttimeAlternativeActivityPrice,
          day.selectedNighttimeActivity === 'alternative',
          true
        ),
        { closeButton: true, className: 'custom-popup' }
      );
      nighttimeAltMarker.on('click', () => {
        if (onDaySelect) onDaySelect(day.dayNumber);
      });
      nighttimeAltMarker.addTo(mapRef.current!);
      markersRef.current.push(nighttimeAltMarker);

      // Draw connection line between selected activities
      const selectedDaytimeLoc = day.selectedDaytimeActivity === 'main'
        ? day.daytimeActivityLocation
        : day.daytimeAlternativeActivityLocation;
      const selectedNighttimeLoc = day.selectedNighttimeActivity === 'main'
        ? day.nighttimeActivityLocation
        : day.nighttimeAlternativeActivityLocation;

      const routeLine = L.polyline(
        [
          [selectedDaytimeLoc.lat, selectedDaytimeLoc.lng],
          [selectedNighttimeLoc.lat, selectedNighttimeLoc.lng],
        ],
        {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      );
      routeLine.addTo(mapRef.current!);
      linesRef.current.push(routeLine);

      // Build coordinates array for bounds
      const dayCoords: [number, number][] = [
        [day.daytimeActivityLocation.lat, day.daytimeActivityLocation.lng],
        [day.daytimeAlternativeActivityLocation.lat, day.daytimeAlternativeActivityLocation.lng],
        [day.nighttimeActivityLocation.lat, day.nighttimeActivityLocation.lng],
        [day.nighttimeAlternativeActivityLocation.lat, day.nighttimeAlternativeActivityLocation.lng],
      ];

      // Add hotel marker if hotel location is set
      if (hotelLocation && hotelLocation.lat !== 0 && hotelLocation.lng !== 0) {
        const hotelMarker = L.marker(
          [hotelLocation.lat, hotelLocation.lng],
          { icon: createHotelMarkerIcon() }
        );
        hotelMarker.bindPopup(
          `<div style="min-width: 200px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 4px;">${hotelLocation.name || 'Your Hotel'}</div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${hotelLocation.address || ''}</div>
          </div>`,
          { closeButton: true, className: 'custom-popup' }
        );
        hotelMarker.addTo(mapRef.current!);
        markersRef.current.push(hotelMarker);

        // Draw route from hotel to daytime activity
        const hotelToDaytimeRoute = L.polyline(
          [
            [hotelLocation.lat, hotelLocation.lng],
            [selectedDaytimeLoc.lat, selectedDaytimeLoc.lng],
          ],
          {
            color: '#ef4444',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5',
          }
        );
        hotelToDaytimeRoute.addTo(mapRef.current!);
        linesRef.current.push(hotelToDaytimeRoute);

        // Draw route from daytime to nighttime activity
        const daytimeToNighttimeRoute = L.polyline(
          [
            [selectedDaytimeLoc.lat, selectedDaytimeLoc.lng],
            [selectedNighttimeLoc.lat, selectedNighttimeLoc.lng],
          ],
          {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
          }
        );
        daytimeToNighttimeRoute.addTo(mapRef.current!);
        linesRef.current.push(daytimeToNighttimeRoute);

        // Add hotel coordinates to bounds
        dayCoords.push([hotelLocation.lat, hotelLocation.lng]);
      }

      // Fit bounds to show all markers for this day
      const bounds = L.latLngBounds(dayCoords);
      mapRef.current.fitBounds(bounds, { padding: [60, 60] });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [itinerary, selectedDay, onDaySelect, numberOfTravelers, hotelLocation]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-white/90 to-transparent p-3 pointer-events-none">
        <h3 className="font-semibold text-gray-800 text-sm">{destination}</h3>
        <p className="text-xs text-gray-600">
          Day {selectedDay || 1} - {itinerary.length} day{itinerary.length > 1 ? 's' : ''} total
        </p>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[400px] md:h-[500px]"
        style={{ background: '#e5e7eb' }}
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <p className="text-xs font-medium text-gray-700 mb-2">Activities</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: '#f59e0b', backgroundColor: '#fef3c7' }}
              />
              <span className="text-xs text-gray-600">Daytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded border-2"
                style={{ borderColor: '#6366f1', backgroundColor: '#e0e7ff' }}
              />
              <span className="text-xs text-gray-600">Nighttime</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#059669' }}
              />
              <span className="text-xs text-gray-600">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border-2 border-dashed"
                style={{ borderColor: '#9ca3af' }}
              />
              <span className="text-xs text-gray-600">Alternative</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
