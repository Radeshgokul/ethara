import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Plus, FolderKanban, ArrowRight, ListTodo } from 'lucide-react';

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { projectsAPI.list().then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  const allTasks = projects.flatMap(p => p.tasks || []);
  const totalTasks = allTasks.length;
  const openTasks = allTasks.filter(t => t.status !== 'DONE').length;
  const doneTasks = allTasks.filter(t => t.status === 'DONE').length;
  const overdueTasks = allTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length;

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo, bg: 'bg-brand-500/10', textColor: 'text-brand-400' },
    { label: 'Open Tasks', value: openTasks, icon: Clock, bg: 'bg-amber-500/10', textColor: 'text-amber-400' },
    { label: 'Overdue', value: overdueTasks, icon: AlertTriangle, bg: 'bg-red-500/10', textColor: 'text-red-400' },
    { label: 'Completed', value: doneTasks, icon: CheckCircle2, bg: 'bg-emerald-500/10', textColor: 'text-emerald-400' },
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-surface-400">Here's what's happening across your projects</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card-hover p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${s.bg}`}><Icon className={`w-5 h-5 ${s.textColor}`} /></div>
                <TrendingUp className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-sm text-surface-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your Projects</h2>
        <Link to="/projects" className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors">View all<ArrowRight className="w-4 h-4" /></Link>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FolderKanban className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-surface-400 mb-6">Create your first project to get started</p>
          <button onClick={() => navigate('/projects')} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="glass-card-hover p-6 group block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center border border-brand-500/10">
                  <FolderKanban className="w-5 h-5 text-brand-400" />
                </div>
                <span className={`badge ${p.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{p.role}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-400 transition-colors">{p.name}</h3>
              {p.description && <p className="text-sm text-surface-400 mb-4 line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-4 text-sm text-surface-500">
                <span>{p.memberCount} members</span>
                <span>{p.openTaskCount} open tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
