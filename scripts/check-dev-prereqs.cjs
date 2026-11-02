const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const issues = [];
const go = spawnSync("go", ["version"], { cwd: root, encoding: "utf8" });
let goVersion = "";

if (go.error?.code === "ENOENT") {
  issues.push("Go tidak ditemukan. Instal Go 1.23+ dari https://go.dev/dl/, lalu buka terminal baru.");
} else if (go.status !== 0) {
  issues.push(`Perintah Go gagal dijalankan: ${(go.stderr || go.error?.message || "unknown error").trim()}`);
} else {
  const match = `${go.stdout}\n${go.stderr}`.match(/\bgo(\d+)\.(\d+)(?:\.\d+)?/);
  if (!match) {
    issues.push("Versi Go tidak dapat dikenali. Pastikan Go 1.23+ tersedia di PATH.");
  } else {
    goVersion = `${match[1]}.${match[2]}`;
    if (Number(match[1]) < 1 || (Number(match[1]) === 1 && Number(match[2]) < 23)) {
      issues.push(`Ditemukan Go ${goVersion}; GeoTrack memerlukan Go 1.23+. Perbarui Go lalu buka terminal baru.`);
    }
  }
}

if (!existsSync(path.join(root, "node_modules", "concurrently", "package.json"))) {
  issues.push("Dependensi root belum terpasang. Jalankan `npm install` dari root repository.");
}

if (!existsSync(path.join(root, "frontend", "node_modules", "vite", "package.json"))) {
  issues.push("Dependensi frontend belum terpasang. Jalankan `npm --prefix frontend install` dari root repository.");
}

if (issues.length) {
  console.error("Prasyarat development GeoTrack belum siap:\n- " + issues.join("\n- "));
  process.exit(1);
}

console.log(`Prasyarat development OK (Go ${goVersion}; dependensi npm tersedia).`);
