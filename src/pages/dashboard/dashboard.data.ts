export interface DashboardApp {
  techName: string;
  appName: string;
  logoUrl?: string;
}

export interface GalleryItem {
  imageUrl: string;
  title: string;
  description: string;
}

export interface ReportDef {
  key: string;
  titleKey: string;
  endpoint: string;
}

/**
 * In the original n8n workflow these came from the "Get Apps Dash" and
 * "Get Gallery Dash" data-table nodes (fed by whatever the user activated
 * from System Control / connected via Odoo). Swap this for a real fetch
 * call once a backend exists — every component below only depends on
 * these two arrays, not on where they came from.
 */
export const mockApps: DashboardApp[] = [
  { techName: "sales", appName: "المبيعات" },
  { techName: "inventory", appName: "المخزون" },
  { techName: "accounting", appName: "المحاسبة" },
];

export const mockGallery: GalleryItem[] = [];

export const reportDefs: ReportDef[] = [
  { key: "sales", titleKey: "rep_sales", endpoint: "/api/reports/sales" },
  { key: "accounts", titleKey: "rep_accounts", endpoint: "/api/reports/accounts" },
  { key: "inventory", titleKey: "rep_inventory", endpoint: "/api/reports/inventory" },
  { key: "seo", titleKey: "rep_seo", endpoint: "/api/reports/seo" },
  { key: "security", titleKey: "rep_security", endpoint: "/api/reports/security" },
  { key: "purchases", titleKey: "rep_purchases", endpoint: "/api/reports/purchases" },
  { key: "ecommerce", titleKey: "rep_ecommerce", endpoint: "/api/reports/ecommerce" },
];
