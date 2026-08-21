import { useState } from 'react';
import { LayoutDashboard, UserCog, CreditCard, Receipt } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageHeader from '../../components/common/PageHeader';
import Container from '../../components/common/Container';
import DashboardTabs, {
  type DashboardTab,
} from '../../components/dashboard/DashboardTabs';
import OverviewSection from '../../components/dashboard/OverviewSection';
import ProfileForm from '../../components/dashboard/ProfileForm';
import PlanSection from '../../components/dashboard/PlanSection';
import PaymentsSection from '../../components/dashboard/PaymentsSection';

const TABS: DashboardTab[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'datos', label: 'Datos personales', icon: UserCog },
  { id: 'plan', label: 'Mi plan', icon: CreditCard },
  { id: 'pagos', label: 'Historial de pagos', icon: Receipt },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('resumen');

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1">
        <PageHeader
          badge="Mi cuenta"
          icon={UserCog}
          title="Gestioná tu cuenta"
          subtitle="Actualizá tus datos, revisá tu plan y llevá el control de tus pagos."
        />

        <section className="bg-background py-12 lg:py-16">
          <Container className="flex flex-col gap-8 md:flex-row">
            <DashboardTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="min-w-0 flex-1">
              {activeTab === 'resumen' && (
                <OverviewSection onNavigate={setActiveTab} />
              )}
              {activeTab === 'datos' && <ProfileForm />}
              {activeTab === 'plan' && <PlanSection />}
              {activeTab === 'pagos' && <PaymentsSection />}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
