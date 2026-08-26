import Navbar from '../../components/layout/Navbar';
import CompleteProfileSection from '../../components/complete-profile/CompleteProfileSection';
import Footer from '../../components/layout/Footer';

function CompleteProfile() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <CompleteProfileSection />
      </main>
      <Footer />
    </div>
  );
}

export default CompleteProfile;
