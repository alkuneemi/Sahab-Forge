/** Best-effort defaults; the user can override the model per app in System Control. */
export const defaultAppModel: Record<string, string> = {
  sale: "sale.order",
  stock: "stock.picking",
  account: "account.move",
  purchase: "purchase.order",
  hr: "hr.employee",
  crm: "crm.lead",
  project: "project.task",
  mrp: "mrp.production",
  point_of_sale: "pos.order",
  fleet: "fleet.vehicle",
  helpdesk: "helpdesk.ticket",
};
