import { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Dumbbell,
  Users as UsersIcon,
  CalendarClock,
  CreditCard,
  Receipt,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Container from '../../components/common/Container';
import DashboardTabs, {
  type DashboardTab,
} from '../../components/dashboard/DashboardTabs';
import ResumenTab from '../../components/admin/ResumenTab';
import ClassesSection from '../../components/admin/ClassesSection';
import ClassSessionsSection from '../../components/admin/ClassSessionsSection';
import TrainersSection from '../../components/admin/TrainersSection';
import PlansSection from '../../components/admin/PlansSection';
import UsersSection from '../../components/admin/UsersSection';
import AdminPaymentsSection from '../../components/admin/AdminPaymentsSection';

const TABS: DashboardTab[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'clases', label: 'Clases', icon: Dumbbell },
  { id: 'turnos', label: 'Turnos', icon: CalendarClock },
  { id: 'entrenadores', label: 'Entrenadores', icon: UsersIcon },
  { id: 'planes', label: 'Planes', icon: CreditCard },
  { id: 'usuarios', label: 'Usuarios', icon: UsersIcon },
  { id: 'pagos', label: 'Pagos presenciales', icon: Receipt },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('resumen');

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-bg-secondary py-10">
          <Container className="flex items-center gap-4">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/70"
              />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-text">
                Panel de administración
              </h1>
              <p className="font-body text-sm text-text-muted">
                Gestión de clases, turnos, entrenadores, planes, usuarios y
                pagos presenciales.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-12">
          <Container className="flex flex-col gap-8 md:flex-row">
            <div className="md:shrink-0">
              <DashboardTabs
                tabs={TABS}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <Link
                to="/"
                className="mt-4 hidden items-center gap-2 px-4 py-2 font-body text-sm text-text-muted hover:text-primary md:flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al sitio
              </Link>
            </div>

            <div className="min-w-0 flex-1">
              {activeTab === 'resumen' && <ResumenTab />}
              {activeTab === 'clases' && <ClassesSection />}
              {activeTab === 'turnos' && <ClassSessionsSection />}
              {activeTab === 'entrenadores' && <TrainersSection />}
              {activeTab === 'planes' && <PlansSection />}
              {activeTab === 'usuarios' && <UsersSection />}
              {activeTab === 'pagos' && <AdminPaymentsSection />}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
