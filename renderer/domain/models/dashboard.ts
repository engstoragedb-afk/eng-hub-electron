export interface IDashboardStats {
    title: string;
    value: string | number;
    description: string;
    tone: "success" | "warning" | "info" | "neutral" | "danger";
    icon: string;
}
