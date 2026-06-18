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
      sbFetch("taches", { select: "*", filter: "statut=neq.Termine", order: "date_echeance.asc" }),
    ]).then(function(r) {
      setData({ evenements: r[0], depenses: r[1], revenus: r[2], coaches: r[3], partenaires: r[4], taches: r[5] });
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);

  var dashToggleTache = useState([]); var toggledTaches = dashToggleTache[0]; var setToggledTaches = dashToggleTache[1];

  function handleDashToggle(t) {
    sbUpdate("taches", t.id, { statut: "Termine" }).then(function() {
      setData(Object.assign({}, data, { taches: data.taches.filter(function(x) { return x.id !== t.id; }) }));
    });
  }

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
        <KpiCard label="⏳ Actions en attente" value={actionsEnAttente} color={actionsEnAttente > 0 ? "#BA7517" : "#888"} sub="à relancer" />
      </div>

      <div style={{ borderTop: "2px solid #e8e6de", paddingTop: 20, marginTop: 8 }}>
        <TachesWidget taches={data.taches || []} partenaires={data.partenaires || []} onAdd={function() {}} onToggle={handleDashToggle} />
      </div>
    </div>
  );
}

// ── DOCUMENTS (shared component) ─────────────────────────────
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
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>📁 Documents</h3>
        <label style={Object.assign({}, btnA, { display: "inline-block", cursor: "pointer" })}>
          {uploading ? "Upload..." : "+ Ajouter"}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleUpload(e.target.files); }} />
        </label>
      </div>

      {/* Dossiers */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {dossiers.map(function(d) {
          return (
            <button key={d} onClick={function() { setDossier(d); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid " + (dossier === d ? "#534AB7" : "#ddd"), background: dossier === d ? "#534AB7" : "#fff", color: dossier === d ? "#fff" : "#555", cursor: "pointer", fontSize: 12, fontWeight: dossier === d ? 600 : 400 }}>
              📁 {d}
            </button>
          );
        })}
        {newDossier ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input autoFocus value={newDossierName} onChange={function(e) { setNewDossierName(e.target.value); }} placeholder="Nom du dossier" style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, width: 120 }} onKeyDown={function(e) { if (e.key === "Enter" && newDossierName.trim()) { setDossier(newDossierName.trim()); setNewDossier(false); setNewDossierName(""); } }} />
            <button onClick={function() { if (newDossierName.trim()) { setDossier(newDossierName.trim()); } setNewDossier(false); setNewDossierName(""); }} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 12 }}>OK</button>
          </div>
        ) : (
          <button onClick={function() { setNewDossier(true); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px dashed #ddd", background: "#fff", color: "#aaa", cursor: "pointer", fontSize: 12 }}>+ Nouveau dossier</button>
        )}
      </div>

      {/* Files list */}
      {loading ? <Spinner /> : filteredDocs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px", color: "#bbb", fontSize: 13, border: "2px dashed #e8e6de", borderRadius: 10 }}>
          Aucun document dans ce dossier<br />
          <label style={{ color: "#534AB7", cursor: "pointer", fontWeight: 500 }}>
            Cliquez pour uploader
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.doc,.docx" style={{ display: "none" }} onChange={function(e) { handleUpload(e.target.files); }} />
          </label>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredDocs.map(function(doc) {
            return (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f7f5f0", borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(doc.nom)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nom}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{formatSize(doc.taille)} · {doc.created_at ? doc.created_at.split("T")[0] : ""}</div>
                </div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#534AB7", fontSize: 12, textDecoration: "none", flexShrink: 0 }}>⬇️</a>
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
              <button onClick={function() { setEditingAction(Object.assign({}, a)); setEditModal(true); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #ddd", background: "#fff", color: "#534AB7", cursor: "pointer", fontSize: 12 }}>✏️ Modifier</button>
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

        {/* Événements associés */}
        {evts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>📅 Événements associés ({evts.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {evts.map(function(e) {
                var STATUT_EVT_COLOR = { Planifie: "#534AB7", "En cours": "#185FA5", Termine: "#1D9E75", Annule: "#A32D2D" };
                var color = STATUT_EVT_COLOR[e.statut] || "#888";
                return (
                  <div key={e.id} style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a" }}>{e.titre}</div>
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

        {/* Événements associés */}
        {evts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>📅 Événements associés ({evts.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {evts.map(function(e) {
                var EVT_COLOR = { Planifie: "#534AB7", "En cours": "#185FA5", Termine: "#1D9E75", Annule: "#A32D2D" };
                var color = EVT_COLOR[e.statut] || "#888";
                return (
                  <div key={e.id} style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a" }}>{e.titre}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        {e.type} · {e.date_debut ? e.date_debut.split("T")[0] : "—"}
                        {e.lieu ? " · " + e.lieu : ""}
                        {e.nombre_enfants_presents > 0 ? " · " + e.nombre_enfants_presents + " enfants" : ""}
                      </div>
                    </div>
                    <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{e.statut}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
    <div style={{ border: "1px solid #e8e6de", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f7f5f0", borderBottom: "1px solid #e8e6de" }}>
        <button onClick={prevMonth} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>›</button>
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
                  color: isPast ? "#ddd" : isSelected ? "#fff" : "#2c2c2a",
                  background: isSelected ? "#534AB7" : "transparent",
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

  var EMPTY_FORM = { titre: "", type: "Entrainement", date_debut: "", lieu: "", nombre_enfants_presents: "", statut: "Planifie", notes: "", confirmation_statut: "En attente", responsable_coach_id: "" };
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
    var payload = {
      titre: editingEvt.titre,
      type: editingEvt.type,
      date_debut: editingEvt.date_debut,
      lieu: editingEvt.lieu,
      nombre_enfants_presents: editingEvt.nombre_enfants_presents || null,
      statut: editingEvt.statut,
      notes: editingEvt.notes,
    };
    sbUpdate("evenements", editingEvt.id, payload).then(function() {
      setData(data.map(function(e) { return e.id === editingEvt.id ? Object.assign({}, e, payload) : e; }));
      setEditEvtModal(false);
      setEditingEvt(null);
    }).catch(function(e) { alert(e.message); });
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
                <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
                  <div onClick={function() { setDetailEvt(isOpen ? null : e.id); }} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}>
                    <div style={{ width: 4, height: 40, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#2c2c2a" }}>{e.titre}</div>
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
}} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#666", flexShrink: 0 }}>✏️</button>
                  <button onClick={function(ev) { ev.stopPropagation(); duplicateEvt(e); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, color: "#534AB7", flexShrink: 0 }}>📋 Dupliquer</button>
                  <button onClick={function(ev) { ev.stopPropagation(); deleteEvt(e); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E24B4A44", background: "#fff", cursor: "pointer", fontSize: 12, color: "#E24B4A", flexShrink: 0 }}>🗑️</button>
                  <span onClick={function() { setDetailEvt(isOpen ? null : e.id); }} style={{ color: "#ccc", cursor: "pointer" }}>{isOpen ? "▲" : "▼"}</span>
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
                    {e.responsable_coach_id && (function() {
                      var resp = coaches.find(function(c) { return c.id === e.responsable_coach_id; });
                      return resp ? <div style={{ fontSize: 13, color: "#534AB7", marginTop: 8, fontWeight: 500 }}>👤 Responsable : {resp.prenom} {resp.nom}</div> : null;
                    })()}
                    {e.notes && <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{e.notes}</div>}
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
        </div>
        <div style={{ borderTop: "1px solid #f0ede6", margin: "12px 0" }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#534AB7", marginBottom: 8 }}>🏉 Coaches assignés ({editEvtCoaches.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
          {coaches.map(function(c) {
            var isSel = editEvtCoaches.indexOf(c.id) !== -1;
            return (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, border: "1px solid " + (isSel ? "#534AB7" : "#e8e6de"), background: isSel ? "#534AB711" : "#fff", cursor: "pointer" }}>
                <input type="checkbox" checked={isSel} onChange={function() {
                  if (isSel) setEditEvtCoaches(editEvtCoaches.filter(function(id) { return id !== c.id; }));
                  else setEditEvtCoaches(editEvtCoaches.concat([c.id]));
                }} style={{ accentColor: "#534AB7" }} />
                <span style={{ fontSize: 13, flex: 1 }}>{c.prenom} {c.nom}</span>
                <span style={{ fontSize: 11, color: "#aaa" }}>{c.pays}</span>
              </label>
            );
          })}
        </div>
        <Field label="Notes"><textarea style={Object.assign({}, inp, { resize: "vertical", minHeight: 50, marginTop: 12 })} value={editingEvt.notes || ""} onChange={function(e) { setEditingEvt(Object.assign({}, editingEvt, { notes: e.target.value })); }} /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={function() { setEditEvtModal(false); }} style={btnS}>Annuler</button>
          <button onClick={handleUpdateEvt} style={btnP}>Enregistrer</button>
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
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#534AB7", marginBottom: 6 }}>{dupDates.length} date{dupDates.length > 1 ? "s" : ""} sélectionnée{dupDates.length > 1 ? "s" : ""}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {dupDates.slice().sort().map(function(d) {
                      return (
                        <span key={d} onClick={function() { setDupDates(dupDates.filter(function(x) { return x !== d; })); }}
                          style={{ background: "#534AB7", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12, cursor: "pointer" }}>
                          {d} ×
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: "1px solid #f0ede6" }}>
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
  var ficheState = useState(null); var ficheCoach = ficheState[0]; var setFicheCoach = ficheState[1];
  var editCoachModalState = useState(false); var editCoachModal = editCoachModalState[0]; var setEditCoachModal = editCoachModalState[1];
  var editCoachFormState = useState(null); var editCoachForm = editCoachFormState[0]; var setEditCoachForm = editCoachFormState[1];
  var uploadingState = useState(null); var uploadingId = uploadingState[0]; var setUploadingId = uploadingState[1];
  var editCoachModalState = useState(false); var editCoachModal = editCoachModalState[0]; var setEditCoachModal = editCoachModalState[1];
  var editCoachFormState = useState(null); var editCoachForm = editCoachFormState[0]; var setEditCoachForm = editCoachFormState[1];

  var EMPTY = { prenom: "", nom: "", email: "", telephone: "", sport_principal: "Rugby", role: "Benevole", statut: "Actif", pays: "", langues: "", background_check: "", sessions_programmees: 0, sessions_completees: 0 };
  var fs = useState(EMPTY); var form = fs[0]; var setForm = fs[1];
  function set(k, v) { setForm(Object.assign({}, form, { [k]: v })); }

  useEffect(function() {
    sbFetch("coaches", { select: "*", order: "sessions_completees.desc" }).then(function(r) { setData(r); setLoading(false); });
  }, []);

  function handleAdd() {
    sbInsert("coaches", form).then(function(rows) { setData([rows[0]].concat(data)); setModal(false); setForm(EMPTY); }).catch(function(e) { alert(e.message); });
  }

  function handleUpdateCoach() {
    var payload = { prenom: editCoachForm.prenom, nom: editCoachForm.nom, email: editCoachForm.email, telephone: editCoachForm.telephone, pays: editCoachForm.pays, langues: editCoachForm.langues, sport_principal: editCoachForm.sport_principal, role: editCoachForm.role, statut: editCoachForm.statut, background_check: editCoachForm.background_check, sessions_programmees: Number(editCoachForm.sessions_programmees) || 0, sessions_completees: Number(editCoachForm.sessions_completees) || 0 };
    sbUpdate("coaches", editCoachForm.id, payload).then(function() {
      setData(data.map(function(c) { return c.id === editCoachForm.id ? Object.assign({}, c, payload) : c; }));
      setFicheCoach(Object.assign({}, ficheCoach, payload));
      setEditCoachModal(false);
    }).catch(function(e) { alert(e.message); });
  }
  function setCF(k, v) { setEditCoachForm(Object.assign({}, editCoachForm, { [k]: v })); }

  function handleUpdateCoach() {
    var payload = {
      prenom: editCoachForm.prenom, nom: editCoachForm.nom,
      email: editCoachForm.email, telephone: editCoachForm.telephone,
      pays: editCoachForm.pays, langues: editCoachForm.langues,
      sport_principal: editCoachForm.sport_principal, role: editCoachForm.role,
      statut: editCoachForm.statut, background_check: editCoachForm.background_check,
      sessions_programmees: editCoachForm.sessions_programmees || 0,
      sessions_completees: editCoachForm.sessions_completees || 0,
    };
    sbUpdate("coaches", editCoachForm.id, payload).then(function() {
      setData(data.map(function(c) { return c.id === editCoachForm.id ? Object.assign({}, c, payload) : c; }));
      setFicheCoach(Object.assign({}, ficheCoach, payload));
      setEditCoachModal(false);
    }).catch(function(e) { alert(e.message); });
  }
  function setCF(k, v) { setEditCoachForm(Object.assign({}, editCoachForm, { [k]: v })); }

  function handlePhotoUpload(coachId, file) {
    if (!file) return;
    setUploadingId(coachId);
    var reader = new FileReader();
    reader.onload = function(ev) {
      var base64 = ev.target.result;
      // Store as data URL in photo_url field
      sbUpdate("coaches", coachId, { photo_url: base64 }).then(function() {
        setData(data.map(function(c) { return c.id === coachId ? Object.assign({}, c, { photo_url: base64 }) : c; }));
        if (ficheCoach && ficheCoach.id === coachId) setFicheCoach(Object.assign({}, ficheCoach, { photo_url: base64 }));
        setUploadingId(null);
      });
    };
    reader.readAsDataURL(file);
  }

  // Sort by sessions_completees desc
  var sorted = data.slice().sort(function(a, b) { return (Number(b.sessions_completees) || 0) - (Number(a.sessions_completees) || 0); });

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#888" }}>{data.length} coach{data.length > 1 ? "es" : ""} · classés par sessions</div>
        <button onClick={function() { setModal(true); }} style={btnA}>+ Ajouter</button>
      </div>

      {data.length === 0 ? <Empty msg="Aucun coach" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {sorted.map(function(c, idx) {
            var sessionsTotal = Number(c.sessions_completees) || 0;
            var sessionsProg = Number(c.sessions_programmees) || 0;
            var pct = sessionsProg > 0 ? Math.round((sessionsTotal / sessionsProg) * 100) : 0;
            var STATUT_C = { Actif: "#1D9E75", Inactif: "#888", Occasionnel: "#BA7517" };
            var color = STATUT_C[c.statut] || "#888";
            var medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
            return (
              <div key={c.id} onClick={function() { setFicheCoach(c); }} style={{ background: "#fff", border: "1px solid #e8e6de", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={function(e) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                {/* Photo area */}
                <div style={{ position: "relative", height: 140, background: "linear-gradient(135deg, #534AB711, #185FA511)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.prenom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#534AB722", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#534AB7" }}>
                      {(c.prenom || "?")[0]}{(c.nom || "")[0]}
                    </div>
                  )}
                  {medal && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 22 }}>{medal}</span>}
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <span style={{ background: color + "22", color: color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c.statut}</span>
                  </div>
                  {/* Upload photo button */}
                  <label onClick={function(e) { e.stopPropagation(); }} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 20, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>
                    {uploadingId === c.id ? "..." : "📷"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handlePhotoUpload(c.id, e.target.files[0]); }} />
                  </label>
                  <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                    #{idx + 1}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2c2c2a" }}>{c.prenom} {c.nom}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.role} · {c.pays || "—"}</div>
                  {c.langues && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{c.langues}</div>}
                  {/* Sessions bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 4 }}>
                      <span>Sessions</span>
                      <span style={{ fontWeight: 600, color: "#534AB7" }}>{sessionsTotal}/{sessionsProg}</span>
                    </div>
                    <div style={{ background: "#f0ede6", borderRadius: 4, height: 6 }}>
                      <div style={{ background: "#534AB7", borderRadius: 4, height: 6, width: Math.min(pct, 100) + "%" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 3, textAlign: "right" }}>{pct}% complété</div>
                  </div>
                  {c.background_check && <div style={{ fontSize: 11, color: c.background_check === "CONFIRMED" ? "#1D9E75" : "#BA7517", marginTop: 6, fontWeight: 500 }}>✓ {c.background_check}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FICHE COACH */}
      {ficheCoach && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 460, height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
            {/* Photo header */}
            <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #534AB722, #185FA522)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ficheCoach.photo_url ? (
                <img src={ficheCoach.photo_url} alt={ficheCoach.prenom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#534AB733", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#534AB7" }}>
                  {(ficheCoach.prenom || "?")[0]}{(ficheCoach.nom || "")[0]}
                </div>
              )}
              <button onClick={function() { setFicheCoach(null); }} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              <button onClick={function() { setEditCoachForm(Object.assign({}, ficheCoach)); setEditCoachModal(true); }} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>✏️ Modifier</button>
              <button onClick={function() { setEditCoachForm(Object.assign({}, ficheCoach)); setEditCoachModal(true); }} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>✏️ Modifier</button>
              <label style={{ position: "absolute", bottom: 12, right: 12, background: "#534AB7", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                📷 Changer la photo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { handlePhotoUpload(ficheCoach.id, e.target.files[0]); }} />
              </label>
            </div>
            {/* Info */}
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>{ficheCoach.prenom} {ficheCoach.nom}</h2>
              <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{ficheCoach.role} · {ficheCoach.sport_principal}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#f7f5f0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>PAYS</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ficheCoach.pays || "—"}</div>
                </div>
                <div style={{ background: "#f7f5f0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>LANGUES</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ficheCoach.langues || "—"}</div>
                </div>
                <div style={{ background: "#f7f5f0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>EMAIL</div>
                  <div style={{ fontSize: 13 }}>{ficheCoach.email || "—"}</div>
                </div>
                <div style={{ background: "#f7f5f0", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>TÉLÉPHONE</div>
                  <div style={{ fontSize: 13 }}>{ficheCoach.telephone || "—"}</div>
                </div>
              </div>
              {/* Sessions */}
              <div style={{ background: "#534AB711", border: "1px solid #534AB733", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#534AB7", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Sessions</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#534AB7" }}>{ficheCoach.sessions_completees || 0}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Complétées</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#185FA5" }}>{ficheCoach.sessions_programmees || 0}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Programmées</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#1D9E75" }}>{ficheCoach.sessions_programmees > 0 ? Math.round((ficheCoach.sessions_completees / ficheCoach.sessions_programmees) * 100) : 0}%</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Taux</div>
                  </div>
                </div>
                <div style={{ background: "#e8e6de", borderRadius: 6, height: 8 }}>
                  <div style={{ background: "#534AB7", borderRadius: 6, height: 8, width: Math.min(ficheCoach.sessions_programmees > 0 ? Math.round((ficheCoach.sessions_completees / ficheCoach.sessions_programmees) * 100) : 0, 100) + "%" }} />
                </div>
              </div>
              {ficheCoach.background_check && <div style={{ marginTop: 12, fontSize: 13, color: "#1D9E75", fontWeight: 500 }}>✓ Background check : {ficheCoach.background_check}</div>}
              <DocumentsSection entityType="coach" entityId={ficheCoach.id} />
            </div>
          </div>
        </div>
      )}

      {/* EDIT COACH MODAL */}
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
              {["Rugby","Football","Atletisme","Basketball","Natation","Autre"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Rôle">
            <select style={sel} value={editCoachForm.role || "Benevole"} onChange={function(e) { setCF("role", e.target.value); }}>
              {["Coach principal","Benevole","Staff","Coordinateur"].map(function(r) { return <option key={r}>{r}</option>; })}
            </select>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Statut">
            <select style={sel} value={editCoachForm.statut || "Actif"} onChange={function(e) { setCF("statut", e.target.value); }}>
              {["Actif","Occasionnel","Inactif"].map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </Field>
          <Field label="Background check"><input style={inp} value={editCoachForm.background_check || ""} onChange={function(e) { setCF("background_check", e.target.value); }} /></Field>
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

      {editCoachForm && <Modal open={editCoachModal} onClose={function() { setEditCoachModal(false); }} title={"Modifier — " + (editCoachForm.prenom || "") + " " + (editCoachForm.nom || "")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Prénom"><input style={inp} value={editCoachForm.prenom || ""} onChange={function(e) { setCF("prenom", e.target.value); }} /></Field>
          <Field label="Nom"><input style={inp} value={editCoachForm.nom || ""} onChange={function(e) { setCF("nom", e.target.value); }} /></Field>
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
          <Field label="Sport"><select style={sel} value={editCoachForm.sport_principal || "Rugby"} onChange={function(e) { setCF("sport_principal", e.target.value); }}>{["Rugby","Football","Atletisme","Basketball","Natation","Autre"].map(function(s){return <option key={s}>{s}</option>;})}</select></Field>
          <Field label="Rôle"><select style={sel} value={editCoachForm.role || "Benevole"} onChange={function(e) { setCF("role", e.target.value); }}>{["Coach principal","Benevole","Staff","Coordinateur"].map(function(r){return <option key={r}>{r}</option>;})}</select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Statut"><select style={sel} value={editCoachForm.statut || "Actif"} onChange={function(e) { setCF("statut", e.target.value); }}>{["Actif","Occasionnel","Inactif"].map(function(s){return <option key={s}>{s}</option>;})}</select></Field>
          <Field label="Background check"><input style={inp} value={editCoachForm.background_check || ""} onChange={function(e) { setCF("background_check", e.target.value); }} /></Field>
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

      {/* ADD MODAL */}
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
var MEMBRES = ["François", "Eric", "Gavin"];
var PRIORITE_CONFIG = {
  Urgente: { color: "#A32D2D", bg: "#A32D2D22", icon: "🔴" },
  Haute:   { color: "#BA7517", bg: "#BA751722", icon: "🟠" },
  Moyenne: { color: "#534AB7", bg: "#534AB722", icon: "🔵" },
  Basse:   { color: "#888",    bg: "#88888822", icon: "⚪" },
};

function TachesWidget(props) {
  // Used in dashboard - shows all non-terminated tasks
  var taches = props.taches || [];
  var partenaires = props.partenaires || [];
  var onAdd = props.onAdd;
  var onToggle = props.onToggle;

  var sorted = taches.slice().sort(function(a, b) {
    var pOrder = { Urgente: 0, Haute: 1, Moyenne: 2, Basse: 3 };
    var pa = pOrder[a.priorite] !== undefined ? pOrder[a.priorite] : 4;
    var pb = pOrder[b.priorite] !== undefined ? pOrder[b.priorite] : 4;
    if (pa !== pb) return pa - pb;
    if (a.date_echeance && b.date_echeance) return a.date_echeance > b.date_echeance ? 1 : -1;
    if (a.date_echeance) return -1;
    if (b.date_echeance) return 1;
    return 0;
  });

  var today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#2c2c2a" }}>
          📋 Tâches à traiter
          {sorted.length > 0 && <span style={{ marginLeft: 8, background: "#534AB722", color: "#534AB7", borderRadius: 20, padding: "2px 8px", fontSize: 12 }}>{sorted.length}</span>}
        </h3>
        <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Nouvelle tâche</button>
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: 13, background: "#f7f5f0", borderRadius: 10 }}>Aucune tâche en cours 🎉</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map(function(t) {
            var cfg = PRIORITE_CONFIG[t.priorite] || PRIORITE_CONFIG.Moyenne;
            var isLate = t.date_echeance && t.date_echeance < today;
            var part = t.partenaire_id ? partenaires.find(function(p) { return p.id === t.partenaire_id; }) : null;
            return (
              <div key={t.id} style={{ background: "#fff", border: "1px solid " + (isLate ? "#E24B4A33" : "#e8e6de"), borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div onClick={function() { onToggle(t); }} style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid " + cfg.color, background: "transparent", flexShrink: 0, cursor: "pointer", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a" }}>{cfg.icon} {t.titre}</span>
                    <span style={{ fontSize: 11, background: cfg.bg, color: cfg.color, borderRadius: 12, padding: "2px 8px", fontWeight: 600 }}>{t.priorite}</span>
                    {isLate && <span style={{ fontSize: 11, background: "#E24B4A22", color: "#E24B4A", borderRadius: 12, padding: "2px 8px", fontWeight: 600 }}>⚠️ En retard</span>}
                  </div>
                  {t.description && <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{t.description}</div>}
                  <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                    {t.date_echeance && <span style={{ fontSize: 12, color: isLate ? "#E24B4A" : "#888" }}>📅 {t.date_echeance}</span>}
                    {t.assigne_a && <span style={{ fontSize: 12, color: "#534AB7", fontWeight: 500 }}>→ {t.assigne_a}</span>}
                    {t.assigne_par && <span style={{ fontSize: 12, color: "#888" }}>de {t.assigne_par}</span>}
                    {(part || t.partenaire_nom_temp) && <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 500 }}>🏢 {part ? part.nom : t.partenaire_nom_temp}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Taches() {
  var ds = useState([]); var data = ds[0]; var setData = ds[1];
  var ps = useState([]); var partenaires = ps[0]; var setPartenaires = ps[1];
  var ls = useState(true); var loading = ls[0]; var setLoading = ls[1];
  var ms = useState(false); var modal = ms[0]; var setModal = ms[1];

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
                <div key={t.id} onClick={function() { handleToggle(t); }} style={{ background: "#fff", border: "1px solid #f0ede6", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, cursor: "pointer", opacity: 0.6 }}>
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
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e8e6de", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                {filteredParts.length === 0 ? (
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Aucun résultat pour "{search}"</div>
                    <button onClick={function() { setShowNewPart(true); setShowDrop(false); set("partenaire_nom_temp", search); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #534AB7", background: "#534AB711", color: "#534AB7", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Créer "{search}" comme nouveau partenaire</button>
                  </div>
                ) : (
                  <div>
                    {filteredParts.map(function(p) {
                      return (
                        <div key={p.id} onClick={function() { set("partenaire_id", p.id); setSearch(p.nom); setShowDrop(false); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f5f3ee" }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = "#f7f5f0"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                          <span style={{ fontWeight: 500 }}>{p.nom}</span>
                          <span style={{ color: "#aaa", marginLeft: 8, fontSize: 12 }}>{p.type}</span>
                        </div>
                      );
                    })}
                    <div onClick={function() { setShowNewPart(true); setShowDrop(false); set("partenaire_nom_temp", search); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "#534AB7", fontWeight: 500, borderTop: "1px solid #f0ede6" }}>+ Créer nouveau partenaire</div>
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
