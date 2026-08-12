export interface PlanFeature {
  label: string;
  available: boolean;
}

export interface MembershipPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  highlight: boolean;
  features: PlanFeature[];
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    name: "Básico",
    description: "Perfecto para empezar tu camino fitness",
    price: "$29",
    period: "/mes",
    highlight: false,
    features: [
      { label: "Acceso 24/7 al gimnasio", available: true },
      { label: "Cardio y equipamiento de fuerza", available: true },
      { label: "Acceso a vestuarios", available: true },
      { label: "Evaluación física gratis", available: true },
      { label: "Acceso a la app móvil", available: true },
      { label: "Clases grupales", available: false },
      { label: "Sesiones de entrenamiento personal", available: false },
      { label: "Coaching nutricional", available: false },
      { label: "Pases para invitados", available: false },
      { label: "Servicio de toallas", available: false },
    ],
  },
  {
    name: "Premium",
    description: "Nuestro plan más popular con todo lo que necesitás",
    price: "$59",
    period: "/mes",
    highlight: true,
    features: [
      { label: "Todo en Básico", available: true },
      { label: "Clases grupales ilimitadas", available: true },
      { label: "2 sesiones de entrenamiento personal/mes", available: true },
      { label: "Consulta de nutrición", available: true },
      { label: "Pases para invitados (2/mes)", available: true },
      { label: "Servicio de toallas", available: true },
      { label: "Acceso a zona de recuperación", available: true },
      { label: "Descuentos en barra de nutrición", available: true },
      { label: "Entrenamiento personal ilimitado", available: false },
      { label: "Terapia de masajes", available: false },
    ],
  },
  {
    name: "Elite",
    description: "Experiencia fitness definitiva con beneficios premium",
    price: "$99",
    period: "/mes",
    highlight: false,
    features: [
      { label: "Todo en Premium", available: true },
      { label: "Entrenamiento personal ilimitado", available: true },
      { label: "Reservas prioritarias de clases", available: true },
      { label: "Terapia de masajes (1/mes)", available: true },
      { label: "Pases ilimitados para invitados", available: true },
      { label: "Locker premium", available: true },
      { label: "Programa de coaching nutricional", available: true },
      { label: "Eventos exclusivos para socios", available: true },
      { label: "Descuentos en suplementos", available: true },
    ],
  },
];
