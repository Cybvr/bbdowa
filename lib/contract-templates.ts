export const CONTRACT_TEMPLATE_COLLECTION = "contractTemplates";

/** Reusable agreement text admins maintain, so staff pick one instead of writing from scratch each time. */
export type ContractTemplate = {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export function sortContractTemplates(templates: ContractTemplate[]): ContractTemplate[] {
  return [...templates].sort((a, b) => a.title.localeCompare(b.title));
}
