import maplibregl from 'maplibre-gl';

export class MeasureControl {
  constructor(onToggle) {
    this._onToggle = onToggle;
    this._container = null;
    this._active = false;
    this._points = [];
    this._layerId = `measure-line-${Math.random().toString(36).slice(2)}`;
    this._sourceId = `measure-src-${Math.random().toString(36).slice(2)}`;
    this._clickHandler = this._handleClick.bind(this);
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
  }

  _handleClick(e) {
    const { lng, lat } = e.lngLat;
    this._points.push([lng, lat]);
    this._update();
  }

  _update() {
    const map = this._map;
    const coords = this._points;
    const fc = {
      type: 'FeatureCollection',
      features: [],
    };
    if (coords.length >= 2) {
      fc.features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
      });
    }
    map.getSource(this._sourceId)?.setData(fc);
  }
}