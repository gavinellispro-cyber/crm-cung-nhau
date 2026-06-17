import { useState } from "react";

const DEMO = {
  kpis: {
    evenementsMois: 14,
    evenmentsAnnee: 89,
    enfantsTouches: 1240,
    ongPartenaires: 11,
    coachesActifs: 18,
    heuresBenevolat: 342,
    revenusMois: 12500000,
    depensesMois: 7800000,
    soldeMois: 4700000,
    sponsorsActifs: 7,
    sponsorsRelancer: 3,
    valeurPartenariats: 85000000,
    tachesRetard: 4,
    evtAVenir: 6,
    besoinsCoaches: 2,
  },
  financesGraph: [
    { mois: "Jan", revenus: 9, depenses: 6 },
    { mois: "Fev", revenus: 11, depenses: 7 },
    { mois: "Mar", revenus: 8, depenses: 8 },
    { mois: "Avr", revenus: 14, depenses: 9 },
    { mois: "Mai", revenus: 10, depenses: 7 },
    { mois: "Jun", revenus: 12.5, depenses: 7.8 },
  ],
  evenements: [
    { id: 1, titre: "Rugby à 7 — Phuoc Long B", date: "2025-06-20", ong: "Orphelinat Phuoc Long", coaches: 3, enfants: 42, statut: "Planifie", type: "Entrainement" },
    { id: 2, titre: "Tournoi amical — District 9", date: "2025-06-22", ong: "Centre Duc Tri", coaches: 5, enfants: 80, statut: "Planifie", type: "Tournoi" },
    { id: 3, titre: "Entraînement hebdo — Binh Chanh", date: "2025-06-18", ong: "ONG Vinh Son", coaches: 2, enfants: 28, statut: "En cours", type: "Entrainement" },
    { id: 4, titre: "Formation coaches", date: "2025-06-25", ong: null, coaches: 8, enfants: 0, statut: "Planifie", type: "Formation" },
    { id: 5, titre: "Rugby à 5 — Thu Duc", date: "2025-06-15", ong: "Maison Don Bosco", coaches: 3, enfants: 35, statut: "Termine", type: "Entrainement" },
  ],
  coaches: [
    { id: 1, nom: "Nguyen Van An", sport: "Rugby", role: "Coach principal", statut: "Actif", heures: 48, missions: 12 },
    { id: 2, nom: "Tran Thi Bich", sport: "Football", role: "Coach principal", statut: "Actif", heures: 36, missions: 9 },
    { id: 3, nom: "Le Minh Duc", sport: "Rugby", role: "Benevole", statut: "Actif", heures: 22, missions: 6 },
    { id: 4, nom: "Pham Hoang Nam", sport: "Atletisme", role: "Coach principal", statut: "Actif", heures: 41, missions: 10 },
    { id: 5, nom: "Do Thi Lan", sport: "Rugby", role: "Benevole", statut: "Occasionnel", heures: 14, missions: 4 },
  ],
  sponsors: [
    { id: 1, nom: "Vietnam Rugby Federation", type: "Financier", montant: 30000000, statut: "Actif", contact: "M. Hoang" },
    { id: 2, nom: "Decathlon Vietnam", type: "Materiel", montant: 15000000, statut: "Actif", contact: "Mme Linh" },
    { id: 3, nom: "Heineken Vietnam", type: "Financier", montant: 20000000, statut: "A relancer", contact: "M. Smith" },
    { id: 4, nom: "ANZ Bank", type: "Financier", montant: 10000000, statut: "A relancer", contact: "Mme Tran" },
    { id: 5, nom: "RMIT University", type: "Services", montant: 5000000, statut: "Actif", contact: "Dr. Johnson" },
  ],
  taches: [
    { id: 1, titre: "Commander maillots taille S", priorite: "Haute", statut: "A faire", echeance: "2025-06-18", assignee: "Nguyen Van An" },
    { id: 2, titre: "Envoyer rapport mensuel sponsors", priorite: "Urgente", statut: "En cours", echeance: "2025-06-17", assignee: "Tran Thi Bich" },
    { id: 3, titre: "Réserver terrain District 9", priorite: "Haute", statut: "A faire", echeance: "2025-06-19", assignee: null },
    { id: 4, titre: "Relancer Heineken pour renouvellement", priorite: "Moyenne", statut: "A faire", echeance: "2025-06-25", assignee: null },
    { id: 5, titre: "Préparer formation coaches juin", priorite: "Moyenne", statut: "En cours", echeance: "2025-06-23", assignee: "Le Minh Duc" },
  ],
};

const vnd = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const STATUT_COLOR = {
  Actif: "#1D9E75", "A relancer": "#BA7517", Inactif: "#888780",
  Prospect: "#378ADD", Planifie: "#534AB7", "En cours": "#185FA5",
  Termine: "#1D9E75", Annule: "#A32D2D", "A faire": "#888780",
  Urgente: "#A32D2D", Haute: "#BA7517", Moyenne: "#534AB7",
  Basse: "#888780", Occasionnel: "#BA7517",
};

function Badge(props) {
  var s = props.s;
  var color = STATUT_COLOR[s] || "#888";
  return (
    <span style={{
      background: color + "22", color: color,
      padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 500,
    }}>{s}</span>
  );
}

function KpiCard(props) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e6de", borderRadius: 12,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{props.label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: props.color || "#534AB7", lineHeight: 1.2 }}>{props.value}</span>
      {props.sub && <span style={{ fontSize: 12, color: "#aaa" }}>{props.sub}</span>}
    </div>
  );
}

function SectionTitle(props) {
  return (
    <h3 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1.2, margin: "8px 0 0" }}>
      {props.children}
    </h3>
  );
}

function BarChartCSS(props) {
  var data = props.data;
  var max = Math.max.apply(null, data.map(function(d) { return Math.max(d.revenus, d.depenses); }));
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 12, padding: "20px 18px" }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 16 }}>Revenus vs dépenses (M VND)</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
        {data.map(function(d) {
          return (
            <div key={d.mois} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, width: "100%" }}>
                <div title={"Revenus: " + d.revenus + "M"} style={{
                  flex: 1, background: "#1D9E75", borderRadius: "3px 3px 0 0",
                  height: Math.round((d.revenus / max) * 100) + "%",
                  minHeight: 4,
                }} />
                <div title={"Dépenses: " + d.depenses + "M"} style={{
                  flex: 1, background: "#E24B4A", borderRadius: "3px 3px 0 0",
                  height: Math.round((d.depenses / max) * 100) + "%",
                  minHeight: 4,
                }} />
              </div>
              <span style={{ fontSize: 11, color: "#999" }}>{d.mois}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <span style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#1D9E75", borderRadius: 2, display: "inline-block" }} /> Revenus
        </span>
        <span style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#E24B4A", borderRadius: 2, display: "inline-block" }} /> Dépenses
        </span>
      </div>
    </div>
  );
}

function TableUI(props) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e8e6de", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f7f5f0" }}>
            {props.headers.map(function(h) {
              return (
                <th key={h} style={{
                  padding: "10px 12px", fontSize: 12, fontWeight: 500, color: "#888",
                  textAlign: "left", letterSpacing: 0.5, borderBottom: "1px solid #e8e6de",
                }}>{h}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>{props.children}</tbody>
      </table>
    </div>
  );
}

function Dashboard(props) {
  var kpis = props.kpis;
  var finances = props.finances;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Activités</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Événements ce mois" value={kpis.evenementsMois} color="#534AB7" />
        <KpiCard label="Cette année" value={kpis.evenmentsAnnee} color="#534AB7" />
        <KpiCard label="À venir (30j)" value={kpis.evtAVenir} color="#185FA5" />
      </div>

      <SectionTitle>Impact social</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Enfants touchés" value={kpis.enfantsTouches.toLocaleString()} color="#1D9E75" />
        <KpiCard label="ONG partenaires" value={kpis.ongPartenaires} color="#1D9E75" />
        <KpiCard label="Coaches actifs" value={kpis.coachesActifs} color="#1D9E75" />
        <KpiCard label="Heures bénévolat" value={kpis.heuresBenevolat} sub="ce mois" color="#1D9E75" />
      </div>

      <SectionTitle>Finances — juin 2025</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Revenus du mois" value={vnd(kpis.revenusMois)} color="#1D9E75" />
        <KpiCard label="Dépenses du mois" value={vnd(kpis.depensesMois)} color="#993C1D" />
        <KpiCard label="Solde" value={vnd(kpis.soldeMois)} color="#1D9E75" />
      </div>

      <BarChartCSS data={finances} />

      <SectionTitle>Sponsors</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Sponsors actifs" value={kpis.sponsorsActifs} color="#BA7517" />
        <KpiCard label="À relancer" value={kpis.sponsorsRelancer} color="#E24B4A" />
        <KpiCard label="Valeur totale" value={vnd(kpis.valeurPartenariats)} color="#BA7517" />
      </div>

      <SectionTitle>Opérations</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <KpiCard label="Tâches en retard" value={kpis.tachesRetard} color="#A32D2D" />
        <KpiCard label="Besoins en coaches" value={kpis.besoinsCoaches} color="#BA7517" />
      </div>
    </div>
  );
}

function Evenements(props) {
  var data = props.data;
  var filtreState = useState("Tous");
  var filtre = filtreState[0];
  var setFiltre = filtreState[1];
  var types = ["Tous", "Entrainement", "Tournoi", "Formation", "Match"];
  var filtered = filtre === "Tous" ? data : data.filter(function(e) { return e.type === filtre; });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {types.map(function(t) {
          return (
            <button key={t} onClick={function() { setFiltre(t); }} style={{
              padding: "5px 14px", borderRadius: 20,
              border: "1px solid " + (filtre === t ? "#534AB7" : "#ddd"),
              background: filtre === t ? "#534AB7" : "#fff",
              color: filtre === t ? "#fff" : "#555",
              cursor: "pointer", fontSize: 13,
            }}>{t}</button>
          );
        })}
      </div>
      <TableUI headers={["Événement", "Date", "ONG", "Coaches", "Enfants", "Statut"]}>
        {filtered.map(function(e) {
          return (
            <tr key={e.id} style={{ borderBottom: "1px solid #f0ede6" }}>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#2c2c2a" }}>{e.titre}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{e.date}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{e.ong || "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666", textAlign: "center" }}>{e.coaches}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666", textAlign: "center" }}>{e.enfants || "—"}</td>
              <td style={{ padding: "10px 12px" }}><Badge s={e.statut} /></td>
            </tr>
          );
        })}
      </TableUI>
    </div>
  );
}

function Coaches(props) {
  return (
    <TableUI headers={["Nom", "Sport", "Rôle", "Statut", "Heures", "Missions"]}>
      {props.data.map(function(c) {
        return (
          <tr key={c.id} style={{ borderBottom: "1px solid #f0ede6" }}>
            <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#2c2c2a" }}>{c.nom}</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.sport}</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.role}</td>
            <td style={{ padding: "10px 12px" }}><Badge s={c.statut} /></td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666", textAlign: "center" }}>{c.heures}h</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666", textAlign: "center" }}>{c.missions}</td>
          </tr>
        );
      })}
    </TableUI>
  );
}

function Sponsors(props) {
  return (
    <TableUI headers={["Organisation", "Type", "Montant annuel", "Contact", "Statut"]}>
      {props.data.map(function(s) {
        return (
          <tr key={s.id} style={{ borderBottom: "1px solid #f0ede6" }}>
            <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#2c2c2a" }}>{s.nom}</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{s.type}</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>{vnd(s.montant)}</td>
            <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{s.contact}</td>
            <td style={{ padding: "10px 12px" }}><Badge s={s.statut} /></td>
          </tr>
        );
      })}
    </TableUI>
  );
}

function Taches(props) {
  var data = props.data;
  var cycler = { "A faire": "En cours", "En cours": "Termine", "Termine": "A faire" };
  var statutState = useState(data.map(function(t) { return t.statut; }));
  var statuts = statutState[0];
  var setStatuts = statutState[1];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(function(t, i) {
        var color = STATUT_COLOR[t.priorite] || "#ddd";
        var done = statuts[i] === "Termine";
        return (
          <div key={t.id} onClick={function() {
            var s = statuts.slice();
            s[i] = cycler[s[i]] || s[i];
            setStatuts(s);
          }} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#fff", border: "1px solid #e8e6de",
            borderRadius: 10, padding: "12px 16px", cursor: "pointer",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "2px solid " + color,
              background: done ? color : "transparent",
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, fontWeight: 500,
                color: done ? "#aaa" : "#2c2c2a",
                textDecoration: done ? "line-through" : "none",
              }}>{t.titre}</div>
              {t.assignee && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>→ {t.assignee}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge s={t.priorite} />
              <span style={{ fontSize: 12, color: "#bbb" }}>{t.echeance}</span>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 4 }}>
        Cliquez sur une tâche pour changer son statut
      </div>
    </div>
  );
}

var TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "evenements", label: "Événements" },
  { id: "coaches", label: "Coaches" },
  { id: "sponsors", label: "Sponsors" },
  { id: "taches", label: "Tâches" },
];

export default function App() {
  var tabState = useState("dashboard");
  var tab = tabState[0];
  var setTab = tabState[1];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f7f5f0" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e6de", padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: "#534AB7", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 16 }}>🏉</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#2c2c2a" }}>Cung Nhau CRM</span>
          </div>
          <nav style={{ display: "flex", gap: 2, marginLeft: "auto" }}>
            {TABS.map(function(t) {
              return (
                <button key={t.id} onClick={function() { setTab(t.id); }} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none",
                  background: tab === t.id ? "#534AB722" : "transparent",
                  color: tab === t.id ? "#534AB7" : "#666",
                  cursor: "pointer", fontSize: 14,
                  fontWeight: tab === t.id ? 600 : 400,
                }}>{t.label}</button>
              );
            })}
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "dashboard" && <Dashboard kpis={DEMO.kpis} finances={DEMO.financesGraph} />}
        {tab === "evenements" && <Evenements data={DEMO.evenements} />}
        {tab === "coaches" && <Coaches data={DEMO.coaches} />}
        {tab === "sponsors" && <Sponsors data={DEMO.sponsors} />}
        {tab === "taches" && <Taches data={DEMO.taches} />}
      </div>
    </div>
  );
}
npm install recharts
