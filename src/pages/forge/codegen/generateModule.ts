import React from "react";
import type { Node, Edge } from "@xyflow/react";
import type { ForgeAppData } from "../store/forgeStore";
import type { SahabModule } from "../../../core/modules/types";

/**
 * @typedef {Object} GeneratedCode
 * @property {string} moduleName - Generated module name
 * @property {string} pythonCode - Python/Odoo code
 * @property {string} xmlViews - XML view definitions
 * @property {string} manifest - Module manifest
 */
export interface GeneratedCode {
  moduleName: string;
  pythonCode: string;
  xmlViews: string;
  manifest: string;
}

/**
 * Generate React module code from Forge diagram
 * Converts visual app design to executable React component
 */
export function generateReactModule(app: ForgeAppData): string {
  const componentName = sanitizeName(app.name);
  const nodeMarkup = app.nodes
    .map((node) => renderNodeMarkup(node))
    .join("\n");

  const code = `
/**
 * @file ${componentName}.tsx
 * @description Generated React component from Sahab Forge
 * @generated ${new Date().toISOString()}
 */

import React from 'react';

export function ${componentName}() {
  return (
    <div className="sahab-forge-generated-${sanitizeName(app.name, '-')}">
      <h1>${app.name}</h1>
      <p>${app.description}</p>
      ${nodeMarkup}
    </div>
  );
}

export default ${componentName};
`;

  return code;
}

/**
 * Generate Odoo/Python module from Forge diagram
 * Creates models, views, and controllers from visual design
 */
export function generateOdooModule(app: ForgeAppData): GeneratedCode {
  const moduleName = sanitizeName(app.name, "_").toLowerCase();
  const className = toPascalCase(moduleName);

  const pythonCode = `# -*- coding: utf-8 -*-
"""
${moduleName} - Generated from Sahab Forge
Auto-generated module - do not edit manually
"""

from odoo import models, fields, api

class ${className}(models.Model):
    _name = '${moduleName}.${moduleName}'
    _description = '${app.name}'

    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    created_at = fields.Datetime(string='Created', default=fields.Datetime.now)
    updated_at = fields.Datetime(string='Updated', default=fields.Datetime.now)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            vals['updated_at'] = fields.Datetime.now()
        return super().create(vals_list)

    def write(self, vals):
        vals['updated_at'] = fields.Datetime.now()
        return super().write(vals)
`;

  const xmlViews = `<?xml version="1.0" encoding="utf-8"?>
<odoo>
  <data noupdate="1">
    <!-- List View -->
    <record id="${moduleName}_list" model="ir.ui.view">
      <field name="name">${app.name} List</field>
      <field name="model">${moduleName}.${moduleName}</field>
      <field name="arch" type="xml">
        <list string="${app.name}">
          <field name="name" />
          <field name="created_at" />
        </list>
      </field>
    </record>

    <!-- Form View -->
    <record id="${moduleName}_form" model="ir.ui.view">
      <field name="name">${app.name} Form</field>
      <field name="model">${moduleName}.${moduleName}</field>
      <field name="arch" type="xml">
        <form string="${app.name}">
          <group>
            <field name="name" />
            <field name="description" />
          </group>
        </form>
      </field>
    </record>

    <!-- Action Window -->
    <record id="${moduleName}_action" model="ir.actions.act_window">
      <field name="name">${app.name}</field>
      <field name="res_model">${moduleName}.${moduleName}</field>
      <field name="view_mode">list,form</field>
      <field name="help">Create and manage ${app.name.toLowerCase()}</field>
    </record>

    <!-- Menu Item -->
    <menuitem id="${moduleName}_menu" name="${app.name}" 
              action="${moduleName}_action" />
  </data>
</odoo>
`;

  const manifest = `{
    'name': '${app.name}',
    'version': '1.0.0',
    'category': 'Generated',
    'author': 'Sahab Forge',
    'depends': ['base'],
    'data': [
        'views/${moduleName}_views.xml',
    ],
    'installable': True,
    'auto_install': False,
}
`;

  return {
    moduleName,
    pythonCode,
    xmlViews,
    manifest,
  };
}

/**
 * Generate TypeScript types from node data
 */
export function generateTypes(nodes: Node[]): string {
  let typeDefinitions = `
/**
 * Auto-generated types from Sahab Forge
 */

`;

  nodes.forEach((node) => {
    if (node.type === "model" && node.data) {
      const nodeData = node.data as Record<string, any>;
      const label = nodeData.label as string | undefined;
      const fields = nodeData.fields as string[] | undefined;

      if (label) {
        const modelName = toPascalCase(label);
        typeDefinitions += `
export interface ${modelName} {
  id: string;
${fields ? fields.map((field: string) => `  ${field}?: any;`).join("\n") : ""}
}
`;
      }
    }
  });

  return typeDefinitions;
}

/**
 * Sanitize names for use in code
 */
export function buildForgeModule(app: ForgeAppData): SahabModule {
  const moduleId = `forge-${sanitizeName(app.name, "-").toLowerCase()}`;
  const componentName = sanitizeName(app.name);
  const generatedReact = generateReactModule(app);
  const generatedOdoo = generateOdooModule(app);

  return {
    id: moduleId,
    name: { ar: app.name, en: app.name },
    description: {
      ar: `وحدة مولدة من Sahab Forge: ${app.description || "تطبيق منشأ بصرياً"}`,
      en: `Generated module from Sahab Forge: ${app.description || "Visually designed app"}`,
    },
    version: "1.0.0",
    routes: [
      {
        path: `/modules/${moduleId}`,
        element: React.createElement("div", { style: { padding: 24 } }, [
          React.createElement("h2", { key: "title" }, app.name),
          React.createElement("pre", { key: "code", style: { whiteSpace: "pre-wrap", marginTop: 12 } }, generatedReact),
        ]),
      },
    ],
    styleOverrides: `
      .sahab-forge-generated-${sanitizeName(app.name, "-")} {
        padding: 24px;
        border-radius: 12px;
        background: #f5f9ff;
      }
    `,
  };
}

function renderNodeMarkup(node: Node): string {
  const data = (node.data as Record<string, unknown>) || {};
  const label = String(data.label || node.type || "Node");

  switch (node.type) {
    case "model":
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3><p>Fields: ${((data.fields as string[]) || []).join(", ") || "none"}</p></section>`;
    case "view":
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3><p>View type: ${String(data.viewType || "list")}</p></section>`;
    case "action":
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3><p>Action: ${String(data.actionType || "default")}</p></section>`;
    case "state":
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3><p>States: ${((data.states as string[]) || []).join(", ") || "draft"}</p></section>`;
    case "externalApi":
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3><p>Endpoint: ${String(data.endpoint || "https://example.com")}</p></section>`;
    default:
      return `<section className="sahab-forge-generated-card"><h3>${label}</h3></section>`;
  }
}

function sanitizeName(name: string, separator: string = ""): string {
  return name
    .trim()
    .replace(/\s+/g, separator)
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
