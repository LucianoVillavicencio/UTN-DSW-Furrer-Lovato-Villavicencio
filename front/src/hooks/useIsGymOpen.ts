import { useEffect, useState } from 'react';
import { isGymOpen } from '../utils/gym-hours';
 
/**
 * Open/closed state that re-checks every minute, so the light flips on its
 * own at opening and closing time if someone leaves the page open.
 */
export const useIsGymOpen = (): boolean => {
  const [isOpen, setIsOpen] = useState(() => isGymOpen());
 
  // Re-evaluates whether the gym is open every minute.
  useEffect(() => {
    const id = window.setInterval(() => setIsOpen(isGymOpen()), 60_000);
    return () => window.clearInterval(id);
  }, []);
 
  return isOpen;
};