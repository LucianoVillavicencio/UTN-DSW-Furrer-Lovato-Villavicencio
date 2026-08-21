import Navbar from '../../components/layout/Navbar';
import NotFoundSection from '../../components/not-found/NotFoundSection';
import Footer from '../../components/layout/Footer';

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <NotFoundSection />
      </main>
      <Footer />
    </div>
  );
}

export default NotFound;
