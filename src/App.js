import React, { useState, useEffect } from "react";

const SUPABASE_URL = "https://sxgxuvrqteewihtqdaga.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Z3h1dnJxdGVld2lodHFkYWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDIzMDMsImV4cCI6MjA5NzIxODMwM30.7g9VtwMLRoAczu0NZbgAylHR67dVgA06nhqEDZ4cKDM";

async function sbFetch(table, options) {
  var opts = options || {};
  var url = SUPABASE_URL + "/rest/v1/" + table;
  var params = [];
  if (opts.select) params.push("select=" + opts.select);
  if (opts.filter) params.push(opts.filter);
  if (opts.order) params.push("order=" + opts.order);
  if (opts.limit) params.push("limit=" + opts.limit);
  if (params.length) url += "?" + params.join("&");
  var res = await fetch(url, { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Supabase error " + res.status);
  return res.json();
}

async function sbInsert(table, data) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) { var err = await res.text(); throw new Error(err); }
  return res.json();
}

async function sbInsertMany(table, rows) {
  if (!rows.length) return [];
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { var err = await res.text(); throw new Error(err); }
  return res.json();
}

async function sbUpdate(table, id, data) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, {
    method: "PATCH",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Update error " + res.status);
  return res.json();
}

const vnd = function(n) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n || 0); };

const TYPE_COLOR = { ONG: "#1D9E75", Shelter: "#9B1C1C", Ecole: "#BA7517", Sponsor: "#C8102E" };
const TYPE_ICON = { ONG: "🤝", Shelter: "🏠", Ecole: "🏫", Sponsor: "💼" };
const STATUT_COLOR = {
  Actif: "#1D9E75", "A relancer": "#BA7517", Inactif: "#888780", Prospect: "#378ADD",
  Planifie: "#C8102E", "En cours": "#9B1C1C", Termine: "#1D9E75", Annule: "#A32D2D",
  "A faire": "#888780", Urgente: "#A32D2D", Haute: "#BA7517", Moyenne: "#C8102E",
  Basse: "#888780", Occasionnel: "#BA7517", "En pause": "#888780",
};

function Badge(props) {
  var color = STATUT_COLOR[props.s] || "#888";
  return <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{props.s}</span>;
}

function TypeBadge(props) {
  var color = TYPE_COLOR[props.t] || "#888";
  return <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{TYPE_ICON[props.t]} {props.t}</span>;
}

function KpiCard(props) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{props.label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: props.color || "#C8102E", lineHeight: 1.2 }}>{props.value}</span>
      {props.sub && <span style={{ fontSize: 12, color: "#aaa" }}>{props.sub}</span>}
    </div>
  );
}

function SectionTitle(props) {
  return <h3 style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1.2, margin: "8px 0 0" }}>{props.children}</h3>;
}

function Spinner() { return <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Chargement...</div>; }
function Empty(props) { return <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>{props.msg}</div>; }

function TableUI(props) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e0e0e0", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f4f4f4" }}>
          {props.headers.map(function(h) { return <th key={h} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 500, color: "#888", textAlign: "left", borderBottom: "1px solid #e0e0e0" }}>{h}</th>; })}
        </tr></thead>
        <tbody>{props.children}</tbody>
      </table>
    </div>
  );
}

function Modal(props) {
  if (!props.open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{props.title}</h2>
          <button onClick={props.onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function Field(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: "#444" }}>{props.label}</label>
      {props.children}
    </div>
  );
}

var inp = { padding: "8px 10px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
var sel = { padding: "8px 10px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, background: "#fff", width: "100%", boxSizing: "border-box" };
var btnP = { padding: "8px 20px", borderRadius: 8, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 };
var btnS = { padding: "8px 16px", borderRadius: 8, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 14 };
var btnA = { padding: "7px 16px", borderRadius: 8, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 };

// ── MULTI-SELECT PARTENAIRES (accordéon) ─────────────────────
function PartenaireMultiSelect(props) {
  var partenaires = props.partenaires;
  var selected = props.selected;
  var onChange = props.onChange;
  var type = props.type;
  var openState = useState(false); var open = openState[0]; var setOpen = openState[1];
  var filtered = partenaires.filter(function(p) { return p.type === type; });
  var color = TYPE_COLOR[type] || "#888";
  var nbSel = selected.length;
  return (
    <div style={{ border: "1px solid " + (nbSel > 0 ? color : "#e0e0e0"), borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      {/* Header cliquable */}
      <div onClick={function() { setOpen(!open); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: nbSel > 0 ? color + "11" : "#fafafa", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{TYPE_ICON[type]}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: nbSel > 0 ? color : "#444" }}>{type}</span>
          {nbSel > 0 && <span style={{ background: color, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{nbSel} sélectionné{nbSel > 1 ? "s" : ""}</span>}
          {!filtered.length && <span style={{ fontSize: 11, color: "#aaa" }}>(aucun)</span>}
        </div>
        <span style={{ fontSize: 16, color: "#888", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>
      {/* Liste déroulante */}
      {open && (
        <div style={{ borderTop: "1px solid #e0e0e0", background: "#fff" }}>
          {!filtered.length ? (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "#aaa" }}>Aucun {type} — ajoutez-en dans l'onglet Partenaires</div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {filtered.map(function(p) {
                var isSelected = selected.indexOf(p.id) !== -1;
                return (
                  <label key={p.id} onClick={function() {
                    if (isSelected) onChange(selected.filter(function(id) { return id !== p.id; }));
                    else onChange(selected.concat(p.id));
                  }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", background: isSelected ? color + "0d" : "transparent", borderBottom: "1px solid #f4f4f4" }}
                    onMouseEnter={function(e) { if (!isSelected) e.currentTarget.style.background = "#f9f9f9"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = isSelected ? color + "0d" : "transparent"; }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid " + (isSelected ? color : "#ccc"), background: isSelected ? color : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? color : "#333", flex: 1 }}>{p.nom}</span>
                    {p.contact_nom && <span style={{ fontSize: 11, color: "#aaa" }}>{p.contact_nom}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DASH EVENT CARD ───────────────────────────────────────────
function DashEvtCard(props) {
  var e = props.e; var onGo = props.onGo;
  var CONF_COLOR = props.CONF_COLOR; var TYPE_EVT_COLOR = props.TYPE_EVT_COLOR; var MOIS_FR = props.MOIS_FR;
  var dateStr = e.date_debut ? e.date_debut.split("T")[0] : "—";
  var parts = dateStr !== "—" ? dateStr.split("-") : ["","",""];
  var jour = parts[2]; var moisIdx = parseInt(parts[1], 10) - 1;
  var confColor = CONF_COLOR[e.confirmation_statut] || "#888";
  var statColor = TYPE_EVT_COLOR[e.statut] || "#888";
  return (
    <div onClick={onGo} style={{ background: "#fff", border: "1px solid #e0e0e0", borderLeft: "4px solid " + statColor, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "box-shadow .15s" }}
      onMouseEnter={function(el) { el.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.08)"; }}
      onMouseLeave={function(el) { el.currentTarget.style.boxShadow="none"; }}>
      {/* Badge date */}
      <div style={{ flexShrink: 0, textAlign: "center", background: "#1a1a1a", color: "#fff", borderRadius: 10, padding: "8px 12px", minWidth: 50 }}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{jour}</div>
        <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>{MOIS_FR[moisIdx] ? MOIS_FR[moisIdx].slice(0,3).toUpperCase() : ""}</div>
      </div>
      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.titre}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{e.type}{e.lieu ? " · " + e.lieu : ""}</div>
        {e.notes && <div style={{ fontSize: 11, color: "#aaa", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.notes}</div>}
      </div>
      {/* Méta droite */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {e.confirmation_statut && <span style={{ fontSize: 11, fontWeight: 600, color: confColor, background: confColor + "18", padding: "2px 8px", borderRadius: 20 }}>{e.confirmation_statut}</span>}
        <span style={{ fontSize: 11, fontWeight: 600, color: statColor, background: statColor + "15", padding: "2px 8px", borderRadius: 20 }}>{e.statut}</span>
        {e.nombre_enfants_presents > 0 && <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 600 }}>👦 {e.nombre_enfants_presents} enfants</span>}
      </div>
      <div style={{ flexShrink: 0, fontSize: 16, color: "#ccc" }}>→</div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard(props) {
  var setTab = props.setTab || function() {};
  var setOpenTacheModal = props.setOpenTacheModal || function() {};
  var dashView = props.dashView || "general";
  var setDashView = props.setDashView || function() {};
  var s = useState(null); var data = s[0]; var setData = s[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var dashFicheState = useState(null); var dashFicheId = dashFicheState[0]; var setDashFicheId = dashFicheState[1];
  var dashEvtState = useState(null); var dashEvtId = dashEvtState[0]; var setDashEvtId = dashEvtState[1];

  useEffect(function() {
    Promise.all([
      sbFetch("evenements", { select: "*" }),
      sbFetch("depenses", { select: "*" }),
      sbFetch("revenus", { select: "*" }),
      sbFetch("coaches", { select: "*", filter: "statut=eq.Actif" }),
      sbFetch("partenaires", { select: "*" }),
      sbFetch("taches", { select: "*", filter: "statut=neq.Confirme", order: "date_echeance.asc" }),
      sbFetch("actions_partenaires", { select: "*", filter: "statut=eq.En+attente", order: "date_prevue.asc" }),
    ]).then(function(r) {
      // Split taches: general (no evenement_id) vs event tasks
      var allTaches = r[5];
      var tachesGenerales = allTaches.filter(function(t) { return !t.evenement_id; });
      var tachesEvenements = allTaches.filter(function(t) { return !!t.evenement_id; });
      setData({ evenements: r[0], depenses: r[1], revenus: r[2], coaches: r[3], partenaires: r[4], taches: tachesGenerales, tachesEvt: tachesEvenements, actions: r[6] });
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);

  var dashToggleTache = useState([]); var toggledTaches = dashToggleTache[0]; var setToggledTaches = dashToggleTache[1];

  function handleDashToggle(t) {
    sbUpdate("taches", t.id, { statut: "Termine" }).then(function() {
      setData(Object.assign({}, data, { taches: data.taches.filter(function(x) { return x.id !== t.id; }) }));
    });
  }

  function handleDashToggleAction(a) {
    sbUpdate("actions_partenaires", a.id, { statut: "Confirme" }).then(function() {
      setData(Object.assign({}, data, { actions: (data.actions || []).filter(function(x) { return x.id !== a.id; }) }));
    });
  }

  function handleDashToggleEvtTask(t) {
    sbUpdate("taches", t.id, { statut: "Confirme" }).then(function() {
      setData(Object.assign({}, data, { tachesEvt: (data.tachesEvt || []).filter(function(x) { return x.id !== t.id; }) }));
    });
  }

  // Modal nouvelle tâche (géré dans le Dashboard)
  var tModal = useState(false); var tacheModal = tModal[0]; var setTacheModal = tModal[1];
  var TEMPTY = { titre: "", description: "", priorite: "Moyenne", date_echeance: "", assigne_par: "", assigne_a: "", partenaire_id: "", partenaire_nom_temp: "" };
  var tForm = useState(TEMPTY); var tacheForm = tForm[0]; var setTacheForm = tForm[1];
  var tSearch = useState(""); var partSearch = tSearch[0]; var setPartSearch = tSearch[1];
  var tDrop = useState(false); var showDrop = tDrop[0]; var setShowDrop = tDrop[1];
  function tset(k, v) { setTacheForm(Object.assign({}, tacheForm, { [k]: v })); }
  function handleAddTache() {
    var payload = { titre: tacheForm.titre, description: tacheForm.description, priorite: tacheForm.priorite, statut: "A faire", date_echeance: tacheForm.date_echeance || null, assigne_par: tacheForm.assigne_par, assigne_a: tacheForm.assigne_a, partenaire_id: tacheForm.partenaire_id || null, partenaire_nom_temp: tacheForm.partenaire_nom_temp || null };
    sbInsert("taches", payload).then(function(rows) {
      setData(Object.assign({}, data, { taches: [rows[0]].concat(data.taches || []) }));
      setTacheModal(false); setTacheForm(TEMPTY); setPartSearch("");
    }).catch(function(e) { alert(e.message); });
  }
  var filteredParts = (data ? data.partenaires || [] : []).filter(function(p) { return partSearch.length >= 2 && p.nom.toLowerCase().indexOf(partSearch.toLowerCase()) !== -1; });

  var aattState = useState(0); var actionsEnAttente = aattState[0]; var setActionsEnAttente = aattState[1];
  useEffect(function() {
    var tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    sbFetch("actions_partenaires", {
      select: "id",
      filter: "statut=eq.En+attente&date_prevue=lte." + tomorrow,
    }).then(function(rows) { setActionsEnAttente(rows.length); }).catch(function() {});
  }, []);

  if (loading || !data) return <Spinner />;

  var now = new Date();
  var moisDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  var moisFin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  var anneeDebut = new Date(now.getFullYear(), 0, 1).toISOString();
  var revMois = data.revenus.filter(function(r) { return r.date_reception >= moisDebut; }).reduce(function(s, r) { return s + Number(r.montant); }, 0);
  var depMois = data.depenses.filter(function(d) { return d.date_depense >= moisDebut; }).reduce(function(s, d) { return s + Number(d.montant); }, 0);
  var evtMoisList = data.evenements.filter(function(e) { return e.date_debut >= moisDebut && e.date_debut <= moisFin; }).sort(function(a,b){ return a.date_debut > b.date_debut ? 1 : -1; });
  var evtMois = evtMoisList.length;
  var evtAnneeList = data.evenements.filter(function(e) { return e.date_debut >= anneeDebut; });
  var evtAnnee = evtAnneeList.length;
  var enfants = data.evenements.reduce(function(s, e) { return s + (Number(e.nombre_enfants_presents) || 0); }, 0);
  var tachesRetard = data.taches.filter(function(t) { return t.statut !== "Termine" && t.date_echeance && t.date_echeance < now.toISOString().split("T")[0]; }).length;
  var byType = function(t) { return data.partenaires.filter(function(p) { return p.type === t && p.statut === "Actif"; }).length; };
  var sponsors = data.partenaires.filter(function(p) { return p.type === "Sponsor"; });
  var valeur = sponsors.filter(function(s) { return s.statut === "Actif"; }).reduce(function(sum, s) { return sum + Number(s.montant_annuel || 0); }, 0);
  var totalPending = (data.taches || []).length + (data.actions || []).length + (data.tachesEvt || []).length;

  // Prochains événements : à venir + confirmés (les 5 prochains)
  var todayStr = now.toISOString().split("T")[0];
  var prochains = data.evenements
    .filter(function(e) { return e.date_debut && e.date_debut.split("T")[0] >= todayStr && (e.confirmation_statut === "Confirmé" || e.confirmation_statut === "Confirme"); })
    .sort(function(a,b){ return a.date_debut > b.date_debut ? 1 : -1; })
    .slice(0, 5);

  var MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  var CONF_COLOR = { "Confirmé": "#1D9E75", "Confirme": "#1D9E75", "En attente": "#BA7517", "Annulé": "#A32D2D" };
  var TYPE_EVT_COLOR = { Planifie: "#C8102E", "En cours": "#9B1C1C", Termine: "#1D9E75", Annule: "#A32D2D" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 4, background: "#2a2a2a", borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        <button onClick={function() { setDashView("general"); }} style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: dashView === "general" ? "#C8102E" : "transparent", color: dashView === "general" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, fontWeight: dashView === "general" ? 600 : 400 }}>📊 Vue générale</button>
        <button onClick={function() { setDashView("taches"); }} style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: dashView === "taches" ? "#C8102E" : "transparent", color: dashView === "taches" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, fontWeight: dashView === "taches" ? 600 : 400 }}>📋 Tâches{totalPending > 0 ? " (" + totalPending + ")" : ""}</button>
      </div>
      <div style={{ display: dashView === "taches" ? "block" : "none" }}>
        <TachesWidget taches={data.taches || []} partenaires={data.partenaires || []} actions={data.actions || []} tachesEvt={data.tachesEvt || []} evenements={data.evenements || []} onAdd={function() { setTacheModal(true); }} onToggle={handleDashToggle} onToggleAction={handleDashToggleAction} onToggleEvtTask={handleDashToggleEvtTask} setTab={setTab} onOpenFiche={function(id) { setDashFicheId(id); }} onOpenEvt={function(id) { setDashEvtId(id); }} />
      </div>
      <div style={{ display: ["general","evtMois","evtAnnee","part_ONG","part_Shelter","part_Ecole","part_Sponsor","coaches","retard","actions"].indexOf(dashView) >= 0 ? "flex" : "none", flexDirection: "column", gap: 20 }}>

        {/* ── ACTIVITÉS ── */}
        <SectionTitle>Activités</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {/* KPI Ce mois — toggle inline */}
          <div onClick={function() { setDashView(dashView === "evtMois" ? "general" : "evtMois"); }} style={{ background: dashView === "evtMois" ? "#1a1a1a" : "#fff", border: "1px solid " + (dashView === "evtMois" ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ fontSize: 11, color: dashView === "evtMois" ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>Événements ce mois · {MOIS_FR[now.getMonth()]}</span>
            <div style={{ fontSize: 32, fontWeight: 700, color: dashView === "evtMois" ? "#fff" : "#C8102E", lineHeight: 1.2, marginTop: 4 }}>{evtMois}</div>
            <div style={{ fontSize: 11, color: dashView === "evtMois" ? "rgba(255,255,255,0.7)" : "#C8102E", marginTop: 6, fontWeight: 500 }}>{dashView === "evtMois" ? "▲ Masquer" : "▼ Voir le détail"}</div>
          </div>
          {/* KPI Année — toggle inline */}
          <div onClick={function() { setDashView(dashView === "evtAnnee" ? "general" : "evtAnnee"); }} style={{ background: dashView === "evtAnnee" ? "#1a1a1a" : "#fff", border: "1px solid " + (dashView === "evtAnnee" ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ fontSize: 11, color: dashView === "evtAnnee" ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>Cette année · {now.getFullYear()}</span>
            <div style={{ fontSize: 32, fontWeight: 700, color: dashView === "evtAnnee" ? "#fff" : "#C8102E", lineHeight: 1.2, marginTop: 4 }}>{evtAnnee}</div>
            <div style={{ fontSize: 11, color: dashView === "evtAnnee" ? "rgba(255,255,255,0.7)" : "#C8102E", marginTop: 6, fontWeight: 500 }}>{dashView === "evtAnnee" ? "▲ Masquer" : "▼ Voir le détail"}</div>
          </div>
          <KpiCard label="Enfants touchés" value={enfants.toLocaleString()} color="#1D9E75" />
        </div>

        {/* Détail événements du mois — inline sous les KPI */}
        {dashView === "evtMois" && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Événements de {MOIS_FR[now.getMonth()]} {now.getFullYear()}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{evtMois} événement{evtMois > 1 ? "s" : ""}</span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {evtMoisList.length === 0 ? <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>Aucun événement ce mois-ci</div> : evtMoisList.map(function(e) {
                return <DashEvtCard key={e.id} e={e} onGo={function() {}} CONF_COLOR={CONF_COLOR} TYPE_EVT_COLOR={TYPE_EVT_COLOR} MOIS_FR={MOIS_FR} />;
              })}
            </div>
          </div>
        )}

        {/* Détail événements de l'année — inline sous les KPI */}
        {dashView === "evtAnnee" && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Événements {now.getFullYear()}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{evtAnnee} événement{evtAnnee > 1 ? "s" : ""}</span>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {evtAnneeList.length === 0 ? <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>Aucun événement cette année</div> : evtAnneeList.map(function(e) {
                return <DashEvtCard key={e.id} e={e} onGo={function() {}} CONF_COLOR={CONF_COLOR} TYPE_EVT_COLOR={TYPE_EVT_COLOR} MOIS_FR={MOIS_FR} />;
              })}
            </div>
          </div>
        )}

        {/* ── PROCHAINS ÉVÉNEMENTS CONFIRMÉS ── */}
        <SectionTitle>Prochains événements confirmés</SectionTitle>
        {prochains.length === 0 ? (
          <div style={{ fontSize: 13, color: "#aaa", padding: "12px 0" }}>Aucun événement confirmé à venir</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prochains.map(function(e) {
              var dateStr = e.date_debut ? e.date_debut.split("T")[0] : "—";
              var isPast = dateStr < todayStr;
              var daysLeft = Math.ceil((new Date(dateStr) - now) / 86400000);
              return (
                <div key={e.id} onClick={function() { setTab("evenements"); }} style={{ background: "#fff", border: "1px solid #e0e0e0", borderLeft: "4px solid #1D9E75", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "box-shadow .15s" }}
                  onMouseEnter={function(el) { el.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={function(el) { el.currentTarget.style.boxShadow="none"; }}>
                  {/* Date badge */}
                  <div style={{ flexShrink: 0, textAlign: "center", background: "#C8102E", color: "#fff", borderRadius: 8, padding: "6px 10px", minWidth: 44 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{dateStr.split("-")[2]}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{MOIS_FR[parseInt(dateStr.split("-")[1],10)-1].slice(0,3).toUpperCase()}</div>
                  </div>
                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.titre}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{e.type}{e.lieu ? " · " + e.lieu : ""}</div>
                  </div>
                  {/* Méta */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    {e.nombre_enfants_presents > 0 && <div style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>👦 {e.nombre_enfants_presents}</div>}
                    <div style={{ fontSize: 11, color: daysLeft <= 3 ? "#C8102E" : "#aaa", fontWeight: daysLeft <= 3 ? 700 : 400, marginTop: 2 }}>
                      {daysLeft === 0 ? "Aujourd'hui !" : daysLeft === 1 ? "Demain" : "Dans " + daysLeft + " j"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PARTENAIRES ACTIFS ── */}
        <SectionTitle>Partenaires actifs</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { key: "ONG",     label: "🤝 ONG",      color: TYPE_COLOR.ONG },
            { key: "Shelter", label: "🏠 Shelters",  color: TYPE_COLOR.Shelter },
            { key: "Ecole",   label: "🏫 Écoles",    color: TYPE_COLOR.Ecole },
            { key: "Sponsor", label: "💼 Sponsors",  color: TYPE_COLOR.Sponsor },
          ].map(function(item) {
            var active = dashView === "part_" + item.key;
            var count = byType(item.key);
            return (
              <div key={item.key} onClick={function() { setDashView(active ? "general" : "part_" + item.key); }} style={{ background: active ? "#1a1a1a" : "#fff", border: "1px solid " + (active ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
                <span style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: active ? "#fff" : item.color, lineHeight: 1.2, marginTop: 4 }}>{count}</div>
                <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.7)" : item.color, marginTop: 6, fontWeight: 500 }}>{active ? "▲ Masquer" : "▼ Voir la liste"}</div>
              </div>
            );
          })}
        </div>

        {/* Détail partenaires inline */}
        {["ONG","Shelter","Ecole","Sponsor"].map(function(type) {
          if (dashView !== "part_" + type) return null;
          var list = data.partenaires.filter(function(p) { return p.type === type && p.statut === "Actif"; });
          var tc = TYPE_COLOR[type];
          return (
            <div key={type} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{TYPE_ICON[type]} {type}s actifs</span>
                <span style={{ fontSize: 12, color: "#888" }}>{list.length} partenaire{list.length > 1 ? "s" : ""}</span>
              </div>
              {list.length === 0 ? (
                <div style={{ padding: "16px 18px", fontSize: 13, color: "#aaa" }}>Aucun {type} actif</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {list.map(function(p) {
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "1px solid #f4f4f4" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: tc, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{p.nom}</div>
                          {p.contact_nom && <div style={{ fontSize: 11, color: "#aaa" }}>{p.contact_nom}{p.ville ? " · " + p.ville : ""}</div>}
                        </div>
                        {p.contact_email && <div style={{ fontSize: 11, color: "#888", display: "none" }}>{p.contact_email}</div>}
                        <Badge s={p.statut} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── OPÉRATIONS ── */}
        <SectionTitle>Opérations</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {/* Coaches actifs */}
          <div onClick={function() { setDashView(dashView === "coaches" ? "general" : "coaches"); }} style={{ background: dashView === "coaches" ? "#1a1a1a" : "#fff", border: "1px solid " + (dashView === "coaches" ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ fontSize: 11, color: dashView === "coaches" ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>Coaches actifs</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: dashView === "coaches" ? "#fff" : "#1D9E75", lineHeight: 1.2, marginTop: 4 }}>{data.coaches.length}</div>
            <div style={{ fontSize: 11, color: dashView === "coaches" ? "rgba(255,255,255,0.7)" : "#1D9E75", marginTop: 6, fontWeight: 500 }}>{dashView === "coaches" ? "▲ Masquer" : "▼ Voir la liste"}</div>
          </div>
          {/* Tâches en retard */}
          <div onClick={function() { setDashView(dashView === "retard" ? "general" : "retard"); }} style={{ background: dashView === "retard" ? "#1a1a1a" : "#fff", border: "1px solid " + (dashView === "retard" ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ fontSize: 11, color: dashView === "retard" ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>Tâches en retard</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: dashView === "retard" ? "#fff" : (tachesRetard > 0 ? "#A32D2D" : "#1D9E75"), lineHeight: 1.2, marginTop: 4 }}>{tachesRetard}</div>
            <div style={{ fontSize: 11, color: dashView === "retard" ? "rgba(255,255,255,0.7)" : (tachesRetard > 0 ? "#A32D2D" : "#aaa"), marginTop: 6, fontWeight: 500 }}>{dashView === "retard" ? "▲ Masquer" : (tachesRetard > 0 ? "▼ Voir le détail" : "Aucune")}</div>
          </div>
          {/* Actions en attente */}
          <div onClick={function() { setDashView(dashView === "actions" ? "general" : "actions"); }} style={{ background: dashView === "actions" ? "#1a1a1a" : "#fff", border: "1px solid " + (dashView === "actions" ? "#1a1a1a" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ fontSize: 11, color: dashView === "actions" ? "rgba(255,255,255,0.6)" : "#888", textTransform: "uppercase", letterSpacing: 1 }}>⏳ Actions en attente</span>
            <div style={{ fontSize: 28, fontWeight: 700, color: dashView === "actions" ? "#fff" : (actionsEnAttente > 0 ? "#BA7517" : "#888"), lineHeight: 1.2, marginTop: 4 }}>{actionsEnAttente}</div>
            <div style={{ fontSize: 11, color: dashView === "actions" ? "rgba(255,255,255,0.7)" : (actionsEnAttente > 0 ? "#BA7517" : "#aaa"), marginTop: 6, fontWeight: 500 }}>{dashView === "actions" ? "▲ Masquer" : (actionsEnAttente > 0 ? "▼ Voir le détail" : "à relancer")}</div>
          </div>
        </div>

        {/* Détail coaches inline */}
        {dashView === "coaches" && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>🏉 Coaches actifs</span>
              <span style={{ fontSize: 12, color: "#888" }}>{data.coaches.length} coach{data.coaches.length > 1 ? "es" : ""}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.coaches.map(function(c) {
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "1px solid #f4f4f4" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D9E7522", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1D9E75", flexShrink: 0 }}>
                      {(c.prenom||"?")[0]}{(c.nom||"")[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{c.role}{c.pays ? " · " + c.pays : ""}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>{c.sessions_completees || 0} sessions</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Détail tâches en retard inline */}
        {dashView === "retard" && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#A32D2D" }}>⚠️ Tâches en retard</span>
              <span style={{ fontSize: 12, color: "#888" }}>{tachesRetard} tâche{tachesRetard > 1 ? "s" : ""}</span>
            </div>
            {tachesRetard === 0 ? (
              <div style={{ padding: "16px 18px", fontSize: 13, color: "#aaa" }}>Aucune tâche en retard 🎉</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.taches.filter(function(t) { return t.statut !== "Termine" && t.date_echeance && t.date_echeance < now.toISOString().split("T")[0]; }).map(function(t) {
                  var retardDays = Math.ceil((now - new Date(t.date_echeance)) / 86400000);
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "1px solid #f4f4f4" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A32D2D", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{t.titre}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>Échéance : {t.date_echeance}{t.assigne_a ? " · " + t.assigne_a : ""}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#A32D2D", background: "#A32D2D11", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>+{retardDays}j</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Détail actions en attente inline */}
        {dashView === "actions" && (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#BA7517" }}>⏳ Actions en attente</span>
              <span style={{ fontSize: 12, color: "#888" }}>{actionsEnAttente} action{actionsEnAttente > 1 ? "s" : ""}</span>
            </div>
            {actionsEnAttente === 0 ? (
              <div style={{ padding: "16px 18px", fontSize: 13, color: "#aaa" }}>Aucune action en attente</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(data.actions || []).map(function(a) {
                  var p = data.partenaires.find(function(x) { return x.id === a.partenaire_id; });
                  var isLate = a.date_prevue < now.toISOString().split("T")[0];
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "1px solid #f4f4f4" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: isLate ? "#A32D2D" : "#BA7517", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{a.titre}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{p ? p.nom + " · " : ""}{a.date_prevue}</div>
                      </div>
                      {isLate && <span style={{ fontSize: 11, fontWeight: 700, color: "#A32D2D", background: "#A32D2D11", padding: "2px 8px", borderRadius: 20 }}>En retard</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL NOUVELLE TÂCHE — géré dans le Dashboard */}
      <Modal open={tacheModal} onClose={function() { setTacheModal(false); setTacheForm(TEMPTY); setPartSearch(""); }} title="Nouvelle tâche">
        <Field label="Titre *"><input style={inp} value={tacheForm.titre} onChange={function(e) { tset("titre", e.target.value); }} placeholder="Ex: Contacter nouveau sponsor" /></Field>
        <Field label="Description"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={tacheForm.description} onChange={function(e) { tset("description", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Priorité">
            <select style={sel} value={tacheForm.priorite} onChange={function(e) { tset("priorite", e.target.value); }}>
              {["Urgente","Haute","Moyenne","Basse"].map(function(p) { return <option key={p}>{p}</option>; })}
            </select>
          </Field>
          <Field label="À traiter pour le">
            <input type="date" style={inp} value={tacheForm.date_echeance} onChange={function(e) { tset("date_echeance", e.target.value); }} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Assigné par">
            <select style={sel} value={tacheForm.assigne_par} onChange={function(e) { tset("assigne_par", e.target.value); }}>
              <option value="">— Sélectionner —</option>
              {MEMBRES.map(function(m) { return <option key={m}>{m}</option>; })}
            </select>
          </Field>
          <Field label="Assigné à">
            <select style={sel} value={tacheForm.assigne_a} onChange={function(e) { tset("assigne_a", e.target.value); }}>
              <option value="">— Sélectionner —</option>
              {MEMBRES.map(function(m) { return <option key={m}>{m}</option>; })}
            </select>
          </Field>
        </div>
        <Field label="Partenaire lié">
          <div style={{ position: "relative" }}>
            <input style={inp} value={partSearch} placeholder="Tapez les premières lettres..." onChange={function(e) { setPartSearch(e.target.value); tset("partenaire_id", ""); tset("partenaire_nom_temp", ""); setShowDrop(true); }} onFocus={function() { setShowDrop(true); }} />
            {tacheForm.partenaire_id && <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }} onClick={function() { tset("partenaire_id", ""); setPartSearch(""); }}>×</div>}
            {showDrop && partSearch.length >= 2 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 180, overflowY: "auto" }}>
                {filteredParts.length === 0
                  ? <div style={{ padding: "10px 14px", fontSize: 13, color: "#888" }}>Aucun résultat pour "{partSearch}"</div>
                  : filteredParts.map(function(p) { return <div key={p.id} onClick={function() { tset("partenaire_id", p.id); setPartSearch(p.nom); setShowDrop(false); }} style={{ padding: "9px 14px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #e8e8e8" }} onMouseEnter={function(e){e.currentTarget.style.background="#f4f4f4";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                      {p.nom} <span style={{ fontSize: 11, color: "#aaa" }}>{p.type}</span>
                    </div>; })}
              </div>
            )}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setTacheModal(false); setTacheForm(TEMPTY); setPartSearch(""); }} style={btnS}>Annuler</button>
          <button onClick={handleAddTache} disabled={!tacheForm.titre} style={Object.assign({}, btnP, { opacity: tacheForm.titre ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
      {/* FICHE PARTENAIRE depuis tâche */}
      {dashFicheId && data && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
          <FichePartenaire
            partenaire={data.partenaires.find(function(p) { return p.id === dashFicheId; }) || {}}
            allPartenaires={data.partenaires || []}
            onClose={function() { setDashFicheId(null); }}
          />
        </div>
      )}
    </div>
  );
}
function DocumentsSection(props) {
  var entityType = props.entityType; // "partenaire" or "coach"
  var entityId = props.entityId;

  var docsState = useState([]); var docs = docsState[0]; var setDocs = docsState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var uploadingState = useState(false); var uploading = uploadingState[0]; var setUploading = uploadingState[1];
  var dossierState = useState("General"); var dossier = dossierState[0]; var setDossier = dossierState[1];
  var newDossierState = useState(false); var newDossier = newDossierState[0]; var setNewDossier = newDossierState[1];
  var newDossierNameState = useState(""); var newDossierName = newDossierNameState[0]; var setNewDossierName = newDossierNameState[1];

  useEffect(function() {
    var filter = entityType === "partenaire" ? "partenaire_id=eq." + entityId : "coach_id=eq." + entityId;
    sbFetch("documents", { select: "*", filter: filter, order: "created_at.desc" })
      .then(function(rows) { setDocs(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [entityId]);

  var dossiers = ["General"].concat(docs.reduce(function(acc, d) {
    if (d.dossier && acc.indexOf(d.dossier) === -1 && d.dossier !== "General") acc.push(d.dossier);
    return acc;
  }, []));
  var filteredDocs = docs.filter(function(d) { return d.dossier === dossier; });

  var FILE_ICONS = { pdf: "📄", jpg: "🖼️", jpeg: "🖼️", png: "🖼️", csv: "📊", xlsx: "📊", xls: "📊", doc: "📝", docx: "📝" };
  function getIcon(nom) {
    var ext = (nom || "").split(".").pop().toLowerCase();
    return FILE_ICONS[ext] || "📎";
  }
  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024*1024) return Math.round(bytes/1024) + " KB";
    return (bytes/1024/1024).toFixed(1) + " MB";
  }

  function handleUpload(files) {
    if (!files || !files.length) return;
    setUploading(true);
    var file = files[0];
    var ext = file.name.split(".").pop();
    var path = entityType + "/" + entityId + "/" + dossier + "/" + Date.now() + "_" + file.name.replace(/\s/g, "_");

    var formData = new FormData();
    formData.append("", file);

    fetch(SUPABASE_URL + "/storage/v1/object/document/" + path, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
      body: formData,
    }).then(function(r) {
      if (!r.ok) throw new Error("Upload failed");
      var publicUrl = SUPABASE_URL + "/storage/v1/object/public/document/" + path;
      var docData = {
        nom: file.name,
        type_fichier: ext,
        taille: file.size,
        url: publicUrl,
        chemin_storage: path,
        dossier: dossier,
      };
      if (entityType === "partenaire") docData.partenaire_id = entityId;
      else docData.coach_id = entityId;

      return sbInsert("documents", docData);
    }).then(function(rows) {
      setDocs([rows[0]].concat(docs));
      setUploading(false);
    }).catch(function(e) { alert("Erreur upload: " + e.message); setUploading(false); });
  }

  function handleDelete(doc) {
    if (!window.confirm("Supprimer " + doc.nom + " ?")) return;
    fetch(SUPABASE_URL + "/storage/v1/object/document/" + doc.chemin_storage, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
    }).then(function() {
      return fetch(SUPABASE_URL + "/rest/v1/documents?id=eq." + doc.id, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
      });
    }).then(function() {
      setDocs(docs.filter(function(d) { return d.id !== doc.id; }));
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>📁 Documents</h3>
        <label style={Object.assign({}, btnA, { display: "inline-block", cursor: "pointer" })}>
          {uploading ? "Upload..." : "+ Ajouter"}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleUpload(e.target.files); }} />
        </label>
      </div>

      {/* Dossiers */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {dossiers.map(function(d) {
          return (
            <button key={d} onClick={function() { setDossier(d); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid " + (dossier === d ? "#C8102E" : "#ddd"), background: dossier === d ? "#C8102E" : "#fff", color: dossier === d ? "#fff" : "#555", cursor: "pointer", fontSize: 12, fontWeight: dossier === d ? 600 : 400 }}>
              📁 {d}
            </button>
          );
        })}
        {newDossier ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input autoFocus value={newDossierName} onChange={function(e) { setNewDossierName(e.target.value); }} placeholder="Nom du dossier" style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #d0d0d0", fontSize: 12, width: 120 }} onKeyDown={function(e) { if (e.key === "Enter" && newDossierName.trim()) { setDossier(newDossierName.trim()); setNewDossier(false); setNewDossierName(""); } }} />
            <button onClick={function() { if (newDossierName.trim()) { setDossier(newDossierName.trim()); } setNewDossier(false); setNewDossierName(""); }} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 12 }}>OK</button>
          </div>
        ) : (
          <button onClick={function() { setNewDossier(true); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px dashed #ddd", background: "#fff", color: "#aaa", cursor: "pointer", fontSize: 12 }}>+ Nouveau dossier</button>
        )}
      </div>

      {/* Files list */}
      {loading ? <Spinner /> : filteredDocs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#bbb", fontSize: 13, border: "2px dashed #e0e0e0", borderRadius: 10 }}>
          Aucun document dans ce dossier<br />
          <label style={{ color: "#C8102E", cursor: "pointer", fontWeight: 500 }}>
            Cliquez pour uploader
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleUpload(e.target.files); }} />
          </label>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredDocs.map(function(doc) {
            return (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f4f4f4", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(doc.nom)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nom}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{formatSize(doc.taille)} · {doc.created_at ? doc.created_at.split("T")[0] : ""}</div>
                </div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", color: "#C8102E", fontSize: 12, textDecoration: "none", flexShrink: 0 }}>⬇️</a>
                <button onClick={function() { handleDelete(doc); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: "#E24B4A", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FICHE PARTENAIRE ─────────────────────────────────────────
// ── ASSOC INLINE (widget sélection partenaires associés) ──────
function AssocInline(props) {
  var all = props.all || []; var self = props.self;
  var selected = props.selected; var onSelect = props.onSelect;
  var search = props.search; var onSearch = props.onSearch;
  var drop = props.drop; var onDrop = props.onDrop;
  var filtered = all.filter(function(q) {
    if (q.id === self || selected.indexOf(q.id) >= 0) return false;
    var s = (search || "").trim().toLowerCase();
    if (!s || s.length < 2) return false;
    return (q.nom || "").toLowerCase().indexOf(s) >= 0;
  });
  return (
    <div>
      {/* Chips sélectionnés */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {selected.map(function(id) {
            var q = all.find(function(x) { return x.id === id; });
            if (!q) return null;
            var tc = TYPE_COLOR[q.type] || "#888";
            return (
              <span key={id} style={{ display: "flex", alignItems: "center", gap: 5, background: tc + "18", color: tc, border: "1px solid " + tc + "44", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                {TYPE_ICON[q.type]} {q.nom}
                <span onClick={function() { onSelect(selected.filter(function(x) { return x !== id; })); }} style={{ cursor: "pointer", marginLeft: 2, opacity: 0.7, fontWeight: 700 }}>×</span>
              </span>
            );
          })}
        </div>
      )}
      {/* Recherche */}
      <div style={{ position: "relative" }}>
        <input style={Object.assign({}, inp, { fontSize: 13 })} value={search} placeholder="Tapez un nom pour associer..." onChange={function(e) { onSearch(e.target.value); onDrop(true); }} onFocus={function() { onDrop(true); }} />
        {search && <div onClick={function() { onSearch(""); onDrop(false); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa", fontSize: 16 }}>×</div>}
        {drop && (search || "").length >= 2 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 200, maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>Aucun résultat</div>
            ) : filtered.map(function(q) {
              var tc = TYPE_COLOR[q.type] || "#888";
              return (
                <div key={q.id} onClick={function() { onSelect(selected.concat(q.id)); onSearch(""); onDrop(false); }} style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "#f4f4f4"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                  <span style={{ background: tc + "22", color: tc, padding: "1px 7px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{TYPE_ICON[q.type]} {q.type}</span>
                  <span>{q.nom}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LIAISONS PARTENAIRES ──────────────────────────────────────
function LiaisonsPartenaire(props) {
  var p = props.partenaire;
  var allPartenaires = props.allPartenaires || [];
  var openState = useState(false); var open = openState[0]; var setOpen = openState[1];
  var liensState = useState([]); var liens = liensState[0]; var setLiens = liensState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var searchState = useState(""); var search = searchState[0]; var setSearch = searchState[1];
  var showDropState = useState(false); var showDrop = showDropState[0]; var setShowDrop = showDropState[1];
  var savingState = useState(false); var saving = savingState[0]; var setSaving = savingState[1];

  useEffect(function() {
    if (!open) return;
    setLoading(true);
    sbFetch("partenaire_liens", { select: "*", filter: "partenaire_id=eq." + p.id, order: "created_at.asc" })
      .then(function(rows) { setLiens(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [open, p.id]);

  var linkedIds = liens.map(function(l) { return l.partenaire_lie_id; });
  var filteredDrop = allPartenaires.filter(function(q) {
    if (q.id === p.id || linkedIds.indexOf(q.id) >= 0) return false;
    var s = search.trim().toLowerCase();
    if (!s || s.length < 2) return false;
    return (q.nom || "").toLowerCase().indexOf(s) >= 0;
  });

  function handleAdd(partnerId) {
    setSaving(true);
    sbInsert("partenaire_liens", { partenaire_id: p.id, partenaire_lie_id: partnerId })
      .then(function(rows) {
        setLiens(liens.concat(rows[0]));
        setSearch(""); setShowDrop(false); setSaving(false);
      }).catch(function(e) { alert(e.message); setSaving(false); });
  }

  function handleDelete(id) {
    fetch(SUPABASE_URL + "/rest/v1/partenaire_liens?id=eq." + id, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } })
      .then(function() { setLiens(liens.filter(function(l) { return l.id !== id; })); });
  }

  function getPartenaire(id) { return allPartenaires.find(function(q) { return q.id === id; }) || null; }

  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #e8e8e8" }}>
      <div onClick={function() { setOpen(!open); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔗</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Partenaires associés</span>
          {liens.length > 0 && <span style={{ background: "#C8102E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{liens.length}</span>}
        </div>
        <span style={{ fontSize: 16, color: "#888", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {/* Barre de recherche inline */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input style={Object.assign({}, inp, { paddingRight: 36 })} value={search} placeholder="🔍 Associer un partenaire..." onChange={function(e) { setSearch(e.target.value); setShowDrop(true); }} onFocus={function() { setShowDrop(true); }} />
            {search && <div onClick={function() { setSearch(""); setShowDrop(false); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa", fontSize: 18, lineHeight: 1 }}>×</div>}
            {showDrop && search.length >= 2 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                {filteredDrop.length === 0 ? (
                  <div style={{ padding: "10px 14px", fontSize: 13, color: "#aaa" }}>Aucun résultat</div>
                ) : filteredDrop.map(function(q) {
                  var tc = TYPE_COLOR[q.type] || "#888";
                  return (
                    <div key={q.id} onClick={function() { handleAdd(q.id); }} style={{ padding: "9px 14px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = "#f4f4f4"; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                      <span style={{ background: tc + "22", color: tc, padding: "1px 7px", borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{TYPE_ICON[q.type]} {q.type}</span>
                      <span style={{ flex: 1 }}>{q.nom}</span>
                      <span style={{ fontSize: 11, color: "#C8102E", fontWeight: 600 }}>+ Associer</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Liste des associations */}
          {loading ? <Spinner /> : liens.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "12px 0" }}>Aucun partenaire associé</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {liens.map(function(l) {
                var lie = getPartenaire(l.partenaire_lie_id);
                var tc = lie ? (TYPE_COLOR[lie.type] || "#888") : "#ccc";
                return (
                  <div key={l.id} style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    {lie ? <span style={{ background: tc + "22", color: tc, padding: "1px 7px", borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{TYPE_ICON[lie.type]} {lie.type}</span> : null}
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{lie ? lie.nom : <span style={{ color: "#aaa" }}>Partenaire supprimé</span>}</span>
                    <button onClick={function() { handleDelete(l.id); }} style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid #fdd", background: "#fff", color: "#E24B4A", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ENFANTS SHELTER ───────────────────────────────────────────
function EnfantsShelter(props) {
  var p = props.partenaire;
  var listState = useState([]); var enfants = listState[0]; var setEnfants = listState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var openState = useState(false); var open = openState[0]; var setOpen = openState[1];
  var importingState = useState(false); var importing = importingState[0]; var setImporting = importingState[1];
  var importErrState = useState(""); var importErr = importErrState[0]; var setImportErr = importErrState[1];
  var searchState = useState(""); var search = searchState[0]; var setSearch = searchState[1];
  var addModalState = useState(false); var addModal = addModalState[0]; var setAddModal = addModalState[1];
  var EMPTY_ENFANT = { nom: "", prenom: "", date_naissance: "", commentaire: "" };
  var formState = useState(EMPTY_ENFANT); var form = formState[0]; var setForm = formState[1];

  useEffect(function() {
    if (!open) return;
    sbFetch("enfants_shelter", { select: "*", filter: "partenaire_id=eq." + p.id, order: "nom.asc" })
      .then(function(rows) { setEnfants(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [open, p.id]);

  function calcAge(dob) {
    if (!dob) return "—";
    var diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + " ans";
  }

  function parseCSV(text) {
    var lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    var header = lines[0].split(/[,;]/).map(function(h) { return h.trim().toLowerCase().replace(/["\s]/g,""); });
    var find = function(keys) {
      for (var i = 0; i < keys.length; i++) {
        var idx = header.findIndex(function(h) { return h.indexOf(keys[i]) >= 0; });
        if (idx >= 0) return idx;
      }
      return -1;
    };
    var iNom = find(["nom","lastname","name"]); var iPrenom = find(["prenom","firstname","first"]); var iDob = find(["datenaissance","dateofbirth","dob","naissance","birth"]); var iCom = find(["commentaire","comment","note","notes","remarque"]);
    return lines.slice(1).map(function(line) {
      var cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(function(c) { return c.trim().replace(/^"|"$/g,""); });
      return { nom: iNom >= 0 ? cols[iNom] || "" : "", prenom: iPrenom >= 0 ? cols[iPrenom] || "" : "", date_naissance: iDob >= 0 ? cols[iDob] || "" : "", commentaire: iCom >= 0 ? cols[iCom] || "" : "" };
    }).filter(function(r) { return r.nom || r.prenom; });
  }

  function handleCSVImport(file) {
    if (!file) return;
    setImporting(true); setImportErr("");
    var reader = new FileReader();
    reader.onload = function(ev) {
      var rows = parseCSV(ev.target.result);
      if (!rows.length) { setImportErr("Aucune ligne valide trouvée. Vérifiez les colonnes : NOM, PRENOM, DATE_NAISSANCE, COMMENTAIRE"); setImporting(false); return; }
      var payloads = rows.map(function(r) { return Object.assign({}, r, { partenaire_id: p.id }); });
      sbInsertMany("enfants_shelter", payloads)
        .then(function(inserted) {
          setEnfants(enfants.concat(inserted).sort(function(a,b){ return (a.nom||"").localeCompare(b.nom||""); }));
          setImporting(false);
          setImportErr("✓ " + inserted.length + " enfant" + (inserted.length > 1 ? "s" : "") + " importé" + (inserted.length > 1 ? "s" : "") + " avec succès.");
        })
        .catch(function(e) { setImportErr("Erreur import : " + e.message); setImporting(false); });
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleAddManuel() {
    var payload = Object.assign({}, form, { partenaire_id: p.id });
    sbInsert("enfants_shelter", payload).then(function(rows) {
      setEnfants(enfants.concat(rows[0]).sort(function(a,b){ return (a.nom||"").localeCompare(b.nom||""); }));
      setAddModal(false); setForm(EMPTY_ENFANT);
    }).catch(function(e) { alert(e.message); });
  }

  function handleDelete(id) {
    if (!window.confirm("Supprimer cet enfant de la liste ?")) return;
    fetch(SUPABASE_URL + "/rest/v1/enfants_shelter?id=eq." + id, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } })
      .then(function() { setEnfants(enfants.filter(function(e) { return e.id !== id; })); });
  }

  function handleExport() {
    var header = ["Nom","Prénom","Date de naissance","Âge","Commentaire"];
    var rows = enfants.map(function(e) {
      return [e.nom, e.prenom, e.date_naissance, calcAge(e.date_naissance), e.commentaire]
        .map(function(v) { return '"' + String(v||"").replace(/"/g,'""') + '"'; }).join(",");
    });
    var csv = [header.join(",")].concat(rows).join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = "enfants_" + p.nom.replace(/\s+/g,"_").toLowerCase() + ".csv"; a.click();
    URL.revokeObjectURL(url);
  }

  var filtered = enfants.filter(function(e) {
    var q = search.trim().toLowerCase();
    if (!q) return true;
    return ((e.nom||"") + " " + (e.prenom||"")).toLowerCase().indexOf(q) >= 0;
  });

  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #e8e8e8" }}>
      {/* Header accordéon */}
      <div onClick={function() { setOpen(!open); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>👦</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Liste des enfants</span>
          {enfants.length > 0 && <span style={{ background: "#C8102E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{enfants.length}</span>}
        </div>
        <span style={{ fontSize: 16, color: "#888", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {/* Barre d'outils */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="🔍 Rechercher..." style={{ flex: "1 1 160px", padding: "7px 10px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 13, outline: "none" }} />
            <button onClick={function() { setAddModal(true); }} style={Object.assign({}, btnA, { fontSize: 12 })}>+ Ajouter</button>
            <label style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #C8102E", background: importing ? "#f4f4f4" : "#C8102E11", color: "#C8102E", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              {importing ? "Import…" : "⬆ Import CSV"}
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={function(e) { handleCSVImport(e.target.files[0]); e.target.value=""; }} disabled={importing} />
            </label>
            {enfants.length > 0 && <button onClick={handleExport} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d0d0d0", background: "#fff", color: "#444", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>⬇ Export CSV</button>}
          </div>

          {/* Message import */}
          {importErr && <div style={{ fontSize: 12, marginBottom: 10, color: importErr.startsWith("✓") ? "#1D9E75" : "#C8102E", background: importErr.startsWith("✓") ? "#1D9E7511" : "#C8102E11", padding: "6px 10px", borderRadius: 8 }}>{importErr}</div>}

          {/* Info format CSV */}
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>
            Format CSV attendu : <code style={{ background: "#f4f4f4", padding: "1px 4px", borderRadius: 4 }}>NOM, PRENOM, DATE_NAISSANCE, COMMENTAIRE</code>
          </div>

          {/* Tableau */}
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "20px 0" }}>{search ? "Aucun résultat" : "Aucun enfant enregistré"}</div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e0e0e0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f4f4f4" }}>
                    {["NOM", "PRÉNOM", "DATE NAISSANCE", "ÂGE", "COMMENTAIRE", ""].map(function(h) {
                      return <th key={h} style={{ padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", borderBottom: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(function(e) {
                    return (
                      <tr key={e.id} style={{ borderBottom: "1px solid #f4f4f4" }}
                        onMouseEnter={function(el) { el.currentTarget.style.background="#fafafa"; }}
                        onMouseLeave={function(el) { el.currentTarget.style.background=""; }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1a1a1a" }}>{e.nom}</td>
                        <td style={{ padding: "8px 10px", color: "#444" }}>{e.prenom}</td>
                        <td style={{ padding: "8px 10px", color: "#666", whiteSpace: "nowrap" }}>{e.date_naissance || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#C8102E", fontWeight: 600, whiteSpace: "nowrap" }}>{calcAge(e.date_naissance)}</td>
                        <td style={{ padding: "8px 10px", color: "#888", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.commentaire || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <button onClick={function() { handleDelete(e.id); }} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #fdd", background: "#fff", color: "#E24B4A", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal ajout manuel */}
          <Modal open={addModal} onClose={function() { setAddModal(false); setForm(EMPTY_ENFANT); }} title="Ajouter un enfant">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Nom *"><input style={inp} value={form.nom} onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }} /></Field>
              <Field label="Prénom *"><input style={inp} value={form.prenom} onChange={function(e) { setForm(Object.assign({}, form, { prenom: e.target.value })); }} /></Field>
            </div>
            <Field label="Date de naissance"><input type="date" style={inp} value={form.date_naissance} onChange={function(e) { setForm(Object.assign({}, form, { date_naissance: e.target.value })); }} /></Field>
            <Field label="Commentaire"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={form.commentaire} onChange={function(e) { setForm(Object.assign({}, form, { commentaire: e.target.value })); }} /></Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={function() { setAddModal(false); setForm(EMPTY_ENFANT); }} style={btnS}>Annuler</button>
              <button onClick={handleAddManuel} disabled={!form.nom && !form.prenom} style={Object.assign({}, btnP, { opacity: (form.nom || form.prenom) ? 1 : 0.5 })}>Enregistrer</button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}

// ── EMAIL SECTION ─────────────────────────────────────────────
function EmailSection(props) {
  var p = props.partenaire;
  var openState = useState(false); var open = openState[0]; var setOpen = openState[1];
  var emailsState = useState([]); var emails = emailsState[0]; var setEmails = emailsState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var syncingState = useState(false); var syncing = syncingState[0]; var setSyncing = syncingState[1];
  var composeState = useState(false); var compose = composeState[0]; var setCompose = composeState[1];
  var replyToState = useState(null); var replyTo = replyToState[0]; var setReplyTo = replyToState[1];
  var sendingState = useState(false); var sending = sendingState[0]; var setSending = sendingState[1];
  var toState = useState(p.contact_email || ""); var to = toState[0]; var setTo = toState[1];
  var subjectState = useState(""); var subject = subjectState[0]; var setSubject = subjectState[1];
  var bodyState = useState(""); var body = bodyState[0]; var setBody = bodyState[1];
  var signatureState = useState("\n\n--\nRugby Cung Nhau\nadmin@rugbycungnhau.com"); var signature = signatureState[0];

  useEffect(function() {
    if (!open) return;
    setLoading(true);
    sbFetch("emails", { select: "*", filter: "partenaire_id=eq." + p.id, order: "date_reception.desc" })
      .then(function(rows) { setEmails(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [open, p.id]);

  function handleSync() {
    setSyncing(true);
    fetch("/api/gmail-sync", { method: "POST" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setSyncing(false);
        // Recharger les emails
        return sbFetch("emails", { select: "*", filter: "partenaire_id=eq." + p.id, order: "date_reception.desc" });
      })
      .then(function(rows) { setEmails(rows); })
      .catch(function(e) { alert("Erreur sync : " + e.message); setSyncing(false); });
  }

  function handleSend() {
    if (!to || !subject || !body) { alert("Destinataire, sujet et corps sont requis."); return; }
    setSending(true);
    var fullBody = body + signature;
    fetch("/api/gmail-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to,
        subject: replyTo ? (subject.startsWith("Re:") ? subject : "Re: " + subject) : subject,
        body: fullBody,
        threadId: replyTo ? replyTo.thread_id : null,
        replyToMessageId: replyTo ? replyTo.gmail_id : null,
        partenaireId: p.id,
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error);
        setSending(false);
        setCompose(false);
        setReplyTo(null);
        setSubject("");
        setBody("");
        // Ajouter l'email envoyé à la liste locale
        sbFetch("emails", { select: "*", filter: "partenaire_id=eq." + p.id, order: "date_reception.desc" })
          .then(function(rows) { setEmails(rows); });
      })
      .catch(function(e) { alert("Erreur envoi : " + e.message); setSending(false); });
  }

  function handleMarkRead(emailId) {
    sbUpdate("emails", emailId, { lu: true })
      .then(function() { setEmails(emails.map(function(e) { return e.id === emailId ? Object.assign({}, e, { lu: true }) : e; })); });
  }

  function openReply(email) {
    setReplyTo(email);
    setTo(email.de.match(/<(.+?)>/) ? email.de.match(/<(.+?)>/)[1] : email.de);
    setSubject(email.sujet);
    setBody("");
    setCompose(true);
  }

  var nonLus = emails.filter(function(e) { return !e.lu && e.type === "recu"; }).length;

  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #e8e8e8" }}>
      {/* Header accordéon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }} onClick={function() { setOpen(!open); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📧</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Emails</span>
          {nonLus > 0 && <span style={{ background: "#C8102E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{nonLus} non lu{nonLus > 1 ? "s" : ""}</span>}
          {emails.length > 0 && nonLus === 0 && <span style={{ background: "#e0e0e0", color: "#888", borderRadius: 20, padding: "1px 8px", fontSize: 11 }}>{emails.length}</span>}
        </div>
        <span style={{ fontSize: 16, color: "#888", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {/* Barre d'outils */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={function() { setCompose(true); setReplyTo(null); setTo(p.contact_email || ""); setSubject(""); setBody(""); }} style={Object.assign({}, btnA, { fontSize: 12 })}>✉️ Nouveau</button>
            <button onClick={handleSync} disabled={syncing} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#444" }}>{syncing ? "⟳ Sync..." : "⟳ Synchroniser"}</button>
          </div>

          {/* Formulaire composition */}
          {compose && (
            <div style={{ background: "#f4f4f4", borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>
                {replyTo ? "↩ Répondre à " + replyTo.de : "✉️ Nouveau message"}
              </div>
              <Field label="À"><input style={inp} value={to} onChange={function(e) { setTo(e.target.value); }} /></Field>
              <Field label="Sujet"><input style={inp} value={subject} onChange={function(e) { setSubject(e.target.value); }} placeholder={replyTo ? "Re: " + replyTo.sujet : ""} /></Field>
              <Field label="Message">
                <textarea style={Object.assign({}, inp, { minHeight: 120, resize: "vertical" })} value={body} onChange={function(e) { setBody(e.target.value); }} placeholder="Votre message..." />
              </Field>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10, padding: "6px 10px", background: "#fff", borderRadius: 6, border: "1px solid #e8e8e8" }}>
                {signature}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={function() { setCompose(false); setReplyTo(null); }} style={btnS}>Annuler</button>
                <button onClick={handleSend} disabled={sending} style={Object.assign({}, btnP, { opacity: sending ? 0.6 : 1 })}>{sending ? "Envoi..." : "📤 Envoyer"}</button>
              </div>
            </div>
          )}

          {/* Liste emails */}
          {loading ? <Spinner /> : emails.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "16px 0" }}>
              Aucun email — cliquez "Synchroniser" pour charger les emails Gmail
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {emails.map(function(email) {
                var isRecu = email.type === "recu";
                var dateStr = email.date_reception ? new Date(email.date_reception).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                  <div key={email.id} onClick={function() { if (!email.lu) handleMarkRead(email.id); }} style={{ background: email.lu ? "#fafafa" : "#fff", border: "1px solid " + (email.lu ? "#e8e8e8" : "#C8102E33"), borderLeft: "3px solid " + (isRecu ? (email.lu ? "#e0e0e0" : "#C8102E") : "#1D9E75"), borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, background: isRecu ? "#C8102E11" : "#1D9E7511", color: isRecu ? "#C8102E" : "#1D9E75", borderRadius: 20, padding: "1px 7px", fontWeight: 600 }}>{isRecu ? "↙ Reçu" : "↗ Envoyé"}</span>
                          {!email.lu && isRecu && <span style={{ fontSize: 10, background: "#C8102E", color: "#fff", borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>NOUVEAU</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: email.lu ? 400 : 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email.sujet || "(sans objet)"}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{isRecu ? email.de : "À : " + email.a}</div>
                        {email.corps && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email.corps.substring(0, 100)}...</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{dateStr}</div>
                        {isRecu && <button onClick={function(ev) { ev.stopPropagation(); openReply(email); }} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #C8102E44", background: "#C8102E11", color: "#C8102E", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>↩ Répondre</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── FICHE PARTENAIRE ──────────────────────────────────────────
function FichePartenaire(props) {
  var p = props.partenaire;
  var onClose = props.onClose;
  var actionsState = useState([]); var actions = actionsState[0]; var setActions = actionsState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var modalState = useState(false); var modal = modalState[0]; var setModal = modalState[1];
  var EMPTY_ACTION = { titre: "", type: "Visite terrain", date_prevue: "", heure: "", commentaire: "" };
  var formState = useState(EMPTY_ACTION); var form = formState[0]; var setForm = formState[1];
  var commentState = useState({}); var comments = commentState[0]; var setComments = commentState[1];
  var editCommentState = useState(null); var editingComment = editCommentState[0]; var setEditingComment = editCommentState[1];
  var editActionState = useState(null); var editingAction = editActionState[0]; var setEditingAction = editActionState[1];
  var editActionModal = useState(false); var editModal = editActionModal[0]; var setEditModal = editActionModal[1];

  var evtsState = useState([]); var evts = evtsState[0]; var setEvts = evtsState[1];

  useEffect(function() {
    Promise.all([
      sbFetch("actions_partenaires", {
        select: "*",
        filter: "partenaire_id=eq." + p.id,
        order: "date_prevue.asc"
      }),
      sbFetch("evenement_partenaires", {
        select: "evenement_id",
        filter: "partenaire_id=eq." + p.id,
      }),
    ]).then(function(r) {
      setActions(r[0]);
      var evtIds = r[1].map(function(e) { return e.evenement_id; });
      if (evtIds.length === 0) { setEvts([]); setLoading(false); return; }
      sbFetch("evenements", {
        select: "*",
        filter: "id=in.(" + evtIds.join(",") + ")",
        order: "date_debut.desc"
      }).then(function(rows) { setEvts(rows); setLoading(false); });
    });
  }, [p.id]);

  function setF(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  function handleAddAction() {
    var payload = Object.assign({}, form, { partenaire_id: p.id, statut: "En attente" });
    sbInsert("actions_partenaires", payload).then(function(rows) {
      setActions(actions.concat(rows[0]));
      setModal(false);
      setForm(EMPTY_ACTION);
    }).catch(function(e) { alert(e.message); });
  }

  function saveComment(a) {
    var txt = comments[a.id] !== undefined ? comments[a.id] : a.commentaire;
    sbUpdate("actions_partenaires", a.id, { commentaire: txt }).then(function() {
      setActions(actions.map(function(x) { return x.id === a.id ? Object.assign({}, x, { commentaire: txt }) : x; }));
      setEditingComment(null);
    });
  }

  function handleUpdateAction() {
    var a = editingAction;
    var payload = { titre: a.titre, type: a.type, date_prevue: a.date_prevue, heure: a.heure, commentaire: a.commentaire };
    sbUpdate("actions_partenaires", a.id, payload).then(function() {
      setActions(actions.map(function(x) { return x.id === a.id ? Object.assign({}, x, payload) : x; }));
      setEditModal(false);
      setEditingAction(null);
    }).catch(function(e) { alert(e.message); });
  }

  var today = new Date().toISOString().split("T")[0];
  var aVenir = actions.filter(function(a) { return a.statut === "En attente" && a.date_prevue >= today; });
  var enRetard = actions.filter(function(a) { return a.statut === "En attente" && a.date_prevue < today; });
  var faites = actions.filter(function(a) { return a.statut === "Confirme"; });

  var TYPE_ACTION_ICON = { "Visite terrain": "🏃", "RDV": "🤝", "Appel": "📞", "Email": "✉️", "Autre": "📌" };

  function deleteAction(a) {
    if (!window.confirm("Supprimer cette action ?")) return;
    fetch(SUPABASE_URL + "/rest/v1/actions_partenaires?id=eq." + a.id, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    }).then(function() {
      setActions(actions.filter(function(x) { return x.id !== a.id; }));
    });
  }

  function changeStatut(a, newStatut) {
    sbUpdate("actions_partenaires", a.id, { statut: newStatut }).then(function() {
      setActions(actions.map(function(x) { return x.id === a.id ? Object.assign({}, x, { statut: newStatut }) : x; }));
    });
  }

  function ActionItem(props2) {
    var a = props2.action;
    var isEditing = editingComment === a.id;
    var isLate = a.statut === "En attente" && a.date_prevue < today;
    var STATUT_CFG = {
      "Confirme":   { color: "#1D9E75", bg: "#1D9E7522", icon: "✅", label: "Confirmé" },
      "En attente": { color: "#BA7517", bg: "#BA751722", icon: "⏳", label: "En attente" },
    };
    var cfg = STATUT_CFG[a.statut] || STATUT_CFG["En attente"];
    return (
      <div style={{ background: "#fff", border: "1px solid " + (isLate ? "#E24B4A44" : "#e0e0e0"), borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flexShrink: 0, marginTop: 2, fontSize: 20 }}>{cfg.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: a.statut === "Confirme" ? "#aaa" : "#1a1a1a", textDecoration: a.statut === "Confirme" ? "line-through" : "none" }}>{TYPE_ACTION_ICON[a.type]} {a.titre}</span>
              <span style={{ fontSize: 11, background: "#e8e8e8", color: "#888", borderRadius: 12, padding: "2px 8px" }}>{a.type}</span>
              {isLate && <span style={{ fontSize: 11, background: "#E24B4A22", color: "#E24B4A", borderRadius: 12, padding: "2px 8px", fontWeight: 600 }}>⚠️ En retard</span>}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>📅 {a.date_prevue}{a.heure ? " à " + a.heure : ""}</div>
            {/* Boutons statut */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={function() { changeStatut(a, "Confirme"); }} style={{ padding: "4px 12px", borderRadius: 20, border: "2px solid " + (a.statut === "Confirme" ? "#1D9E75" : "#ddd"), background: a.statut === "Confirme" ? "#1D9E7522" : "#fff", color: a.statut === "Confirme" ? "#1D9E75" : "#888", cursor: "pointer", fontSize: 12, fontWeight: a.statut === "Confirme" ? 600 : 400 }}>✅ Confirmé</button>
              <button onClick={function() { changeStatut(a, "En attente"); }} style={{ padding: "4px 12px", borderRadius: 20, border: "2px solid " + (a.statut === "En attente" ? "#BA7517" : "#ddd"), background: a.statut === "En attente" ? "#BA751722" : "#fff", color: a.statut === "En attente" ? "#BA7517" : "#888", cursor: "pointer", fontSize: 12, fontWeight: a.statut === "En attente" ? 600 : 400 }}>⏳ En attente</button>
              <button onClick={function() { setEditingAction(Object.assign({}, a)); setEditModal(true); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #d0d0d0", background: "#fff", color: "#C8102E", cursor: "pointer", fontSize: 12 }}>✏️ Modifier</button>
              <button onClick={function() { deleteAction(a); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #E24B4A44", background: "#fff", color: "#E24B4A", cursor: "pointer", fontSize: 12, marginLeft: "auto" }}>🗑️ Supprimer</button>
            </div>
            {/* Commentaire */}
            <div style={{ marginTop: 8 }}>
              {isEditing ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <textarea value={comments[a.id] !== undefined ? comments[a.id] : (a.commentaire || "")} onChange={function(e) { setComments(Object.assign({}, comments, { [a.id]: e.target.value })); }} style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #d0d0d0", fontSize: 13, resize: "vertical", minHeight: 60 }} placeholder="Ajouter un commentaire..." />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={function() { saveComment(a); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 12 }}>Sauver</button>
                    <button onClick={function() { setEditingComment(null); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 12 }}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div onClick={function() { setEditingComment(a.id); setComments(Object.assign({}, comments, { [a.id]: a.commentaire || "" })); }} style={{ fontSize: 13, color: a.commentaire ? "#555" : "#bbb", fontStyle: a.commentaire ? "normal" : "italic", cursor: "pointer", padding: "4px 6px", borderRadius: 6, background: "#f4f4f4" }}>
                  {a.commentaire || "Cliquez pour ajouter un commentaire..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 520, height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        {/* Header fiche */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TypeBadge t={p.type} />
              <Badge s={p.statut} />
            </div>
            <h2 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{p.nom}</h2>
            {p.contact_nom && <div style={{ fontSize: 14, color: "#444" }}>👤 {p.contact_nom}</div>}
            {p.contact_email && <div style={{ fontSize: 13, color: "#C8102E" }}>✉️ {p.contact_email}</div>}
            {p.contact_tel && <div style={{ fontSize: 13, color: "#444" }}>📞 {p.contact_tel}</div>}
            {p.ville && <div style={{ fontSize: 13, color: "#444" }}>📍 {p.ville}{p.district ? " — " + p.district : ""}</div>}
            {p.notes && <div style={{ fontSize: 13, color: "#888", marginTop: 6, fontStyle: "italic" }}>{p.notes}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>×</button>
        </div>

        {/* Actions */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Actions & Historique</h3>
            <button onClick={function() { setModal(true); }} style={btnA}>+ Planifier</button>
          </div>

          {loading ? <Spinner /> : (
            <div>
              {enRetard.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E24B4A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⚠️ En retard ({enRetard.length})</div>
                  {enRetard.map(function(a) { return <ActionItem key={a.id} action={a} />; })}
                </div>
              )}
              {aVenir.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#C8102E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>À venir ({aVenir.length})</div>
                  {aVenir.map(function(a) { return <ActionItem key={a.id} action={a} />; })}
                </div>
              )}
              {faites.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Confirmées ({faites.length})</div>
                  {faites.map(function(a) { return <ActionItem key={a.id} action={a} />; })}
                </div>
              )}
              {actions.length === 0 && <Empty msg="Aucune action — cliquez + Planifier" />}
            </div>
          )}
        </div>

        {/* Événements associés */}
        {evts.length > 0 && (
          <div style={{ padding: "0 24px", marginTop: 0 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>📅 Événements associés ({evts.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {evts.map(function(e) {
                var STATUT_EVT_COLOR = { Planifie: "#C8102E", "En cours": "#9B1C1C", Termine: "#1D9E75", Annule: "#A32D2D" };
                var color = STATUT_EVT_COLOR[e.statut] || "#888";
                return (
                  <div key={e.id} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{e.titre}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        {e.type} · {e.date_debut ? e.date_debut.split("T")[0] : "—"}
                        {e.lieu ? " · " + e.lieu : ""}
                        {e.nombre_enfants_presents > 0 ? " · " + e.nombre_enfants_presents + " enfants" : ""}
                      </div>
                      {e.confirmation_statut && <span style={{ fontSize: 11, background: e.confirmation_statut === "Confirme" ? "#1D9E7522" : "#BA751722", color: e.confirmation_statut === "Confirme" ? "#1D9E75" : "#BA7517", borderRadius: 12, padding: "2px 6px", fontWeight: 600, marginTop: 4, display: "inline-block" }}>{e.confirmation_statut === "Confirme" ? "✅ Confirmé" : "⏳ En attente"}</span>}
                    </div>
                    <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{e.statut}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Liste enfants — Shelters uniquement */}
        {p.type === "Shelter" && <EnfantsShelter partenaire={p} />}

        {/* Liaisons entre partenaires */}
        <LiaisonsPartenaire partenaire={p} allPartenaires={props.allPartenaires || []} />

        {/* Emails */}
        <EmailSection partenaire={p} />

        <DocumentsSection entityType="partenaire" entityId={p.id} />

        {/* Modal edition action */}
        {editingAction && <Modal open={editModal} onClose={function() { setEditModal(false); }} title="Modifier l'action">
          <Field label="Titre *"><input style={inp} value={editingAction.titre || ""} onChange={function(e) { setEditingAction(Object.assign({}, editingAction, { titre: e.target.value })); }} /></Field>
          <Field label="Type">
            <select style={sel} value={editingAction.type || "Visite terrain"} onChange={function(e) { setEditingAction(Object.assign({}, editingAction, { type: e.target.value })); }}>
              {["Visite terrain","RDV","Appel","Email","Autre"].map(function(t) { return <option key={t}>{t}</option>; })}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date *"><input type="date" style={inp} value={editingAction.date_prevue || ""} onChange={function(e) { setEditingAction(Object.assign({}, editingAction, { date_prevue: e.target.value })); }} /></Field>
            <Field label="Heure"><input type="time" style={inp} value={editingAction.heure || ""} onChange={function(e) { setEditingAction(Object.assign({}, editingAction, { heure: e.target.value })); }} /></Field>
          </div>
          <Field label="Commentaire"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 80 })} value={editingAction.commentaire || ""} onChange={function(e) { setEditingAction(Object.assign({}, editingAction, { commentaire: e.target.value })); }} /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={function() { setEditModal(false); }} style={btnS}>Annuler</button>
            <button onClick={handleUpdateAction} style={btnP}>Enregistrer</button>
          </div>
        </Modal>}

        {/* Modal ajout action */}
        <Modal open={modal} onClose={function() { setModal(false); }} title="Planifier une action">
          <Field label="Titre *"><input style={inp} value={form.titre} onChange={function(e) { setF("titre", e.target.value); }} placeholder="Ex: Visite mensuelle" /></Field>
          <Field label="Type">
            <select style={sel} value={form.type} onChange={function(e) { setF("type", e.target.value); }}>
              {["Visite terrain","RDV","Appel","Email","Autre"].map(function(t) { return <option key={t}>{t}</option>; })}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date *"><input type="date" style={inp} value={form.date_prevue} onChange={function(e) { setF("date_prevue", e.target.value); }} /></Field>
            <Field label="Heure"><input type="time" style={inp} value={form.heure} onChange={function(e) { setF("heure", e.target.value); }} /></Field>
          </div>
          <Field label="Commentaire"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 70 })} value={form.commentaire} onChange={function(e) { setF("commentaire", e.target.value); }} placeholder="Notes, contexte, objectifs..." /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
            <button onClick={handleAddAction} disabled={!form.titre || !form.date_prevue} style={Object.assign({}, btnP, { opacity: (form.titre && form.date_prevue) ? 1 : 0.5 })}>Enregistrer</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

// ── PARTENAIRES ───────────────────────────────────────────────
var CSV_PROSPECTS = [
  { id:"p1",  nom:"ADENOT Lionel",       prenom:"Lionel",    civilite:"Mr",      type_csv:"",         tel:null,                    email:"lionel.adenot@decathlon.com",        organisation:"Decathlon",                                      job:"",                                              ville:"",                 adresse:"" },
  { id:"p2",  nom:"ALEXANDER Tom",       prenom:"Tom",       civilite:"Mr",      type_csv:"Corporate",tel:"+84 79 7483800",         email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p3",  nom:"BASSON Paul",         prenom:"Paul",      civilite:"Mr",      type_csv:"",         tel:"+84 90 6937866",        email:"basson.p@gmail.com",                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p4",  nom:"BON Emmanuel",        prenom:"Emmanuel",  civilite:"Mr",      type_csv:"",         tel:"+62 812 81152 9055",    email:"emmanuelbonrugby@yahoo.fr",          organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p5",  nom:"BROWNRIGG Tracey",    prenom:"Tracey",    civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"tracey.brownrigg@bisvietnam.com",    organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p6",  nom:"BURIDARD Auriane",    prenom:"Auriane",   civilite:"Mrs/Ms",  type_csv:"",         tel:"+33 7 81 66 15 46",     email:null,                                 organisation:"La Guilde Européenne du Raid (ONG)",              job:"Chargée de mission Sport & Développement",      ville:"Paris, France",    adresse:"7, rue Pasquier - 75008 Paris" },
  { id:"p7",  nom:"CAMARA Nelson",       prenom:"Nelson",    civilite:"Mr",      type_csv:"",         tel:"+221 77 644 20 21",     email:"nc@sport-impact.org",                organisation:"Sport en Commun",                                job:"Executive President",                           ville:"Dakar, Senegal",   adresse:"Immeuble 7 - Rue KA 05 - Karak, Dakar" },
  { id:"p8",  nom:"CAMARET Arthur",      prenom:"Arthur",    civilite:"Mr",      type_csv:"",         tel:"+84 90 261 2360",       email:"arthur.camaret@gmail.com",           organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p9",  nom:"CAMPBELL John",       prenom:"John",      civilite:"Mr",      type_csv:"",         tel:null,                    email:"jcampbell@savills.com.vn",           organisation:"Savills Vietnam",                                job:"Director",                                      ville:"",                 adresse:"" },
  { id:"p10", nom:"CANY Alain",          prenom:"Alain",     civilite:"Mr",      type_csv:"RCN, Corporate", tel:"+84 90 3660960",  email:"alain.cany@gmail.com",              organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p11", nom:"CASTANIER Patrick",   prenom:"Patrick",   civilite:"Mr",      type_csv:"",         tel:null,                    email:"patrick.castanier@pernod-ricard.com",organisation:"Pernod Ricard Asia Duty Free",                   job:"Directeur Commercial",                          ville:"",                 adresse:"" },
  { id:"p12", nom:"CASTRES Fabrice",     prenom:"Fabrice",   civilite:"Mr",      type_csv:"School",   tel:null,                    email:"fabrice.castres22@gmail.com",        organisation:"Sedbergh Vietnam",                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p13", nom:"CHOUABIA Yacine",     prenom:"Yacine",    civilite:"Mr",      type_csv:"",         tel:null,                    email:"yacine.chouabia@edf.fr",             organisation:"EDF",                                            job:"Business Development Director Asia",             ville:"",                 adresse:"" },
  { id:"p14", nom:"COLLEY Iain",         prenom:"Iain",      civilite:"Mr",      type_csv:"School",   tel:null,                    email:"iain.colley@bisvietnam.com",         organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p15", nom:"COLLIN Ronan",        prenom:"Ronan",     civilite:"Mr",      type_csv:"",         tel:"+34 644 573 130",       email:"ronan@ngo-shoes.com",                organisation:"N'go",                                           job:"COO",                                           ville:"",                 adresse:"" },
  { id:"p16", nom:"DASSONVILLE Astrid",  prenom:"Astrid",    civilite:"Mrs/Ms",  type_csv:"",         tel:"+84 90 950 39 94",      email:null,                                 organisation:"TotalEnergies",                                  job:"",                                              ville:"",                 adresse:"" },
  { id:"p17", nom:"DEBLOCK Alain",       prenom:"Alain",     civilite:"Mr",      type_csv:"",         tel:"+33 6 61 70 82 27",     email:"deblock@terralto.com",               organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p18", nom:"DESCHAMPS Jean-Marc", prenom:"Jean-Marc", civilite:"Mr",      type_csv:"Corporate",tel:"+84 16 97909498",       email:"jean-marc.deschamps@mazars.vn",      organisation:"Forvis Mazars",                                  job:"Senior Advisor",                                ville:"",                 adresse:"" },
  { id:"p19", nom:"DÉSIR Patrick",       prenom:"Patrick",   civilite:"Mr",      type_csv:"",         tel:"+84 90 3171 1199",      email:"pdesir@poussieresdevie.org",         organisation:"Poussières de Vie",                              job:"",                                              ville:"",                 adresse:"" },
  { id:"p20", nom:"DIAS Christophe",     prenom:"Christophe",civilite:"Mr",      type_csv:"",         tel:"+33 6 72 93 15 69",     email:"richyf@afd.fr",                      organisation:"Agence Française de Développement (AFD)",         job:"Chargé de Mission - Sport & Développement",     ville:"Paris, France",    adresse:"5 rue Roland Barthes - 75012 Paris" },
  { id:"p21", nom:"DINH Barbara",        prenom:"Barbara",   civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:"barbara.dinh@pierre-fabre.com",      organisation:"Pierre Fabre",                                   job:"",                                              ville:"",                 adresse:"" },
  { id:"p22", nom:"DOAN VIET Dai Tu",    prenom:"Dai Tu",    civilite:"Mr",      type_csv:"",         tel:null,                    email:"daitu.doanviet@openasiagroup.com",   organisation:"Open Asia",                                      job:"Chairman",                                      ville:"",                 adresse:"" },
  { id:"p23", nom:"DUNCAN Drew",         prenom:"Drew",      civilite:"Mr",      type_csv:"",         tel:"+84 96 627 327",        email:"drew.duncan@dhl.com",                organisation:"DHL",                                            job:"Managing Director",                             ville:"",                 adresse:"" },
  { id:"p24", nom:"DURAN LOPEZ Juan-Pedro",prenom:"Juan-Pedro",civilite:"Mr",    type_csv:"",         tel:"+84 901 43 91 43",      email:"juanpedro.duranlopez@bpce-vietnam.com",organisation:"BPCE IOM",                                     job:"General Manager",                               ville:"HCMC, Vietnam",    adresse:"Green Power Tower 21st Floor, 35 Ton Duc Thang, Dist. 1" },
  { id:"p25", nom:"ELLIS Gavin",         prenom:"Gavin",     civilite:"Mr",      type_csv:"RCN",      tel:"+84 58 291 6291",       email:"gavin.ellis.pro@gmail.com",          organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p26", nom:"EVANS Jodie",         prenom:"Jodie",     civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"jodie.evans@sedbergh.edu.vn",        organisation:"Sedbergh Vietnam",                               job:"Headmistress",                                  ville:"",                 adresse:"" },
  { id:"p27", nom:"FAGES Olivier",       prenom:"Olivier",   civilite:"Mr",      type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p28", nom:"FISSE Benoit",        prenom:"Benoit",    civilite:"Mr",      type_csv:"",         tel:null,                    email:"scufisse@gmail.com",                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p29", nom:"FRASER Mark",         prenom:"Mark",      civilite:"Mr",      type_csv:"Corporate",tel:"+84 90 3837119",        email:"mark.fraser@frasersvn.com",          organisation:"Frasers Law Company, Vietnam",                   job:"Founding Managing Partner",                     ville:"",                 adresse:"" },
  { id:"p30", nom:"FRAZIER Michael",     prenom:"Michael",   civilite:"Mr",      type_csv:"Corporate",tel:"+84 79 7483800",        email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p31", nom:"GASPAR Lisa-Marie",   prenom:"Lisa-Marie",civilite:"Mrs/Ms",  type_csv:"",         tel:"+33 143 24 79 39",      email:"lgaspar@unenfantparlamain.org",      organisation:"Un Enfant par la Main",                          job:"Responsable communication",                     ville:"Nogent sur Marne", adresse:"2 boulevard Albert 1er, 94130 Nogent sur Marne" },
  { id:"p32", nom:"GILLIN Mark",         prenom:"Mark",      civilite:"Mr",      type_csv:"Corporate",tel:"+84 903 804 860",       email:"markg@aimup.com",                    organisation:"America Indochina Management Vietnam",            job:"Director",                                      ville:"HCMC, Vietnam",    adresse:"117-119-121 Nguyen Du, Dist. 1" },
  { id:"p33", nom:"GIROUX Thibaut",      prenom:"Thibaut",   civilite:"Mr",      type_csv:"Corporate",tel:"+84 9 08 99 39 77",     email:"tgiroux@gmail.com",                  organisation:"Stolz-Miras",                                    job:"CEO",                                           ville:"Bien Hoa, Vietnam", adresse:"Lot 521, Street no.13, Amata IP, Long Binh" },
  { id:"p34", nom:"GOUPILLE Antoine",    prenom:"Antoine",   civilite:"Mr",      type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p35", nom:"GUILLON Le Thu",      prenom:"Le Thu",    civilite:"Mrs/Ms",  type_csv:"",         tel:"+84 90 9240758",        email:"lethu.nguyen@fvhospital.com",        organisation:"FV Hospital",                                    job:"",                                              ville:"",                 adresse:"" },
  { id:"p36", nom:"GUILLON Jean Marcel", prenom:"Jean Marcel",civilite:"Mr",     type_csv:"",         tel:"+84 90 3701691",        email:"guillonjm@fvhospital.com",           organisation:"FV Hospital",                                    job:"",                                              ville:"",                 adresse:"" },
  { id:"p37", nom:"HALLAK Gregory",      prenom:"Gregory",   civilite:"Mr",      type_csv:"Corporate",tel:"+84 989 088 814",       email:"gregory.hallak@cartier.com",         organisation:"Cartier Joailliers",                             job:"Managing Director",                             ville:"HCMC, Vietnam",    adresse:"Room 5a, Level 5, Opera View Building, 161 Dong Khoi" },
  { id:"p38", nom:"HAMAÏDE Julia",       prenom:"Julia",     civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:"redaction@koimagazine.fr",           organisation:"Koï magazine",                                   job:"Fondatrice et rédactrice en chef",               ville:"",                 adresse:"" },
  { id:"p39", nom:"HERENT Eric",         prenom:"Eric",      civilite:"Mr",      type_csv:"Corporate",tel:"+84 969 061 506",       email:"eric.herent@aimup.com",              organisation:"America Indochina Management Vietnam",            job:"Division Manager",                              ville:"HCMC, Vietnam",    adresse:"117-119-121 Nguyen Du, Dist. 1" },
  { id:"p40", nom:"HIGGINS Stephen",     prenom:"Stephen",   civilite:"Mr",      type_csv:"",         tel:"+84 12 6571 4416",      email:"stephen.higgins65@gmail.com",        organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p41", nom:"HOANG Minh",          prenom:"Minh",      civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:"minh@febe.vc",                       organisation:"FEBE Ventures",                                  job:"Director of Operations & Platform",             ville:"",                 adresse:"" },
  { id:"p42", nom:"HSU Angela",          prenom:"Angela",    civilite:"Mrs/Ms",  type_csv:"",         tel:"+84 91 5205209",        email:"angelas728@gmail.com",               organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p43", nom:"JONCAS Jean-Pierre",  prenom:"Jean-Pierre",civilite:"Mr",     type_csv:"Corporate",tel:"+84 901 355 006",       email:"jeanpierre.joncas@accor.com",        organisation:"Accor",                                          job:"General Manager, Area GM Southern Vietnam",     ville:"HCMC, Vietnam",    adresse:"76-78 Nguyen Thi Minh Khai, Ward 6, Dist. 3" },
  { id:"p44", nom:"JONES Mark",          prenom:"Mark",      civilite:"Mr",      type_csv:"School",   tel:null,                    email:"mark.jones@bisvietnam.com",          organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p45", nom:"JONVILLE Stanley",    prenom:"Stanley",   civilite:"Mr",      type_csv:"",         tel:"+84 90 8681912",        email:"jonville.stan@gmail.com",            organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p46", nom:"KOULAKSEZIAN Adam",   prenom:"Adam",      civilite:"Mr",      type_csv:"Corporate",tel:"+84 28 38 23 88 22",    email:"adam.koulaksezian@ccifv.org",        organisation:"La CCI France Vietnam (CCIFV)",                  job:"Directeur Exécutif",                            ville:"HCMC, Vietnam",    adresse:"186 Nguyễn Văn Hưởng, Thảo Điền, Q.2" },
  { id:"p47", nom:"LACHIZE Didier",      prenom:"Didier",    civilite:"Mr",      type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p48", nom:"LE GARZIC Yves",      prenom:"Yves",      civilite:"Mr",      type_csv:"",         tel:null,                    email:"lgjy@yahoo.fr",                      organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p49", nom:"LEAL DE LA TORRE François Xavier",prenom:"François Xavier",civilite:"Mr",type_csv:"",tel:"364546907",          email:null,                                 organisation:"K1 Fitness And Fight Factory",                   job:"",                                              ville:"",                 adresse:"" },
  { id:"p50", nom:"LEVISON Emma",        prenom:"Emma",      civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"emma.levison@teacher.sedbergh.edu.vn",organisation:"Sedbergh Vietnam",                              job:"Head of PE Department",                         ville:"",                 adresse:"" },
  { id:"p51", nom:"LORTHOLARY-NGUYEN Christine",prenom:"Christine",civilite:"Mrs/Ms",type_csv:"",tel:null,                        email:"thihanhchristine@yahoo.fr",          organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p52", nom:"LUONG Nicolas",       prenom:"Nicolas",   civilite:"Mr",      type_csv:"",         tel:"+84 90 8691123",        email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p53", nom:"MERLIN Eric",         prenom:"Eric",      civilite:"Mr",      type_csv:"",         tel:"+84 90 340 1035",       email:"eric@appletree-asia.com",            organisation:"The Apple Tree Group",                           job:"CEO",                                           ville:"HCMC, Vietnam",    adresse:"18 Hai Ba Trung, Ben Nghe Ward, Dist.1" },
  { id:"p54", nom:"MERLIN Ha Phuong",    prenom:"Ha Phuong", civilite:"",        type_csv:"",         tel:null,                    email:"phuongha_merlin@yahoo.com",          organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p55", nom:"MEYER Thomas",        prenom:"Thomas",    civilite:"Mr",      type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p56", nom:"MOUAT Leslie",        prenom:"Leslie",    civilite:"Mr",      type_csv:"",         tel:"+84 93 4191025",        email:"leslie.mouat@marsh.com",             organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p57", nom:"MY CAM Tu",           prenom:"Tu",        civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"tu.cam.quan@vas.edu.vn",             organisation:"Vietnam Australia Intl School",                  job:"Central Academic Team",                         ville:"",                 adresse:"" },
  { id:"p58", nom:"NGUY Michel",         prenom:"Michel",    civilite:"Mr",      type_csv:"",         tel:"01 80 60 13 16",        email:"michel@yuman-immobilier.fr",         organisation:"",                                               job:"Directeur Général",                             ville:"",                 adresse:"" },
  { id:"p59", nom:"NGUYEN Maurice",      prenom:"Maurice",   civilite:"Mr",      type_csv:"",         tel:"+84 90 3752928",        email:"maurice.nguyen@kcnvietnam.com",      organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p60", nom:"NGUYEN Hai-Nam",      prenom:"Hai-Nam",   civilite:"Mr",      type_csv:"",         tel:"+33 7 6157 7658",       email:"hainam.nguyen@abvietfrance.org",     organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p61", nom:"NGUYEN An",           prenom:"An",        civilite:"",        type_csv:"",         tel:"+84 91 295 3667",       email:"a.nguyen@indochinemedia.com",        organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p62", nom:"NGUYEN Thu",          prenom:"Thu",       civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"thu.thien.nguyen@vas.edu.vn",        organisation:"Vietnam Australia Intl School",                  job:"Central Academic Team",                         ville:"",                 adresse:"" },
  { id:"p63", nom:"NIEUWENHUIZEN Tania", prenom:"Tania",     civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"tania.nieuwenhuizen@teacher.sedbergh.edu.vn",organisation:"",                                      job:"",                                              ville:"",                 adresse:"" },
  { id:"p64", nom:"PAVILLON GROSSER Emmanuelle",prenom:"Emmanuelle",civilite:"Mrs/Ms",type_csv:"",tel:"+84 90 3816027",           email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p65", nom:"PEEL Tom",            prenom:"Tom",       civilite:"Mr",      type_csv:"",         tel:null,                    email:"thomasepeel@googlemail.com",         organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p66", nom:"PELLETIER Stef",      prenom:"Stef",      civilite:"Mr",      type_csv:"",         tel:"+84 90 9153577",        email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p67", nom:"PEREZ Audrey",        prenom:"Audrey",    civilite:"Mrs/Ms",  type_csv:"",         tel:"364546907",             email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p68", nom:"PHOEUONG Sakal",      prenom:"Sakal",     civilite:"Mr",      type_csv:"Corporate",tel:"+84 90 2597009",        email:"sakaph@hotmail.com",                 organisation:"P'ti Saigon",                                    job:"Chef",                                          ville:"HCMC, Vietnam",    adresse:"52 Ngô Quang Huy, Thảo Điền, Thủ Đức" },
  { id:"p69", nom:"PHUONG THAO Sarah",   prenom:"Sarah",     civilite:"Mrs/Ms",  type_csv:"Corporate",tel:null,                    email:"sarah@febe.vc",                      organisation:"FEBE Ventures",                                  job:"",                                              ville:"",                 adresse:"" },
  { id:"p70", nom:"PIER Laurenza",       prenom:"Laurenza",  civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p71", nom:"PINATELLE Xavier",    prenom:"Xavier",    civilite:"Mr",      type_csv:"",         tel:null,                    email:"xavier.pinatelle@total.com",         organisation:"TotalEnergies",                                  job:"Directeur de Division CEE",                     ville:"",                 adresse:"" },
  { id:"p72", nom:"POIRIER Jean-Noel",   prenom:"Jean-Noel", civilite:"Mr",      type_csv:"Corporate",tel:"+84 932 396 486",       email:"parishanoi2012@gmail.com",           organisation:"ALMA Viet Nam Consulting Ltd",                   job:"Chairman",                                      ville:"Hanoi, Vietnam",   adresse:"36 Ham Long, Hoan Kiem, Ha Noi" },
  { id:"p73", nom:"RAUSSIN Olivier",     prenom:"Olivier",   civilite:"Mr",      type_csv:"Corporate",tel:null,                    email:"olivier@febe.vc",                    organisation:"FEBE Ventures",                                  job:"CEO",                                            ville:"",                 adresse:"" },
  { id:"p74", nom:"RINGSTAD Jonas",      prenom:"Jonas",     civilite:"Mr",      type_csv:"",         tel:"+84 98 9868671",        email:"jonas@etown.com.vn",                 organisation:"",                                               job:"Property Manager",                              ville:"",                 adresse:"" },
  { id:"p75", nom:"ROUSSEAU Michel",     prenom:"Michel",    civilite:"Mr",      type_csv:"",         tel:"+84 90 9153577",        email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p76", nom:"ROWLANDS Anthony",    prenom:"Anthony",   civilite:"Mr",      type_csv:"School",   tel:null,                    email:"anthony.rowlands@bisvietnam.com",    organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p77", nom:"SAUVAGEOT Bertrand",  prenom:"Bertrand",  civilite:"Mr",      type_csv:"School",   tel:null,                    email:null,                                 organisation:"Vietnam Australia Intl School",                  job:"Chief Executive Officer",                       ville:"",                 adresse:"" },
  { id:"p78", nom:"SCHELLES Christopher",prenom:"Christopher",civilite:"Mr",     type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p79", nom:"SENOUCI Bruno",       prenom:"Bruno",     civilite:"Mr",      type_csv:"",         tel:null,                    email:"bruno.senouci@drcomgroup.com",       organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p80", nom:"SON Hoang",           prenom:"Hoang",     civilite:"",        type_csv:"",         tel:"+84 90 371213",         email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p81", nom:"STACEY Daniel",       prenom:"Daniel",    civilite:"Mr",      type_csv:"",         tel:"+84 90 8293753",        email:"dmstacey@hotmail.co.uk",             organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p82", nom:"TARWATER Kathlyn",    prenom:"Kathlyn",   civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:"kathlyn.tarwater1@vas.edu.vn",       organisation:"Vietnam Australia Intl School",                  job:"Head of Extracurricular Activities",             ville:"",                 adresse:"" },
  { id:"p83", nom:"TAYLOR Brook",        prenom:"Brook",     civilite:"Mr",      type_csv:"Corporate",tel:"+84 90 8629 993",       email:"brook.taylor@vinacapital.com",       organisation:"VinaCapital",                                    job:"CEO Asset Management",                          ville:"HCMC, Vietnam",    adresse:"17th Floor, Sun Wah Tower, 115 Nguyen Hue, Dist. 1" },
  { id:"p84", nom:"THOMAS Henri",        prenom:"Henri",     civilite:"Mr",      type_csv:"",         tel:"+1 6 4379 3117",        email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p85", nom:"TIN Mai Huu",         prenom:"Mai Huu",   civilite:"Mrs/Ms",  type_csv:"Corporate",tel:"+84 913 951 309",       email:"tinmh@unigroup.com.vn",              organisation:"U&I Investment Corporation (Unigroup)",           job:"Chairman & CEO",                                ville:"Binh Duong",       adresse:"158 Ngo Gia Tu, Chanh Nghia ward, Thu Dau Mot city" },
  { id:"p86", nom:"TRAN Minh",           prenom:"Minh",      civilite:"Mrs/Ms",  type_csv:"School",   tel:null,                    email:"minh.tran@bisvietnam.com",           organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p87", nom:"TRAN SI Dang",        prenom:"Dang",      civilite:"Mr",      type_csv:"School",   tel:null,                    email:"dang.tran@sedbergh.edu.vn",          organisation:"Sedbergh Vietnam",                               job:"ECA Field trip Coordinator",                    ville:"",                 adresse:"" },
  { id:"p88", nom:"TRESSENS Paul",       prenom:"Paul",       civilite:"Mr",     type_csv:"",         tel:null,                    email:"tressens-paul@orange.fr",            organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p89", nom:"TSANG Andrew",        prenom:"Andrew",    civilite:"Mr",      type_csv:"",         tel:"+84 90 8127280",        email:"dr.andrew@westcoastinternational.com",organisation:"",                                              job:"",                                              ville:"",                 adresse:"" },
  { id:"p90", nom:"VANNAV0NG Catherine", prenom:"Catherine", civilite:"Mrs/Ms",  type_csv:"",         tel:null,                    email:null,                                 organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p91", nom:"VILLARD Marc",        prenom:"Marc",      civilite:"Mr",      type_csv:"",         tel:null,                    email:"dhbthuy@yahoo.com",                  organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p92", nom:"VOISIN Jean-Luc",     prenom:"Jean-Luc",  civilite:"Mr",      type_csv:"",         tel:"+84 903 664 048",       email:"dg@vergersmekong.com.vn",            organisation:"Les Vergers Du Mékong",                          job:"General Director",                              ville:"HCMC, Vietnam",    adresse:"11 Thai Thuan Street, An Khanh An Phu, Dist. 2" },
  { id:"p93", nom:"WEEKS John",          prenom:"John",      civilite:"Mr",      type_csv:"School",   tel:null,                    email:"jdweeks.85@gmail.com",               organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p94", nom:"WILLS Gareth",        prenom:"Gareth",    civilite:"Mr",      type_csv:"School",   tel:null,                    email:"gareth.wills@bisvietnam.com",        organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p95", nom:"WOLFE Alex Paul",     prenom:"Alex Paul", civilite:"Mr",      type_csv:"",         tel:"+84 86 8140647",        email:"alex.wolfe@hotmail.co.uk",           organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
  { id:"p96", nom:"WYDNHAM Caitlin",     prenom:"Caitlin",   civilite:"Mrs/Ms",  type_csv:"",         tel:"+84 39 4634 855",       email:"caitlin@bdcf.org",                   organisation:"Blue Dragon Children's Foundation",              job:"Resources and Partnerships Leader",             ville:"",                 adresse:"" },
  { id:"p97", nom:"WYLD Robert",         prenom:"Robert",    civilite:"Mr",      type_csv:"",         tel:"+84 909 909 555",       email:"robertwyld@pacificcross.com.vn",     organisation:"Pacific Cross",                                  job:"Chief Executive Officer",                       ville:"HCMC, Vietnam",    adresse:"6th Floor, VNPT Building, 1487 Nguyen Van Linh St, Dist. 7" },
  { id:"p98", nom:"ZIBULSKI Marc",       prenom:"Marc",      civilite:"Mr",      type_csv:"",         tel:"+84 90 3600982",        email:"marc.zibulski@horsington.vn",        organisation:"",                                               job:"",                                              ville:"",                 adresse:"" },
];

function Partenaires() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var fs2 = useState("Tous"); var filtre = fs2[0]; var setFiltre = fs2[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var ems = useState(false); var editModal = ems[0]; var setEditModal = ems[1];
  var efs = useState(null); var editForm = efs[0]; var setEditForm = efs[1];
  var ficheState = useState(null); var ficheId = ficheState[0]; var setFicheId = ficheState[1];

  // Prospects
  var convertState = useState(null); var convertTarget = convertState[0]; var setConvertTarget = convertState[1];
  var convertTypeState = useState("ONG"); var convertType = convertTypeState[0]; var setConvertType = convertTypeState[1];
  var convertingState = useState(false); var converting = convertingState[0]; var setConverting = convertingState[1];
  var convertedState = useState({}); var converted = convertedState[0]; var setConverted = convertedState[1];
  var prospectSearch = useState(""); var pSearch = prospectSearch[0]; var setPSearch = prospectSearch[1];

  var EMPTY_FORM = { nom: "", type: "ONG", contact_nom: "", contact_email: "", contact_tel: "", adresse: "", district: "", nombre_enfants: "", montant_annuel: "", statut: "Actif", notes: "" };
  var fs = useState(EMPTY_FORM); var form = fs[0]; var setForm = fs[1];

  useEffect(function() {
    sbFetch("partenaires", { select: "*", order: "nom.asc" }).then(function(r) { setData(r); setLoading(false); });
  }, []);

  var types = ["Tous", "ONG", "Shelter", "Ecole", "Sponsor"];
  var filtered = filtre === "Tous" ? data : data.filter(function(p) { return p.type === filtre; });

  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  function handleAdd() {
    var payload = Object.assign({}, form);
    if (payload.nombre_enfants === "") delete payload.nombre_enfants;
    if (payload.montant_annuel === "") payload.montant_annuel = 0;
    sbInsert("partenaires", payload).then(function(rows) {
      var newP = rows[0];
      setData(data.concat(newP));
      // Créer les associations sélectionnées
      if (assocSelectedAdd.length > 0) {
        var liens = assocSelectedAdd.map(function(id) { return { partenaire_id: newP.id, partenaire_lie_id: id }; });
        sbInsertMany("partenaire_liens", liens).catch(function() {});
      }
      setModal(false); setForm(EMPTY_FORM); setAssocSelectedAdd([]); setAssocSearchAdd("");
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  function handleUpdate() {
    var payload = Object.assign({}, editForm);
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    if (payload.nombre_enfants === "") delete payload.nombre_enfants;
    if (payload.montant_annuel === "") payload.montant_annuel = 0;
    sbUpdate("partenaires", editForm.id, payload).then(function() {
      setData(data.map(function(p) { return p.id === editForm.id ? Object.assign({}, p, payload) : p; }));
      // Remplacer les associations : supprimer les anciennes, insérer les nouvelles
      fetch(SUPABASE_URL + "/rest/v1/partenaire_liens?partenaire_id=eq." + editForm.id, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } })
        .then(function() {
          if (assocSelectedEdit.length > 0) {
            var liens = assocSelectedEdit.map(function(id) { return { partenaire_id: editForm.id, partenaire_lie_id: id }; });
            sbInsertMany("partenaire_liens", liens).catch(function() {});
          }
        });
      setEditModal(false); setEditForm(null); setAssocSelectedEdit([]); setAssocSearchEdit("");
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  function setEdit(k, v) { setEditForm(Object.assign({}, editForm, { [k]: v })); }

  // Charger les associations existantes quand on ouvre la modale Modifier
  function openEditModal(p) {
    setEditForm(p);
    setAssocSelectedEdit([]); setAssocSearchEdit("");
    sbFetch("partenaire_liens", { select: "partenaire_lie_id", filter: "partenaire_id=eq." + p.id })
      .then(function(rows) { setAssocSelectedEdit(rows.map(function(r) { return r.partenaire_lie_id; })); })
      .catch(function() {});
    setEditModal(true);
  }

  function handleConvert() {
    if (!convertTarget) return;
    setConverting(true);
    var p = convertTarget;
    var payload = {
      nom: p.organisation || p.nom,
      type: convertType,
      contact_nom: p.nom,
      contact_email: p.email || "",
      contact_tel: p.tel || "",
      adresse: p.adresse || "",
      ville: p.ville || "",
      statut: "Prospect",
      notes: [p.job, p.type_csv ? "Source CSV: " + p.type_csv : ""].filter(Boolean).join(" · "),
      nombre_enfants: null,
      montant_annuel: 0,
    };
    sbInsert("partenaires", payload).then(function(rows) {
      setData(data.concat(rows[0]));
      setConverted(Object.assign({}, converted, { [p.id]: convertType }));
      setConverting(false);
      setConvertTarget(null);
    }).catch(function(e) { alert(e.message); setConverting(false); });
  }

  var exportPanelState = useState(false); var exportPanel = exportPanelState[0]; var setExportPanel = exportPanelState[1];
  var exportTargetState = useState("tous"); var exportTarget = exportTargetState[0]; var setExportTarget = exportTargetState[1];

  // États pour associations inline dans les modales
  var assocSearchAddState = useState(""); var assocSearchAdd = assocSearchAddState[0]; var setAssocSearchAdd = assocSearchAddState[1];
  var assocSelectedAddState = useState([]); var assocSelectedAdd = assocSelectedAddState[0]; var setAssocSelectedAdd = assocSelectedAddState[1];
  var assocDropAddState = useState(false); var assocDropAdd = assocDropAddState[0]; var setAssocDropAdd = assocDropAddState[1];
  var assocSearchEditState = useState(""); var assocSearchEdit = assocSearchEditState[0]; var setAssocSearchEdit = assocSearchEditState[1];
  var assocSelectedEditState = useState([]); var assocSelectedEdit = assocSelectedEditState[0]; var setAssocSelectedEdit = assocSelectedEditState[1];
  var assocDropEditState = useState(false); var assocDropEdit = assocDropEditState[0]; var setAssocDropEdit = assocDropEditState[1];

  function handleExportContacts() {
    var rows, filename;
    if (exportTarget === "prospects") {
      var header = ["Nom","Prénom","Civilité","Organisation","Poste","Email","Téléphone","Ville","Adresse","Type CSV"];
      rows = CSV_PROSPECTS
        .filter(function(p) { return !isConverted(p).done; })
        .map(function(p) {
          return [p.nom, p.prenom, p.civilite, p.organisation, p.job, p.email||"", p.tel||"", p.ville, p.adresse, p.type_csv]
            .map(function(v) { return '"' + String(v||"").replace(/"/g,'""') + '"'; }).join(",");
        });
      filename = "prospects_rcn.csv";
    } else {
      var header = ["Nom","Type","Contact","Email","Téléphone","Ville","District","Adresse","Statut","Nb Enfants","Montant Annuel","Notes"];
      var src = exportTarget === "tous" ? data : data.filter(function(p) { return p.type === exportTarget; });
      rows = src.map(function(p) {
        return [p.nom, p.type, p.contact_nom, p.contact_email, p.contact_tel, p.ville||p.district, p.district, p.adresse, p.statut, p.nombre_enfants, p.montant_annuel, p.notes]
          .map(function(v) { return '"' + String(v||"").replace(/"/g,'""') + '"'; }).join(",");
      });
      filename = "partenaires_" + (exportTarget === "tous" ? "tous" : exportTarget.toLowerCase()) + "_rcn.csv";
    }
    if (!rows.length) { alert("Aucun contact à exporter."); return; }
    var csv = [header.join(",")].concat(rows).join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setExportPanel(false);
  }

  // Détection persistante : un prospect est converti s'il existe déjà en base
  // (match par email OU par contact_nom exact) ou converti dans cette session
  function isConverted(p) {
    if (converted[p.id]) return { done: true, type: converted[p.id] };
    var match = data.find(function(d) {
      if (p.email && d.contact_email && d.contact_email.toLowerCase() === p.email.toLowerCase()) return true;
      if (d.contact_nom && d.contact_nom.toLowerCase() === p.nom.toLowerCase()) return true;
      return false;
    });
    if (match) return { done: true, type: match.type };
    return { done: false };
  }

  // Filtre prospect
  var prospectFiltered = CSV_PROSPECTS.filter(function(p) {
    var conv = isConverted(p);
    if (conv.done) return false;
    var q = pSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.nom + " " + (p.organisation||"") + " " + (p.ville||"") + " " + (p.email||"")).toLowerCase().indexOf(q) >= 0;
  });

  // Compteur total non convertis
  var totalNonConverts = CSV_PROSPECTS.filter(function(p) { return !isConverted(p).done; }).length;

  var PROSPECT_COLOR = "#D97706";

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Barre de filtres */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {types.map(function(t) {
            var active = filtre === t;
            var color = TYPE_COLOR[t] || "#C8102E";
            return (
              <button key={t} onClick={function() { setFiltre(t); }} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid " + (active ? color : "#ddd"), background: active ? color : "#fff", color: active ? "#fff" : "#555", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400 }}>
                {TYPE_ICON[t] ? TYPE_ICON[t] + " " : ""}{t}
              </button>
            );
          })}
          {/* Onglet Prospects */}
          <button onClick={function() { setFiltre("Prospects"); }} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid " + (filtre === "Prospects" ? PROSPECT_COLOR : "#ddd"), background: filtre === "Prospects" ? PROSPECT_COLOR : "#fff", color: filtre === "Prospects" ? "#fff" : "#555", cursor: "pointer", fontSize: 13, fontWeight: filtre === "Prospects" ? 600 : 400 }}>
            📋 Contacts <span style={{ background: filtre === "Prospects" ? "rgba(255,255,255,0.25)" : PROSPECT_COLOR + "22", color: filtre === "Prospects" ? "#fff" : PROSPECT_COLOR, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>{totalNonConverts}</span>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* Export CSV */}
          <button onClick={function() { setExportPanel(!exportPanel); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: exportPanel ? "#1a1a1a" : "#fff", color: exportPanel ? "#fff" : "#444", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>⬇ Export CSV</button>
          {exportPanel && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>Exporter les contacts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {[
                  { key: "tous", label: "Tous les partenaires", count: data.length },
                  { key: "ONG", label: "🤝 ONG", count: data.filter(function(p){return p.type==="ONG";}).length },
                  { key: "Shelter", label: "🏠 Shelters", count: data.filter(function(p){return p.type==="Shelter";}).length },
                  { key: "Ecole", label: "🏫 Écoles", count: data.filter(function(p){return p.type==="Ecole";}).length },
                  { key: "Sponsor", label: "💼 Sponsors", count: data.filter(function(p){return p.type==="Sponsor";}).length },
                  { key: "prospects", label: "🎯 Prospects CSV", count: CSV_PROSPECTS.filter(function(p){return !isConverted(p).done;}).length },
                ].map(function(opt) {
                  var active = exportTarget === opt.key;
                  return (
                    <button key={opt.key} onClick={function() { setExportTarget(opt.key); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, border: "2px solid " + (active ? "#C8102E" : "#e0e0e0"), background: active ? "#C8102E11" : "#fafafa", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#C8102E" : "#444" }}>
                      <span>{opt.label}</span>
                      <span style={{ fontSize: 11, color: active ? "#C8102E" : "#aaa", fontWeight: 600 }}>{opt.count} contact{opt.count > 1 ? "s" : ""}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setExportPanel(false); }} style={Object.assign({}, btnS, { flex: 1, fontSize: 13 })}>Annuler</button>
                <button onClick={handleExportContacts} style={Object.assign({}, btnP, { flex: 2, fontSize: 13 })}>⬇ Télécharger</button>
              </div>
            </div>
          )}
          {filtre !== "Prospects" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#888" }}>{filtered.length} partenaire{filtered.length > 1 ? "s" : ""}</span>
              <button onClick={function() { setModal(true); }} style={btnA}>+ Ajouter</button>
            </div>
          )}
        </div>
      </div>

      {/* VUE PROSPECTS */}
      {filtre === "Prospects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input value={pSearch} onChange={function(e) { setPSearch(e.target.value); }} placeholder="🔍 Rechercher (nom, organisation, ville, email)..." style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, outline: "none" }} />
            <span style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>{prospectFiltered.length} contact{prospectFiltered.length > 1 ? "s" : ""}</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f4f4f4" }}>
                    {["NOM", "ORGANISATION", "POSTE", "EMAIL", "TÉLÉPHONE", "VILLE", "TYPE CSV", ""].map(function(h) {
                      return <th key={h} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", borderBottom: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {prospectFiltered.map(function(p) {
                    var convInfo = isConverted(p); var alreadyDone = convInfo.done;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid #e8e8e8", opacity: alreadyDone ? 0.4 : 1 }}>
                        <td style={{ padding: "9px 12px", fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.nom}</td>
                        <td style={{ padding: "9px 12px", color: "#444", maxWidth: 200 }}>{p.organisation || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={{ padding: "9px 12px", color: "#444", maxWidth: 180, fontSize: 12 }}>{p.job || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={{ padding: "9px 12px", color: "#C8102E", fontSize: 12 }}>{p.email || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={{ padding: "9px 12px", color: "#444", whiteSpace: "nowrap" }}>{p.tel || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={{ padding: "9px 12px", color: "#444", fontSize: 12, whiteSpace: "nowrap" }}>{p.ville || <span style={{ color: "#ccc" }}>—</span>}</td>
                        <td style={{ padding: "9px 12px" }}>
                          {p.type_csv ? <span style={{ background: "#C8102E11", color: "#C8102E", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.type_csv}</span> : <span style={{ color: "#ccc" }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                          {alreadyDone
                            ? <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>✓ Converti en {convInfo.type}</span>
                            : <button onClick={function() { setConvertTarget(p); setConvertType("ONG"); }} style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid " + PROSPECT_COLOR, background: PROSPECT_COLOR + "11", color: PROSPECT_COLOR, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↗ Convertir</button>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VUE PARTENAIRES NORMAUX */}
      {filtre !== "Prospects" && (
        filtered.length === 0 ? <Empty msg={"Aucun " + (filtre === "Tous" ? "partenaire" : filtre) + " — cliquez + Ajouter"} /> : (
          <TableUI headers={["ORGANISATION", "TYPE", "LOCATION", "STATUS", "RESPONSIBLE", "EMAIL", "PHONE", ""]}>
            {filtered.map(function(p) {
              return (
                <tr key={p.id} onClick={function() { setFicheId(p.id); }} style={{ borderBottom: "1px solid #e8e8e8", cursor: "pointer" }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "#f4f4f4"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>{p.nom}</td>
                  <td style={{ padding: "10px 12px" }}><TypeBadge t={p.type} /></td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#444" }}>{p.ville || p.district || "—"}</td>
                  <td style={{ padding: "10px 12px" }}><Badge s={p.statut} /></td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#444" }}>{p.contact_nom || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#444" }}>{p.contact_email || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#444" }}>{p.contact_tel || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={function(e) { e.stopPropagation(); openEditModal(p); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#C8102E" }}>✏️ Modifier</button>
                  </td>
                </tr>
              );
            })}
          </TableUI>
        )
      )}

      {/* MODAL CONVERSION PROSPECT */}
      {convertTarget && <Modal open={!!convertTarget} onClose={function() { setConvertTarget(null); }} title={"Convertir — " + convertTarget.nom}>
        <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{convertTarget.organisation || "Pas d'organisation"}</div>
          {convertTarget.job && <div style={{ fontSize: 12, color: "#444" }}>{convertTarget.job}</div>}
          {convertTarget.email && <div style={{ fontSize: 12, color: "#C8102E", marginTop: 2 }}>{convertTarget.email}</div>}
          {convertTarget.tel && <div style={{ fontSize: 12, color: "#444" }}>{convertTarget.tel}</div>}
          {convertTarget.ville && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{convertTarget.ville}</div>}
        </div>
        <Field label="Convertir en *">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) {
              var active = convertType === t;
              return <button key={t} onClick={function() { setConvertType(t); }} style={{ padding: "10px 8px", borderRadius: 10, border: "2px solid " + (active ? TYPE_COLOR[t] : "#e0e0e0"), background: active ? TYPE_COLOR[t] + "11" : "#fff", cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 400, color: active ? TYPE_COLOR[t] : "#666", transition: "all .15s" }}>
                {TYPE_ICON[t]} {t}
              </button>;
            })}
          </div>
        </Field>
        <div style={{ fontSize: 12, color: "#888", marginTop: 8, padding: "8px 12px", background: "#f4f4f4", borderRadius: 8 }}>
          Ce contact sera ajouté dans <strong>Partenaires → {convertType}</strong> avec le statut <strong>Prospect</strong>. Il disparaîtra de la liste Prospects dans cette session.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={function() { setConvertTarget(null); }} style={btnS}>Annuler</button>
          <button onClick={handleConvert} disabled={converting} style={Object.assign({}, btnP, { opacity: converting ? 0.6 : 1 })}>
            {converting ? "Conversion…" : "↗ Confirmer la conversion"}
          </button>
        </div>
      </Modal>}

      {editForm && <Modal open={editModal} onClose={function() { setEditModal(false); }} title={"Modifier — " + (editForm.nom || "")}>
        <Field label="Type *">
          <div style={{ display: "flex", gap: 8 }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) {
              var active = editForm.type === t;
              return <button key={t} onClick={function() { setEdit("type", t); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid " + (active ? TYPE_COLOR[t] : "#e0e0e0"), background: active ? TYPE_COLOR[t] + "11" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? TYPE_COLOR[t] : "#666" }}>{TYPE_ICON[t]}<br />{t}</button>;
            })}
          </div>
        </Field>
        <Field label="Nom *"><input style={inp} value={editForm.nom || ""} onChange={function(e) { setEdit("nom", e.target.value); }} /></Field>
        <Field label="Contact — Nom"><input style={inp} value={editForm.contact_nom || ""} onChange={function(e) { setEdit("contact_nom", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email"><input style={inp} type="email" value={editForm.contact_email || ""} onChange={function(e) { setEdit("contact_email", e.target.value); }} /></Field>
          <Field label="Téléphone"><input style={inp} value={editForm.contact_tel || ""} onChange={function(e) { setEdit("contact_tel", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Ville / Location"><input style={inp} value={editForm.ville || ""} onChange={function(e) { setEdit("ville", e.target.value); }} /></Field>
          <Field label="District"><input style={inp} value={editForm.district || ""} onChange={function(e) { setEdit("district", e.target.value); }} /></Field>
        </div>
        <Field label="Adresse"><input style={inp} value={editForm.adresse || ""} onChange={function(e) { setEdit("adresse", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {editForm.type !== "Sponsor" && <Field label="Nb enfants"><input type="number" style={inp} value={editForm.nombre_enfants || ""} onChange={function(e) { setEdit("nombre_enfants", e.target.value); }} /></Field>}
          {editForm.type === "Sponsor" && <Field label="Montant annuel (VND)"><input type="number" style={inp} value={editForm.montant_annuel || ""} onChange={function(e) { setEdit("montant_annuel", e.target.value); }} /></Field>}
          <Field label="Statut">
            <select style={sel} value={editForm.statut || "Actif"} onChange={function(e) { setEdit("statut", e.target.value); }}>
              {["Actif","Prospect","A relancer","En pause","Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
        </div>
        <Field label="Notes"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={editForm.notes || ""} onChange={function(e) { setEdit("notes", e.target.value); }} /></Field>
        <Field label="Partenaires associés">
          <AssocInline all={data} self={editForm.id} selected={assocSelectedEdit} onSelect={setAssocSelectedEdit} search={assocSearchEdit} onSearch={setAssocSearchEdit} drop={assocDropEdit} onDrop={setAssocDropEdit} />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleUpdate} style={btnP}>Enregistrer</button>
        </div>
      </Modal>}

      {ficheId && <FichePartenaire partenaire={data.find(function(p) { return p.id === ficheId; }) || {}} allPartenaires={data} onClose={function() { setFicheId(null); }} />}

      <Modal open={modal} onClose={function() { setModal(false); }} title="Nouveau partenaire">
        <Field label="Type *">
          <div style={{ display: "flex", gap: 8 }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) {
              var active = form.type === t;
              return (
                <button key={t} onClick={function() { set("type", t); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid " + (active ? TYPE_COLOR[t] : "#e0e0e0"), background: active ? TYPE_COLOR[t] + "11" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? TYPE_COLOR[t] : "#666" }}>
                  {TYPE_ICON[t]}<br />{t}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Nom *"><input style={inp} value={form.nom} onChange={function(e) { set("nom", e.target.value); }} placeholder={"Nom de l'" + form.type} /></Field>
        <Field label="Contact — Nom"><input style={inp} value={form.contact_nom} onChange={function(e) { set("contact_nom", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email"><input style={inp} type="email" value={form.contact_email} onChange={function(e) { set("contact_email", e.target.value); }} /></Field>
          <Field label="Téléphone"><input style={inp} value={form.contact_tel} onChange={function(e) { set("contact_tel", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="District"><input style={inp} value={form.district} onChange={function(e) { set("district", e.target.value); }} /></Field>
          {form.type !== "Sponsor" && <Field label="Nb enfants"><input type="number" style={inp} value={form.nombre_enfants} onChange={function(e) { set("nombre_enfants", e.target.value); }} /></Field>}
          {form.type === "Sponsor" && <Field label="Montant annuel (VND)"><input type="number" style={inp} value={form.montant_annuel} onChange={function(e) { set("montant_annuel", e.target.value); }} /></Field>}
        </div>
        <Field label="Statut">
          <select style={sel} value={form.statut} onChange={function(e) { set("statut", e.target.value); }}>
            {["Actif","Prospect","A relancer","En pause","Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
          </select>
        </Field>
        <Field label="Notes"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={form.notes} onChange={function(e) { set("notes", e.target.value); }} /></Field>
        <Field label="Partenaires associés">
          <AssocInline all={data} self={null} selected={assocSelectedAdd} onSelect={setAssocSelectedAdd} search={assocSearchAdd} onSearch={setAssocSearchAdd} drop={assocDropAdd} onDrop={setAssocDropAdd} />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.nom} style={Object.assign({}, btnP, { opacity: form.nom ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}


// ── COACH MULTI-SELECT (accordéon) ───────────────────────────
function CoachMultiSelect(props) {
  var coaches = props.coaches;
  var selected = props.selected;
  var onChange = props.onChange;
  var openState = useState(false); var open = openState[0]; var setOpen = openState[1];
  var nbSel = selected.length;
  var COLOR = "#C8102E";
  return (
    <div style={{ border: "1px solid " + (nbSel > 0 ? COLOR : "#e0e0e0"), borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div onClick={function() { setOpen(!open); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: nbSel > 0 ? COLOR + "11" : "#fafafa", cursor: "pointer", userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🏉</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: nbSel > 0 ? COLOR : "#444" }}>Coaches & bénévoles</span>
          {nbSel > 0 && <span style={{ background: COLOR, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{nbSel} sélectionné{nbSel > 1 ? "s" : ""}</span>}
          {!coaches.length && <span style={{ fontSize: 11, color: "#aaa" }}>(aucun)</span>}
        </div>
        <span style={{ fontSize: 16, color: "#888", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid #e0e0e0", background: "#fff" }}>
          {!coaches.length ? (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "#aaa" }}>Aucun coach actif</div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {coaches.map(function(c) {
                var isSelected = selected.indexOf(c.id) !== -1;
                return (
                  <label key={c.id} onClick={function() {
                    if (isSelected) onChange(selected.filter(function(id) { return id !== c.id; }));
                    else onChange(selected.concat(c.id));
                  }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", background: isSelected ? COLOR + "0d" : "transparent", borderBottom: "1px solid #f4f4f4" }}
                    onMouseEnter={function(e) { if (!isSelected) e.currentTarget.style.background = "#f9f9f9"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = isSelected ? COLOR + "0d" : "transparent"; }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: "2px solid " + (isSelected ? COLOR : "#ccc"), background: isSelected ? COLOR : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? COLOR : "#333", flex: 1 }}>{c.prenom} {c.nom}</span>
                    <span style={{ fontSize: 11, color: "#aaa" }}>{[c.pays, c.langues].filter(Boolean).join(" · ")}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TÂCHES ÉVÉNEMENT ─────────────────────────────────────────
function EvtTaches(props) {
  var evtId = props.evtId;
  var tasksState = useState([]); var tasks = tasksState[0]; var setTasks = tasksState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var showFormState = useState(false); var showForm = showFormState[0]; var setShowForm = showFormState[1];
  var titleState = useState(""); var title = titleState[0]; var setTitle = titleState[1];
  var prioriteState = useState("Moyenne"); var priorite = prioriteState[0]; var setPriorite = prioriteState[1];

  var PRIO_COLOR = { Urgente: "#A32D2D", Haute: "#BA7517", Moyenne: "#C8102E", Basse: "#888" };

  useEffect(function() {
    sbFetch("taches", { select: "*", filter: "evenement_id=eq." + evtId, order: "created_at.asc" })
      .then(function(rows) { setTasks(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, [evtId]);

  function handleAdd() {
    if (!title.trim()) return;
    sbInsert("taches", { titre: title, priorite: priorite, statut: "En attente", evenement_id: evtId })
      .then(function(rows) {
        setTasks(tasks.concat(rows[0]));
        setTitle(""); setShowForm(false);
      }).catch(function(e) { alert(e.message); });
  }

  function changeStatut(t, s) {
    sbUpdate("taches", t.id, { statut: s }).then(function() {
      setTasks(tasks.map(function(x) { return x.id === t.id ? Object.assign({}, x, { statut: s }) : x; }));
    });
  }

  function deleteTask(t) {
    fetch(SUPABASE_URL + "/rest/v1/taches?id=eq." + t.id, {
      method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    }).then(function() { setTasks(tasks.filter(function(x) { return x.id !== t.id; })); });
  }

  if (loading) return <div style={{ fontSize: 13, color: "#aaa", padding: "8px 0" }}>Chargement...</div>;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>📋 Tâches ({tasks.length})</span>
        <button onClick={function() { setShowForm(!showForm); }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #C8102E", background: showForm ? "#C8102E" : "#fff", color: showForm ? "#fff" : "#C8102E", cursor: "pointer", fontSize: 12 }}>+ Ajouter</button>
      </div>

      {showForm && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
          <input value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Titre de la tâche..." style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #d0d0d0", fontSize: 13 }} onKeyDown={function(e) { if (e.key === "Enter") handleAdd(); }} />
          <select value={priorite} onChange={function(e) { setPriorite(e.target.value); }} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d0d0d0", fontSize: 12 }}>
            {["Urgente","Haute","Moyenne","Basse"].map(function(p) { return <option key={p}>{p}</option>; })}
          </select>
          <button onClick={handleAdd} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 12 }}>OK</button>
          <button onClick={function() { setShowForm(false); setTitle(""); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#888" }}>✕</button>
        </div>
      )}

      {tasks.length === 0 && !showForm && <div style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>Aucune tâche pour cet événement</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map(function(t) {
          var color = PRIO_COLOR[t.priorite] || "#888";
          var isDone = t.statut === "Confirme";
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: isDone ? "#f4f4f4" : "#fff", borderRadius: 8, border: "1px solid #e0e0e0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ flex: 1, fontSize: 13, color: isDone ? "#aaa" : "#1a1a1a", textDecoration: isDone ? "line-through" : "none" }}>{t.titre}</span>
              <button onClick={function() { changeStatut(t, "Confirme"); }} style={{ padding: "2px 8px", borderRadius: 12, border: "1px solid " + (isDone ? "#1D9E75" : "#ddd"), background: isDone ? "#1D9E7522" : "#fff", color: isDone ? "#1D9E75" : "#888", cursor: "pointer", fontSize: 11, fontWeight: isDone ? 600 : 400 }}>✅ Confirmé</button>
              <button onClick={function() { changeStatut(t, "En attente"); }} style={{ padding: "2px 8px", borderRadius: 12, border: "1px solid " + (t.statut === "En attente" ? "#BA7517" : "#ddd"), background: t.statut === "En attente" ? "#BA751722" : "#fff", color: t.statut === "En attente" ? "#BA7517" : "#888", cursor: "pointer", fontSize: 11, fontWeight: t.statut === "En attente" ? 600 : 400 }}>⏳ En attente</button>
              <button onClick={function() { deleteTask(t); }} style={{ padding: "2px 6px", borderRadius: 6, border: "none", background: "transparent", color: "#E24B4A", cursor: "pointer", fontSize: 13 }}>🗑️</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CALENDRIER DUPLICATION (composant isolé) ─────────────────
function DupCalendar(props) {
  var dupDates = props.dupDates;
  var setDupDates = props.setDupDates;
  var dupMonth = props.dupMonth;
  var setDupMonth = props.setDupMonth;

  var MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  var DAYS = ["L","M","M","J","V","S","D"];
  var year = dupMonth.getFullYear();
  var month = dupMonth.getMonth();
  var firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = new Date().toISOString().split("T")[0];

  function toggleDate(dateStr) {
    if (dupDates.indexOf(dateStr) !== -1) {
      setDupDates(dupDates.filter(function(d) { return d !== dateStr; }));
    } else {
      setDupDates(dupDates.concat([dateStr]));
    }
  }

  function prevMonth(e) {
    e.preventDefault();
    e.stopPropagation();
    setDupMonth(new Date(year, month - 1, 1));
  }

  function nextMonth(e) {
    e.preventDefault();
    e.stopPropagation();
    setDupMonth(new Date(year, month + 1, 1));
  }

  var cells = [];
  for (var b = 0; b < firstDay; b++) cells.push(null);
  for (var d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
        <button onClick={prevMonth} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>›</button>
      </div>
      <div style={{ padding: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAYS.map(function(d, i) {
            return <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#bbb", padding: "2px 0" }}>{d}</div>;
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map(function(day, i) {
            if (!day) return <div key={"e"+i} />;
            var dateStr = year + "-" + String(month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
            var isSelected = dupDates.indexOf(dateStr) !== -1;
            var isPast = dateStr < today;
            return (
              <div key={dateStr}
                onClick={function() { if (!isPast) toggleDate(dateStr); }}
                style={{
                  textAlign: "center", padding: "7px 2px", fontSize: 13,
                  cursor: isPast ? "not-allowed" : "pointer",
                  color: isPast ? "#ddd" : isSelected ? "#fff" : "#1a1a1a",
                  background: isSelected ? "#C8102E" : "transparent",
                  borderRadius: 6,
                  fontWeight: isSelected ? 700 : 400,
                  userSelect: "none",
                }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ÉVÉNEMENTS ────────────────────────────────────────────────
function Evenements() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ps = useState([]); var partenaires = ps[0]; var setPartenaires = ps[1];
  var cs = useState([]); var coaches = cs[0]; var setCoaches = cs[1];
  var selCoaches = useState([]); var selectedCoaches = selCoaches[0]; var setSelectedCoaches = selCoaches[1];
  var epMap = useState({}); var evtPartenaires = epMap[0]; var setEvtPartenaires = epMap[1];
  var ecMap = useState({}); var evtCoachMap = ecMap[0]; var setEvtCoachMap = ecMap[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var viewState = useState("liste"); var view = viewState[0]; var setView = viewState[1];
  var monthState = useState(new Date()); var currentMonth = monthState[0]; var setCurrentMonth = monthState[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var detailState = useState(null); var detailEvt = detailState[0]; var setDetailEvt = detailState[1];
  var editEvtState = useState(null); var editingEvt = editEvtState[0]; var setEditingEvt = editEvtState[1];
  var editEvtModal = useState(false); var editEvtModalOpen = editEvtModal[0]; var setEditEvtModal = editEvtModal[1];
  var editEvtCoachesState = useState([]); var editEvtCoaches = editEvtCoachesState[0]; var setEditEvtCoaches = editEvtCoachesState[1];
  var dupModalState = useState(false); var dupModal = dupModalState[0]; var setDupModal = dupModalState[1];
  var dupSourceState = useState(null); var dupSource = dupSourceState[0]; var setDupSource = dupSourceState[1];
  var dupDatesState = useState([]); var dupDates = dupDatesState[0]; var setDupDates = dupDatesState[1];
  var dupMonthState = useState(function() { return new Date(); }); var dupMonth = dupMonthState[0]; var setDupMonth = dupMonthState[1];
  var dupLoadingState = useState(false); var dupLoading = dupLoadingState[0]; var setDupLoading = dupLoadingState[1];

  var EMPTY_FORM = { titre: "", type: "Entrainement", date_debut: "", lieu: "", nombre_enfants_presents: "", statut: "Planifie", notes: "", confirmation_statut: "En attente", responsable_coach_id: "", responsable_equipement_id: "" };
  var fs = useState(EMPTY_FORM); var form = fs[0]; var setForm = fs[1];
  var selONG = useState([]); var selectedONG = selONG[0]; var setSelectedONG = selONG[1];
  var selShelter = useState([]); var selectedShelter = selShelter[0]; var setSelectedShelter = selShelter[1];
  var selEcole = useState([]); var selectedEcole = selEcole[0]; var setSelectedEcole = selEcole[1];
  var selSponsor = useState([]); var selectedSponsor = selSponsor[0]; var setSelectedSponsor = selSponsor[1];

  useEffect(function() {
    Promise.all([
      sbFetch("evenements", { select: "*", order: "date_debut.asc" }),
      sbFetch("partenaires", { select: "*", filter: "statut=eq.Actif", order: "nom.asc" }),
      sbFetch("evenement_partenaires", { select: "*" }),
      sbFetch("coaches", { select: "*", filter: "statut=eq.Actif", order: "nom.asc" }),
      sbFetch("evenement_coaches", { select: "*" }),
    ]).then(function(r) {
      setData(r[0]);
      setPartenaires(r[1]);
      var map = {};
      r[2].forEach(function(ep) {
        if (!map[ep.evenement_id]) map[ep.evenement_id] = [];
        map[ep.evenement_id].push(ep.partenaire_id);
      });
      setEvtPartenaires(map);
      setCoaches(r[3]);
      var cmap = {};
      r[4].forEach(function(ec) {
        if (!cmap[ec.evenement_id]) cmap[ec.evenement_id] = [];
        cmap[ec.evenement_id].push(ec.coach_id);
      });
      setEvtCoachMap(cmap);
      setLoading(false);
    });
  }, []);

  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  function resetForm(dateStr) {
    setForm(Object.assign({}, EMPTY_FORM, { date_debut: dateStr || "" }));
    setSelectedONG([]); setSelectedShelter([]); setSelectedEcole([]); setSelectedSponsor([]);
    setSelectedCoaches([]);
  }

  function duplicateEvt(e) {
    // Pre-fill form with existing event data, clear date
    var partIds = evtPartenaires[e.id] || [];
    setForm({
      titre: e.titre,
      type: e.type,
      date_debut: "",
      lieu: e.lieu || "",
      nombre_enfants_presents: e.nombre_enfants_presents || "",
      statut: "Planifie",
      notes: e.notes || "",
    });
    // Restore partner selections
    var ongs = partenaires.filter(function(p) { return p.type === "ONG" && partIds.indexOf(p.id) !== -1; }).map(function(p) { return p.id; });
    var shelters = partenaires.filter(function(p) { return p.type === "Shelter" && partIds.indexOf(p.id) !== -1; }).map(function(p) { return p.id; });
    var ecoles = partenaires.filter(function(p) { return p.type === "Ecole" && partIds.indexOf(p.id) !== -1; }).map(function(p) { return p.id; });
    var sponsors = partenaires.filter(function(p) { return p.type === "Sponsor" && partIds.indexOf(p.id) !== -1; }).map(function(p) { return p.id; });
    setSelectedONG(ongs);
    setSelectedShelter(shelters);
    setSelectedEcole(ecoles);
    setSelectedSponsor(sponsors);
    // Restore coaches - fetch from evenement_coaches
    sbFetch("evenement_coaches", { select: "coach_id", filter: "evenement_id=eq." + e.id }).then(function(rows) {
      setSelectedCoaches(rows.map(function(r) { return r.coach_id; }));
    });
    setModal(true);
  }

  function openModalForDate(dateStr) {
    resetForm(dateStr ? dateStr + "T08:00" : "");
    setModal(true);
  }

  function handleAdd() {
    var payload = Object.assign({}, form);
    if (payload.nombre_enfants_presents === "") delete payload.nombre_enfants_presents;
    sbInsert("evenements", payload).then(function(rows) {
      var evt = rows[0];
      var allSelected = [].concat(selectedONG, selectedShelter, selectedEcole, selectedSponsor);
      var liaisons = allSelected.map(function(pid) { return { evenement_id: evt.id, partenaire_id: pid }; });
      var coachLiaisons = selectedCoaches.map(function(cid) { return { evenement_id: evt.id, coach_id: cid, heures_prestees: 0 }; });
      var p1 = liaisons.length ? sbInsertMany("evenement_partenaires", liaisons) : Promise.resolve([]);
      var p2 = coachLiaisons.length ? sbInsertMany("evenement_coaches", coachLiaisons) : Promise.resolve([]);
      return Promise.all([p1, p2]).then(function() {
        // Update sessions_programmees for each coach
        var updatePromises = selectedCoaches.map(function(cid) {
          var coach = coaches.find(function(c) { return c.id === cid; });
          if (coach) return sbUpdate("coaches", cid, { sessions_programmees: (Number(coach.sessions_programmees) || 0) + 1 });
          return Promise.resolve();
        });
        return Promise.all(updatePromises);
      }).then(function() {
        setData(data.concat(evt).sort(function(a,b){ return a.date_debut > b.date_debut ? 1 : -1; }));
        var newMap = Object.assign({}, evtPartenaires);
        newMap[evt.id] = allSelected;
        setEvtPartenaires(newMap);
        // Update local coaches sessions count
        setCoaches(coaches.map(function(c) {
          if (selectedCoaches.indexOf(c.id) !== -1) return Object.assign({}, c, { sessions_programmees: (Number(c.sessions_programmees) || 0) + 1 });
          return c;
        }));
        setModal(false);
        resetForm();
      });
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  function handleUpdateEvt() {
    var payload = { titre: editingEvt.titre, type: editingEvt.type, date_debut: editingEvt.date_debut, lieu: editingEvt.lieu, nombre_enfants_presents: editingEvt.nombre_enfants_presents || null, statut: editingEvt.statut, notes: editingEvt.notes, confirmation_statut: editingEvt.confirmation_statut, responsable_coach_id: editingEvt.responsable_coach_id || null, responsable_equipement_id: editingEvt.responsable_equipement_id || null };
    sbUpdate("evenements", editingEvt.id, payload)
    .then(function() {
      return fetch(SUPABASE_URL + "/rest/v1/evenement_coaches?evenement_id=eq." + editingEvt.id, {
        method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
      });
    })
    .then(function() {
      var liaisons = editEvtCoaches.map(function(cid) { return { evenement_id: editingEvt.id, coach_id: cid, heures_prestees: 0 }; });
      return liaisons.length ? sbInsertMany("evenement_coaches", liaisons) : Promise.resolve([]);
    })
    .then(function() {
      setData(data.map(function(e) { return e.id === editingEvt.id ? Object.assign({}, e, payload) : e; }));
      var newCmap = Object.assign({}, evtCoachMap);
      newCmap[editingEvt.id] = editEvtCoaches;
      setEvtCoachMap(newCmap);
      setEditEvtModal(false); setEditingEvt(null);
    })
    .catch(function(e) { alert("Erreur: " + e.message); });
  }

  function deleteEvt(e) {
    if (!window.confirm('Supprimer ' + e.titre + ' ?')) return;
    fetch(SUPABASE_URL + "/rest/v1/evenements?id=eq." + e.id, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    }).then(function() {
      setData(data.filter(function(x) { return x.id !== e.id; }));
    }).catch(function(err) { alert("Erreur: " + err.message); });
  }

  function getPartenairesForEvt(evtId) {
    var ids = evtPartenaires[evtId] || [];
    return partenaires.filter(function(p) { return ids.indexOf(p.id) !== -1; });
  }

  // Calendar helpers
  function getDaysInMonth(date) {
    var year = date.getFullYear(); var month = date.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay: firstDay, daysInMonth: daysInMonth, year: year, month: month };
  }

  function getEventsForDay(year, month, day) {
    var dateStr = year + "-" + String(month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
    return data.filter(function(e) { return e.date_debut && e.date_debut.startsWith(dateStr); });
  }

  var MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  var DAYS_FR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
  var STATUT_EVT_COLOR = { Planifie: "#C8102E", "En cours": "#9B1C1C", Termine: "#1D9E75", Annule: "#A32D2D" };

  // Export CSV
  var exportPanelState = useState(false); var exportPanel = exportPanelState[0]; var setExportPanel = exportPanelState[1];
  var now = new Date();
  var exportMoisState = useState(now.getMonth()); var exportMois = exportMoisState[0]; var setExportMois = exportMoisState[1];
  var exportAnneeState = useState(now.getFullYear()); var exportAnnee = exportAnneeState[0]; var setExportAnnee = exportAnneeState[1];
  var exportModeState = useState("mois"); var exportMode = exportModeState[0]; var setExportMode = exportModeState[1];

  var ANNEES = (function() {
    var years = []; var y = now.getFullYear();
    for (var i = y - 2; i <= y + 1; i++) years.push(i);
    return years;
  })();

  function buildCSV(evts) {
    var header = ["Titre","Type","Date","Lieu","Statut","Confirmation","Enfants","Notes","Partenaires","Coaches"];
    var rows = evts.map(function(e) {
      var parts = getPartenairesForEvt(e.id).map(function(p) { return p.nom; }).join(" | ");
      var evtCoachIds = evtCoachMap[e.id] || [];
      var coachs = coaches.filter(function(c) { return evtCoachIds.indexOf(c.id) !== -1; }).map(function(c) { return c.prenom + " " + c.nom; }).join(" | ");
      return [
        e.titre || "",
        e.type || "",
        e.date_debut ? e.date_debut.split("T")[0] : "",
        e.lieu || "",
        e.statut || "",
        e.confirmation_statut || "",
        e.nombre_enfants_presents || "",
        (e.notes || "").replace(/\n/g, " "),
        parts,
        coachs,
      ].map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    });
    return [header.join(",")].concat(rows).join("\n");
  }

  function downloadCSV(content, filename) {
    var blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    var evts;
    var filename;
    if (exportMode === "mois") {
      var pad = String(exportMois + 1).padStart(2, "0");
      var prefix = exportAnnee + "-" + pad;
      evts = data.filter(function(e) { return e.date_debut && e.date_debut.startsWith(prefix); });
      filename = "evenements_" + MONTHS_FR[exportMois].toLowerCase() + "_" + exportAnnee + ".csv";
    } else {
      evts = data.filter(function(e) { return e.date_debut && e.date_debut.startsWith(String(exportAnnee)); });
      filename = "evenements_" + exportAnnee + ".csv";
    }
    if (!evts.length) { alert("Aucun événement pour cette période."); return; }
    downloadCSV(buildCSV(evts), filename);
    setExportPanel(false);
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "#e8e8e8", borderRadius: 8, padding: 3 }}>
          <button onClick={function() { setView("liste"); }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: view === "liste" ? "#fff" : "transparent", color: view === "liste" ? "#C8102E" : "#888", cursor: "pointer", fontSize: 13, fontWeight: view === "liste" ? 600 : 400, boxShadow: view === "liste" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>☰ Liste</button>
          <button onClick={function() { setView("calendrier"); }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: view === "calendrier" ? "#fff" : "transparent", color: view === "calendrier" ? "#C8102E" : "#888", cursor: "pointer", fontSize: 13, fontWeight: view === "calendrier" ? 600 : 400, boxShadow: view === "calendrier" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>📅 Calendrier</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", position: "relative" }}>
          {/* Bouton export */}
          <button onClick={function() { setExportPanel(!exportPanel); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: exportPanel ? "#1a1a1a" : "#fff", color: exportPanel ? "#fff" : "#444", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
            ⬇ Export CSV
          </button>
          {/* Panneau export */}
          {exportPanel && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 280 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>Exporter les événements</div>
              {/* Mode */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["mois","annee"].map(function(m) {
                  return <button key={m} onClick={function() { setExportMode(m); }} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "2px solid " + (exportMode === m ? "#C8102E" : "#e0e0e0"), background: exportMode === m ? "#C8102E" : "#fff", color: exportMode === m ? "#fff" : "#555", cursor: "pointer", fontSize: 12, fontWeight: exportMode === m ? 600 : 400 }}>{m === "mois" ? "Par mois" : "Par année"}</button>;
                })}
              </div>
              {/* Sélecteurs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {exportMode === "mois" && (
                  <select value={exportMois} onChange={function(e) { setExportMois(Number(e.target.value)); }} style={Object.assign({}, sel, { flex: 2 })}>
                    {MONTHS_FR.map(function(m, i) { return <option key={i} value={i}>{m}</option>; })}
                  </select>
                )}
                <select value={exportAnnee} onChange={function(e) { setExportAnnee(Number(e.target.value)); }} style={Object.assign({}, sel, { flex: 1 })}>
                  {ANNEES.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
              {/* Résumé */}
              <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>
                {(function() {
                  var count;
                  if (exportMode === "mois") {
                    var pad = String(exportMois + 1).padStart(2, "0");
                    count = data.filter(function(e) { return e.date_debut && e.date_debut.startsWith(exportAnnee + "-" + pad); }).length;
                    return count + " événement" + (count > 1 ? "s" : "") + " en " + MONTHS_FR[exportMois] + " " + exportAnnee;
                  } else {
                    count = data.filter(function(e) { return e.date_debut && e.date_debut.startsWith(String(exportAnnee)); }).length;
                    return count + " événement" + (count > 1 ? "s" : "") + " en " + exportAnnee;
                  }
                })()}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { setExportPanel(false); }} style={Object.assign({}, btnS, { flex: 1, fontSize: 13 })}>Annuler</button>
                <button onClick={handleExport} style={Object.assign({}, btnP, { flex: 2, fontSize: 13 })}>⬇ Télécharger</button>
              </div>
            </div>
          )}
          <button onClick={function() { openModalForDate(""); }} style={btnA}>+ Ajouter</button>
        </div>
      </div>

      {/* LISTE VIEW */}
      {view === "liste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.length === 0 ? <Empty msg="Aucun événement — cliquez + Ajouter" /> : data.map(function(e) {
            var parts = getPartenairesForEvt(e.id);
            var evtCoachIds = (evtCoachMap[e.id] || []);
            var evtCoaches = coaches.filter(function(c) {
              return evtCoachIds.indexOf(c.id) !== -1;
            });
            var isOpen = detailEvt === e.id;
            var color = STATUT_EVT_COLOR[e.statut] || "#888";
            return (
              <div key={e.id} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
                  <div onClick={function() { setDetailEvt(isOpen ? null : e.id); }} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                    <div style={{ width: 4, height: 40, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{e.titre}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{e.type} · {e.date_debut ? e.date_debut.split("T")[0] : "—"}{e.lieu ? " · " + e.lieu : ""}</div>
                    {e.confirmation_statut && <span style={{ fontSize: 11, background: e.confirmation_statut === "Confirme" ? "#1D9E7522" : "#BA751722", color: e.confirmation_statut === "Confirme" ? "#1D9E75" : "#BA7517", borderRadius: 12, padding: "2px 8px", fontWeight: 600 }}>{e.confirmation_statut === "Confirme" ? "✅ Confirmé" : "⏳ En attente"}</span>}
                    </div>
                    {e.nombre_enfants_presents > 0 && <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>{e.nombre_enfants_presents} enfants</span>}
                    <Badge s={e.statut} />
                  </div>
                  <button onClick={function(ev) {
  ev.stopPropagation();
  setEditingEvt(Object.assign({}, e));
  sbFetch("evenement_coaches", { select: "coach_id", filter: "evenement_id=eq." + e.id })
    .then(function(rows) { setEditEvtCoaches(rows.map(function(r) { return r.coach_id; })); });
  setEditEvtModal(true);
}} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#444", flexShrink: 0 }}>✏️</button>
                  <button onClick={function(ev) { ev.stopPropagation(); duplicateEvt(e); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#C8102E", flexShrink: 0 }}>📋 Dupliquer</button>
                  <button onClick={function(ev) { ev.stopPropagation(); deleteEvt(e); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E24B4A44", background: "#fff", cursor: "pointer", fontSize: 12, color: "#E24B4A", flexShrink: 0 }}>🗑️</button>
                  <span onClick={function() { setDetailEvt(isOpen ? null : e.id); }} style={{ color: "#ccc", cursor: "pointer" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #e8e8e8", padding: "12px 16px", background: "#fafaf8" }}>
                    {parts.length === 0 && evtCoaches.length === 0 ? <div style={{ fontSize: 13, color: "#aaa" }}>Aucun partenaire ou coach lié</div> : (
                      <div>
                        {parts.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: evtCoaches.length > 0 ? 10 : 0 }}>
                          {parts.map(function(p) {
                            return <div key={p.id} style={{ background: TYPE_COLOR[p.type] + "11", border: "1px solid " + TYPE_COLOR[p.type] + "44", borderRadius: 8, padding: "6px 12px" }}>
                              <div style={{ fontSize: 11, color: TYPE_COLOR[p.type], fontWeight: 600 }}>{TYPE_ICON[p.type]} {p.type}</div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nom}</div>
                            </div>;
                          })}
                        </div>}
                        {evtCoaches.length > 0 && <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#C8102E", marginBottom: 6 }}>🏉 Coaches assignés</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {evtCoaches.map(function(c) {
                              return <div key={c.id} style={{ background: "#C8102E11", border: "1px solid #C8102E44", borderRadius: 8, padding: "6px 12px" }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.prenom} {c.nom}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{c.pays || ""}</div>
                              </div>;
                            })}
                          </div>
                        </div>}
                      </div>
                    )}
                    {e.responsable_coach_id && (function() {
                      var resp = coaches.find(function(c) { return c.id === e.responsable_coach_id; });
                      return resp ? <div style={{ fontSize: 13, color: "#C8102E", marginTop: 8, fontWeight: 500 }}>👤 Responsable : {resp.prenom} {resp.nom}</div> : null;
                    })()}
                    {e.responsable_equipement_id && (function() {
                      var resp = coaches.find(function(c) { return c.id === e.responsable_equipement_id; });
                      return resp ? <div style={{ fontSize: 13, color: "#BA7517", marginTop: 4, fontWeight: 500 }}>🎒 Équipement : {resp.prenom} {resp.nom}</div> : null;
                    })()}
                    {e.notes && <div style={{ fontSize: 13, color: "#444", marginTop: 6 }}>{e.notes}</div>}
                    <div style={{ borderTop: "1px solid #e8e8e8", marginTop: 12, paddingTop: 4 }}>
                      <EvtTaches evtId={e.id} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CALENDRIER VIEW */}
      {view === "calendrier" && (function() {
        var cal = getDaysInMonth(currentMonth);
        var blanks = Array(cal.firstDay).fill(null);
        var days = Array.from({length: cal.daysInMonth}, function(_, i) { return i + 1; });
        var today = new Date();
        return (
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e8e8e8" }}>
              <button onClick={function() { setCurrentMonth(new Date(cal.year, cal.month - 1, 1)); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{MONTHS_FR[cal.month]} {cal.year}</span>
              <button onClick={function() { setCurrentMonth(new Date(cal.year, cal.month + 1, 1)); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e8e8e8" }}>
              {DAYS_FR.map(function(d) { return <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#aaa" }}>{d}</div>; })}
            </div>
            {/* Days grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {blanks.map(function(_, i) { return <div key={"b"+i} style={{ minHeight: 80, borderRight: "1px solid #f5f3ee", borderBottom: "1px solid #f5f3ee", background: "#fafaf8" }} />; })}
              {days.map(function(day) {
                var evts = getEventsForDay(cal.year, cal.month, day);
                var isToday = today.getFullYear() === cal.year && today.getMonth() === cal.month && today.getDate() === day;
                var dateStr = cal.year + "-" + String(cal.month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
                return (
                  <div key={day} onClick={function() { openModalForDate(dateStr); }} style={{ minHeight: 80, borderRight: "1px solid #f5f3ee", borderBottom: "1px solid #f5f3ee", padding: "6px 4px", cursor: "pointer", background: isToday ? "#C8102E11" : "#fff", transition: "background .15s" }}
                    onMouseEnter={function(e) { if (!isToday) e.currentTarget.style.background = "#f4f4f4"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = isToday ? "#C8102E11" : "#fff"; }}>
                    <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? "#C8102E" : "#555", textAlign: "right", marginBottom: 4 }}>{isToday ? <span style={{ background: "#C8102E", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{day}</span> : day}</div>
                    {evts.slice(0, 3).map(function(e) {
                      var color = STATUT_EVT_COLOR[e.statut] || "#888";
                      return <div key={e.id} onClick={function(ev) { ev.stopPropagation(); setDetailEvt(e.id); setView("liste"); }} style={{ fontSize: 10, background: color + "22", color: color, borderRadius: 4, padding: "2px 4px", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 500 }}>{e.titre}</div>;
                    })}
                    {evts.length > 3 && <div style={{ fontSize: 10, color: "#aaa" }}>+{evts.length - 3}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* EDIT EVENT MODAL */}
      {editingEvt && <Modal open={editEvtModalOpen} onClose={function() { setEditEvtModal(false); }} title={"Modifier — " + (editingEvt.titre || "")}>
        <Field label="Titre *"><input style={inp} value={editingEvt.titre || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { titre: e.target.value })); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Type"><select style={sel} value={editingEvt.type || "Entrainement"} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { type: e.target.value })); }}>{["Entrainement","Tournoi","Formation","Match","Evenement special"].map(function(t) { return <option key={t}>{t}</option>; })}</select></Field>
          <Field label="Statut"><select style={sel} value={editingEvt.statut || "Planifie"} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { statut: e.target.value })); }}>{["Planifie","En cours","Termine","Annule"].map(function(t) { return <option key={t}>{t}</option>; })}</select></Field>
        </div>
        <Field label="Date et heure *"><input type="datetime-local" style={inp} value={editingEvt.date_debut ? editingEvt.date_debut.slice(0,16) : ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { date_debut: e.target.value })); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Lieu"><input style={inp} value={editingEvt.lieu || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { lieu: e.target.value })); }} /></Field>
          <Field label="Nb enfants"><input type="number" style={inp} value={editingEvt.nombre_enfants_presents || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { nombre_enfants_presents: e.target.value })); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Confirmation">
            <select style={sel} value={editingEvt.confirmation_statut || "En attente"} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { confirmation_statut: e.target.value })); }}>
              <option value="En attente">⏳ En attente</option>
              <option value="Confirme">✅ Confirmé</option>
            </select>
          </Field>
          <Field label="Responsable">
            <select style={sel} value={editingEvt.responsable_coach_id || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { responsable_coach_id: e.target.value })); }}>
              <option value="">— Aucun —</option>
              {coaches.map(function(c) { return <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>; })}
            </select>
          </Field>
          <Field label="Responsable équipement">
            <select style={sel} value={editingEvt.responsable_equipement_id || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { responsable_equipement_id: e.target.value })); }}>
              <option value="">— Aucun —</option>
              {coaches.map(function(c) { return <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ borderTop: "1px solid #e8e8e8", margin: "12px 0" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#C8102E", marginBottom: 8 }}>🏉 Coaches assignés ({editEvtCoaches.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
          {coaches.map(function(c) {
            var isSel = editEvtCoaches.indexOf(c.id) !== -1;
            return (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, border: "1px solid " + (isSel ? "#C8102E" : "#e0e0e0"), background: isSel ? "#C8102E11" : "#fff", cursor: "pointer" }}>
                <input type="checkbox" checked={isSel} onChange={function() {
                  if (isSel) setEditEvtCoaches(editEvtCoaches.filter(function(id) { return id !== c.id; }));
                  else setEditEvtCoaches(editEvtCoaches.concat([c.id]));
                }} style={{ accentColor: "#C8102E" }} />
                <span style={{ fontSize: 13, flex: 1 }}>{c.prenom} {c.nom}</span>
                <span style={{ fontSize: 11, color: "#aaa" }}>{c.pays}</span>
              </label>
            );
          })}
        </div>
        <Field label="Notes"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 50, marginTop: 12 })} value={editingEvt.notes || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { notes: e.target.value })); }} /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditEvtModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleUpdateEvt} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 600, opacity: 1 }}>Enregistrer</button>
        </div>
      </Modal>}

      {/* DUPLICATION MODAL */}
      {dupSource && dupModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>📋 Dupliquer — {dupSource.titre}</h2>
              <button onClick={function() { setDupModal(false); setDupDates([]); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>Cliquez sur les dates pour les sélectionner ou désélectionner. Naviguez entre les mois librement.</p>

            <DupCalendar dupDates={dupDates} setDupDates={setDupDates} dupMonth={dupMonth} setDupMonth={setDupMonth} />

            <div style={{ marginTop: 14, minHeight: 36 }}>
              {dupDates.length === 0 ? (
                <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>Aucune date sélectionnée</div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#C8102E", marginBottom: 6 }}>{dupDates.length} date{dupDates.length > 1 ? "s" : ""} sélectionnée{dupDates.length > 1 ? "s" : ""}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {dupDates.slice().sort().map(function(d) {
                      return (
                        <span key={d} onClick={function() { setDupDates(dupDates.filter(function(x) { return x !== d; })); }}
                          style={{ background: "#C8102E", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12, cursor: "pointer" }}>
                          {d} ×
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #e8e8e8" }}>
              <button onClick={function() { setDupModal(false); setDupDates([]); }} style={btnS}>Annuler</button>
              <button onClick={handleConfirmDuplication} disabled={dupDates.length === 0 || dupLoading}
                style={Object.assign({}, btnP, { opacity: dupDates.length > 0 && !dupLoading ? 1 : 0.5 })}>
                {dupLoading ? "Création..." : "✅ Créer " + dupDates.length + " événement" + (dupDates.length > 1 ? "s" : "")}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ADD MODAL */}
      <Modal open={modal} onClose={function() { setModal(false); }} title="Nouvel événement">
        <Field label="Titre *"><input style={inp} value={form.titre} onChange={function(e) { set("titre", e.target.value); }} placeholder="Ex: Rugby à 7 — District 9" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Type">
            <select style={sel} value={form.type} onChange={function(e) { set("type", e.target.value); }}>
              {["Entrainement","Tournoi","Formation","Match","Evenement special"].map(function(t) { return <option key={t}>{t}</option>; })}
            </select>
          </Field>
          <Field label="Statut">
            <select style={sel} value={form.statut} onChange={function(e) { set("statut", e.target.value); }}>
              {["Planifie","En cours","Termine","Annule"].map(function(t) { return <option key={t}>{t}</option>; })}
            </select>
          </Field>
        </div>
        <Field label="Date et heure *"><input type="datetime-local" style={inp} value={form.date_debut} onChange={function(e) { set("date_debut", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Lieu"><input style={inp} value={form.lieu} onChange={function(e) { set("lieu", e.target.value); }} /></Field>
          <Field label="Nb enfants"><input type="number" style={inp} value={form.nombre_enfants_presents} onChange={function(e) { set("nombre_enfants_presents", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Confirmation">
            <select style={sel} value={form.confirmation_statut} onChange={function(e) { set("confirmation_statut", e.target.value); }}>
              <option value="En attente">⏳ En attente</option>
              <option value="Confirme">✅ Confirmé</option>
            </select>
          </Field>
          <Field label="Responsable">
            <select style={sel} value={form.responsable_coach_id} onChange={function(e) { set("responsable_coach_id", e.target.value); }}>
              <option value="">— Aucun —</option>
              {coaches.map(function(c) { return <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>; })}
            </select>
          </Field>
          <Field label="Responsable équipement">
            <select style={sel} value={form.responsable_equipement_id} onChange={function(e) { set("responsable_equipement_id", e.target.value); }}>
              <option value="">— Aucun —</option>
              {coaches.map(function(c) { return <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ borderTop: "1px solid #e8e8e8", margin: "8px 0 14px" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 10 }}>Partenaires liés</div>
        {[{type:"ONG",sel:selectedONG,setSel:setSelectedONG},{type:"Shelter",sel:selectedShelter,setSel:setSelectedShelter},{type:"Ecole",sel:selectedEcole,setSel:setSelectedEcole},{type:"Sponsor",sel:selectedSponsor,setSel:setSelectedSponsor}].map(function(item) {
          return <PartenaireMultiSelect key={item.type} partenaires={partenaires} selected={item.sel} onChange={item.setSel} type={item.type} />;
        })}
        <div style={{ borderTop: "1px solid #e8e8e8", margin: "8px 0 14px" }} />
        <CoachMultiSelect coaches={coaches} selected={selectedCoaches} onChange={setSelectedCoaches} />
        <Field label="Notes"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 50 })} value={form.notes} onChange={function(e) { set("notes", e.target.value); }} /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.titre || !form.date_debut} style={Object.assign({}, btnP, { opacity: (form.titre && form.date_debut) ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

// ── COACHES ───────────────────────────────────────────────────
function Coaches() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var ficheState = useState(null); var ficheCoach = ficheState[0]; var setFicheCoach = ficheState[1];
  var coachEvtsState = useState([]); var coachEvts = coachEvtsState[0]; var setCoachEvts = coachEvtsState[1];
  var coachEvtsLoadingState = useState(false); var coachEvtsLoading = coachEvtsLoadingState[0]; var setCoachEvtsLoading = coachEvtsLoadingState[1];
  var editModalState = useState(false); var editCoachModal = editModalState[0]; var setEditCoachModal = editModalState[1];
  var editFormState = useState(null); var editCoachForm = editFormState[0]; var setEditCoachForm = editFormState[1];
  var uploadingState = useState(null); var uploadingId = uploadingState[0]; var setUploadingId = uploadingState[1];

  // Recherche, filtres et tri
  var searchState = useState(""); var search = searchState[0]; var setSearch = searchState[1];
  var fStatutState = useState("Tous"); var fStatut = fStatutState[0]; var setFStatut = fStatutState[1];
  var fRoleState = useState("Tous"); var fRole = fRoleState[0]; var setFRole = fRoleState[1];
  var fSportState = useState("Tous"); var fSport = fSportState[0]; var setFSport = fSportState[1];
  var sortState = useState("sessions"); var sortBy = sortState[0]; var setSortBy = sortState[1];

  var EMPTY = { prenom: "", nom: "", email: "", telephone: "", sport_principal: "Rugby", role: "Benevole", statut: "Actif", pays: "", langues: "", background_check: "", sessions_programmees: 0, sessions_completees: 0 };
  var fs = useState(EMPTY); var form = fs[0]; var setForm = fs[1];
  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }
  function setCF(k, v) { setEditCoachForm(Object.assign({}, editCoachForm, { [k]: v })); }

  useEffect(function() {
    sbFetch("coaches", { select: "*", order: "sessions_completees.desc" }).then(function(r) { setData(r); setLoading(false); });
  }, []);

  useEffect(function() {
    if (!ficheCoach) { setCoachEvts([]); return; }
    setCoachEvtsLoading(true);
    Promise.all([
      sbFetch("evenement_coaches", { select: "evenement_id", filter: "coach_id=eq." + ficheCoach.id }),
      sbFetch("evenements", { select: "id,titre,type,date_debut,lieu,statut,confirmation_statut,nombre_enfants_presents,responsable_coach_id", order: "date_debut.desc" }),
    ]).then(function(r) {
      var ids = r[0].map(function(x) { return x.evenement_id; });
      var evts = r[1].filter(function(e) { return ids.indexOf(e.id) >= 0; });
      setCoachEvts(evts);
      setCoachEvtsLoading(false);
    }).catch(function() { setCoachEvtsLoading(false); });
  }, [ficheCoach && ficheCoach.id]);

  function handleAdd() {
    sbInsert("coaches", form).then(function(rows) { setData([rows[0]].concat(data)); setModal(false); setForm(EMPTY); }).catch(function(e) { alert(e.message); });
  }

  function handleUpdateCoach() {
    var payload = {
      prenom: editCoachForm.prenom, nom: editCoachForm.nom,
      email: editCoachForm.email, telephone: editCoachForm.telephone,
      pays: editCoachForm.pays, langues: editCoachForm.langues,
      sport_principal: editCoachForm.sport_principal, role: editCoachForm.role,
      statut: editCoachForm.statut, background_check: editCoachForm.background_check,
      sessions_programmees: Number(editCoachForm.sessions_programmees) || 0,
      sessions_completees: Number(editCoachForm.sessions_completees) || 0,
    };
    sbUpdate("coaches", editCoachForm.id, payload).then(function() {
      setData(data.map(function(c) { return c.id === editCoachForm.id ? Object.assign({}, c, payload) : c; }));
      if (ficheCoach && ficheCoach.id === editCoachForm.id) setFicheCoach(Object.assign({}, ficheCoach, payload));
      setEditCoachModal(false);
    }).catch(function(e) { alert(e.message); });
  }

  function handlePhotoUpload(coachId, file) {
    if (!file) return;
    setUploadingId(coachId);
    var reader = new FileReader();
    reader.onload = function(ev) {
      var base64 = ev.target.result;
      sbUpdate("coaches", coachId, { photo_url: base64 }).then(function() {
        setData(data.map(function(c) { return c.id === coachId ? Object.assign({}, c, { photo_url: base64 }) : c; }));
        if (ficheCoach && ficheCoach.id === coachId) setFicheCoach(Object.assign({}, ficheCoach, { photo_url: base64 }));
        setUploadingId(null);
      }).catch(function(e) { alert(e.message); setUploadingId(null); });
    };
    reader.readAsDataURL(file);
  }

  // Taux de complétion plafonné à 100 %
  function pctOf(c) {
    var prog = Number(c.sessions_programmees) || 0;
    var comp = Number(c.sessions_completees) || 0;
    return prog > 0 ? Math.min(Math.round((comp / prog) * 100), 100) : 0;
  }

  // Background check structuré (compatible avec l'ancienne valeur "CONFIRMED")
  var BG_OPTIONS = ["", "Confirmé", "En cours", "Non requis"];
  var BG_COLORS = { "Confirmé": "#1D9E75", "CONFIRMED": "#1D9E75", "En cours": "#BA7517", "Non requis": "#888780" };
  function bgColor(v) { return BG_COLORS[v] || "#BA7517"; }
  function bgLabel(v) { return v === "CONFIRMED" ? "Confirmé" : v; }

  // Statistiques d'en-tête
  var totalSessions = data.reduce(function(s, c) { return s + (Number(c.sessions_completees) || 0); }, 0);
  var actifs = data.filter(function(c) { return c.statut === "Actif"; }).length;
  var avgTaux = data.length ? Math.round(data.reduce(function(s, c) { return s + pctOf(c); }, 0) / data.length) : 0;

  // Filtrage + tri
  var filtered = data.filter(function(c) {
    var q = search.trim().toLowerCase();
    var hay = ((c.prenom || "") + " " + (c.nom || "") + " " + (c.pays || "") + " " + (c.langues || "")).toLowerCase();
    var matchSearch = !q || hay.indexOf(q) >= 0;
    var matchStatut = fStatut === "Tous" || c.statut === fStatut;
    var matchRole = fRole === "Tous" || c.role === fRole;
    var matchSport = fSport === "Tous" || c.sport_principal === fSport;
    return matchSearch && matchStatut && matchRole && matchSport;
  });
  var sorted = filtered.slice().sort(function(a, b) {
    if (sortBy === "nom") return ((a.prenom || "") + (a.nom || "")).localeCompare((b.prenom || "") + (b.nom || ""));
    if (sortBy === "taux") return pctOf(b) - pctOf(a);
    if (sortBy === "statut") return (a.statut || "").localeCompare(b.statut || "");
    return (Number(b.sessions_completees) || 0) - (Number(a.sessions_completees) || 0);
  });
  var showMedals = sortBy === "sessions" && fStatut === "Tous" && fRole === "Tous" && fSport === "Tous" && !search.trim();
  var filtresActifs = fStatut !== "Tous" || fRole !== "Tous" || fSport !== "Tous" || search.trim();

  var miniSel = { padding: "6px 8px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 13, background: "#fff" };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Bandeau de statistiques */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <KpiCard label="Coaches" value={data.length} color="#C8102E" />
        <KpiCard label="Actifs" value={actifs} sub={data.length ? Math.round((actifs / data.length) * 100) + "% de l'effectif" : ""} color="#1D9E75" />
        <KpiCard label="Sessions complétées" value={totalSessions} color="#9B1C1C" />
        <KpiCard label="Taux moyen" value={avgTaux + "%"} color="#BA7517" />
      </div>

      {/* Barre recherche + filtres */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="🔍 Rechercher (nom, pays, langue)..." style={{ flex: "1 1 220px", minWidth: 180, padding: "8px 12px", borderRadius: 8, border: "1px solid #d0d0d0", fontSize: 14, outline: "none" }} />
        <select value={fStatut} onChange={function(e) { setFStatut(e.target.value); }} style={miniSel}>
          {["Tous", "Actif", "Occasionnel", "Inactif"].map(function(s) { return <option key={s} value={s}>{s === "Tous" ? "Statut : tous" : s}</option>; })}
        </select>
        <select value={fRole} onChange={function(e) { setFRole(e.target.value); }} style={miniSel}>
          {["Tous", "Coach principal", "Benevole", "Staff", "Coordinateur"].map(function(r) { return <option key={r} value={r}>{r === "Tous" ? "Rôle : tous" : r}</option>; })}
        </select>
        <select value={fSport} onChange={function(e) { setFSport(e.target.value); }} style={miniSel}>
          {["Tous", "Rugby", "Football", "Atletisme", "Basketball", "Natation", "Autre"].map(function(s) { return <option key={s} value={s}>{s === "Tous" ? "Sport : tous" : s}</option>; })}
        </select>
        <select value={sortBy} onChange={function(e) { setSortBy(e.target.value); }} style={miniSel}>
          <option value="sessions">Tri : sessions</option>
          <option value="taux">Tri : taux</option>
          <option value="nom">Tri : nom</option>
          <option value="statut">Tri : statut</option>
        </select>
        {filtresActifs && <button onClick={function() { setSearch(""); setFStatut("Tous"); setFRole("Tous"); setFSport("Tous"); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#888" }}>✕ Réinitialiser</button>}
        <button onClick={function() { setModal(true); }} style={Object.assign({}, btnA, { marginLeft: "auto" })}>+ Ajouter</button>
      </div>

      <div style={{ fontSize: 13, color: "#888" }}>
        {filtered.length === data.length ? (data.length + " coach" + (data.length > 1 ? "es" : "")) : (filtered.length + " / " + data.length + " coaches")}
        {showMedals ? " · classés par sessions" : ""}
      </div>

      {data.length === 0 ? <Empty msg="Aucun coach" /> : sorted.length === 0 ? <Empty msg="Aucun coach ne correspond aux filtres" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {sorted.map(function(c, idx) {
            var sessionsTotal = Number(c.sessions_completees) || 0;
            var sessionsProg = Number(c.sessions_programmees) || 0;
            var pct = pctOf(c);
            var STATUT_C = { Actif: "#1D9E75", Inactif: "#888780", Occasionnel: "#BA7517" };
            var color = STATUT_C[c.statut] || "#888780";
            var medal = showMedals ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "") : "";
            return (
              <div key={c.id} onClick={function() { setFicheCoach(c); }} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={function(e) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                {/* Zone photo */}
                <div style={{ position: "relative", height: 140, background: "linear-gradient(135deg, #1a1a1a, #2d0808)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.prenom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(200,16,46,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#C8102E" }}>
                      {(c.prenom || "?")[0]}{(c.nom || "")[0]}
                    </div>
                  )}
                  {medal && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 22 }}>{medal}</span>}
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c.statut}</span>
                  </div>
                  <label onClick={function(e) { e.stopPropagation(); }} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 20, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>
                    {uploadingId === c.id ? "..." : "📷"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handlePhotoUpload(c.id, e.target.files[0]); }} />
                  </label>
                  {showMedals && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>#{idx + 1}</div>}
                </div>
                {/* Infos */}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.role} · {c.pays || "—"}</div>
                  {c.langues && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{c.langues}</div>}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#444", marginBottom: 4 }}>
                      <span>Sessions</span>
                      <span style={{ fontWeight: 600, color: "#C8102E" }}>{sessionsTotal}/{sessionsProg}</span>
                    </div>
                    <div style={{ background: "#e8e8e8", borderRadius: 4, height: 6 }}>
                      <div style={{ background: "#C8102E", borderRadius: 4, height: 6, width: pct + "%" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 3, textAlign: "right" }}>{pct}% complété</div>
                  </div>
                  {c.background_check && <div style={{ fontSize: 11, color: bgColor(c.background_check), marginTop: 6, fontWeight: 500 }}>✓ {bgLabel(c.background_check)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FICHE COACH */}
      {ficheCoach && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }} onClick={function() { setFicheCoach(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: "#fff", width: "100%", maxWidth: 460, height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
            {/* En-tête photo */}
            <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #1a1a1a, #2d0808)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ficheCoach.photo_url ? (
                <img src={ficheCoach.photo_url} alt={ficheCoach.prenom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#C8102E33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#C8102E" }}>
                  {(ficheCoach.prenom || "?")[0]}{(ficheCoach.nom || "")[0]}
                </div>
              )}
              <button onClick={function() { setFicheCoach(null); }} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              <button onClick={function() { setEditCoachForm(Object.assign({}, ficheCoach)); setEditCoachModal(true); }} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>✏️ Modifier</button>
              <label style={{ position: "absolute", bottom: 12, right: 12, background: "#C8102E", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                📷 Changer la photo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handlePhotoUpload(ficheCoach.id, e.target.files[0]); }} />
              </label>
            </div>
            {/* Infos */}
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>{ficheCoach.prenom} {ficheCoach.nom}</h2>
              <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{ficheCoach.role} · {ficheCoach.sport_principal}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>PAYS</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ficheCoach.pays || "—"}</div>
                </div>
                <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>LANGUES</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ficheCoach.langues || "—"}</div>
                </div>
                <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>EMAIL</div>
                  <div style={{ fontSize: 13 }}>{ficheCoach.email || "—"}</div>
                </div>
                <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>TÉLÉPHONE</div>
                  <div style={{ fontSize: 13 }}>{ficheCoach.telephone || "—"}</div>
                </div>
              </div>
              {/* Sessions */}
              <div style={{ background: "#fff8f8", border: "1px solid #f0c0c0", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#C8102E", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Sessions</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#C8102E" }}>{ficheCoach.sessions_completees || 0}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Complétées</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#9B1C1C" }}>{ficheCoach.sessions_programmees || 0}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Programmées</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#1D9E75" }}>{pctOf(ficheCoach)}%</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Taux</div>
                  </div>
                </div>
                <div style={{ background: "#e0e0e0", borderRadius: 6, height: 8 }}>
                  <div style={{ background: "#C8102E", borderRadius: 6, height: 8, width: pctOf(ficheCoach) + "%" }} />
                </div>
              </div>
              {ficheCoach.background_check && <div style={{ marginTop: 12, fontSize: 13, color: bgColor(ficheCoach.background_check), fontWeight: 500 }}>✓ Background check : {bgLabel(ficheCoach.background_check)}</div>}

              {/* Événements du coach */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#C8102E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  🏉 Événements ({coachEvts.length})
                </div>
                {coachEvtsLoading ? (
                  <div style={{ fontSize: 13, color: "#aaa", padding: "10px 0" }}>Chargement…</div>
                ) : coachEvts.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#aaa", padding: "10px 0" }}>Aucun événement assigné</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {coachEvts.map(function(e) {
                      var isResp = e.responsable_coach_id === ficheCoach.id;
                      var CONF_C = { "Confirmé": "#1D9E75", "En attente": "#BA7517", "Annulé": "#993C1D" };
                      var confColor = CONF_C[e.confirmation_statut] || "#888";
                      var isPast = e.date_debut && e.date_debut < new Date().toISOString().split("T")[0];
                      return (
                        <div key={e.id} style={{ background: isPast ? "#f4f4f4" : "#fff", border: "1px solid " + (isResp ? "#C8102E33" : "#e0e0e0"), borderLeft: isResp ? "3px solid #C8102E" : "3px solid #e0e0e0", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: isPast ? "#aaa" : "#1a1a1a" }}>{e.titre}</div>
                              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{e.type} · {e.date_debut} {e.lieu ? "· " + e.lieu : ""}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                              {e.confirmation_statut && <span style={{ fontSize: 11, fontWeight: 600, color: confColor, background: confColor + "18", padding: "2px 8px", borderRadius: 20 }}>{e.confirmation_statut}</span>}
                              {isResp && <span style={{ fontSize: 10, fontWeight: 600, color: "#C8102E", background: "#C8102E11", padding: "2px 8px", borderRadius: 20 }}>Responsable</span>}
                            </div>
                          </div>
                          {e.nombre_enfants_presents > 0 && <div style={{ fontSize: 11, color: "#1D9E75", marginTop: 4, fontWeight: 500 }}>👦 {e.nombre_enfants_presents} enfants</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DocumentsSection entityType="coach" entityId={ficheCoach.id} />
            </div>
          </div>
        </div>
      )}

      {/* MODALE MODIFIER */}
      {editCoachForm && <Modal open={editCoachModal} onClose={function() { setEditCoachModal(false); }} title={"Modifier — " + (editCoachForm.prenom || "") + " " + (editCoachForm.nom || "")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prénom *"><input style={inp} value={editCoachForm.prenom || ""} onChange={function(e) { setCF("prenom", e.target.value); }} /></Field>
          <Field label="Nom *"><input style={inp} value={editCoachForm.nom || ""} onChange={function(e) { setCF("nom", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email"><input style={inp} type="email" value={editCoachForm.email || ""} onChange={function(e) { setCF("email", e.target.value); }} /></Field>
          <Field label="Téléphone"><input style={inp} value={editCoachForm.telephone || ""} onChange={function(e) { setCF("telephone", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Pays"><input style={inp} value={editCoachForm.pays || ""} onChange={function(e) { setCF("pays", e.target.value); }} /></Field>
          <Field label="Langues"><input style={inp} value={editCoachForm.langues || ""} onChange={function(e) { setCF("langues", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sport">
            <select style={sel} value={editCoachForm.sport_principal || "Rugby"} onChange={function(e) { setCF("sport_principal", e.target.value); }}>
              {["Rugby", "Football", "Atletisme", "Basketball", "Natation", "Autre"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Rôle">
            <select style={sel} value={editCoachForm.role || "Benevole"} onChange={function(e) { setCF("role", e.target.value); }}>
              {["Coach principal", "Benevole", "Staff", "Coordinateur"].map(function(r) { return <option key={r}>{r}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Statut">
            <select style={sel} value={editCoachForm.statut || "Actif"} onChange={function(e) { setCF("statut", e.target.value); }}>
              {["Actif", "Occasionnel", "Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Background check">
            <select style={sel} value={BG_OPTIONS.indexOf(editCoachForm.background_check) >= 0 ? editCoachForm.background_check : (editCoachForm.background_check === "CONFIRMED" ? "Confirmé" : "")} onChange={function(e) { setCF("background_check", e.target.value); }}>
              <option value="">—</option>
              {["Confirmé", "En cours", "Non requis"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sessions programmées"><input type="number" style={inp} value={editCoachForm.sessions_programmees || 0} onChange={function(e) { setCF("sessions_programmees", e.target.value); }} /></Field>
          <Field label="Sessions complétées"><input type="number" style={inp} value={editCoachForm.sessions_completees || 0} onChange={function(e) { setCF("sessions_completees", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditCoachModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleUpdateCoach} style={btnP}>Enregistrer</button>
        </div>
      </Modal>}

      {/* MODALE AJOUTER */}
      <Modal open={modal} onClose={function() { setModal(false); }} title="Nouveau coach">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prénom *"><input style={inp} value={form.prenom} onChange={function(e) { set("prenom", e.target.value); }} /></Field>
          <Field label="Nom *"><input style={inp} value={form.nom} onChange={function(e) { set("nom", e.target.value); }} /></Field>
        </div>
        <Field label="Email"><input style={inp} type="email" value={form.email} onChange={function(e) { set("email", e.target.value); }} /></Field>
        <Field label="Téléphone"><input style={inp} value={form.telephone} onChange={function(e) { set("telephone", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Pays"><input style={inp} value={form.pays} onChange={function(e) { set("pays", e.target.value); }} /></Field>
          <Field label="Langues"><input style={inp} value={form.langues} onChange={function(e) { set("langues", e.target.value); }} placeholder="FRA, ENG, VN" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sport">
            <select style={sel} value={form.sport_principal} onChange={function(e) { set("sport_principal", e.target.value); }}>
              {["Rugby", "Football", "Atletisme", "Basketball", "Natation", "Autre"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Rôle">
            <select style={sel} value={form.role} onChange={function(e) { set("role", e.target.value); }}>
              {["Coach principal", "Benevole", "Staff", "Coordinateur"].map(function(r) { return <option key={r}>{r}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Statut">
            <select style={sel} value={form.statut} onChange={function(e) { set("statut", e.target.value); }}>
              {["Actif", "Occasionnel", "Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Background check">
            <select style={sel} value={form.background_check} onChange={function(e) { set("background_check", e.target.value); }}>
              <option value="">—</option>
              {["Confirmé", "En cours", "Non requis"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.prenom || !form.nom} style={Object.assign({}, btnP, { opacity: (form.prenom && form.nom) ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

// ── TÂCHES ────────────────────────────────────────────────────
var MEMBRES = ["François", "Eric", "Gavin"];
var PRIORITE_CONFIG = {
  Urgente: { color: "#A32D2D", bg: "#A32D2D22", icon: "🔴" },
  Haute:   { color: "#BA7517", bg: "#BA751722", icon: "🟠" },
  Moyenne: { color: "#C8102E", bg: "#C8102E22", icon: "🔵" },
  Basse:   { color: "#888",    bg: "#88888822", icon: "⚪" },
};

function TachesWidget(props) {
  var taches = props.taches || [];
  var partenaires = props.partenaires || [];
  var actions = props.actions || [];
  var tachesEvt = props.tachesEvt || [];
  var evenements = props.evenements || [];
  var onAdd = props.onAdd;
  var onToggle = props.onToggle;
  var onToggleAction = props.onToggleAction || function() {};
  var onToggleEvtTask = props.onToggleEvtTask || function() {};
  var setTab = props.setTab || function() {};
  var onOpenFiche = props.onOpenFiche || function() {};
  var onOpenEvt = props.onOpenEvt || function() {};

  var PRIORITE_ACTION = { "Visite terrain": "Haute", "RDV": "Haute", "Appel": "Moyenne", "Email": "Moyenne", "Autre": "Basse" };

  var actionsTasks = actions.map(function(a) {
    var part = partenaires.find(function(p) { return p.id === a.partenaire_id; });
    return { id: "action_" + a.id, _isAction: true, _originalId: a.id, titre: a.type + " — " + (part ? part.nom : "Partenaire"), description: a.titre, priorite: PRIORITE_ACTION[a.type] || "Moyenne", date_echeance: a.date_prevue, partenaire_id: a.partenaire_id, _partNom: part ? part.nom : "", statut: "A faire" };
  });

  var evtTasks = tachesEvt.map(function(t) {
    var evt = evenements.find(function(e) { return e.id === t.evenement_id; });
    return { id: "evttask_" + t.id, _isEvtTask: true, _originalId: t.id, titre: t.titre, description: evt ? ("📅 " + evt.titre) : "", priorite: t.priorite || "Moyenne", date_echeance: t.date_echeance || (evt && evt.date_debut ? evt.date_debut.split("T")[0] : null), _evtNom: evt ? evt.titre : "", statut: t.statut };
  });

  var allItems = taches.concat(actionsTasks).concat(evtTasks);
  var today = new Date().toISOString().split("T")[0];

  function sortItems(list) {
    return list.slice().sort(function(a, b) {
      var pOrder = { Urgente: 0, Haute: 1, Moyenne: 2, Basse: 3 };
      var isLateA = a.date_echeance && a.date_echeance < today;
      var isLateB = b.date_echeance && b.date_echeance < today;
      if (isLateA && !isLateB) return -1;
      if (!isLateA && isLateB) return 1;
      if (a.date_echeance && b.date_echeance && a.date_echeance !== b.date_echeance) return a.date_echeance > b.date_echeance ? 1 : -1;
      var pa = pOrder[a.priorite] !== undefined ? pOrder[a.priorite] : 4;
      var pb = pOrder[b.priorite] !== undefined ? pOrder[b.priorite] : 4;
      return pa - pb;
    });
  }

  var cols = [
    { label: "🔴 Urgente & Haute", color: "#A32D2D", bg: "#A32D2D11", border: "#A32D2D33", items: sortItems(allItems.filter(function(t) { return t.priorite === "Urgente" || t.priorite === "Haute"; })) },
    { label: "🔵 Moyenne",         color: "#185FA5", bg: "#185FA511", border: "#185FA533", items: sortItems(allItems.filter(function(t) { return t.priorite === "Moyenne"; })) },
    { label: "⚪ Basse",            color: "#888",    bg: "#88888811", border: "#88888833", items: sortItems(allItems.filter(function(t) { return t.priorite === "Basse" || !t.priorite; })) },
  ];

  function TaskCard(p2) {
    var t = p2.t;
    var cfg = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.Moyenne;
    var isLate = t.date_echeance && t.date_echeance < today;
    var part = t.partenaire_id ? partenaires.find(function(p) { return p.id === t.partenaire_id; }) : null;
    var evt = t._isEvtTask ? evenements.find(function(e) { return e.id === t.evenement_id; }) : null;

    function handleCardClick() {
      if (t.partenaire_id) {
        onOpenFiche(t.partenaire_id);
      } else if (t._isEvtTask && evt) {
        onOpenEvt(evt.id);
      }
    }

    var isClickable = !!(t.partenaire_id || (t._isEvtTask && evt));

    return (
      <div onClick={isClickable ? handleCardClick : undefined} style={{ background: "#fff", border: "1px solid " + (isLate ? "#E24B4A44" : "#e8e8e8"), borderLeft: "3px solid " + cfg.color, borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", cursor: isClickable ? "pointer" : "default", transition: "box-shadow .15s" }}
        onMouseEnter={isClickable ? function(e) { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; } : undefined}
        onMouseLeave={isClickable ? function(e) { e.currentTarget.style.boxShadow = "none"; } : undefined}>
        <div onClick={function(e) { e.stopPropagation(); if (t._isAction) onToggleAction({id: t._originalId}); else if (t._isEvtTask) onToggleEvtTask({id: t._originalId}); else onToggle(t); }} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + cfg.color, background: "transparent", flexShrink: 0, cursor: "pointer", marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3, wordBreak: "break-word" }}>
            {t.titre}
            {isClickable && <span style={{ fontSize: 10, color: "#aaa", marginLeft: 6 }}>↗</span>}
          </div>
          {t.description && <div style={{ fontSize: 11, color: "#888", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
            {t.date_echeance && <span style={{ fontSize: 11, color: isLate ? "#E24B4A" : "#888" }}>📅 {t.date_echeance}{isLate ? " ⚠️" : ""}</span>}
            {t.assigne_a && <span style={{ fontSize: 11, color: "#C8102E", fontWeight: 500 }}>→ {t.assigne_a}</span>}
            {(part || t._partNom || t.partenaire_nom_temp) && <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 600 }}>🏢 {part ? part.nom : (t._partNom || t.partenaire_nom_temp)}</span>}
            {t._isAction && <span style={{ fontSize: 10, background: "#BA751722", color: "#BA7517", borderRadius: 10, padding: "1px 6px", fontWeight: 600 }}>Action partenaire</span>}
            {t._isEvtTask && <span style={{ fontSize: 10, background: "#9B1C1C22", color: "#9B1C1C", borderRadius: 10, padding: "1px 6px", fontWeight: 600 }}>📅 {t._evtNom}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
          📋 Tâches à traiter
          {allItems.length > 0 && <span style={{ marginLeft: 8, background: "rgba(200,16,46,0.15)", color: "#C8102E", borderRadius: 20, padding: "2px 8px", fontSize: 12 }}>{allItems.length}</span>}
        </h3>
        <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Nouvelle tâche</button>
      </div>

      {allItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: 13, background: "#f4f4f4", borderRadius: 10 }}>Aucune tâche en cours 🎉</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, alignItems: "start" }}>
          {cols.map(function(col) {
            return (
              <div key={col.label} style={{ background: col.bg, border: "1px solid " + col.border, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid " + col.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: col.color, background: col.bg, border: "1px solid " + col.border, borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>{col.items.length}</span>
                </div>
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {col.items.length === 0
                    ? <div style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "10px 0" }}>—</div>
                    : col.items.map(function(t) { return <TaskCard key={t.id} t={t} />; })
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Taches(props) {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ps = useState([]); var partenaires = ps[0]; var setPartenaires = ps[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var ms = useState(props.openModal || false); var modal = ms[0]; var setModal = ms[1];

  useEffect(function() {
    if (props.openModal) { setModal(true); if (props.setOpenModal) props.setOpenModal(false); }
  }, [props.openModal]);

  var EMPTY = { titre: "", description: "", priorite: "Moyenne", statut: "A faire", date_echeance: "", assigne_par: "", assigne_a: "", partenaire_id: "", partenaire_nom_temp: "", nouveau_partenaire: false, nouveau_partenaire_nom: "" };
  var fs = useState(EMPTY); var form = fs[0]; var setForm = fs[1];
  var searchState = useState(""); var search = searchState[0]; var setSearch = searchState[1];
  var showDropState = useState(false); var showDrop = showDropState[0]; var setShowDrop = showDropState[1];
  var newPartModal = useState(false); var showNewPart = newPartModal[0]; var setShowNewPart = newPartModal[1];
  var newPartForm = useState({ nom: "", type: "ONG", contact_nom: "", contact_email: "", contact_tel: "", statut: "Prospect" });
  var npf = newPartForm[0]; var setNpf = newPartForm[1];

  useEffect(function() {
    Promise.all([
      sbFetch("taches", { select: "*", order: "date_echeance.asc" }),
      sbFetch("partenaires", { select: "id,nom,type", order: "nom.asc" }),
    ]).then(function(r) { setData(r[0]); setPartenaires(r[1]); setLoading(false); });
  }, []);

  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  var filteredParts = partenaires.filter(function(p) {
    return search.length >= 2 && p.nom.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });

  function handleAdd() {
    var payload = {
      titre: form.titre, description: form.description, priorite: form.priorite,
      statut: "A faire", date_echeance: form.date_echeance || null,
      assigne_par: form.assigne_par, assigne_a: form.assigne_a,
      partenaire_id: form.partenaire_id || null,
      partenaire_nom_temp: form.partenaire_nom_temp || null,
    };
    sbInsert("taches", payload).then(function(rows) {
      setData(data.concat(rows[0]));
      setModal(false); setForm(EMPTY); setSearch("");
    }).catch(function(e) { alert(e.message); });
  }

  function handleToggle(t) {
    var newStatut = t.statut === "Termine" ? "A faire" : "Termine";
    sbUpdate("taches", t.id, { statut: newStatut }).then(function() {
      setData(data.map(function(x) { return x.id === t.id ? Object.assign({}, x, { statut: newStatut }) : x; }));
    });
  }

  function handleCreatePartenaire() {
    sbInsert("partenaires", npf).then(function(rows) {
      var newP = rows[0];
      setPartenaires(partenaires.concat(newP));
      setForm(Object.assign({}, form, { partenaire_id: newP.id, partenaire_nom_temp: "" }));
      setSearch(newP.nom);
      setShowNewPart(false);
      setNpf({ nom: "", type: "ONG", contact_nom: "", contact_email: "", contact_tel: "", statut: "Prospect" });
    }).catch(function(e) { alert(e.message); });
  }

  var nonTerminees = data.filter(function(t) { return t.statut !== "Termine"; });
  var terminees = data.filter(function(t) { return t.statut === "Termine"; });

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={function() { setModal(true); }} style={btnA}>+ Nouvelle tâche</button>
      </div>

      <TachesWidget taches={nonTerminees} partenaires={partenaires} onAdd={function() { setModal(true); }} onToggle={handleToggle} />

      {terminees.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Terminées ({terminees.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {terminees.map(function(t) {
              return (
                <div key={t.id} onClick={function() { handleToggle(t); }} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, cursor: "pointer", opacity: 0.6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1D9E75", border: "2px solid #1D9E75", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: 12 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: "#aaa", textDecoration: "line-through" }}>{t.titre}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE TÂCHE */}
      <Modal open={modal} onClose={function() { setModal(false); setSearch(""); setForm(EMPTY); }} title="Nouvelle tâche">
        <Field label="Titre *"><input style={inp} value={form.titre} onChange={function(e) { set("titre", e.target.value); }} placeholder="Ex: Contacter nouveau sponsor" /></Field>
        <Field label="Description"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={form.description} onChange={function(e) { set("description", e.target.value); }} /></Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Priorité">
            <select style={sel} value={form.priorite} onChange={function(e) { set("priorite", e.target.value); }}>
              {["Urgente","Haute","Moyenne","Basse"].map(function(p) { return <option key={p}>{p}</option>; })}
            </select>
          </Field>
          <Field label="À traiter pour le">
            <input type="date" style={inp} value={form.date_echeance} onChange={function(e) { set("date_echeance", e.target.value); }} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Assigné par">
            <select style={sel} value={form.assigne_par} onChange={function(e) { set("assigne_par", e.target.value); }}>
              <option value="">— Sélectionner —</option>
              {MEMBRES.map(function(m) { return <option key={m}>{m}</option>; })}
            </select>
          </Field>
          <Field label="Assigné à">
            <select style={sel} value={form.assigne_a} onChange={function(e) { set("assigne_a", e.target.value); }}>
              <option value="">— Sélectionner —</option>
              {MEMBRES.map(function(m) { return <option key={m}>{m}</option>; })}
            </select>
          </Field>
        </div>

        {/* Partenaire avec recherche */}
        <Field label="Partenaire lié">
          <div style={{ position: "relative" }}>
            <input style={inp} value={search} placeholder="Tapez les premières lettres..." onChange={function(e) { setSearch(e.target.value); set("partenaire_id", ""); set("partenaire_nom_temp", ""); setShowDrop(true); }} onFocus={function() { setShowDrop(true); }} />
            {form.partenaire_id && (
              <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }} onClick={function() { set("partenaire_id", ""); setSearch(""); }}>×</div>
            )}
            {showDrop && search.length >= 2 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                {filteredParts.length === 0 ? (
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Aucun résultat pour "{search}"</div>
                    <button onClick={function() { setShowNewPart(true); setShowDrop(false); set("partenaire_nom_temp", search); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #C8102E", background: "#C8102E11", color: "#C8102E", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Créer "{search}" comme nouveau partenaire</button>
                  </div>
                ) : (
                  <div>
                    {filteredParts.map(function(p) {
                      return (
                        <div key={p.id} onClick={function() { set("partenaire_id", p.id); setSearch(p.nom); setShowDrop(false); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f5f3ee" }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = "#f4f4f4"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                          <span style={{ fontWeight: 500 }}>{p.nom}</span>
                          <span style={{ color: "#aaa", marginLeft: 8, fontSize: 12 }}>{p.type}</span>
                        </div>
                      );
                    })}
                    <div onClick={function() { setShowNewPart(true); setShowDrop(false); set("partenaire_nom_temp", search); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#C8102E", fontWeight: 500, borderTop: "1px solid #e8e8e8" }}>+ Créer nouveau partenaire</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); setSearch(""); setForm(EMPTY); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.titre} style={Object.assign({}, btnP, { opacity: form.titre ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>

      {/* MODAL NOUVEAU PARTENAIRE */}
      {showNewPart && <Modal open={showNewPart} onClose={function() { setShowNewPart(false); }} title="Nouveau partenaire">
        <Field label="Nom *"><input style={inp} value={npf.nom || search} onChange={function(e) { setNpf(Object.assign({}, npf, { nom: e.target.value })); }} /></Field>
        <Field label="Type">
          <select style={sel} value={npf.type} onChange={function(e) { setNpf(Object.assign({}, npf, { type: e.target.value })); }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) { return <option key={t}>{t}</option>; })}
          </select>
        </Field>
        <Field label="Contact"><input style={inp} value={npf.contact_nom} onChange={function(e) { setNpf(Object.assign({}, npf, { contact_nom: e.target.value })); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email"><input style={inp} type="email" value={npf.contact_email} onChange={function(e) { setNpf(Object.assign({}, npf, { contact_email: e.target.value })); }} /></Field>
          <Field label="Téléphone"><input style={inp} value={npf.contact_tel} onChange={function(e) { setNpf(Object.assign({}, npf, { contact_tel: e.target.value })); }} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setShowNewPart(false); }} style={btnS}>Annuler</button>
          <button onClick={handleCreatePartenaire} disabled={!npf.nom} style={Object.assign({}, btnP, { opacity: npf.nom ? 1 : 0.5 })}>Créer & lier</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── AUTH SUPABASE ─────────────────────────────────────────────
async function sbFetchUsers() {
  return sbFetch("users_crm", { select: "*", order: "nom.asc" });
}

async function sbUpdateUser(id, payload) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/users_crm?id=eq." + id, {
    method: "PATCH",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Update error " + res.status);
  return res.json();
}

async function sbInsertUser(payload) {
  return sbInsert("users_crm", payload);
}

async function sbDeleteUser(id) {
  var res = await fetch(SUPABASE_URL + "/rest/v1/users_crm?id=eq." + id, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
  });
  if (!res.ok) throw new Error("Delete error " + res.status);
}

// ── ÉCRAN LOGIN ───────────────────────────────────────────────
function LoginScreen(props) {
  var onLogin = props.onLogin;
  var loginState = useState(""); var login = loginState[0]; var setLogin = loginState[1];
  var passState = useState(""); var pass = passState[0]; var setPass = passState[1];
  var errState = useState(""); var err = errState[0]; var setErr = errState[1];
  var loadingState = useState(false); var loading = loadingState[0]; var setLoading = loadingState[1];
  var showPassState = useState(false); var showPass = showPassState[0]; var setShowPass = showPassState[1];

  function handleSubmit() {
    if (!login.trim() || !pass) { setErr("Veuillez remplir tous les champs."); return; }
    setLoading(true); setErr("");
    sbFetch("users_crm", { select: "*", filter: "login=eq." + login.trim().toLowerCase() })
      .then(function(rows) {
        var user = rows[0];
        if (user && user.password === pass) {
          setLoading(false);
          onLogin({ id: user.id, nom: user.nom, login: user.login, role: user.role });
        } else {
          setLoading(false);
          setErr("Identifiant ou mot de passe incorrect.");
        }
      })
      .catch(function() { setLoading(false); setErr("Erreur de connexion. Vérifiez votre connexion internet."); });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img src="data:image/png;base64,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" alt="RCN" style={{ height: 80, objectFit: "contain" }} />
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>Cung Nhau CRM</div>
          </div>
        </div>
        <div style={{ background: "#2a2a2a", borderRadius: 16, padding: "28px 24px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Identifiant</label>
            <input value={login} onChange={function(e) { setLogin(e.target.value); setErr(""); }} onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }} placeholder="Votre identifiant" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={pass} onChange={function(e) { setPass(e.target.value); setErr(""); }} onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }} placeholder="••••••••" style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <div onClick={function() { setShowPass(!showPass); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</div>
            </div>
          </div>
          {err && <div style={{ color: "#E24B4A", fontSize: 13, marginBottom: 14, padding: "8px 12px", background: "#E24B4A11", borderRadius: 8 }}>{err}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? "#888" : "#C8102E", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>{loading ? "Connexion…" : "Se connecter"}</button>
        </div>
      </div>
    </div>
  );
}

// ── CHANGEMENT MOT DE PASSE (accessible à tous) ───────────────
function ChangerMotDePasse(props) {
  var currentUser = props.currentUser;
  var onClose = props.onClose;
  var onUpdated = props.onUpdated;
  var oldPassState = useState(""); var oldPass = oldPassState[0]; var setOldPass = oldPassState[1];
  var newPassState = useState(""); var newPass = newPassState[0]; var setNewPass = newPassState[1];
  var confirmPassState = useState(""); var confirmPass = confirmPassState[0]; var setConfirmPass = confirmPassState[1];
  var errState = useState(""); var err = errState[0]; var setErr = errState[1];
  var okState = useState(false); var ok = okState[0]; var setOk = okState[1];
  var savingState = useState(false); var saving = savingState[0]; var setSaving = savingState[1];
  var showState = useState({}); var show = showState[0]; var setShow = showState[1];

  function handleSave() {
    if (!oldPass || !newPass || !confirmPass) { setErr("Tous les champs sont requis."); return; }
    if (newPass.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (newPass !== confirmPass) { setErr("Les deux mots de passe ne correspondent pas."); return; }
    setSaving(true); setErr("");
    // Vérifier l'ancien mot de passe
    sbFetch("users_crm", { select: "password", filter: "id=eq." + currentUser.id })
      .then(function(rows) {
        if (!rows[0] || rows[0].password !== oldPass) {
          setErr("Mot de passe actuel incorrect."); setSaving(false); return;
        }
        return sbUpdateUser(currentUser.id, { password: newPass })
          .then(function() {
            setSaving(false); setOk(true);
            setOldPass(""); setNewPass(""); setConfirmPass("");
            setTimeout(function() { onClose(); if (onUpdated) onUpdated(); }, 1500);
          });
      })
      .catch(function(e) { setErr("Erreur : " + e.message); setSaving(false); });
  }

  function t(k) { return function() { setShow(Object.assign({}, show, { [k]: !show[k] })); }; }

  return (
    <Modal open={true} onClose={onClose} title="Changer mon mot de passe">
      <Field label="Mot de passe actuel">
        <div style={{ position: "relative" }}>
          <input type={show.old ? "text" : "password"} style={inp} value={oldPass} onChange={function(e) { setOldPass(e.target.value); setErr(""); }} />
          <div onClick={t("old")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>{show.old ? "🙈" : "👁️"}</div>
        </div>
      </Field>
      <Field label="Nouveau mot de passe">
        <div style={{ position: "relative" }}>
          <input type={show.new ? "text" : "password"} style={inp} value={newPass} onChange={function(e) { setNewPass(e.target.value); setErr(""); }} />
          <div onClick={t("new")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>{show.new ? "🙈" : "👁️"}</div>
        </div>
      </Field>
      <Field label="Confirmer le nouveau mot de passe">
        <div style={{ position: "relative" }}>
          <input type={show.confirm ? "text" : "password"} style={inp} value={confirmPass} onChange={function(e) { setConfirmPass(e.target.value); setErr(""); }} />
          <div onClick={t("confirm")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>{show.confirm ? "🙈" : "👁️"}</div>
        </div>
      </Field>
      {err && <div style={{ color: "#E24B4A", fontSize: 13, padding: "8px 12px", background: "#E24B4A11", borderRadius: 8, marginBottom: 8 }}>{err}</div>}
      {ok && <div style={{ color: "#1D9E75", fontSize: 13, padding: "8px 12px", background: "#1D9E7511", borderRadius: 8, marginBottom: 8 }}>✓ Mot de passe changé avec succès !</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={btnS}>Annuler</button>
        <button onClick={handleSave} disabled={saving} style={Object.assign({}, btnP, { opacity: saving ? 0.6 : 1 })}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </Modal>
  );
}

// ── PANNEAU ADMIN ─────────────────────────────────────────────
function AdminPanel(props) {
  var currentUser = props.currentUser;
  var onClose = props.onClose;
  var usersState = useState([]); var users = usersState[0]; var setUsers = usersState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var editingState = useState(null); var editing = editingState[0]; var setEditing = editingState[1];
  var addingState = useState(false); var adding = addingState[0]; var setAdding = addingState[1];
  var EMPTY_USER = { nom: "", login: "", password: "", role: "user" };
  var newUserState = useState(EMPTY_USER); var newUser = newUserState[0]; var setNewUser = newUserState[1];
  var showPassState = useState({}); var showPass = showPassState[0]; var setShowPass = showPassState[1];
  var savingState = useState(false); var saving = savingState[0]; var setSaving = savingState[1];
  var errState = useState(""); var err = errState[0]; var setErr = errState[1];

  useEffect(function() {
    sbFetchUsers().then(function(rows) { setUsers(rows); setLoading(false); }).catch(function() { setLoading(false); });
  }, []);

  function togglePass(id) { setShowPass(Object.assign({}, showPass, { [id]: !showPass[id] })); }

  function saveEdit() {
    if (!editing.nom || !editing.login || !editing.password) { setErr("Tous les champs sont requis."); return; }
    setSaving(true); setErr("");
    sbUpdateUser(editing.id, { nom: editing.nom, login: editing.login, password: editing.password, role: editing.role })
      .then(function() {
        setUsers(users.map(function(u) { return u.id === editing.id ? Object.assign({}, u, editing) : u; }));
        setEditing(null); setSaving(false);
      }).catch(function(e) { setErr("Erreur : " + e.message); setSaving(false); });
  }

  function deleteUser(id) {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    sbDeleteUser(id).then(function() {
      setUsers(users.filter(function(u) { return u.id !== id; }));
    }).catch(function(e) { alert("Erreur : " + e.message); });
  }

  function addUser() {
    if (!newUser.nom || !newUser.login || !newUser.password) { setErr("Nom, identifiant et mot de passe sont requis."); return; }
    if (newUser.password.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); return; }
    setSaving(true); setErr("");
    sbInsertUser(newUser).then(function(rows) {
      setUsers(users.concat(rows[0]));
      setNewUser(EMPTY_USER); setAdding(false); setSaving(false);
    }).catch(function(e) { setErr("Erreur : " + e.message); setSaving(false); });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1a1a1a", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Administration — Utilisateurs</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {err && <div style={{ color: "#E24B4A", fontSize: 13, padding: "8px 12px", background: "#E24B4A11", borderRadius: 8, marginBottom: 12 }}>{err}</div>}
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#888" }}>{users.length} utilisateur{users.length > 1 ? "s" : ""}</span>
            <button onClick={function() { setAdding(true); setEditing(null); setErr(""); }} style={Object.assign({}, btnA, { fontSize: 12 })}>+ Ajouter</button>
          </div>

          {adding && (
            <div style={{ background: "#f4f4f4", borderRadius: 10, padding: "14px 16px", marginBottom: 14, border: "2px solid #C8102E22" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#C8102E", marginBottom: 12 }}>Nouvel utilisateur</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Nom</label><input style={inp} value={newUser.nom} onChange={function(e) { setNewUser(Object.assign({}, newUser, { nom: e.target.value })); }} /></div>
                <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Identifiant</label><input style={inp} value={newUser.login} onChange={function(e) { setNewUser(Object.assign({}, newUser, { login: e.target.value.toLowerCase() })); }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Mot de passe (min. 6 car.)</label><input style={inp} value={newUser.password} onChange={function(e) { setNewUser(Object.assign({}, newUser, { password: e.target.value })); }} /></div>
                <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Rôle</label>
                  <select style={sel} value={newUser.role} onChange={function(e) { setNewUser(Object.assign({}, newUser, { role: e.target.value })); }}>
                    <option value="user">Utilisateur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={function() { setAdding(false); setNewUser(EMPTY_USER); setErr(""); }} style={btnS}>Annuler</button>
                <button onClick={addUser} disabled={saving} style={Object.assign({}, btnP, { opacity: saving ? 0.6 : 1 })}>{saving ? "Création…" : "Créer"}</button>
              </div>
            </div>
          )}

          {loading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map(function(u) {
                var isMe = u.id === currentUser.id;
                var isEditing = editing && editing.id === u.id;
                return (
                  <div key={u.id} style={{ border: "1px solid " + (isMe ? "#C8102E44" : "#e8e8e8"), borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: isMe ? "#C8102E08" : "#fafafa", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: isMe ? "#C8102E" : "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{u.nom[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{u.nom} {isMe && <span style={{ fontSize: 11, color: "#C8102E", fontWeight: 500 }}>(vous)</span>}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>@{u.login} · <span style={{ color: u.role === "admin" ? "#C8102E" : "#888", fontWeight: u.role === "admin" ? 600 : 400 }}>{u.role === "admin" ? "Admin" : "Utilisateur"}</span></div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {!isEditing && <button onClick={function() { setEditing(Object.assign({}, u)); setAdding(false); setErr(""); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#444" }}>✏️ Modifier</button>}
                        {!isMe && <button onClick={function() { deleteUser(u.id); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fdd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#E24B4A" }}>🗑️</button>}
                      </div>
                    </div>
                    {isEditing && (
                      <div style={{ padding: "14px 14px", borderTop: "1px solid #e8e8e8" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Nom</label><input style={inp} value={editing.nom} onChange={function(e) { setEditing(Object.assign({}, editing, { nom: e.target.value })); }} /></div>
                          <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Identifiant</label><input style={inp} value={editing.login} onChange={function(e) { setEditing(Object.assign({}, editing, { login: e.target.value.toLowerCase() })); }} /></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Mot de passe</label>
                            <div style={{ position: "relative" }}>
                              <input type={showPass[u.id] ? "text" : "password"} style={inp} value={editing.password} onChange={function(e) { setEditing(Object.assign({}, editing, { password: e.target.value })); }} />
                              <div onClick={function() { togglePass(u.id); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#aaa" }}>{showPass[u.id] ? "🙈" : "👁️"}</div>
                            </div>
                          </div>
                          <div><label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Rôle</label>
                            <select style={sel} value={editing.role} onChange={function(e) { setEditing(Object.assign({}, editing, { role: e.target.value })); }}>
                              <option value="user">Utilisateur</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={function() { setEditing(null); setErr(""); }} style={btnS}>Annuler</button>
                          <button onClick={saveEdit} disabled={saving} style={Object.assign({}, btnP, { opacity: saving ? 0.6 : 1 })}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── ÉQUIPEMENT ────────────────────────────────────────────────
var CATEGORIES_EQUIPEMENT = [
  { id: "ballon",          label: "Ballon",           icon: "🏉", color: "#C8102E" },
  { id: "cone",            label: "Cône",             icon: "🔺", color: "#BA7517" },
  { id: "chasuble",        label: "Chasuble",         icon: "🦺", color: "#1D9E75" },
  { id: "vetement_enfant", label: "Vêtement enfants", icon: "👕", color: "#185FA5" },
  { id: "polo_coach",      label: "Polo coach",       icon: "👔", color: "#534AB7" },
  { id: "autre",           label: "Autre",            icon: "📦", color: "#888"    },
];

function Equipement() {
  var dataState = useState([]); var data = dataState[0]; var setData = dataState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var addModalState = useState(false); var addModal = addModalState[0]; var setAddModal = addModalState[1];
  var editModalState = useState(null); var editItem = editModalState[0]; var setEditItem = editModalState[1];
  var updatingState = useState(null); var updating = updatingState[0]; var setUpdating = updatingState[1];

  // Formulaire ajout
  var EMPTY = { nom: "", categorie: "ballon", quantite: 0, seuil_alerte: 0, notes: "" };
  var formState = useState(EMPTY); var form = formState[0]; var setForm = formState[1];
  var savingState = useState(false); var saving = savingState[0]; var setSaving = savingState[1];

  useEffect(function() {
    sbFetch("equipements", { select: "*", order: "categorie.asc,nom.asc" })
      .then(function(rows) { setData(rows); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, []);

  function handleAdd() {
    if (!form.nom) return;
    setSaving(true);
    sbInsert("equipements", { nom: form.nom, categorie: form.categorie, quantite: Number(form.quantite) || 0, seuil_alerte: Number(form.seuil_alerte) || 0, notes: form.notes || null })
      .then(function(rows) {
        setData(data.concat(rows[0]).sort(function(a,b){ return a.categorie.localeCompare(b.categorie) || a.nom.localeCompare(b.nom); }));
        setAddModal(false); setForm(EMPTY); setSaving(false);
      }).catch(function(e) { alert(e.message); setSaving(false); });
  }

  function handleDelta(item, delta) {
    var newQty = Math.max(0, (Number(item.quantite) || 0) + delta);
    setUpdating(item.id);
    sbUpdate("equipements", item.id, { quantite: newQty })
      .then(function() {
        setData(data.map(function(d) { return d.id === item.id ? Object.assign({}, d, { quantite: newQty }) : d; }));
        setUpdating(null);
      }).catch(function(e) { alert(e.message); setUpdating(null); });
  }

  function handleDelete(id) {
    if (!window.confirm("Supprimer cet article ?")) return;
    fetch(SUPABASE_URL + "/rest/v1/equipements?id=eq." + id, { method: "DELETE", headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } })
      .then(function() { setData(data.filter(function(d) { return d.id !== id; })); });
  }

  function handleSaveEdit() {
    setSaving(true);
    sbUpdate("equipements", editItem.id, { nom: editItem.nom, categorie: editItem.categorie, seuil_alerte: Number(editItem.seuil_alerte) || 0, notes: editItem.notes || null })
      .then(function() {
        setData(data.map(function(d) { return d.id === editItem.id ? Object.assign({}, d, editItem) : d; }));
        setEditItem(null); setSaving(false);
      }).catch(function(e) { alert(e.message); setSaving(false); });
  }

  function getCat(id) { return CATEGORIES_EQUIPEMENT.find(function(c) { return c.id === id; }) || CATEGORIES_EQUIPEMENT[5]; }

  // Stats dashboard
  var totalArticles = data.length;
  var totalUnites = data.reduce(function(s, d) { return s + (Number(d.quantite) || 0); }, 0);
  var enAlerte = data.filter(function(d) { return Number(d.seuil_alerte) > 0 && Number(d.quantite) <= Number(d.seuil_alerte); }).length;
  var epuises = data.filter(function(d) { return Number(d.quantite) === 0; }).length;

  // Grouper par catégorie
  var grouped = CATEGORIES_EQUIPEMENT.map(function(cat) {
    return { cat: cat, items: data.filter(function(d) { return d.categorie === cat.id; }) };
  }).filter(function(g) { return g.items.length > 0; });

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── MINI DASHBOARD ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Articles référencés</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{totalArticles}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Unités en stock</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1D9E75", lineHeight: 1 }}>{totalUnites}</div>
        </div>
        <div onClick={function() {}} style={{ background: enAlerte > 0 ? "#BA751708" : "#fff", border: "1px solid " + (enAlerte > 0 ? "#BA751744" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>⚠️ En alerte</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: enAlerte > 0 ? "#BA7517" : "#aaa", lineHeight: 1 }}>{enAlerte}</div>
          {enAlerte > 0 && <div style={{ fontSize: 11, color: "#BA7517", marginTop: 4 }}>stock ≤ seuil</div>}
        </div>
        <div style={{ background: epuises > 0 ? "#C8102E08" : "#fff", border: "1px solid " + (epuises > 0 ? "#C8102E44" : "#e0e0e0"), borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>🚫 Épuisés</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: epuises > 0 ? "#C8102E" : "#aaa", lineHeight: 1 }}>{epuises}</div>
          {epuises > 0 && <div style={{ fontSize: 11, color: "#C8102E", marginTop: 4 }}>à réapprovisionner</div>}
        </div>
      </div>

      {/* Barre par catégorie */}
      {data.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES_EQUIPEMENT.map(function(cat) {
            var items = data.filter(function(d) { return d.categorie === cat.id; });
            if (!items.length) return null;
            var total = items.reduce(function(s,d){ return s + (Number(d.quantite)||0); }, 0);
            var alert = items.some(function(d){ return Number(d.seuil_alerte) > 0 && Number(d.quantite) <= Number(d.seuil_alerte); });
            return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 6, background: cat.color + "11", border: "1px solid " + cat.color + "33", borderRadius: 20, padding: "4px 12px" }}>
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{cat.label}</span>
                <span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>{total}</span>
                {alert && <span style={{ fontSize: 10 }}>⚠️</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton ajouter */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={function() { setAddModal(true); }} style={btnA}>+ Ajouter un article</button>
      </div>

      {/* Liste groupée par catégorie */}
      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          Aucun article — cliquez "+ Ajouter un article" pour commencer
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(function(g) {
            var cat = g.cat;
            return (
              <div key={cat.id} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14, overflow: "hidden" }}>
                {/* En-tête catégorie */}
                <div style={{ padding: "12px 18px", background: cat.color + "11", borderBottom: "1px solid " + cat.color + "22", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: cat.color, background: cat.color + "22", borderRadius: 20, padding: "1px 8px", fontWeight: 600, marginLeft: 4 }}>
                    {g.items.length} article{g.items.length > 1 ? "s" : ""} · {g.items.reduce(function(s,d){return s+(Number(d.quantite)||0);},0)} unités
                  </span>
                </div>
                {/* Lignes */}
                <div>
                  {g.items.map(function(item, idx) {
                    var qty = Number(item.quantite) || 0;
                    var seuil = Number(item.seuil_alerte) || 0;
                    var isLow = seuil > 0 && qty <= seuil;
                    var isEmpty = qty === 0;
                    var isUpdating = updating === item.id;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: idx < g.items.length - 1 ? "1px solid #f4f4f4" : "none", background: isEmpty ? "#C8102E04" : isLow ? "#BA751704" : "transparent" }}>
                        {/* Nom + notes */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                            {item.nom}
                            {isEmpty && <span style={{ fontSize: 10, fontWeight: 700, color: "#C8102E", background: "#C8102E11", padding: "1px 7px", borderRadius: 10 }}>ÉPUISÉ</span>}
                            {!isEmpty && isLow && <span style={{ fontSize: 10, fontWeight: 700, color: "#BA7517", background: "#BA751711", padding: "1px 7px", borderRadius: 10 }}>ALERTE</span>}
                          </div>
                          {item.notes && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{item.notes}</div>}
                          {seuil > 0 && <div style={{ fontSize: 11, color: "#ccc", marginTop: 1 }}>Seuil d'alerte : {seuil}</div>}
                        </div>

                        {/* Contrôle quantité */}
                        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#f4f4f4", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                          <button onClick={function() { handleDelta(item, -1); }} disabled={qty === 0 || isUpdating} style={{ width: 36, height: 36, border: "none", background: "transparent", cursor: qty > 0 ? "pointer" : "not-allowed", fontSize: 18, fontWeight: 700, color: qty > 0 ? "#C8102E" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <div style={{ minWidth: 52, textAlign: "center", fontSize: 18, fontWeight: 800, color: isEmpty ? "#C8102E" : isLow ? "#BA7517" : "#1a1a1a", padding: "0 4px" }}>
                            {isUpdating ? "…" : qty}
                          </div>
                          <button onClick={function() { handleDelta(item, +1); }} disabled={isUpdating} style={{ width: 36, height: 36, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={function() { setEditItem(Object.assign({}, item)); }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#444" }}>✏️</button>
                          <button onClick={function() { handleDelete(item.id); }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #fdd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#E24B4A" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUTER */}
      <Modal open={addModal} onClose={function() { setAddModal(false); setForm(EMPTY); }} title="Ajouter un article">
        <Field label="Nom *"><input style={inp} value={form.nom} onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }} placeholder="Ex: Ballon taille 4" /></Field>
        <Field label="Catégorie">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {CATEGORIES_EQUIPEMENT.map(function(cat) {
              var active = form.categorie === cat.id;
              return <button key={cat.id} onClick={function() { setForm(Object.assign({}, form, { categorie: cat.id })); }} style={{ padding: "8px 6px", borderRadius: 8, border: "2px solid " + (active ? cat.color : "#e0e0e0"), background: active ? cat.color + "11" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cat.color : "#555", textAlign: "center" }}>{cat.icon}<br />{cat.label}</button>;
            })}
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Quantité initiale"><input type="number" min="0" style={inp} value={form.quantite} onChange={function(e) { setForm(Object.assign({}, form, { quantite: e.target.value })); }} /></Field>
          <Field label="Seuil d'alerte"><input type="number" min="0" style={inp} value={form.seuil_alerte} onChange={function(e) { setForm(Object.assign({}, form, { seuil_alerte: e.target.value })); }} placeholder="0 = désactivé" /></Field>
        </div>
        <Field label="Notes"><input style={inp} value={form.notes} onChange={function(e) { setForm(Object.assign({}, form, { notes: e.target.value })); }} placeholder="Ex: Pour les entraînements" /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setAddModal(false); setForm(EMPTY); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.nom || saving} style={Object.assign({}, btnP, { opacity: form.nom ? 1 : 0.5 })}>{saving ? "Enregistrement…" : "Ajouter"}</button>
        </div>
      </Modal>

      {/* MODAL MODIFIER */}
      {editItem && <Modal open={!!editItem} onClose={function() { setEditItem(null); }} title={"Modifier — " + editItem.nom}>
        <Field label="Nom *"><input style={inp} value={editItem.nom} onChange={function(e) { setEditItem(Object.assign({}, editItem, { nom: e.target.value })); }} /></Field>
        <Field label="Catégorie">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {CATEGORIES_EQUIPEMENT.map(function(cat) {
              var active = editItem.categorie === cat.id;
              return <button key={cat.id} onClick={function() { setEditItem(Object.assign({}, editItem, { categorie: cat.id })); }} style={{ padding: "8px 6px", borderRadius: 8, border: "2px solid " + (active ? cat.color : "#e0e0e0"), background: active ? cat.color + "11" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cat.color : "#555", textAlign: "center" }}>{cat.icon}<br />{cat.label}</button>;
            })}
          </div>
        </Field>
        <Field label="Seuil d'alerte"><input type="number" min="0" style={inp} value={editItem.seuil_alerte || 0} onChange={function(e) { setEditItem(Object.assign({}, editItem, { seuil_alerte: e.target.value })); }} placeholder="0 = désactivé" /></Field>
        <Field label="Notes"><input style={inp} value={editItem.notes || ""} onChange={function(e) { setEditItem(Object.assign({}, editItem, { notes: e.target.value })); }} /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditItem(null); }} style={btnS}>Annuler</button>
          <button onClick={handleSaveEdit} disabled={saving} style={Object.assign({}, btnP, { opacity: saving ? 0.6 : 1 })}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── EMAILS APP ────────────────────────────────────────────────
function EmailsApp() {
  var emailsState = useState([]); var emails = emailsState[0]; var setEmails = emailsState[1];
  var partenairesState = useState([]); var partenaires = partenairesState[0]; var setPartenaires = partenairesState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var syncingState = useState(false); var syncing = syncingState[0]; var setSyncing = syncingState[1];
  var selectedState = useState(null); var selected = selectedState[0]; var setSelected = selectedState[1];
  var filterState = useState("tous"); var filter = filterState[0]; var setFilter = filterState[1];
  var filterPartState = useState(""); var filterPart = filterPartState[0]; var setFilterPart = filterPartState[1];
  var searchState = useState(""); var search = searchState[0]; var setSearch = searchState[1];
  var composeState = useState(false); var compose = composeState[0]; var setCompose = composeState[1];
  var sendingState = useState(false); var sending = sendingState[0]; var setSending = sendingState[1];
  var toState = useState(""); var to = toState[0]; var setTo = toState[1];
  var subjectState = useState(""); var subject = subjectState[0]; var setSubject = subjectState[1];
  var bodyState = useState(""); var body = bodyState[0]; var setBody = bodyState[1];
  var replyToState = useState(null); var replyTo = replyToState[0]; var setReplyTo = replyToState[1];
  var settingsState = useState(false); var settings = settingsState[0]; var setSettings = settingsState[1];

  // Gestionnaire de signatures
  var SIG_KEY = "rcn_signatures";
  var SIG_ACTIVE_KEY = "rcn_signature_active";
  var DEFAULT_SIGS = [{ id: 1, nom: "Par défaut", texte: "\n\n--\nRugby Cung Nhau\nadmin@rugbycungnhau.com", logo: null }];
  var sigsState = useState(DEFAULT_SIGS); var sigs = sigsState[0]; var setSigs = sigsState[1];
  var activeSigIdState = useState(1); var activeSigId = activeSigIdState[0]; var setActiveSigId = activeSigIdState[1];
  useEffect(function() {
    try {
      var saved = localStorage.getItem(SIG_KEY);
      if (saved) setSigs(JSON.parse(saved));
      var savedId = localStorage.getItem(SIG_ACTIVE_KEY);
      if (savedId) setActiveSigId(parseInt(savedId));
    } catch(e) {}
  }, []);
  var editingSigState = useState(null); var editingSig = editingSigState[0]; var setEditingSig = editingSigState[1];
  var newSigState = useState(false); var newSig = newSigState[0]; var setNewSig = newSigState[1];
  var newSigFormState = useState({ nom: "", texte: "", logo: null }); var newSigForm = newSigFormState[0]; var setNewSigForm = newSigFormState[1];

  function saveSigs(list) { setSigs(list); try { localStorage.setItem(SIG_KEY, JSON.stringify(list)); } catch(e) {} }
  function saveActiveSig(id) { setActiveSigId(id); try { localStorage.setItem(SIG_ACTIVE_KEY, String(id)); } catch(e) {} }
  var activeSig = sigs.find(function(s) { return s.id === activeSigId; }) || sigs[0] || { texte: "" };
  var signature = activeSig ? (activeSig.logo ? "" : "") + activeSig.texte : "";

  function handleLogoUpload(file, cb) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) { cb(e.target.result); };
    reader.readAsDataURL(file);
  }

  useEffect(function() {
    Promise.all([
      sbFetch("emails", { select: "*", order: "date_reception.desc" }),
      sbFetch("partenaires", { select: "id,nom,contact_email,type", order: "nom.asc" }),
    ]).then(function(r) {
      setEmails(r[0]); setPartenaires(r[1]); setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);

  function handleSync() {
    setSyncing(true);
    fetch("/api/gmail-sync", { method: "POST" })
      .then(function(r) { return r.json(); })
      .then(function() {
        return sbFetch("emails", { select: "*", order: "date_reception.desc" });
      })
      .then(function(rows) { setEmails(rows); setSyncing(false); })
      .catch(function(e) { alert("Erreur : " + e.message); setSyncing(false); });
  }

  function handleSend() {
    if (!to || !subject || !body) { alert("Destinataire, sujet et corps requis."); return; }
    setSending(true);
    var partId = partenaires.find(function(p) { return p.contact_email && p.contact_email.toLowerCase() === to.toLowerCase(); });
    fetch("/api/gmail-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to, subject: subject, body: body + signature,
        threadId: replyTo ? replyTo.thread_id : null,
        replyToMessageId: replyTo ? replyTo.gmail_id : null,
        partenaireId: partId ? partId.id : null,
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) throw new Error(d.error);
        setSending(false); setCompose(false); setReplyTo(null);
        setTo(""); setSubject(""); setBody("");
        return sbFetch("emails", { select: "*", order: "date_reception.desc" });
      })
      .then(function(rows) { setEmails(rows); })
      .catch(function(e) { alert("Erreur envoi : " + e.message); setSending(false); });
  }

  function handleMarkRead(id) {
    sbUpdate("emails", id, { lu: true }).then(function() {
      setEmails(emails.map(function(e) { return e.id === id ? Object.assign({}, e, { lu: true }) : e; }));
    });
  }

  function openReply(email) {
    setReplyTo(email);
    setTo(email.de.match(/<(.+?)>/) ? email.de.match(/<(.+?)>/)[1] : email.de);
    setSubject(email.sujet.startsWith("Re:") ? email.sujet : "Re: " + email.sujet);
    setBody(""); setCompose(true);
  }

  function getPartenaire(id) { return id ? partenaires.find(function(p) { return p.id === id; }) : null; }

  // Filtrage
  var filtered = emails.filter(function(e) {
    if (filter === "recus" && e.type !== "recu") return false;
    if (filter === "envoyes" && e.type !== "envoye") return false;
    if (filter === "nonlus" && (e.lu || e.type !== "recu")) return false;
    if (filterPart && e.partenaire_id !== filterPart) return false;
    if (search) {
      var q = search.toLowerCase();
      if (!(e.sujet||"").toLowerCase().includes(q) && !(e.de||"").toLowerCase().includes(q) && !(e.corps||"").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  var nonLus = emails.filter(function(e) { return !e.lu && e.type === "recu"; }).length;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 120px)", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14, overflow: "hidden" }}>

      {/* ── COLONNE GAUCHE : liste emails ── */}
      <div style={{ width: 340, borderRight: "1px solid #e0e0e0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e0e0e0", background: "#1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>📧 Emails</span>
              {nonLus > 0 && <span style={{ background: "#C8102E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{nonLus}</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleSync} disabled={syncing} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: syncing ? "#444" : "#333", color: "#fff", cursor: "pointer", fontSize: 12 }}>{syncing ? "⟳..." : "⟳"}</button>
              <button onClick={function() { setSettings(!settings); setCompose(false); }} title="Signature" style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: settings ? "#C8102E" : "#333", color: "#fff", cursor: "pointer", fontSize: 12 }}>✏️</button>
              <button onClick={function() { setCompose(true); setSettings(false); setReplyTo(null); setTo(""); setSubject(""); setBody(""); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✉️ Nouveau</button>
            </div>
          </div>
          {/* Recherche */}
          <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="🔍 Rechercher..." style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "#333", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {/* Panneau signatures */}
        {settings && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e0e0e0", background: "#f9f9f9", maxHeight: 380, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>✏️ Signatures</span>
              <button onClick={function() { setNewSig(true); setEditingSig(null); setNewSigForm({ nom: "", texte: "\n\n--\n", logo: null }); }} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: "#C8102E", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>+ Nouvelle</button>
            </div>

            {/* Liste des signatures */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: newSig ? 10 : 0 }}>
              {sigs.map(function(s) {
                var isActive = s.id === activeSigId;
                var isEditing = editingSig && editingSig.id === s.id;
                return (
                  <div key={s.id} style={{ border: "2px solid " + (isActive ? "#C8102E" : "#e0e0e0"), borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {/* En-tête */}
                    <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", gap: 8, background: isActive ? "#C8102E08" : "#fff" }}>
                      <input type="radio" checked={isActive} onChange={function() { saveActiveSig(s.id); setEditingSig(null); }} style={{ cursor: "pointer", accentColor: "#C8102E" }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#C8102E" : "#333" }}>{s.nom}</span>
                      {s.logo && <img src={s.logo} alt="logo" style={{ height: 18, objectFit: "contain" }} />}
                      <button onClick={function() { setEditingSig(Object.assign({}, s)); setNewSig(false); }} style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, color: "#444" }}>✏️</button>
                      {sigs.length > 1 && <button onClick={function() {
                        var newList = sigs.filter(function(x) { return x.id !== s.id; });
                        saveSigs(newList);
                        if (isActive && newList.length > 0) saveActiveSig(newList[0].id);
                      }} style={{ padding: "2px 7px", borderRadius: 5, border: "1px solid #fdd", background: "#fff", cursor: "pointer", fontSize: 11, color: "#E24B4A" }}>🗑️</button>}
                    </div>
                    {/* Édition inline */}
                    {isEditing && (
                      <div style={{ padding: "8px 10px", borderTop: "1px solid #e8e8e8", background: "#fafafa" }}>
                        <input style={Object.assign({}, inp, { fontSize: 12, marginBottom: 6 })} value={editingSig.nom} placeholder="Nom de la signature" onChange={function(e) { setEditingSig(Object.assign({}, editingSig, { nom: e.target.value })); }} />
                        <textarea style={Object.assign({}, inp, { fontSize: 11, fontFamily: "monospace", minHeight: 60, resize: "vertical", marginBottom: 6 })} value={editingSig.texte} onChange={function(e) { setEditingSig(Object.assign({}, editingSig, { texte: e.target.value })); }} />
                        <div style={{ marginBottom: 6 }}>
                          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Logo (optionnel)</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {editingSig.logo && <img src={editingSig.logo} alt="logo" style={{ height: 28, objectFit: "contain", border: "1px solid #e0e0e0", borderRadius: 4, padding: 2 }} />}
                            <label style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, color: "#444" }}>
                              📁 {editingSig.logo ? "Changer" : "Ajouter logo"}
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handleLogoUpload(e.target.files[0], function(data) { setEditingSig(Object.assign({}, editingSig, { logo: data })); }); }} />
                            </label>
                            {editingSig.logo && <button onClick={function() { setEditingSig(Object.assign({}, editingSig, { logo: null })); }} style={{ fontSize: 11, color: "#E24B4A", background: "none", border: "none", cursor: "pointer" }}>✕ Retirer</button>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={function() { setEditingSig(null); }} style={Object.assign({}, btnS, { fontSize: 11 })}>Annuler</button>
                          <button onClick={function() {
                            var updated = sigs.map(function(x) { return x.id === editingSig.id ? editingSig : x; });
                            saveSigs(updated); setEditingSig(null);
                          }} style={Object.assign({}, btnP, { fontSize: 11 })}>Enregistrer</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nouvelle signature */}
            {newSig && (
              <div style={{ border: "2px solid #C8102E44", borderRadius: 8, padding: "10px", background: "#fff", marginTop: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C8102E", marginBottom: 8 }}>Nouvelle signature</div>
                <input style={Object.assign({}, inp, { fontSize: 12, marginBottom: 6 })} value={newSigForm.nom} placeholder="Nom (ex: Formelle, Courte...)" onChange={function(e) { setNewSigForm(Object.assign({}, newSigForm, { nom: e.target.value })); }} />
                <textarea style={Object.assign({}, inp, { fontSize: 11, fontFamily: "monospace", minHeight: 60, resize: "vertical", marginBottom: 6 })} value={newSigForm.texte} onChange={function(e) { setNewSigForm(Object.assign({}, newSigForm, { texte: e.target.value })); }} />
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {newSigForm.logo && <img src={newSigForm.logo} alt="logo" style={{ height: 28, objectFit: "contain", border: "1px solid #e0e0e0", borderRadius: 4, padding: 2 }} />}
                    <label style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 11, color: "#444" }}>
                      📁 {newSigForm.logo ? "Changer logo" : "Ajouter logo"}
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handleLogoUpload(e.target.files[0], function(data) { setNewSigForm(Object.assign({}, newSigForm, { logo: data })); }); }} />
                    </label>
                    {newSigForm.logo && <button onClick={function() { setNewSigForm(Object.assign({}, newSigForm, { logo: null })); }} style={{ fontSize: 11, color: "#E24B4A", background: "none", border: "none", cursor: "pointer" }}>✕</button>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={function() { setNewSig(false); }} style={Object.assign({}, btnS, { fontSize: 11 })}>Annuler</button>
                  <button onClick={function() {
                    if (!newSigForm.nom) return;
                    var maxId = sigs.reduce(function(m, s) { return Math.max(m, s.id); }, 0);
                    var newList = sigs.concat(Object.assign({}, newSigForm, { id: maxId + 1 }));
                    saveSigs(newList); setNewSig(false); setNewSigForm({ nom: "", texte: "\n\n--\n", logo: null });
                  }} disabled={!newSigForm.nom} style={Object.assign({}, btnP, { fontSize: 11, opacity: newSigForm.nom ? 1 : 0.5 })}>Créer</button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Filtres */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #e0e0e0", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["tous", "Tous", emails.length],
            ["recus", "↙ Reçus", emails.filter(function(e) { return e.type === "recu"; }).length],
            ["envoyes", "↗ Envoyés", emails.filter(function(e) { return e.type === "envoye"; }).length],
            ["nonlus", "🔴 Non lus", nonLus],
          ].map(function(f) {
            return (
              <button key={f[0]} onClick={function() { setFilter(f[0]); }} style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid " + (filter === f[0] ? "#C8102E" : "#e0e0e0"), background: filter === f[0] ? "#C8102E" : "#fff", color: filter === f[0] ? "#fff" : "#555", cursor: "pointer", fontSize: 11, fontWeight: filter === f[0] ? 600 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                {f[1]} {f[2] > 0 && <span style={{ background: filter === f[0] ? "rgba(255,255,255,0.3)" : "#e0e0e0", borderRadius: 20, padding: "0 5px", fontSize: 10, fontWeight: 700 }}>{f[2]}</span>}
              </button>
            );
          })}
        </div>
        {/* Filtre partenaire */}
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #e0e0e0" }}>
          <select style={Object.assign({}, sel, { fontSize: 12 })} value={filterPart} onChange={function(e) { setFilterPart(e.target.value); }}>
            <option value="">Tous les partenaires</option>
            {partenaires.filter(function(p) { return emails.some(function(e) { return e.partenaire_id === p.id; }); }).map(function(p) {
              return <option key={p.id} value={p.id}>{p.nom}</option>;
            })}
          </select>
        </div>
        {/* Liste */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>{filter === "nonlus" ? "🎉 Aucun email non lu !" : "Aucun email"}</div>
          ) : filtered.map(function(email) {
            var isSelected = selected && selected.id === email.id;
            var part = getPartenaire(email.partenaire_id);
            var dateStr = email.date_reception ? new Date(email.date_reception).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={email.id} onClick={function() { setSelected(email); setCompose(false); if (!email.lu) handleMarkRead(email.id); }} style={{ padding: "12px 14px", borderBottom: "1px solid #f4f4f4", cursor: "pointer", background: isSelected ? "#C8102E08" : email.lu ? "#fff" : "#fff8f8", borderLeft: "3px solid " + (isSelected ? "#C8102E" : email.lu ? "transparent" : "#C8102E") }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: !email.lu && email.type === "recu" ? 700 : 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{email.type === "recu" ? (email.de.match(/<(.+?)>/) ? email.de.split("<")[0].trim() : email.de) : "À : " + email.a}</span>
                  <span style={{ fontSize: 10, color: "#aaa", flexShrink: 0 }}>{dateStr}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: !email.lu && email.type === "recu" ? 700 : 400, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email.sujet || "(sans objet)"}</div>
                <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{(email.corps || "").substring(0, 60)}</div>
                {part && <span style={{ fontSize: 10, background: "#C8102E11", color: "#C8102E", borderRadius: 10, padding: "1px 6px", marginTop: 4, display: "inline-block", fontWeight: 600 }}>{part.nom}</span>}
                {email.importance === "urgent" && <span style={{ fontSize: 10, background: "#C8102E", color: "#fff", borderRadius: 10, padding: "1px 6px", marginTop: 4, display: "inline-block", fontWeight: 700, marginLeft: 4 }}>🔴 Urgent</span>}
                {email.importance === "important" && <span style={{ fontSize: 10, background: "#BA7517", color: "#fff", borderRadius: 10, padding: "1px 6px", marginTop: 4, display: "inline-block", fontWeight: 700, marginLeft: 4 }}>🟡 Important</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COLONNE DROITE : contenu email / composition ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {compose ? (
          /* Composition */
          <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{replyTo ? "↩ Répondre" : "✉️ Nouveau message"}</div>
            <Field label="À"><input style={inp} value={to} onChange={function(e) { setTo(e.target.value); }} placeholder="destinataire@email.com" /></Field>
            <Field label="Sujet"><input style={inp} value={subject} onChange={function(e) { setSubject(e.target.value); }} /></Field>
            <Field label="Message">
              <textarea style={Object.assign({}, inp, { minHeight: 200, resize: "vertical", fontFamily: "system-ui" })} value={body} onChange={function(e) { setBody(e.target.value); }} placeholder="Votre message..." />
            </Field>
            <div style={{ background: "#f4f4f4", padding: "8px 12px", borderRadius: 8, fontSize: 12, color: "#888" }}>
              {activeSig && activeSig.logo && <img src={activeSig.logo} alt="logo" style={{ height: 32, objectFit: "contain", display: "block", marginBottom: 6 }} />}
              <div style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{signature}</div>
              {sigs.length > 1 && (
                <select value={activeSigId} onChange={function(e) { saveActiveSig(parseInt(e.target.value)); }} style={{ marginTop: 8, fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                  {sigs.map(function(s) { return <option key={s.id} value={s.id}>{s.nom}</option>; })}
                </select>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function() { setCompose(false); setReplyTo(null); }} style={btnS}>Annuler</button>
              <button onClick={handleSend} disabled={sending} style={Object.assign({}, btnP, { opacity: sending ? 0.6 : 1 })}>{sending ? "Envoi..." : "📤 Envoyer"}</button>
            </div>
          </div>
        ) : selected ? (
          /* Lecture email */
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{selected.sujet || "(sans objet)"}</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#444" }}><strong>De :</strong> {selected.de}</div>
                  <div style={{ fontSize: 13, color: "#444" }}><strong>À :</strong> {selected.a}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{selected.date_reception ? new Date(selected.date_reception).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  {getPartenaire(selected.partenaire_id) && <div style={{ marginTop: 6 }}><span style={{ fontSize: 11, background: "#C8102E11", color: "#C8102E", borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>🏢 {getPartenaire(selected.partenaire_id).nom}</span></div>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {/* Tags importance */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { key: "urgent", label: "🔴 Urgent", color: "#C8102E" },
                      { key: "important", label: "🟡 Important", color: "#BA7517" },
                      { key: "normal", label: "⚪ Normal", color: "#888" },
                    ].map(function(tag) {
                      var active = (selected.importance || "normal") === tag.key;
                      return (
                        <button key={tag.key} onClick={function() {
                          sbUpdate("emails", selected.id, { importance: tag.key }).then(function() {
                            setEmails(emails.map(function(e) { return e.id === selected.id ? Object.assign({}, e, { importance: tag.key }) : e; }));
                            setSelected(Object.assign({}, selected, { importance: tag.key }));
                          });
                        }} style={{ padding: "4px 10px", borderRadius: 20, border: "2px solid " + (active ? tag.color : "#e0e0e0"), background: active ? tag.color + "18" : "#fff", color: active ? tag.color : "#888", cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 400 }}>{tag.label}</button>
                      );
                    })}
                  </div>
                  {selected.type === "recu" && <button onClick={function() { openReply(selected); }} style={Object.assign({}, btnA, { fontSize: 13 })}>↩ Répondre</button>}
                  <button onClick={function() {
                    var newLu = !selected.lu;
                    sbUpdate("emails", selected.id, { lu: newLu }).then(function() {
                      setEmails(emails.map(function(e) { return e.id === selected.id ? Object.assign({}, e, { lu: newLu }) : e; }));
                      setSelected(Object.assign({}, selected, { lu: newLu }));
                    });
                  }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#444" }}>
                    {selected.lu ? "🔵 Marquer non lu" : "✓ Marquer lu"}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 20 }}>
              <div style={{ fontSize: 14, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "system-ui" }}>{selected.corps || "(corps vide)"}</div>
            </div>
          </div>
        ) : (
          /* Placeholder */
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#ccc" }}>
            <span style={{ fontSize: 48 }}>📧</span>
            <span style={{ fontSize: 14 }}>Sélectionnez un email pour le lire</span>
            <button onClick={function() { setCompose(true); }} style={Object.assign({}, btnA, { fontSize: 13 })}>✉️ Nouveau message</button>
          </div>
        )}
      </div>
    </div>
  );
}

var TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "partenaires", label: "Partenaires" },
  { id: "evenements", label: "Événements" },
  { id: "coaches", label: "Coaches" },
  { id: "equipement", label: "Équipement" },
  { id: "emails", label: "Emails" },
];

export default function App() {
  var ts = useState("dashboard"); var tab = ts[0]; var setTab = ts[1];
  var otm = useState(false); var openTacheModal = otm[0]; var setOpenTacheModal = otm[1];
  var dvs = useState("general"); var dashView = dvs[0]; var setDashView = dvs[1];
  var notifState = useState([]); var notifications = notifState[0]; var setNotifications = notifState[1];

  // Auth
  var sessionKey = "rcn_user";
  var storedUser = (function() { try { var s = localStorage.getItem(sessionKey); return s ? JSON.parse(s) : null; } catch(e) { return null; } })();
  var userState = useState(storedUser); var currentUser = userState[0]; var setCurrentUser = userState[1];
  var adminState = useState(false); var adminOpen = adminState[0]; var setAdminOpen = adminState[1];
  var changePassState = useState(false); var changePassOpen = changePassState[0]; var setChangePassOpen = changePassState[1];

  function handleLogin(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
    setCurrentUser(user);
  }
  function handleLogout() {
    localStorage.removeItem(sessionKey);
    setCurrentUser(null);
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;


  useEffect(function() {
    var today = new Date().toISOString().split("T")[0];
    var tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    sbFetch("actions_partenaires", {
      select: "*",
      filter: "statut=eq.En+attente&date_prevue=lte." + tomorrow,
      order: "date_prevue.asc"
    }).then(function(rows) {
      setNotifications(rows);
    }).catch(function() {});
  }, []);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f4f4f4" }}>
      <div style={{ background: "#1a1a1a", borderBottom: "none", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="data:image/png;base64,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" alt="RCN Logo" style={{ height: 40, width: 40, objectFit: "contain", borderRadius: 6 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "#ffffff" }}>Cung Nhau CRM</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {notifications.length > 0 && (
            <div title={notifications.length + " action(s) à venir"} style={{ position: "relative", cursor: "pointer" }} onClick={function() { setTab("partenaires"); }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <span style={{ position: "absolute", top: -4, right: -4, background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{notifications.length}</span>
            </div>
          )}
          <nav style={{ display: "flex", gap: 2 }}>
            {TABS.map(function(t) {
              return <button key={t.id} onClick={function() { setTab(t.id); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: tab === t.id ? "#C8102E" : "transparent", color: tab === t.id ? "#fff" : "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 14, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>;
            })}
          </nav>
          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8, paddingLeft: 8, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C8102E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{currentUser.nom[0]}</div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{currentUser.nom}</span>
            {currentUser.role === "admin" && (
              <button onClick={function() { setAdminOpen(true); }} title="Administration" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12 }}>⚙️</button>
            )}
            <button onClick={function() { setChangePassOpen(true); }} title="Changer mon mot de passe" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12 }}>🔑</button>
            <button onClick={handleLogout} title="Se déconnecter" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12 }}>⏏</button>
          </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "dashboard" && <Dashboard setTab={setTab} setOpenTacheModal={setOpenTacheModal} dashView={dashView} setDashView={setDashView} />}
        {tab === "partenaires" && <Partenaires />}
        {tab === "evenements" && <Evenements />}
        {tab === "coaches" && <Coaches />}
        {tab === "equipement" && <Equipement />}
        {tab === "emails" && <EmailsApp />}
      </div>
      {adminOpen && <AdminPanel currentUser={currentUser} onClose={function() { setAdminOpen(false); }} />}
      {changePassOpen && <ChangerMotDePasse currentUser={currentUser} onClose={function() { setChangePassOpen(false); }} />}
    </div>
  );
}
