import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface CardStatisticProps {
  items: {
    title: string;
    icon: LucideIcon;
    value: string | number;
    description?: string;
  }
  className?: string;
}

export default function CardStatistic({ items, className }: CardStatisticProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{items.title}</CardTitle>
        {items.icon && <items.icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{items.value}</div>
        {items.description && (
          <p className="text-xs text-muted-foreground">
            {items.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
