import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Search } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try { const r = await projectsAPI.list(); setProjects(r.data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) { toast.error('Project name must be at least 3 characters'); return; }
    setCreating(true);
    try {
      await projectsAPI.create({ name: name.trim(), description: description.trim() });
      toast.success('Project created!');
      setShowModal(false); setName(''); setDescription('');
      fetchProjects();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create project'); }
    finally { setCreating(false); }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingSpinner text="Loading projects..." />;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
          <p className="text-surface-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2" id="new-project-btn">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length > 3 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-11 max-w-md" />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderKanban className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p className="text-surface-400 mb-6">Create your first project to start collaborating</p>
          {!search && <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="glass-card-hover p-6 group block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center border border-brand-500/10">
                  <FolderKanban className="w-5 h-5 text-brand-400" />
                </div>
                <span className={`badge ${p.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{p.role}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-400 transition-colors">{p.name}</h3>
              {p.description && <p className="text-sm text-surface-400 mb-4 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-4 text-sm text-surface-500 mt-auto">
                <span>{p.memberCount} members</span>
                <span>{p.openTaskCount} open</span>
                <span>{p.taskCount} total</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Project Name</label>
            <input id="project-name" type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="My Awesome Project" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description (optional)</label>
            <textarea id="project-desc" value={description} onChange={e => setDescription(e.target.value)} className="input-field resize-none h-24" placeholder="What's this project about?" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
