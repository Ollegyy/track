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
      const features = map.queryRenderedFeatures(event.point, { layers: [id] });
      const feature = features && features[0];
      console.log('MapMarkers click', { layerId: id, features, featureProps: feature?.properties });
      if (!feature) return;
      const coordinates = feature.geometry.coordinates.slice();
      let html = feature.properties?.popupHtml;
      if (!html) {
        const sFix = feature.properties?.sFix;
        const eFix = feature.properties?.eFix;
        const dMs = feature.properties?.dMs;
        if (sFix && eFix && dMs != null) {
          html = `<div><div><strong>${sFix}</strong> — <strong>${eFix}</strong></div><div>${Math.floor(dMs / 60000)} min</div></div>`;
        }
      }
      console.log('MapMarkers popup content', { hasHtml: !!html, html, coords: coordinates });
      if (!html) return;
      if (popup) popup.remove();
      const container = document.createElement('div');
      container.style.padding = '8px';
      container.style.color = '#000';
      container.style.font = '12px sans-serif';
      container.style.border = '1px solid #1976d2';
      container.style.borderRadius = '6px';
      container.innerHTML = html;
      popup = new maplibregl.Popup({ closeOnClick: true, closeOnMove: true })
        .setLngLat(coordinates)
        .setDOMContent(container)
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
    console.log('MapMarkers setData', { layerId: id, markerCount: markers?.length || 0, sample: markers && markers[0] });
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: markers.map(({ latitude, longitude, image, title, popupHtml, sFix, eFix, dMs }) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          image: image || 'default-neutral',
          title: title || '',
          popupHtml: popupHtml || '',
          sFix: sFix || '',
          eFix: eFix || '',
          dMs: dMs != null ? dMs : '',
        },
      })),
    });
  }, [showTitles, markers]);

  return null;
};

export default MapMarkers;
