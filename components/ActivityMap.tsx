import React, { useEffect, useRef, useState } from 'react';
import { getNearbyMapActivities, MapMarker } from '@/services/nearbyActivityService';
import { LoaderIcon } from '@/components/icons/Icons';

declare const L: any;

interface ActivityMapProps {
    latitude: number;
    longitude: number;
}

export const ActivityMap: React.FC<ActivityMapProps> = ({ latitude, longitude }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Dynamically load Leaflet resources from CDN
    useEffect(() => {
        let isMounted = true;

        const loadLeaflet = async () => {
            try {
                // Insert Leaflet stylesheet if not already present
                if (!document.getElementById('leaflet-css-cdn')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css-cdn';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                // Insert Leaflet JS script if not already present
                if (!document.getElementById('leaflet-js-cdn')) {
                    const script = document.createElement('script');
                    script.id = 'leaflet-js-cdn';
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.async = true;
                    script.onload = () => {
                        if (isMounted) setLeafletLoaded(true);
                    };
                    script.onerror = () => {
                        if (isMounted) setError("Failed to load map library.");
                    };
                    document.head.appendChild(script);
                } else {
                    // Script was already appended, check if global L is available
                    if (typeof L !== 'undefined') {
                        setLeafletLoaded(true);
                    } else {
                        // Wait a bit if it was appended but not fully initialized
                        const interval = setInterval(() => {
                            if (typeof L !== 'undefined') {
                                clearInterval(interval);
                                if (isMounted) setLeafletLoaded(true);
                            }
                        }, 100);
                        return () => clearInterval(interval);
                    }
                }
            } catch (e) {
                console.error("Error setting up Leaflet scripts:", e);
                if (isMounted) setError("Error loading map scripts.");
            }
        };

        loadLeaflet();

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. Fetch nearby places and activities from the service
    useEffect(() => {
        let isMounted = true;
        
        const fetchPlaces = async () => {
            try {
                setLoading(true);
                const data = await getNearbyMapActivities(latitude, longitude);
                if (isMounted) {
                    setMarkers(data);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Error fetching map suggestions:", e);
                if (isMounted) {
                    setError("Failed to find nearby places.");
                    setLoading(false);
                }
            }
        };

        fetchPlaces();

        return () => {
            isMounted = false;
        };
    }, [latitude, longitude]);

    // 3. Initialize map and render pins
    useEffect(() => {
        if (!leafletLoaded || loading || !mapContainerRef.current) return;

        // Clean up previous map instance to prevent target container duplicate initialization errors
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        try {
            // Setup Map centered at user's latitude and longitude
            const map = L.map(mapContainerRef.current, {
                zoomControl: true,
                attributionControl: true
            }).setView([latitude, longitude], 14);
            
            mapInstanceRef.current = map;

            // Load Tile Layer from OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            }).addTo(map);

            // Add User Marker (pulsing blue pin)
            const userIcon = L.divIcon({
                className: 'leaflet-user-marker',
                html: `<div class="relative flex items-center justify-center">
                    <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
                </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            L.marker([latitude, longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup('<div class="font-sans font-bold text-xs text-[#1A1815] py-0.5 px-1">You are here</div>')
                .openPopup();

            // Render suggested activity pins
            markers.forEach((marker) => {
                let emoji = '📍';
                let bgClass = 'bg-gray-500';
                
                if (marker.category === 'walk') {
                    emoji = '🌳';
                    bgClass = 'bg-green-600 dark:bg-green-700';
                } else if (marker.category === 'cafe') {
                    emoji = '☕';
                    bgClass = 'bg-amber-500 dark:bg-amber-600';
                } else if (marker.category === 'social') {
                    emoji = '👥';
                    bgClass = 'bg-purple-600 dark:bg-purple-700';
                }

                // Beautiful standard HTML divIcon with shadow and scale effect
                const activityIcon = L.divIcon({
                    className: 'leaflet-activity-marker',
                    html: `<div class="w-8 h-8 ${bgClass} rounded-full border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-sm transform hover:scale-110 hover:shadow-lg transition-all cursor-pointer">${emoji}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const distanceText = marker.distance >= 1000 
                    ? `${(marker.distance / 1000).toFixed(1)} km` 
                    : `${marker.distance} m`;

                const popupContent = `
                    <div class="p-1 font-sans text-ios-text max-w-[220px]">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <span class="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-ios-bg dark:bg-gray-700 text-ios-muted border border-ios-border dark:border-gray-600">${marker.category.toUpperCase()}</span>
                            <span class="text-[9px] font-medium text-ios-muted">${distanceText} away</span>
                        </div>
                        <h4 class="font-serif italic font-bold text-sm text-[#1A1815] dark:text-white leading-tight mb-1.5">${marker.title}</h4>
                        <p class="text-xs text-ios-muted dark:text-gray-300 leading-relaxed mb-2.5">${marker.description}</p>
                        <a href="https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-full px-3 py-2 bg-[#1A1815] hover:bg-black/80 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.15em] transition-colors no-underline">
                            Get Directions →
                        </a>
                    </div>
                `;

                L.marker([marker.latitude, marker.longitude], { icon: activityIcon })
                    .addTo(map)
                    .bindPopup(popupContent, {
                        closeButton: false,
                        offset: L.point(0, -5)
                    });
            });

        } catch (e) {
            console.error("Leaflet map rendering error:", e);
            setError("Unable to render the map map container.");
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [leafletLoaded, loading, markers, latitude, longitude]);

    if (error) {
        return (
            <div className="w-full h-80 bg-ios-card dark:bg-gray-800 rounded-3xl border border-ios-border dark:border-gray-700 flex flex-col items-center justify-center p-6 text-center text-red-500">
                <p className="text-xs font-bold uppercase tracking-widest mb-2">Map Error</p>
                <p className="text-sm text-ios-muted dark:text-gray-400 leading-relaxed">{error}</p>
            </div>
        );
    }

    if (!leafletLoaded || loading) {
        return (
            <div className="w-full h-80 bg-ios-card dark:bg-gray-800 rounded-3xl border border-ios-border dark:border-gray-700 flex flex-col items-center justify-center text-ios-muted">
                <LoaderIcon className="w-8 h-8 mb-4 text-ios-accent" />
                <p className="text-[10px] uppercase tracking-widest font-bold">Curation in progress...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="w-full h-80 rounded-3xl border border-ios-border dark:border-gray-700 overflow-hidden shadow-sm relative z-10">
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            
            {/* Quick legend info for categories */}
            <div className="flex gap-4 justify-center text-[9px] font-bold uppercase tracking-wider text-ios-muted px-2">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
                    <span>Walks & Parks</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Cafes</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>Meetups & Socials</span>
                </div>
            </div>
        </div>
    );
};
