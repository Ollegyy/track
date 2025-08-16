import { findFonts } from '../core/mapUtil';

export class MeasureControl {
  constructor(onToggle) {
    this._onToggle = onToggle;
    this._container = null;
    this._active = false;
    this._points = [];
    this._layerId = `measure-line-${Math.random().toString(36).slice(2)}`;
    this._sourceId = `measure-src-${Math.random().toString(36).slice(2)}`;
    this._labelLayerId = `measure-labels-${Math.random().toString(36).slice(2)}`;
    this._labelSourceId = `measure-labels-src-${Math.random().toString(36).slice(2)}`;
    this._clickHandler = this._handleClick.bind(this);
    this._finish = this._finish.bind(this);
  }

  onAdd(map) {
    this._map = map;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Измерить расстояние';
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.border = 'none';
    btn.style.background = '#fff';
    btn.style.borderRadius = '4px';
    btn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    btn.style.cursor = 'pointer';
    btn.innerText = '📏';
    btn.onclick = () => this.toggle();

    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    container.appendChild(btn);
    this._container = container;
    return container;
  }

  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._container = null;
    this._deactivate();
    this._map = null;
  }

  toggle() {
    this._active ? this._deactivate() : this._activate();
    if (this._onToggle) this._onToggle(this._active);
  }

  _activate() {
    this._active = true;
    this._points = [];
    const map = this._map;
    map.getCanvas().style.cursor = 'crosshair';

    map.addSource(this._sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: this._layerId,
      type: 'line',
      source: this._sourceId,
      paint: {
        'line-color': '#1976d2',
        'line-width': 3,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    });

    map.addSource(this._labelSourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: this._labelLayerId,
      type: 'symbol',
      source: this._labelSourceId,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-font': findFonts(map),
        'text-allow-overlap': true,
        'text-anchor': 'top',
        'text-offset': [0, 0.6],
      },
      paint: {
        'text-color': '#000',
        'text-halo-color': '#fff',
        'text-halo-width': 1,
      },
    });

    map.on('click', this._clickHandler);
    map.getCanvas().addEventListener('dblclick', this._finish, { once: true });
  }

  _deactivate() {
    this._active = false;
    const map = this._map;
    map.getCanvas().style.cursor = '';
    map.off('click', this._clickHandler);
    if (map.getLayer(this._layerId)) map.removeLayer(this._layerId);
    if (map.getSource(this._sourceId)) map.removeSource(this._sourceId);
    if (map.getLayer(this._labelLayerId)) map.removeLayer(this._labelLayerId);
    if (map.getSource(this._labelSourceId)) map.removeSource(this._labelSourceId);
  }

  _finish() {
    // End measuring; keep the drawing, or deactivate to clear
    this._deactivate();
  }

  _handleClick(e) {
    const { lng, lat } = e.lngLat;
    this._points.push([lng, lat]);
    this._update();
  }

  _haversineMeters(a, b) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  _update() {
    const map = this._map;
    const coords = this._points;

    const lineFC = { type: 'FeatureCollection', features: [] };
    if (coords.length >= 2) {
      lineFC.features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
    }
    map.getSource(this._sourceId)?.setData(lineFC);

    // Build labels: per-segment lengths and total at the end
    const labelFeatures = [];
    let totalMeters = 0;
    for (let i = 1; i < coords.length; i += 1) {
      const a = coords[i - 1];
      const b = coords[i];
      const distM = this._haversineMeters(a, b);
      totalMeters += distM;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      labelFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: mid },
        properties: { label: `${(distM / 1000).toFixed(2)} km` },
      });
    }
    if (coords.length >= 2) {
      const last = coords[coords.length - 1];
      labelFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: last },
        properties: { label: `Σ ${(totalMeters / 1000).toFixed(2)} km` },
      });
    }
    const labelFC = { type: 'FeatureCollection', features: labelFeatures };
    map.getSource(this._labelSourceId)?.setData(labelFC);
  }
}