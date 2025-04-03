import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Book, Plus, ChevronLeft, Save, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const DiaryPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem(`diary_${authUser?._id}`);
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  const [activeEntry, setActiveEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    date: new Date().toISOString(),
  });

  useEffect(() => {
    if (authUser?._id) {
      localStorage.setItem(`diary_${authUser._id}`, JSON.stringify(entries));
    }
  }, [entries, authUser]);

  const handleCreateEntry = () => {
    if (!newEntry.title || !newEntry.content) {
      toast.error("Please fill in both title and content");
      return;
    }

    const entryToSave = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      date: new Date().toISOString()
    };

    setEntries([entryToSave, ...entries]);
    setNewEntry({
      title: "",
      content: "",
      date: new Date().toISOString(),
    });
    setActiveEntry(null);
    toast.success("Diary entry saved!");
  };

  const handleDeleteEntry = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
    if (activeEntry?.id === id) {
      setActiveEntry(null);
    }
    toast.success("Entry deleted");
  };

  return (
    <div className="min-h-screen pt-20 bg-base-200">
      <div className="container px-4 mx-auto max-w-5xl">
        <button 
          className="btn btn-ghost gap-2 mb-4"
          onClick={() => navigate("/dashboard")}
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Book className="text-amber-600" />
            Your Personal Diary
          </h1>
          {activeEntry && (
            <button 
              className="btn btn-primary gap-2"
              onClick={() => setActiveEntry(null)}
            >
              <Plus size={16} />
              New Entry
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry List */}
          <div className="bg-base-100 p-6 rounded-xl shadow-md lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Entries</h2>
              {!activeEntry && (
                <span className="badge badge-primary">New Entry</span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[500px] space-y-3">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-base-content/70">
                  <p>No entries yet.</p>
                  <p>Create your first diary entry!</p>
                </div>
              ) : (
                entries.map(entry => (
                  <div 
                    key={entry.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-base-200 transition
                      ${activeEntry?.id === entry.id ? 'border-l-4 border-primary' : ''}`}
                    onClick={() => setActiveEntry(entry)}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{entry.title}</h3>
                      <button 
                        className="btn btn-ghost btn-xs" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
                        }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-base-content/70">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Entry Editor */}
          <div className="bg-base-100 p-6 rounded-xl shadow-md lg:col-span-2">
            {activeEntry ? (
              <div>
                <h2 className="text-xl font-bold mb-2">{activeEntry.title}</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  {new Date(activeEntry.date).toLocaleString()}
                </p>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{activeEntry.content}</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">New Entry</h2>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Title</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                      placeholder="Entry title"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Content</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-56"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                      placeholder="Write your thoughts here..."
                    />
                  </div>
                  
                  <button 
                    className="btn btn-primary w-full gap-2"
                    onClick={handleCreateEntry}
                  >
                    <Save size={16} />
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
