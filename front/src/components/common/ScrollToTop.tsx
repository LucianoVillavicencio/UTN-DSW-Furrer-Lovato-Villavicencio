import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  // Scrolls to the URL anchor, or to the top, on every navigation.
  useEffect(() => {
    // URL with an anchor (/#pase-gratis): scroll to that section.
    // scroll-padding-top in index.css keeps it clear of the sticky navbar.
    if (hash) {
      const target = document.getElementById(
        decodeURIComponent(hash.slice(1)),
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    // New page without an anchor: jump to the top instantly. 'instant' is
    // explicit so the smooth scrolling from index.css doesn't animate every
    // page change.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
};