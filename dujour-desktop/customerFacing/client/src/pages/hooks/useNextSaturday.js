// hooks/useNextSaturday.js
import { useMemo } from 'react';

const useNextSaturday = () => {
  return useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let nextSaturday;
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      nextSaturday = new Date(today.setDate(today.getDate() + (13 - dayOfWeek)));
    } else {
      nextSaturday = new Date(today.setDate(today.getDate() + (6 - dayOfWeek)));
    }
    return nextSaturday;
  }, []);
};

export default useNextSaturday;
