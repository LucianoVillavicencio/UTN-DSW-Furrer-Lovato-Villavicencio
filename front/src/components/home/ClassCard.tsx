import type { LucideIcon } from "lucide-react";
import Card from "../common/Card";

interface ClassCardProps {
    icon: LucideIcon;
    title: string,
    descripcion: string
    
}


const ClassCard = ({icon: Icon, title, descripcion }:ClassCardProps) => {
  return (

    <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 group-hover:bg-green-800/20 ">
            <Icon className="h-8 w-8 text-primary"></Icon>
        </div>
        <div>
            <title></title>
        </div>
        
        <h3 className="mt-5 text-xl font-semibold text-text">{title}</h3>

        <p className=" mt-2 font-body text-sm text-text-muted ">{descripcion}</p>
    </Card>
  );
}

export default ClassCard;