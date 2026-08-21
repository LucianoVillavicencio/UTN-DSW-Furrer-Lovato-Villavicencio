import { Outlet } from 'react-router-dom';
import { ScrollToTop } from '../components/common/ScrollToTop';

// Wraps every route: ScrollToTop resets the scroll position on navigation.
const RootLayout = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

export default RootLayout;
