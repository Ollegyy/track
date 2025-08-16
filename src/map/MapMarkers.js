import { useId, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';
import maplibregl from 'maplibre-gl';

const MapMarkers = ({ markers, showTitles, enablePopup }) => {
  const id = useId();

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    if (showTitles) {
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'text-field': '{title}',
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2 * iconScale],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });
    } else {
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
        },
      });
    }

    let popup;
    const onClick = (event) => {
      if (!enablePopup) return;
      const feature = event.features?.[0];
      if (!feature) return;
      const coordinates = feature.geometry.coordinates.slice();
      const html = feature.properties?.popupHtml;
      if (!html) return;
      if (popup) popup.remove();
      popup = new maplibregl.Popup({ closeOnClick: true, closeOnMove: true })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    };

    if (enablePopup) {
      map.on('click', id, onClick);
    }

    return () => {
      if (enablePopup) {
        map.off('click', id, onClick);
      }
      if (popup) popup.remove();
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [showTitles, enablePopup]);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: markers.map(({ latitude, longitude, image, title, popupHtml }) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          image: image || 'default-neutral',
          title: title || '',
          popupHtml: popupHtml || '',
        },
      })),
    });
  }, [showTitles, markers]);

  return null;
};

export default MapMarkers;
