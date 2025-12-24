import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  ShoppingCart,
  Check,
  StickyNote,
  FileText,
  Clock,
  X,
  WifiOff,
  Pencil,
} from "lucide-react";
// IMPORTAMOS FIREBASE
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBBePDfxv3xtgR0TknFHjRKe3i1_OijZus",
  authDomain: "familia-berlin.firebaseapp.com",
  projectId: "familia-berlin",
  storageBucket: "familia-berlin.firebasestorage.app",
  messagingSenderId: "566582130890",
  appId: "1:566582130890:web:072933d8323d48e0cc1c33",
};

// DETECCIÓN INTELIGENTE DE MODO
const IS_DEMO = firebaseConfig.apiKey.includes("PEGA_TU");

let app, db;
if (!IS_DEMO) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error("Error config Firebase:", e);
  }
}

// --- DATOS ---
const FAMILY_MEMBERS = [
  {
    id: "euge",
    name: "Euge",
    color: "bg-rose-500",
    text: "text-rose-600",
    border: "border-rose-200",
    bgLight: "bg-rose-50",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Euge",
  },
  {
    id: "marian",
    name: "Marian",
    color: "bg-slate-600",
    text: "text-slate-600",
    border: "border-slate-200",
    bgLight: "bg-slate-100",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marian",
  },
  {
    id: "joaqui",
    name: "Joaqui",
    color: "bg-blue-500",
    text: "text-blue-600",
    border: "border-blue-200",
    bgLight: "bg-blue-50",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joaqui",
  },
  {
    id: "grego",
    name: "Grego",
    color: "bg-amber-400",
    text: "text-amber-600",
    border: "border-amber-200",
    bgLight: "bg-amber-50",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grego",
  },
];

const FAMILY_PHOTO_URL =
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070";
const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function App() {
  const [currentView, setCurrentView] = useState("calendar");
  const [selectedDay, setSelectedDay] = useState(0);
  const [showModal, setShowModal] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);

  // Estados de datos
  const [activities, setActivities] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inputs
  const [newItemText, setNewItemText] = useState("");
  const [newActivity, setNewActivity] = useState({
    title: "",
    time: "09:00",
    endTime: "10:00",
    memberId: "euge",
    note: "",
  });
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteText, setEditingNoteText] = useState("");

  // --- EFECTOS DE CARGA ---
  useEffect(() => {
    if (IS_DEMO) {
      const localAct = JSON.parse(localStorage.getItem("berlin_act") || "[]");
      const localShop = JSON.parse(localStorage.getItem("berlin_shop") || "[]");
      const localNotes = JSON.parse(
        localStorage.getItem("berlin_notes") || "[]"
      );

      if (localAct.length === 0) {
        setActivities([
          {
            id: 1,
            day: 0,
            memberId: "joaqui",
            title: "Prueba Demo",
            time: "08:00",
            endTime: "16:00",
            note: "Info local",
          },
        ]);
      } else {
        setActivities(localAct);
      }
      setShoppingList(localShop);
      setNotes(localNotes);
      setLoading(false);
      return;
    }

    if (!db) return;

    const unsubAct = onSnapshot(collection(db, "activities"), (snap) => {
      setActivities(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    });
    const unsubShop = onSnapshot(
      query(collection(db, "shopping"), orderBy("createdAt", "desc")),
      (snap) =>
        setShoppingList(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
    );
    const unsubNotes = onSnapshot(collection(db, "notes"), (snap) =>
      setNotes(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
    );

    return () => {
      unsubAct();
      unsubShop();
      unsubNotes();
    };
  }, []);

  // Sync LocalStorage en Demo
  useEffect(() => {
    if (IS_DEMO && !loading) {
      localStorage.setItem("berlin_act", JSON.stringify(activities));
      localStorage.setItem("berlin_shop", JSON.stringify(shoppingList));
      localStorage.setItem("berlin_notes", JSON.stringify(notes));
    }
  }, [activities, shoppingList, notes, loading]);

  // --- FUNCIONES ---
  const handleAddActivity = async () => {
    if (!newActivity.title) return;
    if (IS_DEMO) {
      setActivities([
        ...activities,
        { id: Date.now(), day: selectedDay, ...newActivity },
      ]);
    } else if (db) {
      await addDoc(collection(db, "activities"), {
        day: selectedDay,
        ...newActivity,
        createdAt: Date.now(),
      });
    }
    setShowModal(null);
    setNewActivity({
      title: "",
      time: "09:00",
      endTime: "10:00",
      memberId: "euge",
      note: "",
    });
  };

  const handleDeleteActivity = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Borrar actividad?")) return;
    if (IS_DEMO) setActivities(activities.filter((a) => a.id !== id));
    else if (db) await deleteDoc(doc(db, "activities", id));
    setShowModal(null);
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    if (IS_DEMO) {
      setActivities(
        activities.map((a) =>
          a.id === editingActivity.id ? editingActivity : a
        )
      );
    } else if (db) {
      const { id, ...dataToUpdate } = editingActivity;
      await updateDoc(doc(db, "activities", id), dataToUpdate);
    }
    setShowModal(null);
    setEditingActivity(null);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    if (IS_DEMO)
      setShoppingList([
        ...shoppingList,
        { id: Date.now(), text: newItemText, completed: false },
      ]);
    else if (db)
      await addDoc(collection(db, "shopping"), {
        text: newItemText,
        completed: false,
        createdAt: Date.now(),
      });
    setNewItemText("");
  };

  const toggleItem = async (item) => {
    if (IS_DEMO)
      setShoppingList(
        shoppingList.map((i) =>
          i.id === item.id ? { ...i, completed: !i.completed } : i
        )
      );
    else if (db)
      await updateDoc(doc(db, "shopping", item.id), {
        completed: !item.completed,
      });
  };

  const deleteItem = async (id) => {
    if (IS_DEMO) setShoppingList(shoppingList.filter((i) => i.id !== id));
    else if (db) await deleteDoc(doc(db, "shopping", id));
  };

  const deleteCompletedItems = async () => {
    const completed = shoppingList.filter((i) => i.completed);
    if (completed.length === 0) return;
    if (!window.confirm(`¿Borrar ${completed.length} elementos tachados?`))
      return;

    if (IS_DEMO) {
      setShoppingList(shoppingList.filter((i) => !i.completed));
    } else if (db) {
      completed.forEach(async (item) => {
        await deleteDoc(doc(db, "shopping", item.id));
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    const colors = [
      "bg-yellow-200",
      "bg-blue-200",
      "bg-green-200",
      "bg-pink-200",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    if (IS_DEMO)
      setNotes([...notes, { id: Date.now(), text: newNoteText, color }]);
    else if (db)
      await addDoc(collection(db, "notes"), {
        text: newNoteText,
        color,
        createdAt: Date.now(),
      });
    setNewNoteText("");
    setShowModal(null);
  };

  const deleteNote = async (id) => {
    if (IS_DEMO) setNotes(notes.filter((n) => n.id !== id));
    else if (db) await deleteDoc(doc(db, "notes", id));
  };

  // --- RENDERIZADORES ---
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-indigo-600 font-bold">
        Cargando...
      </div>
    );

  const renderCalendar = () => {
    const todaysActivities = activities
      .filter((a) => a.day === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
    return (
      <div className="relative pb-24">
        <div className="relative mt-4">
          {/* LÍNEA GRIS VERTICAL: Ajustada a punto medio (left-16) */}
          <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>

          <div className="space-y-4 z-10 relative">
            {todaysActivities.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>Sin actividades</p>
              </div>
            )}
            {todaysActivities.map((act) => {
              const member =
                FAMILY_MEMBERS.find((m) => m.id === act.memberId) ||
                FAMILY_MEMBERS[0];
              return (
                <div
                  key={act.id}
                  onClick={() => {
                    setEditingActivity(act);
                    setShowModal("edit-activity");
                  }}
                  className="flex gap-3 items-start cursor-pointer transition-transform active:scale-[0.98]"
                >
                  {/* COLUMNA HORA: Ajustada a punto medio (w-14) */}
                  <div className="w-14 pt-3 flex flex-col items-end text-right">
                    <span className="font-bold text-gray-700 text-xs">
                      {act.time}
                    </span>
                    <span className="text-gray-400 text-[10px] leading-tight">
                      {act.endTime}
                    </span>
                  </div>

                  {/* TARJETA ACTIVIDAD */}
                  <div
                    className={`flex-1 ${member.bgLight} p-2 pr-3 rounded-2xl border ${member.border} shadow-sm relative overflow-hidden group`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${member.color}`}
                    ></div>
                    <div className="flex justify-between items-center pl-2 gap-2">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight truncate">
                          {act.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase ${member.text}`}
                          >
                            {member.name}
                          </span>
                          {act.note && (
                            <div className="flex items-center gap-0.5 bg-white/50 px-1.5 rounded-full">
                              <FileText size={8} className="text-gray-500" />
                              <span className="text-[9px] text-gray-500 font-medium">
                                Nota
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-300 group-hover:text-indigo-400 p-2 z-10">
                        <Pencil size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setShowModal("activity")}
          className="fixed bottom-24 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all z-20"
        >
          <Plus size={32} />
        </button>
      </div>
    );
  };

  const renderShopping = () => {
    const hasCompleted = shoppingList.some((i) => i.completed);
    return (
      <div className="pb-24">
        <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Agregar item..."
            className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 font-medium text-base"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-xl"
          >
            <Plus size={24} />
          </button>
        </form>
        <div className="space-y-2">
          {shoppingList.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                item.completed
                  ? "bg-gray-50 border-gray-100 opacity-60"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleItem(item)}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    item.completed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {item.completed && <Check size={14} className="text-white" />}
                </div>
                <span
                  className={`font-medium ${
                    item.completed
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {item.text}
                </span>
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="text-gray-300 hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        {hasCompleted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={deleteCompletedItems}
              className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-full text-sm font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={16} /> Limpiar completados
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNotes = () => (
    <div className="pb-24 grid grid-cols-2 gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`${note.color} p-4 rounded-xl shadow-sm rotate-1 hover:rotate-0 transition-transform relative group min-h-[140px] flex flex-col`}
        >
          <p className="font-handwriting text-gray-800 flex-1 leading-relaxed whitespace-pre-wrap font-medium text-sm">
            {note.text}
          </p>
          <button
            onClick={() => deleteNote(note.id)}
            className="absolute top-2 right-2 text-black/20 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => setShowModal("note")}
        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-colors min-h-[140px]"
      >
        <Plus size={32} className="mb-2" />
        <span className="text-sm font-bold">Nueva Nota</span>
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-gray-50 font-sans overflow-hidden select-none overscroll-none touch-none">
      {/* HEADER */}
      <div className="relative h-44 rounded-b-[2rem] overflow-hidden shadow-lg z-20 flex-shrink-0 bg-indigo-900">
        <img
          src={FAMILY_PHOTO_URL}
          alt="Familia"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative h-full flex flex-col justify-end pb-3 px-4">
          <h1 className="text-white text-2xl font-bold tracking-tight shadow-sm mb-1">
            Familia Berlin
          </h1>
          <div className="flex items-center gap-2 mb-2">
            {currentView === "calendar" && (
              <span className="text-indigo-100 text-xs font-bold uppercase flex items-center gap-1">
                <Calendar size={12} /> Organizador Semanal
              </span>
            )}
            {currentView === "shopping" && (
              <span className="text-indigo-100 text-xs font-bold uppercase flex items-center gap-1">
                <ShoppingCart size={12} /> Compras
              </span>
            )}
            {currentView === "notes" && (
              <span className="text-indigo-100 text-xs font-bold uppercase flex items-center gap-1">
                <StickyNote size={12} /> Notas
              </span>
            )}
            {IS_DEMO && (
              <span className="bg-yellow-400/20 text-yellow-200 text-[10px] px-2 py-0.5 rounded-full border border-yellow-400/30 flex items-center gap-1">
                <WifiOff size={10} /> Demo
              </span>
            )}
          </div>

          {currentView === "calendar" && (
            <div className="grid grid-cols-7 gap-1 w-full">
              {DAYS.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                    selectedDay === index
                      ? "bg-white text-indigo-900 shadow-md font-bold scale-105"
                      : "text-indigo-100 hover:bg-white/10"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide">
                    {day.substring(0, 3)}
                  </span>
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      selectedDay === index ? "bg-indigo-600" : "bg-transparent"
                    }`}
                  ></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 overscroll-contain touch-pan-y [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {currentView === "calendar" && renderCalendar()}
        {currentView === "shopping" && renderShopping()}
        {currentView === "notes" && renderNotes()}
      </div>

      {/* BOTTOM NAV */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-shrink-0 safe-area-bottom">
        <button
          onClick={() => setCurrentView("calendar")}
          className={`flex flex-col items-center gap-1 ${
            currentView === "calendar" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <Calendar
            size={24}
            strokeWidth={currentView === "calendar" ? 2.5 : 2}
          />
          <span className="text-[10px] font-bold">Calendario</span>
        </button>
        <button
          onClick={() => setCurrentView("shopping")}
          className={`flex flex-col items-center gap-1 ${
            currentView === "shopping" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <ShoppingCart
            size={24}
            strokeWidth={currentView === "shopping" ? 2.5 : 2}
          />
          <span className="text-[10px] font-bold">Compras</span>
        </button>
        <button
          onClick={() => setCurrentView("notes")}
          className={`flex flex-col items-center gap-1 ${
            currentView === "notes" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <StickyNote
            size={24}
            strokeWidth={currentView === "notes" ? 2.5 : 2}
          />
          <span className="text-[10px] font-bold">Notas</span>
        </button>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {showModal === "activity"
                  ? "Nueva Actividad"
                  : showModal === "note"
                  ? "Nueva Nota"
                  : "Editar Actividad"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(null);
                  setEditingActivity(null);
                }}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {showModal === "activity" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    ¿Para quién?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FAMILY_MEMBERS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() =>
                          setNewActivity({ ...newActivity, memberId: m.id })
                        }
                        className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                          newActivity.memberId === m.id
                            ? `${m.border} ${m.bgLight}`
                            : "border-transparent bg-gray-50"
                        }`}
                      >
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full mb-1 object-cover"
                        />
                        <span
                          className={`text-[9px] font-bold ${
                            newActivity.memberId === m.id
                              ? "text-gray-800"
                              : "text-gray-400"
                          }`}
                        >
                          {m.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Actividad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Natación..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 font-semibold text-base"
                    value={newActivity.title}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Inicio
                    </label>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-lg"
                      value={newActivity.time}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, time: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold text-lg"
                      value={newActivity.endTime}
                      onChange={(e) =>
                        setNewActivity({
                          ...newActivity,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddActivity}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-2"
                >
                  Guardar
                </button>
              </div>
            )}

            {showModal === "note" && (
              <div className="space-y-4">
                <textarea
                  placeholder="Nota..."
                  className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 h-32 text-lg"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                ></textarea>
                <button
                  onClick={handleAddNote}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg"
                >
                  Pegar
                </button>
              </div>
            )}

            {showModal === "edit-activity" && editingActivity && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Responsable
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FAMILY_MEMBERS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() =>
                          setEditingActivity({
                            ...editingActivity,
                            memberId: m.id,
                          })
                        }
                        className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                          editingActivity.memberId === m.id
                            ? `${m.border} ${m.bgLight}`
                            : "border-transparent bg-gray-50"
                        }`}
                      >
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-8 h-8 rounded-full mb-1 object-cover"
                        />
                        <span
                          className={`text-[9px] font-bold ${
                            editingActivity.memberId === m.id
                              ? "text-gray-800"
                              : "text-gray-400"
                          }`}
                        >
                          {m.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Actividad
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-gray-800 text-lg"
                    value={editingActivity.title}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Inicio
                    </label>
                    <input
                      type="time"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 font-semibold text-lg"
                      value={editingActivity.time}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 font-semibold text-lg"
                      value={editingActivity.endTime}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                    <FileText size={12} /> Nota / Detalles
                  </label>
                  <textarea
                    placeholder="Detalles..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 h-24 text-base"
                    value={editingActivity.note || ""}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        note: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => handleDeleteActivity(editingActivity.id, e)}
                    className="p-4 rounded-xl bg-red-50 text-red-500 font-bold"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={handleUpdateActivity}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
