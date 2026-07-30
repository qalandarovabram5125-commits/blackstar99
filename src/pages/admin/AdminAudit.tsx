import { Card, PageHeader } from "@/components/admin/ui";

export default function AdminAudit() {
  return (
    <div>
      <PageHeader title="Audit jurnali" subtitle="Audit tizimi hali qo'shilmagan" />
      <Card className="p-8 text-center text-muted-foreground text-sm">
        Audit jurnali funksiyasi backendda qo'shilmagan.
      </Card>
    </div>
  );
}