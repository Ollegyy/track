import { useEffect } from 'react';
import { useTheme } from '@mui/material';
import { map } from '../core/MapView';
import { MeasureControl } from './MeasureControl';

const MapMeasure = () => {
  const theme = useTheme();

  useEffect(() => {
    const control = new MeasureControl();
    map.addControl(control, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(control);
    };
  }, [theme.direction]);

  return null;
};

export default MapMeasure;