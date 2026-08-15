import type { Plan } from "../../types/plan";

export interface PlanFeature {
  label: string;
  available: boolean;
}

export interface MembershipPlan {
  id?: number;
  name: string;
  description: string;
  price: string;
  numericPrice: number;
  period: string;
  numDays: number;
  highlight: boolean;
  features: PlanFeature[];
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 1,
    name: "Básico",
    description: "Perfecto para empezar tu camino fitness",
    price: "$29",
    numericPrice: 29,
    period: "/mes",
    numDays: 30,
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
    id: 2,
    name: "Premium",
    description: "Nuestro plan más popular con todo lo que necesitás",
    price: "$59",
    numericPrice: 59,
    period: "/mes",
    numDays: 30,
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
    id: 3,
    name: "Elite",
    description: "Experiencia fitness definitiva con beneficios premium",
    price: "$99",
    numericPrice: 99,
    period: "/mes",
    numDays: 30,
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

/**
 * Maps a backend Plan entity to a rich MembershipPlan for the UI.
 */
export function enrichBackendPlan(plan: Plan): MembershipPlan {
  const normName = (plan.name || "").toLowerCase();
  const isPremium = normName.includes("premium") || (!normName.includes("básico") && !normName.includes("basico") && !normName.includes("elite"));
  const isElite = normName.includes("elite") || normName.includes("vip") || normName.includes("pro");
  const isBasic = normName.includes("básico") || normName.includes("basico");

  // Determine features based on plan tier or generate smart features
  let features: PlanFeature[];
  if (isElite) {
    features = [
      { label: "Acceso ilimitado 24/7 a todas las áreas", available: true },
      { label: "Todas las clases grupales ilimitadas", available: true },
      { label: "Entrenamiento personal ilimitado", available: true },
      { label: "Coaching nutricional personalizado", available: true },
      { label: "Acceso prioritario a turnos de clases", available: true },
      { label: "Locker premium y servicio de toallas", available: true },
    ];
  } else if (isBasic) {
    features = [
      { label: "Acceso 24/7 al gimnasio", available: true },
      { label: "Cardio y equipamiento de fuerza", available: true },
      { label: "Acceso a vestuarios", available: true },
      { label: "Evaluación física inicial gratis", available: true },
      { label: "Clases grupales", available: false },
      { label: "Entrenador personal dedicado", available: false },
    ];
  } else {
    // Standard / Premium
    features = [
      { label: "Acceso 24/7 al gimnasio", available: true },
      { label: "Cardio y equipamiento de fuerza", available: true },
      { label: "Clases grupales incluidas", available: true },
      { label: "2 sesiones con entrenador personal/mes", available: true },
      { label: "Seguimiento nutricional", available: true },
      { label: "Entrenamiento personal diario", available: false },
    ];
  }

  const periodStr = plan.numDays === 30 ? "/mes" : plan.numDays === 365 ? "/año" : `/${plan.numDays} días`;

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || (isBasic ? "Perfecto para empezar tu camino fitness" : isElite ? "Experiencia fitness definitiva con beneficios premium" : "Nuestro plan más popular con todo lo necesario"),
    price: `$${plan.price}`,
    numericPrice: Number(plan.price),
    period: periodStr,
    numDays: plan.numDays || 30,
    highlight: isPremium && !isBasic && !isElite,
    features,
  };
}

