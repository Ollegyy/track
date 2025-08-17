import {
  useState, useCallback, useEffect,
} from 'react';
import { Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import MainMap from './MainMap';
import { useAttributePreference } from '../common/util/preferences';
import dayjs from 'dayjs';
import { geofenceToFeature } from '../map/core/mapUtil';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: 0,
      top: 0,
      height: `calc(100% - ${theme.spacing(3)})`,
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
      width: '100%',
    },
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
  },
}));

// Point-in-polygon helpers (ray casting)
const pointInRing = (lon, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (lon, lat, geometry) => {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates;
    if (!pointInRing(lon, lat, outer)) return false;
    return !holes.some((hole) => pointInRing(lon, lat, hole));
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => {
      const [outer, ...holes] = poly;
      if (!pointInRing(lon, lat, outer)) return false;
      return !holes.some((hole) => pointInRing(lon, lat, hole));
    });
  }
  return false;
};

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const geofences = useSelector((state) => state.geofences.items);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId);

  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);

  const [routePositions, setRoutePositions] = useState([]);
  const [dailyDistanceMeters, setDailyDistanceMeters] = useState(null);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (selectedDeviceId) {
        const from = dayjs().startOf('day').toISOString();
        const to = dayjs().toISOString();
        const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
        try {
          const response = await fetch(`/api/positions?${query.toString()}`, { signal: controller.signal });
          if (response.ok) {
            const positions = await response.json();
            setRoutePositions(Array.isArray(positions) ? positions : []);
          } else {
            setRoutePositions([]);
          }
        } catch (e) {
          setRoutePositions([]);
        }
      } else {
        setRoutePositions([]);
      }
    })();
    return () => controller.abort();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (routePositions && routePositions.length >= 2) {
      const geofencePolygons = Object.values(geofences)
        .filter((gf) => !gf.attributes?.hide)
        .map((gf) => geofenceToFeature(theme, gf))
        .map((f) => f.geometry);

      let distance = 0;
      for (let i = 1; i < routePositions.length; i += 1) {
        const prev = routePositions[i - 1];
        const curr = routePositions[i];
        const segMeters = typeof curr?.attributes?.distance === 'number' ? curr.attributes.distance : 0;
        if (segMeters <= 0) continue;
        const midLat = (prev.latitude + curr.latitude) / 2;
        const midLon = (prev.longitude + curr.longitude) / 2;
        const inside = geofencePolygons.some((geom) => pointInPolygon(midLon, midLat, geom));
        if (!inside) {
          distance += segMeters;
        }
      }
      setDailyDistanceMeters(distance);
    } else {
      setDailyDistanceMeters(null);
    }
  }, [routePositions, geofences, theme]);

  useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  return (
    <div className={classes.root}>
      {desktop && (
        <MainMap
          filteredPositions={filteredPositions}
          selectedPosition={selectedPosition}
          onEventsClick={onEventsClick}
          routePositions={routePositions}
        />
      )}
      <div className={classes.sidebar}>
        <Paper square elevation={3} className={classes.header}>
          <MainToolbar
            filteredDevices={filteredDevices}
            devicesOpen={devicesOpen}
            setDevicesOpen={setDevicesOpen}
            keyword={keyword}
            setKeyword={setKeyword}
            filter={filter}
            setFilter={setFilter}
            filterSort={filterSort}
            setFilterSort={setFilterSort}
            filterMap={filterMap}
            setFilterMap={setFilterMap}
          />
        </Paper>
        <div className={classes.middle}>
          {!desktop && (
            <div className={classes.contentMap}>
              <MainMap
                filteredPositions={filteredPositions}
                selectedPosition={selectedPosition}
                onEventsClick={onEventsClick}
                routePositions={routePositions}
              />
            </div>
          )}
          <Paper square className={classes.contentList} style={devicesOpen ? {} : { visibility: 'hidden' }}>
            <DeviceList devices={filteredDevices} />
          </Paper>
        </div>
        {desktop && (
          <div className={classes.footer}>
            <BottomMenu />
          </div>
        )}
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={theme.dimensions.drawerWidthDesktop}
          dailyDistanceMeters={dailyDistanceMeters}
        />
      )}
    </div>
  );
};

export default MainPage;
