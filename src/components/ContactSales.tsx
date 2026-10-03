"use client";

import { ContactContract } from "@/components/ContactContract";
import { ContactTaskForm } from "@/components/ContactTaskForm";

export function ContactSales({
  contactId,
  clientName,
  phone,
  address,
  managerId,
  managerName,
  customFields,
  dealAmount,
  tasks,
  onChange,
}: {
  contactId: string;
  clientName: string;
  phone: string;
  address: string;
  managerId?: string | null;
  managerName: string;
  customFields: Record<string, unknown>;
  dealAmount: string | number;
  tasks: Array<{ id: string; description: string; dueAt: string; status: string; type: string }>;
  onChange: () => void;
}) {
  return (
    <div className="space-y-4">
      <ContactTaskForm
        contactId={contactId}
        clientName={clientName}
        phone={phone}
        address={address}
        managerId={managerId}
        tasks={tasks}
        onChange={onChange}
      />
      <ContactContract
        contactId={contactId}
        clientName={clientName}
        managerName={managerName}
        customFields={customFields}
        dealAmount={dealAmount}
        onChange={onChange}
      />
    </div>
  );
}
