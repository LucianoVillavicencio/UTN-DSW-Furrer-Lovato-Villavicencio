import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormAlertProps {
  type: "error" | "success";
  message: string | null;
}

const FormAlert = ({ type, message }: FormAlertProps) => {
  if (!message) return null;

  if (type === "error") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-sm text-primary">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default FormAlert;
