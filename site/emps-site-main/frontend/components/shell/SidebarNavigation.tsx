"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Layers2, X } from "lucide-react";
import { NavigationLink as Link } from './NavigationLink';
import { useId, useState } from "react";
import { empsNavigationItems, semsSidebarItems } from "./shell-navigation";
import { Popover } from "@/components/ui/Popover";
import { stationWizardFont } from "@/components/stations/station-wizard-font";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavigation({ pathname, expanded, mobileOpen, onToggle, onClose }: {
  pathname: string; expanded: boolean; mobileOpen: boolean;
  onToggle: () => void; onClose: () => void;
}) {
  const resourcesId = useId();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resources = semsSidebarItems.flatMap(item => item.children ?? (item.href ? [{label: item.label, href: item.href}] : []));
  const externalLinks = (close?: () => void) => <nav aria-label="Recursos externos GoodWe">{resources.map(item =>
    <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="sidebar-submenu-item" onClick={() => {close?.(); onClose();}}>{item.label}<ExternalLink size={12} aria-hidden="true"/></a>
  )}<a href="https://semsplus.goodwe.com/configure/#/organization_management" target="_blank" rel="noreferrer" className="sidebar-submenu-item">Gestão da organização<ExternalLink size={12} aria-hidden="true"/></a></nav>;

  return <aside className={`sidebar ${stationWizardFont.className} ${mobileOpen ? "sidebar--open" : ""}`}>
    <div className="brand-row">
      <Link href="/stations" className="rail-brand" aria-label="EMPS · Minhas instalações" onClick={onClose}>
        <span className="emps-logo emps-logo--compact" aria-hidden="true"><span className="emps-logo__mask"/></span>
        {expanded && <strong className="sidebar-product-name">EMPS<small>Gestão de recarga</small></strong>}
      </Link>
      <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Fechar menu"><X size={18}/></button>
    </div>
    <nav className="nav-list" aria-label="Navegação principal">
      <div className="nav-section nav-section--emps">{empsNavigationItems.map(item => {
        const Icon = item.icon, active = isActive(pathname, item.href);
        return <Link key={item.href} href={item.href} className={`nav-item ${active ? 'nav-item--active' : ''}`}
          title={item.label} aria-label={item.label} aria-current={active ? 'page' : undefined} onClick={onClose}>
          <Icon size={20} aria-hidden="true"/><span>{item.label}</span>
        </Link>;
      })}</div>
    </nav>
    <div className="sidebar-footer">
      {expanded ? <div className="sidebar-group">
        <button type="button" className="nav-item" aria-expanded={resourcesOpen} aria-controls={resourcesId} onClick={() => setResourcesOpen(value => !value)}><Layers2 size={20}/><span>Recursos GoodWe</span><ChevronDown size={14}/></button>
        <div id={resourcesId} className="sidebar-submenu sidebar-resources" hidden={!resourcesOpen}>{externalLinks()}</div>
      </div> : <Popover label="Recursos externos GoodWe" trigger={<Layers2 size={20}/>} side="right" buttonClassName="nav-item" className="sidebar-flyout">{close => externalLinks(close)}</Popover>}
      <button type="button" className="sidebar-toggle" title={expanded ? "Recolher menu" : "Expandir menu"} aria-label={expanded ? "Recolher menu" : "Expandir menu"} aria-expanded={expanded} onClick={onToggle}>
        {expanded ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
      </button>
    </div>
  </aside>;
}
