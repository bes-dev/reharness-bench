/** Held-out instances: convert a fresh YAML config to JSON. Gold = three instance-specific values that must
 *  survive the conversion (the demo's "Reharness"/"db.internal"/"evolve" never appear). */
import { rng, int, pick } from "../../instances-lib.mts";

export const count = 8;

const APPS = ["Lumache", "Vantor", "Quillon", "Nebryx", "Tessera", "Ovelia", "Kapron", "Zephyrine"];
const HOSTS = ["pg-primary", "mysql-core", "mongo-hub", "redis-main", "mariadb-east", "cockroach-west"];
const FEATURES = ["telemetry", "dark_mode", "autoscale", "sandbox", "billing_v2", "webhooks", "audit_log", "sso"];

export default function gen(i: number) {
  const r = rng(3000 + i);
  const app = APPS[i % APPS.length];
  const host = `${HOSTS[int(r, 0, HOSTS.length - 1)]}.svc.cluster`;
  const feats = pick(r, FEATURES, 3);
  const yaml = [
    `name: ${app}`,
    `port: ${int(r, 3000, 9999)}`,
    "database:",
    `  host: ${host}`,
    `  pool: ${int(r, 5, 50)}`,
    "features:",
    ...feats.map(f => `  - ${f}`),
    "",
  ].join("\n");
  return { files: { "config.yaml": yaml }, expectPresent: [app, host, feats[0]] };
}
