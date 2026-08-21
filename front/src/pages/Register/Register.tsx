import Navbar from '../../components/layout/Navbar';
import RegisterSection from '../../components/register/RegisterSection';
import Footer from '../../components/layout/Footer';

function Register() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <RegisterSection />
      </main>
      <Footer />
    </div>
  );
}

export default Register;
