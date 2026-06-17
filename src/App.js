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

const TYPE_COLOR = { ONG: "#1D9E75", Shelter: "#185FA5", Ecole: "#BA7517", Sponsor: "#534AB7" };
const TYPE_ICON = { ONG: "🤝", Shelter: "🏠", Ecole: "🏫", Sponsor: "💼" };
const STATUT_COLOR = {
  Actif: "#1D9E75", "A relancer": "#BA7517", Inactif: "#888780", Prospect: "#378ADD",
  Planifie: "#534AB7", "En cours": "#185FA5", Termine: "#1D9E75", Annule: "#A32D2D",
  "A faire": "#888780", Urgente: "#A32D2D", Haute: "#BA7517", Moyenne: "#534AB7",
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
    <div style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{props.label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color: props.color || "#534AB7", lineHeight: 1.2 }}>{props.value}</span>
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
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e8e6de", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f7f5f0" }}>
          {props.headers.map(function(h) { return <th key={h} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 500, color: "#888", textAlign: "left", borderBottom: "1px solid #e8e6de" }}>{h}</th>; })}
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
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
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
      <label style={{ fontSize: 12, fontWeight: 500, color: "#666" }}>{props.label}</label>
      {props.children}
    </div>
  );
}

var inp = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
var sel = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, background: "#fff", width: "100%", boxSizing: "border-box" };
var btnP = { padding: "8px 20px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 };
var btnS = { padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 14 };
var btnA = { padding: "7px 16px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 };

// ── MULTI-SELECT PARTENAIRES ───────────────────────────────────
function PartenaireMultiSelect(props) {
  var partenaires = props.partenaires;
  var selected = props.selected;
  var onChange = props.onChange;
  var type = props.type;
  var filtered = partenaires.filter(function(p) { return p.type === type; });
  if (!filtered.length) return (
    <div style={{ fontSize: 12, color: "#aaa", padding: "8px 0" }}>Aucun {type} actif — ajoutez-en dans l'onglet Partenaires</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {filtered.map(function(p) {
        var isSelected = selected.indexOf(p.id) !== -1;
        return (
          <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid " + (isSelected ? TYPE_COLOR[type] : "#e8e6de"), background: isSelected ? TYPE_COLOR[type] + "11" : "#fff", cursor: "pointer" }}>
            <input type="checkbox" checked={isSelected} onChange={function() {
              if (isSelected) { onChange(selected.filter(function(id) { return id !== p.id; })); }
              else { onChange(selected.concat(p.id)); }
            }} style={{ accentColor: TYPE_COLOR[type] }} />
            <span style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400 }}>{p.nom}</span>
            {p.contact_nom && <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>{p.contact_nom}</span>}
          </label>
        );
      })}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard() {
  var s = useState(null); var data = s[0]; var setData = s[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];

  useEffect(function() {
    Promise.all([
      sbFetch("evenements", { select: "*" }),
      sbFetch("depenses", { select: "*" }),
      sbFetch("revenus", { select: "*" }),
      sbFetch("coaches", { select: "*", filter: "statut=eq.Actif" }),
      sbFetch("partenaires", { select: "*" }),
      sbFetch("taches", { select: "*" }),
    ]).then(function(r) {
      setData({ evenements: r[0], depenses: r[1], revenus: r[2], coaches: r[3], partenaires: r[4], taches: r[5] });
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);

  if (loading || !data) return <Spinner />;

  var now = new Date();
  var moisDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  var anneeDebut = new Date(now.getFullYear(), 0, 1).toISOString();
  var revMois = data.revenus.filter(function(r) { return r.date_reception >= moisDebut; }).reduce(function(s, r) { return s + Number(r.montant); }, 0);
  var depMois = data.depenses.filter(function(d) { return d.date_depense >= moisDebut; }).reduce(function(s, d) { return s + Number(d.montant); }, 0);
  var evtMois = data.evenements.filter(function(e) { return e.date_debut >= moisDebut; }).length;
  var evtAnnee = data.evenements.filter(function(e) { return e.date_debut >= anneeDebut; }).length;
  var enfants = data.evenements.reduce(function(s, e) { return s + (Number(e.nombre_enfants_presents) || 0); }, 0);
  var tachesRetard = data.taches.filter(function(t) { return t.statut !== "Termine" && t.date_echeance && t.date_echeance < now.toISOString().split("T")[0]; }).length;
  var byType = function(t) { return data.partenaires.filter(function(p) { return p.type === t && p.statut === "Actif"; }).length; };
  var sponsors = data.partenaires.filter(function(p) { return p.type === "Sponsor"; });
  var valeur = sponsors.filter(function(s) { return s.statut === "Actif"; }).reduce(function(sum, s) { return sum + Number(s.montant_annuel || 0); }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle>Activités</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Événements ce mois" value={evtMois} color="#534AB7" />
        <KpiCard label="Cette année" value={evtAnnee} color="#534AB7" />
        <KpiCard label="Enfants touchés" value={enfants.toLocaleString()} color="#1D9E75" />
      </div>
      <SectionTitle>Partenaires actifs</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="🤝 ONG" value={byType("ONG")} color={TYPE_COLOR.ONG} />
        <KpiCard label="🏠 Shelters" value={byType("Shelter")} color={TYPE_COLOR.Shelter} />
        <KpiCard label="🏫 Écoles" value={byType("Ecole")} color={TYPE_COLOR.Ecole} />
        <KpiCard label="💼 Sponsors" value={byType("Sponsor")} color={TYPE_COLOR.Sponsor} />
      </div>
      <SectionTitle>Finances</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Revenus du mois" value={vnd(revMois)} color="#1D9E75" />
        <KpiCard label="Dépenses du mois" value={vnd(depMois)} color="#993C1D" />
        <KpiCard label="Solde" value={vnd(revMois - depMois)} color={revMois - depMois >= 0 ? "#1D9E75" : "#A32D2D"} />
        <KpiCard label="Valeur sponsors" value={vnd(valeur)} color="#534AB7" />
      </div>
      <SectionTitle>Opérations</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Coaches actifs" value={data.coaches.length} color="#1D9E75" />
        <KpiCard label="Tâches en retard" value={tachesRetard} color={tachesRetard > 0 ? "#A32D2D" : "#1D9E75"} />
        <KpiCard label="⏳ Actions en attente" value={notifications.length} color={notifications.length > 0 ? "#BA7517" : "#888"} sub="à relancer" />
      </div>
    </div>
  );
}

// ── FICHE PARTENAIRE ─────────────────────────────────────────
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

  useEffect(function() {
    sbFetch("actions_partenaires", {
      select: "*",
      filter: "partenaire_id=eq." + p.id,
      order: "date_prevue.asc"
    }).then(function(rows) { setActions(rows); setLoading(false); });
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
      <div style={{ background: "#fff", border: "1px solid " + (isLate ? "#E24B4A44" : "#e8e6de"), borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flexShrink: 0, marginTop: 2, fontSize: 20 }}>{cfg.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: a.statut === "Confirme" ? "#aaa" : "#2c2c2a", textDecoration: a.statut === "Confirme" ? "line-through" : "none" }}>{TYPE_ACTION_ICON[a.type]} {a.titre}</span>
              <span style={{ fontSize: 11, background: "#f0ede6", color: "#888", borderRadius: 12, padding: "2px 8px" }}>{a.type}</span>
              {isLate && <span style={{ fontSize: 11, background: "#E24B4A22", color: "#E24B4A", borderRadius: 12, padding: "2px 8px", fontWeight: 600 }}>⚠️ En retard</span>}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>📅 {a.date_prevue}{a.heure ? " à " + a.heure : ""}</div>
            {/* Boutons statut */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={function() { changeStatut(a, "Confirme"); }} style={{ padding: "4px 12px", borderRadius: 20, border: "2px solid " + (a.statut === "Confirme" ? "#1D9E75" : "#ddd"), background: a.statut === "Confirme" ? "#1D9E7522" : "#fff", color: a.statut === "Confirme" ? "#1D9E75" : "#888", cursor: "pointer", fontSize: 12, fontWeight: a.statut === "Confirme" ? 600 : 400 }}>✅ Confirmé</button>
              <button onClick={function() { changeStatut(a, "En attente"); }} style={{ padding: "4px 12px", borderRadius: 20, border: "2px solid " + (a.statut === "En attente" ? "#BA7517" : "#ddd"), background: a.statut === "En attente" ? "#BA751722" : "#fff", color: a.statut === "En attente" ? "#BA7517" : "#888", cursor: "pointer", fontSize: 12, fontWeight: a.statut === "En attente" ? 600 : 400 }}>⏳ En attente</button>
              <button onClick={function() { deleteAction(a); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #E24B4A44", background: "#fff", color: "#E24B4A", cursor: "pointer", fontSize: 12, marginLeft: "auto" }}>🗑️ Supprimer</button>
            </div>
            {/* Commentaire */}
            <div style={{ marginTop: 8 }}>
              {isEditing ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <textarea value={comments[a.id] !== undefined ? comments[a.id] : (a.commentaire || "")} onChange={function(e) { setComments(Object.assign({}, comments, { [a.id]: e.target.value })); }} style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, resize: "vertical", minHeight: 60 }} placeholder="Ajouter un commentaire..." />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={function() { saveComment(a); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 12 }}>Sauver</button>
                    <button onClick={function() { setEditingComment(null); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12 }}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div onClick={function() { setEditingComment(a.id); setComments(Object.assign({}, comments, { [a.id]: a.commentaire || "" })); }} style={{ fontSize: 13, color: a.commentaire ? "#555" : "#bbb", fontStyle: a.commentaire ? "normal" : "italic", cursor: "pointer", padding: "4px 6px", borderRadius: 6, background: "#f7f5f0" }}>
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
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0ede6", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TypeBadge t={p.type} />
              <Badge s={p.statut} />
            </div>
            <h2 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 700, color: "#2c2c2a" }}>{p.nom}</h2>
            {p.contact_nom && <div style={{ fontSize: 14, color: "#666" }}>👤 {p.contact_nom}</div>}
            {p.contact_email && <div style={{ fontSize: 13, color: "#534AB7" }}>✉️ {p.contact_email}</div>}
            {p.contact_tel && <div style={{ fontSize: 13, color: "#666" }}>📞 {p.contact_tel}</div>}
            {p.ville && <div style={{ fontSize: 13, color: "#666" }}>📍 {p.ville}{p.district ? " — " + p.district : ""}</div>}
            {p.notes && <div style={{ fontSize: 13, color: "#888", marginTop: 6, fontStyle: "italic" }}>{p.notes}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>×</button>
        </div>

        {/* Actions */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>Actions & Historique</h3>
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
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#534AB7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>À venir ({aVenir.length})</div>
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
function Partenaires() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var fs2 = useState("Tous"); var filtre = fs2[0]; var setFiltre = fs2[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var ems = useState(false); var editModal = ems[0]; var setEditModal = ems[1];
  var efs = useState(null); var editForm = efs[0]; var setEditForm = efs[1];
  var ficheState = useState(null); var ficheId = ficheState[0]; var setFicheId = ficheState[1];
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
      setData(data.concat(rows[0]));
      setModal(false);
      setForm(EMPTY_FORM);
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  function handleUpdate() {
    var payload = Object.assign({}, editForm);
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    if (payload.nombre_enfants === "") delete payload.nombre_enfants;
    if (payload.montant_annuel === "") payload.montant_annuel = 0;
    sbUpdate("partenaires", editForm.id, payload).then(function() {
      setData(data.map(function(p) { return p.id === editForm.id ? Object.assign({}, p, payload) : p; }));
      setEditModal(false);
      setEditForm(null);
    }).catch(function(e) { alert("Erreur: " + e.message); });
  }

  function setEdit(k, v) { setEditForm(Object.assign({}, editForm, { [k]: v })); }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {types.map(function(t) {
            var active = filtre === t;
            var color = TYPE_COLOR[t] || "#534AB7";
            return (
              <button key={t} onClick={function() { setFiltre(t); }} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid " + (active ? color : "#ddd"), background: active ? color : "#fff", color: active ? "#fff" : "#555", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400 }}>
                {TYPE_ICON[t] ? TYPE_ICON[t] + " " : ""}{t}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#888" }}>{filtered.length} partenaire{filtered.length > 1 ? "s" : ""}</span>
          <button onClick={function() { setModal(true); }} style={btnA}>+ Ajouter</button>
        </div>
      </div>

      {filtered.length === 0 ? <Empty msg={"Aucun " + (filtre === "Tous" ? "partenaire" : filtre) + " — cliquez + Ajouter"} /> : (
        <TableUI headers={["ORGANISATION", "TYPE", "LOCATION", "STATUS", "RESPONSIBLE", "EMAIL", "PHONE", ""]}>
          {filtered.map(function(p) {
            return (
              <tr key={p.id} onClick={function() { setFicheId(p.id); }} style={{ borderBottom: "1px solid #f0ede6", cursor: "pointer" }}
                onMouseEnter={function(e) { e.currentTarget.style.background = "#f7f5f0"; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500, color: "#2c2c2a" }}>{p.nom}</td>
                <td style={{ padding: "10px 12px" }}><TypeBadge t={p.type} /></td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{p.ville || p.district || "—"}</td>
                <td style={{ padding: "10px 12px" }}><Badge s={p.statut} /></td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{p.contact_nom || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{p.contact_email || "—"}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{p.contact_tel || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={function(e) { e.stopPropagation(); setEditForm(p); setEditModal(true); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#534AB7" }}>✏️ Modifier</button>
                </td>
              </tr>
            );
          })}
        </TableUI>
      )}


      {editForm && <Modal open={editModal} onClose={function() { setEditModal(false); }} title={"Modifier — " + (editForm.nom || "")}>
        <Field label="Type *">
          <div style={{ display: "flex", gap: 8 }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) {
              var active = editForm.type === t;
              return <button key={t} onClick={function() { setEdit("type", t); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid " + (active ? TYPE_COLOR[t] : "#e8e6de"), background: active ? TYPE_COLOR[t] + "11" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? TYPE_COLOR[t] : "#666" }}>{TYPE_ICON[t]}<br />{t}</button>;
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
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleUpdate} style={btnP}>Enregistrer</button>
        </div>
      </Modal>}

      {ficheId && <FichePartenaire partenaire={data.find(function(p) { return p.id === ficheId; }) || {}} onClose={function() { setFicheId(null); }} />}

      <Modal open={modal} onClose={function() { setModal(false); }} title="Nouveau partenaire">
        <Field label="Type *">
          <div style={{ display: "flex", gap: 8 }}>
            {["ONG","Shelter","Ecole","Sponsor"].map(function(t) {
              var active = form.type === t;
              return (
                <button key={t} onClick={function() { set("type", t); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "2px solid " + (active ? TYPE_COLOR[t] : "#e8e6de"), background: active ? TYPE_COLOR[t] + "11" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? TYPE_COLOR[t] : "#666" }}>
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
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.nom} style={Object.assign({}, btnP, { opacity: form.nom ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}


// ── COACH MULTI-SELECT ────────────────────────────────────────
function CoachMultiSelect(props) {
  var coaches = props.coaches;
  var selected = props.selected;
  var onChange = props.onChange;
  if (!coaches.length) return <div style={{ fontSize: 12, color: "#aaa", padding: "8px 0" }}>Aucun coach actif</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {coaches.map(function(c) {
        var isSelected = selected.indexOf(c.id) !== -1;
        return (
          <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid " + (isSelected ? "#534AB7" : "#e8e6de"), background: isSelected ? "#534AB711" : "#fff", cursor: "pointer" }}>
            <input type="checkbox" checked={isSelected} onChange={function() {
              if (isSelected) onChange(selected.filter(function(id) { return id !== c.id; }));
              else onChange(selected.concat(c.id));
            }} style={{ accentColor: "#534AB7" }} />
            <span style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400, flex: 1 }}>{c.prenom} {c.nom}</span>
            <span style={{ fontSize: 12, color: "#aaa" }}>{c.pays || ""} · {c.langues || ""}</span>
          </label>
        );
      })}
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
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var viewState = useState("liste"); var view = viewState[0]; var setView = viewState[1];
  var monthState = useState(new Date()); var currentMonth = monthState[0]; var setCurrentMonth = monthState[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var detailState = useState(null); var detailEvt = detailState[0]; var setDetailEvt = detailState[1];

  var EMPTY_FORM = { titre: "", type: "Entrainement", date_debut: "", lieu: "", nombre_enfants_presents: "", statut: "Planifie", notes: "" };
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
      setLoading(false);
    });
  }, []);

  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  function resetForm(dateStr) {
    setForm(Object.assign({}, EMPTY_FORM, { date_debut: dateStr || "" }));
    setSelectedONG([]); setSelectedShelter([]); setSelectedEcole([]); setSelectedSponsor([]);
    setSelectedCoaches([]);
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
  var STATUT_EVT_COLOR = { Planifie: "#534AB7", "En cours": "#185FA5", Termine: "#1D9E75", Annule: "#A32D2D" };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "#f0ede6", borderRadius: 8, padding: 3 }}>
          <button onClick={function() { setView("liste"); }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: view === "liste" ? "#fff" : "transparent", color: view === "liste" ? "#534AB7" : "#888", cursor: "pointer", fontSize: 13, fontWeight: view === "liste" ? 600 : 400, boxShadow: view === "liste" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>☰ Liste</button>
          <button onClick={function() { setView("calendrier"); }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: view === "calendrier" ? "#fff" : "transparent", color: view === "calendrier" ? "#534AB7" : "#888", cursor: "pointer", fontSize: 13, fontWeight: view === "calendrier" ? 600 : 400, boxShadow: view === "calendrier" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>📅 Calendrier</button>
        </div>
        <button onClick={function() { openModalForDate(""); }} style={btnA}>+ Ajouter</button>
      </div>

      {/* LISTE VIEW */}
      {view === "liste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.length === 0 ? <Empty msg="Aucun événement — cliquez + Ajouter" /> : data.map(function(e) {
            var parts = getPartenairesForEvt(e.id);
            var evtCoachIds = (evtPartenaires[e.id] || []);
            var evtCoaches = coaches.filter(function(c) {
              // use evenement_coaches relationship - simplified: coaches assigned
              return false; // placeholder - will be loaded via separate fetch
            });
            var isOpen = detailEvt === e.id;
            var color = STATUT_EVT_COLOR[e.statut] || "#888";
            return (
              <div key={e.id} style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 12, overflow: "hidden" }}>
                <div onClick={function() { setDetailEvt(isOpen ? null : e.id); }} style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer", gap: 12 }}>
                  <div style={{ width: 4, height: 40, borderRadius: 4, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>{e.titre}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{e.type} · {e.date_debut ? e.date_debut.split("T")[0] : "—"}{e.lieu ? " · " + e.lieu : ""}</div>
                  </div>
                  {e.nombre_enfants_presents > 0 && <span style={{ fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>{e.nombre_enfants_presents} enfants</span>}
                  <Badge s={e.statut} />
                  <span style={{ color: "#ccc" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f0ede6", padding: "12px 16px", background: "#fafaf8" }}>
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
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#534AB7", marginBottom: 6 }}>🏉 Coaches assignés</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {evtCoaches.map(function(c) {
                              return <div key={c.id} style={{ background: "#534AB711", border: "1px solid #534AB744", borderRadius: 8, padding: "6px 12px" }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.prenom} {c.nom}</div>
                                <div style={{ fontSize: 11, color: "#888" }}>{c.pays || ""}</div>
                              </div>;
                            })}
                          </div>
                        </div>}
                      </div>
                    )}
                    {e.notes && <div style={{ fontSize: 13, color: "#666", marginTop: 10 }}>{e.notes}</div>}
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
          <div style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 12, overflow: "hidden" }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0ede6" }}>
              <button onClick={function() { setCurrentMonth(new Date(cal.year, cal.month - 1, 1)); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#2c2c2a" }}>{MONTHS_FR[cal.month]} {cal.year}</span>
              <button onClick={function() { setCurrentMonth(new Date(cal.year, cal.month + 1, 1)); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f0ede6" }}>
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
                  <div key={day} onClick={function() { openModalForDate(dateStr); }} style={{ minHeight: 80, borderRight: "1px solid #f5f3ee", borderBottom: "1px solid #f5f3ee", padding: "6px 4px", cursor: "pointer", background: isToday ? "#534AB711" : "#fff", transition: "background .15s" }}
                    onMouseEnter={function(e) { if (!isToday) e.currentTarget.style.background = "#f7f5f0"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = isToday ? "#534AB711" : "#fff"; }}>
                    <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? "#534AB7" : "#555", textAlign: "right", marginBottom: 4 }}>{isToday ? <span style={{ background: "#534AB7", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{day}</span> : day}</div>
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
        <div style={{ borderTop: "1px solid #f0ede6", margin: "8px 0 14px" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 12 }}>Partenaires liés</div>
        {[{type:"ONG",sel:selectedONG,setSel:setSelectedONG},{type:"Shelter",sel:selectedShelter,setSel:setSelectedShelter},{type:"Ecole",sel:selectedEcole,setSel:setSelectedEcole},{type:"Sponsor",sel:selectedSponsor,setSel:setSelectedSponsor}].map(function(item) {
          return (
            <div key={item.type} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: TYPE_COLOR[item.type], marginBottom: 6 }}>{TYPE_ICON[item.type]} {item.type}{item.sel.length > 0 ? " (" + item.sel.length + " sélectionné" + (item.sel.length > 1 ? "s" : "") + ")" : ""}</div>
              <PartenaireMultiSelect partenaires={partenaires} selected={item.sel} onChange={item.setSel} type={item.type} />
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid #f0ede6", margin: "8px 0 14px" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#534AB7", marginBottom: 8 }}>🏉 Coaches & bénévoles assignés{selectedCoaches.length > 0 ? " (" + selectedCoaches.length + " sélectionné" + (selectedCoaches.length > 1 ? "s" : "") + ")" : ""}</div>
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
  var ces = useState(false); var coachEditModal = ces[0]; var setCoachEditModal = ces[1];
  var cef = useState(null); var coachEdit = cef[0]; var setCoachEdit = cef[1];
  var EMPTY = { prenom: "", nom: "", email: "", telephone: "", sport_principal: "Rugby", role: "Benevole", statut: "Actif" };
  var fs = useState(EMPTY); var form = fs[0]; var setForm = fs[1];
  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }
  useEffect(function() { sbFetch("coaches", { select: "*", order: "nom.asc" }).then(function(r) { setData(r); setLoading(false); }); }, []);
  function handleAdd() {
    sbInsert("coaches", form).then(function(rows) { setData(data.concat(rows[0])); setModal(false); setForm(EMPTY); }).catch(function(e) { alert(e.message); });
  }

  function handleCoachUpdate() {
    var payload = Object.assign({}, coachEdit);
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    sbUpdate("coaches", coachEdit.id, payload).then(function() {
      setData(data.map(function(c) { return c.id === coachEdit.id ? Object.assign({}, c, payload) : c; }));
      setCoachEditModal(false); setCoachEdit(null);
    }).catch(function(e) { alert(e.message); });
  }
  function setCE(k, v) { setCoachEdit(Object.assign({}, coachEdit, { [k]: v })); }
  if (loading) return <Spinner />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={function() { setModal(true); }} style={btnA}>+ Ajouter</button></div>
      {data.length === 0 ? <Empty msg="Aucun coach" /> : (
        <TableUI headers={["Nom", "Pays", "Langues", "Rôle", "Background", "Sessions", "Statut", ""]}>
          {data.map(function(c) { return (
            <tr key={c.id} style={{ borderBottom: "1px solid #f0ede6" }}>
              <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 500 }}>{c.prenom} {c.nom}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.pays || "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.langues || "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.role}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.background_check || "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#666", textAlign: "center" }}>{(c.sessions_completees || 0) + "/" + (c.sessions_programmees || 0)}</td>
              <td style={{ padding: "10px 12px" }}><Badge s={c.statut} /></td>
              <td style={{ padding: "10px 12px" }}><button onClick={function() { setCoachEdit(c); setCoachEditModal(true); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#534AB7" }}>✏️ Modifier</button></td>
            </tr>
          ); })}
        </TableUI>
      )}

      {coachEdit && <Modal open={coachEditModal} onClose={function() { setCoachEditModal(false); }} title={"Modifier — " + (coachEdit.prenom || "") + " " + (coachEdit.nom || "")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prénom"><input style={inp} value={coachEdit.prenom || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {prenom: e.target.value})); }} /></Field>
          <Field label="Nom"><input style={inp} value={coachEdit.nom || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {nom: e.target.value})); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Email"><input style={inp} type="email" value={coachEdit.email || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {email: e.target.value})); }} /></Field>
          <Field label="Téléphone"><input style={inp} value={coachEdit.telephone || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {telephone: e.target.value})); }} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Pays"><input style={inp} value={coachEdit.pays || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {pays: e.target.value})); }} /></Field>
          <Field label="Age"><input type="number" style={inp} value={coachEdit.age || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {age: e.target.value})); }} /></Field>
        </div>
        <Field label="Langues"><input style={inp} value={coachEdit.langues || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {langues: e.target.value})); }} placeholder="Ex: FRA, ENG, VN" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sport">
            <select style={sel} value={coachEdit.sport_principal || "Rugby"} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {sport_principal: e.target.value})); }}>
              {["Rugby","Football","Atletisme","Basketball","Natation","Autre"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Rôle">
            <select style={sel} value={coachEdit.role || "Benevole"} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {role: e.target.value})); }}>
              {["Coach principal","Benevole","Staff","Coordinateur"].map(function(r) { return <option key={r}>{r}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Background check"><input style={inp} value={coachEdit.background_check || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {background_check: e.target.value})); }} /></Field>
          <Field label="Sessions programmées"><input type="number" style={inp} value={coachEdit.sessions_programmees || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {sessions_programmees: e.target.value})); }} /></Field>
          <Field label="Sessions complétées"><input type="number" style={inp} value={coachEdit.sessions_completees || ""} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {sessions_completees: e.target.value})); }} /></Field>
        </div>
        <Field label="Statut">
          <select style={sel} value={coachEdit.statut || "Actif"} onChange={function(e) { setCoachEdit(Object.assign({}, coachEdit, {statut: e.target.value})); }}>
            {["Actif","Occasionnel","Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
          </select>
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setCoachEditModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleCoachUpdate} style={btnP}>Enregistrer</button>
        </div>
      </Modal>}

      <Modal open={modal} onClose={function() { set<Modal(false); }} title="Nouveau coach">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prénom *"><input style={inp} value={form.prenom} onChange={function(e) { set("prenom", e.target.value); }} /></Field>
          <Field label="Nom *"><input style={inp} value={form.nom} onChange={function(e) { set("nom", e.target.value); }} /></Field>
        </div>
        <Field label="Email"><input style={inp} type="email" value={form.email} onChange={function(e) { set("email", e.target.value); }} /></Field>
        <Field label="Téléphone"><input style={inp} value={form.telephone} onChange={function(e) { set("telephone", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Sport">
            <select style={sel} value={form.sport_principal} onChange={function(e) { set("sport_principal", e.target.value); }}>
              {["Rugby","Football","Atletisme","Basketball","Natation","Autre"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Rôle">
            <select style={sel} value={form.role} onChange={function(e) { set("role", e.target.value); }}>
              {["Coach principal","Benevole","Staff","Coordinateur"].map(function(r) { return <option key={r}>{r}</option>; })}
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
function Taches() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];
  var EMPTY = { titre: "", priorite: "Moyenne", statut: "A faire", date_echeance: "", description: "" };
  var fs = useState(EMPTY); var form = fs[0]; var setForm = fs[1];
  var cycler = { "A faire": "En cours", "En cours": "Termine", "Termine": "A faire" };
  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }
  useEffect(function() { sbFetch("taches", { select: "*", order: "date_echeance.asc" }).then(function(r) { setData(r); setLoading(false); }); }, []);
  function toggle(t) { var n = cycler[t.statut]; sbUpdate("taches", t.id, { statut: n }).then(function() { setData(data.map(function(x) { return x.id === t.id ? Object.assign({}, x, { statut: n }) : x; })); }); }
  function handleAdd() {
    var p = Object.assign({}, form); if (!p.date_echeance) delete p.date_echeance;
    sbInsert("taches", p).then(function(rows) { setData(data.concat(rows[0])); setModal(false); setForm(EMPTY); }).catch(function(e) { alert(e.message); });
  }
  if (loading) return <Spinner />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}><button onClick={function() { setModal(true); }} style={btnA}>+ Ajouter</button></div>
      {data.length === 0 ? <Empty msg="Aucune tâche" /> : data.map(function(t) {
        var color = STATUT_COLOR[t.priorite] || "#ddd"; var done = t.statut === "Termine";
        return (
          <div key={t.id} onClick={function() { toggle(t); }} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e8e6de", borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + color, background: done ? color : "transparent", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: done ? "#aaa" : "#2c2c2a", textDecoration: done ? "line-through" : "none" }}>{t.titre}</div>
              {t.description && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{t.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge s={t.priorite} />
              {t.date_echeance && <span style={{ fontSize: 12, color: "#bbb" }}>{t.date_echeance}</span>}
            </div>
          </div>
        );
      })}
      {data.length > 0 && <div style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 4 }}>Cliquez pour changer le statut</div>}
      <Modal open={modal} onClose={function() { setModal(false); }} title="Nouvelle tâche">
        <Field label="Titre *"><input style={inp} value={form.titre} onChange={function(e) { set("titre", e.target.value); }} /></Field>
        <Field label="Description"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 60 })} value={form.description} onChange={function(e) { set("description", e.target.value); }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Priorité">
            <select style={sel} value={form.priorite} onChange={function(e) { set("priorite", e.target.value); }}>
              {["Basse","Moyenne","Haute","Urgente"].map(function(p) { return <option key={p}>{p}</option>; })}
            </select>
          </Field>
          <Field label="Échéance"><input type="date" style={inp} value={form.date_echeance} onChange={function(e) { set("date_echeance", e.target.value); }} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleAdd} disabled={!form.titre} style={Object.assign({}, btnP, { opacity: form.titre ? 1 : 0.5 })}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
var TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "partenaires", label: "Partenaires" },
  { id: "evenements", label: "Événements" },
  { id: "coaches", label: "Coaches" },
  { id: "taches", label: "Tâches" },
];

export default function App() {
  var ts = useState("dashboard"); var tab = ts[0]; var setTab = ts[1];
  var notifState = useState([]); var notifications = notifState[0]; var setNotifications = notifState[1];

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
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f7f5f0" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e6de", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#534AB7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 16 }}>🏉</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#2c2c2a" }}>Cung Nhau CRM</span>
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
              return <button key={t.id} onClick={function() { setTab(t.id); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: tab === t.id ? "#534AB722" : "transparent", color: tab === t.id ? "#534AB7" : "#666", cursor: "pointer", fontSize: 14, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>;
            })}
          </nav>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "partenaires" && <Partenaires />}
        {tab === "evenements" && <Evenements />}
        {tab === "coaches" && <Coaches />}
        {tab === "taches" && <Taches />}
      </div>
    </div>
  );
}
