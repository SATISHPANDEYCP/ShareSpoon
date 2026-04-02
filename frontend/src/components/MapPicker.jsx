import { useState, useRef } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FiMapPin, FiNavigation, FiSearch } from 'react-icons/fi';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const defaultCenter = {
  latitude: 28.6139, // New Delhi
  longitude: 77.2090,
};

/**
 * MapPicker Component
 * Interactive map for selecting location using Mapbox
 */
const MapPicker = ({ location, onLocationChange }) => {
  const mapRef = useRef(null);
  
  const [viewport, setViewport] = useState({
    latitude: location ? location.coordinates[1] : defaultCenter.latitude,
    longitude: location ? location.coordinates[0] : defaultCenter.longitude,
    zoom: 13,
  });

  const [markerPosition, setMarkerPosition] = useState(
    location
      ? { latitude: location.coordinates[1], longitude: location.coordinates[0] }
      : null
  );

  const [currentLocation, setCurrentLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Search address using Mapbox Geocoding API
  const handleAddressSearch = async (query) => {
    setAddress(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  const handleSelectAddress = (feature) => {
    const [lng, lat] = feature.center;
    
    setMarkerPosition({ latitude: lat, longitude: lng });
    setViewport(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      zoom: 15,
    }));
    
    onLocationChange({
      type: 'Point',
      coordinates: [lng, lat],
      address: feature.place_name,
    });
    
    setAddress(feature.place_name);
    setShowResults(false);
  };

  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    
    setMarkerPosition({ latitude: lat, longitude: lng });
    onLocationChange({
      type: 'Point',
      coordinates: [lng, lat],
    });
    
    // Reverse geocode to get address
    reverseGeocode(lng, lat);
  };

  const reverseGeocode = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleMarkerDragEnd = (e) => {
    const { lng, lat } = e.lngLat;
    
    setMarkerPosition({ latitude: lat, longitude: lng });
    onLocationChange({
      type: 'Point',
      coordinates: [lng, lat],
    });
    
    reverseGeocode(lng, lat);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          setCurrentLocation({ latitude, longitude });
          setMarkerPosition({ latitude, longitude });
          setViewport(prev => ({
            ...prev,
            latitude,
            longitude,
            zoom: 15,
          }));
          
          onLocationChange({
            type: 'Point',
            coordinates: [longitude, latitude],
          });
          
          reverseGeocode(longitude, latitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please allow location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-red-600">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Pickup Location
        </label>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <FiNavigation className="w-4 h-4" />
          Use my location
        </button>
      </div>

      {/* Address Search Input */}
      <div className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search address (optional) or click on map"
            value={address}
            onChange={(e) => handleAddressSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectAddress(result)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                         border-b border-gray-200 dark:border-gray-700 last:border-b-0
                         flex items-start gap-2"
              >
                <FiMapPin className="w-4 h-4 mt-1 text-primary-600 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100">{result.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-md">
        <Map
          ref={mapRef}
          {...viewport}
          onMove={e => setViewport(e.viewState)}
          onClick={handleMapClick}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Current Location Marker (Red) */}
          {currentLocation && (
            <Marker
              latitude={currentLocation.latitude}
              longitude={currentLocation.longitude}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-8 h-8 bg-red-500 rounded-full opacity-25 animate-ping"></div>
                <div className="relative w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </Marker>
          )}

          {/* Pickup Location Marker (Green/Draggable) */}
          {markerPosition && (
            <Marker
              latitude={markerPosition.latitude}
              longitude={markerPosition.longitude}
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <div className="relative cursor-move">
                <div className="text-4xl drop-shadow-lg" title="Drag to adjust location">
                  📍
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
        <p>
          <strong>How to select:</strong> Search for an address above, click on the map, or drag the 📍 marker to set pickup location
        </p>
      </div>

      {location && (
        <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2">
          <span className="font-medium">Coordinates:</span>
          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {location.coordinates[1].toFixed(6)}, {location.coordinates[0].toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * MapView Component
 * Display map with markers for food posts using Mapbox
 */
export const MapView = ({ posts, center, onMarkerClick }) => {
  const mapRef = useRef(null);
  
  const mapCenter = center || defaultCenter;
  
  const [viewport, setViewport] = useState({
    latitude: mapCenter.latitude || mapCenter.lat || defaultCenter.latitude,
    longitude: mapCenter.longitude || mapCenter.lng || defaultCenter.longitude,
    zoom: 12,
  });


  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-red-600">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={e => setViewport(e.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        {posts && posts.map((post) => {
          if (!post.pickupLocation?.coordinates) return null;

          const latitude = post.pickupLocation.coordinates[1];
          const longitude = post.pickupLocation.coordinates[0];

          return (
            <Marker
              key={post._id}
              latitude={latitude}
              longitude={longitude}
              onClick={() => onMarkerClick && onMarkerClick(post)}
            >
              <div 
                className="cursor-pointer text-2xl"
                title={post.title}
              >
                🍕
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default MapPicker;
