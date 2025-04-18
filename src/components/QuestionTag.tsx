
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionTagProps {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

export function QuestionTag({ label, variant = "default", className }: QuestionTagProps) {
  return (
    <Badge 
      variant={variant}
      className={cn("mr-2", className)}
    >
      {label}
    </Badge>
  );
}
