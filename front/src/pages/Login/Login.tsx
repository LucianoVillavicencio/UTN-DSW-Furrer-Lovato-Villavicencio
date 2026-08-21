import Navbar from '../../components/layout/Navbar';
import LoginSection from '../../components/login/LoginSection';
import Footer from '../../components/layout/Footer';

function Login() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center my-auto">
        <LoginSection />
      </main>
      <Footer />
    </div>
  );
}

export default Login;
