import assets from '@/data/charger-performance.json';
import samplePaymentTerminals from '@/data/payment-terminals.json';

// Installed inventory is independent of session activity and report dates.
export function executiveInventory(sites: string[] = []) {
  const scoped = assets.filter(asset => !sites.length || sites.includes(asset.site_name));
  const ports = [...new Map(scoped.map(asset => [`${asset.evse_id}/${asset.port_id}`, asset])).values()];
  const types: Record<string, number> = {};
  const power: Record<string, number> = {};
  for (const port of ports) {
    const type = port.connector_type || 'Unknown';
    types[type] = (types[type] ?? 0) + 1;
    const category = ['CCS1', 'CCS2', 'CHAdeMO'].includes(type) ? 'DC'
      : ['J1772', 'Type 1', 'Type 2', 'Type2'].includes(type) ? 'AC' : 'Unknown';
    power[category] = (power[category] ?? 0) + 1;
  }
  return { paymentTerminals: samplePaymentTerminals.filter(terminal => !sites.length || sites.includes(terminal.site_name)).length, chargers: new Set(scoped.map(asset => asset.evse_id)).size, connectors: ports.length, types, power };
}
