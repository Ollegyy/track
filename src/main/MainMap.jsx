import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import useFeatures from '../common/util/useFeatures';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapCamera from '../map/MapCamera';
import MapMarkers from '../map/MapMarkers';
import dayjs from 'dayjs';
import { formatTime, formatNumericHours } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick, routePositions = [] }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  const onMarkerClick = useCallback((_, deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

  const stopMarkers = useMemo(() => {
    const markers = [];
    if (!routePositions || routePositions.length < 2) return markers;

    const thresholdMs = 5 * 60 * 1000;
    const thresholdDistanceM = 10; // tolerance for GPS jitter

    const toRad = (deg) => (deg * Math.PI) / 180;
    const distanceMeters = (lat1, lon1, lat2, lon2) => {
      const R = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let i = 0;
    while (i < routePositions.length) {
      const anchorLat = routePositions[i].latitude;
      const anchorLon = routePositions[i].longitude;
      const startFix = routePositions[i].fixTime;
      const startTime = dayjs(startFix).valueOf();
      let j = i + 1;
      while (
        j < routePositions.length &&
        distanceMeters(routePositions[j].latitude, routePositions[j].longitude, anchorLat, anchorLon) <= thresholdDistanceM
      ) {
        j += 1;
      }
      const endFix = routePositions[j - 1].fixTime;
      const endTime = dayjs(endFix).valueOf();
      const durationMs = endTime - startTime;
      if (durationMs >= thresholdMs) {
        const popupHtml = `
          <div style="min-width:180px">
            <div><strong>${formatTime(startFix, 'minutes')}</strong> — <strong>${formatTime(endFix, 'minutes')}</strong></div>
            <div>${formatNumericHours(durationMs, t)}</div>
          </div>`;
        markers.push({ latitude: anchorLat, longitude: anchorLon, image: 'parking-raw', popupHtml });
      }
      i = j;
    }
    return markers;
  }, [routePositions, t]);

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes />
        {routePositions && routePositions.length > 1 && (
          <>
            <MapRoutePath positions={routePositions} />
            <MapRoutePoints positions={routePositions} showSpeedControl />
            <MapMarkers
              markers={[
                {
                  latitude: routePositions[0].latitude,
                  longitude: routePositions[0].longitude,
                  image: 'start-success',
                },
                {
                  latitude: routePositions[routePositions.length - 1].latitude,
                  longitude: routePositions[routePositions.length - 1].longitude,
                  image: 'finish-error',
                },
              ]}
            />
            {stopMarkers.length > 0 && (
              <MapMarkers markers={stopMarkers} enablePopup />
            )}
            <MapCamera positions={routePositions} />
          </>
        )}
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
        />
        <MapDefaultCamera />
        {!routePositions || routePositions.length <= 1 ? (
          <MapSelectedDevice />
        ) : null}
        <PoiMap />
      </MapView>
      <MapScale />
      <MapCurrentLocation />
      <MapGeocoder />
      {!features.disableEvents && (
        <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
      )}
      {desktop && (
        <MapPadding start={parseInt(theme.dimensions.drawerWidthDesktop, 10) + parseInt(theme.spacing(1.5), 10)} />
      )}
    </>
  );
};

export default MainMap;
