import { useCallback } from 'react';
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


import {
  IconButton, Paper, Slider, Toolbar, Typography,
} from '@mui/material';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import BackIcon from '../common/components/BackIcon';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useNavigate } from 'react-router-dom';
import {
  useState, useEffect, useRef,
} from 'react';
import { useCatch } from '../reactHelper';
import { makeStyles } from 'tss-react/mui';

import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import { formatTime } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import MapCamera from '../map/MapCamera';
import StatusCard from '../common/components/StatusCard';




const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
}));


const MainMap = ({ filteredPositions, selectedPosition, onEventsClick, todayPositions }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  const onMarkerClick = useCallback((_, deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

{/*************************начало новых const**********************************/}
{/*
const t = useTranslation();
  
  const navigate = useNavigate();
  const timerRef = useRef();

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const [from, setFrom] = useState();
  const [to, setTo] = useState();
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((index) => index + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = useCallback((_, index) => {
    setIndex(index);
  }, [setIndex]);

  
  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    setLoading(true);
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    const query = new URLSearchParams({ deviceId, from, to });
    try {
      const response = await fetch(`/api/positions?${query.toString()}`);
      if (response.ok) {
        setIndex(0);
        const positions = await response.json();
        setPositions(positions);
        if (positions.length) {
          setExpanded(false);
        } else {
          throw Error(t('sharedNoData'));
        }
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
    };
    */}
{/*****************************конец новых const******************************* */}

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes />
        {todayPositions && todayPositions.length > 1 && (
          <>
            <MapRoutePath positions={todayPositions} />
            <MapRoutePoints positions={todayPositions} />
          </>
        )}
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
        />
        <MapDefaultCamera />
        {todayPositions && todayPositions.length > 1 && (
          <MapCamera positions={todayPositions} />
        )}
        <MapSelectedDevice />
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