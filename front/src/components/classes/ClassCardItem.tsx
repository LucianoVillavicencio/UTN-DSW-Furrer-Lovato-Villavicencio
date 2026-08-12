import { Calendar, User as UserIcon, ChevronRight } from "lucide-react";
import Button from "../common/Button";
import Card from "../common/Card";
import { renderCategoryIcon, type MasterClassData } from "./master-classes.data";

interface ClassCardItemProps {
  masterCls: MasterClassData;
  onPress: (masterCls: MasterClassData) => void;
}

const ClassCardItem = ({ masterCls, onPress }: ClassCardItemProps) => {
  return (
    <Card
      onClick={() => onPress(masterCls)}
      className="group relative flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            {renderCategoryIcon(masterCls.tipoClase?.nombre, "h-4 w-4")}
            {masterCls.tipoClase?.nombre}
          </span>
          <span className="text-xs font-semibold text-text-muted">
            Duración: 1 hora
          </span>
        </div>

        {/* Class Name */}
        <h3 className="mt-5 text-2xl font-bold text-text group-hover:text-primary transition-colors">
          {masterCls.nombre}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-text-muted leading-relaxed line-clamp-3">
          {masterCls.descripcion}
        </p>

        {/* Instructor & Days info */}
        <div className="mt-6 space-y-2.5 border-t border-border/40 pt-4 text-xs font-medium text-text-muted">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <span>
              Instructor:{" "}
              <strong className="text-text font-semibold">
                Prof. {masterCls.profesor?.nombre} {masterCls.profesor?.apellido}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              Días de dictado:{" "}
              <strong className="text-text font-semibold">{masterCls.diasClase}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Press Card CTA */}
      <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-xs font-semibold text-text-muted group-hover:text-text transition-colors">
          Horarios de 07:00 a 22:00 hs
        </span>
        <Button variant="primary" size="sm" className="gap-1.5 text-xs">
          Ver horarios e inscribirme <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ClassCardItem;
