import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { StatusBadge, PriorityBadge, RoleBadge, Avatar, isOverdue, formatDate } from '../components/Badges';
import toast from 'react-hot-toast';
import { ArrowLeft, Settings, Trash2, Plus, Users, KanbanSquare, Filter, UserPlus, Crown, X, Calendar, AlertCircle } from 'lucide-react';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  // Task state
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [taskSaving, setTaskSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Member state
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  // Edit project
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => { fetchProject(); }, [id]);

  const fetchProject = async () => {
    try { const r = await projectsAPI.get(id); setProject(r.data); } catch (e) { toast.error('Failed to load project'); navigate('/projects'); } finally { setLoading(false); }
  };

  const isAdmin = project?.currentUserRole === 'ADMIN';

  // Task handlers
  const openNewTask = () => { setEditingTask(null); setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' }); setTaskModal(true); };
  const openEditTask = (t) => { setEditingTask(t); setTaskForm({ title: t.title, description: t.description || '', status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '', assigneeId: t.assigneeId || '' }); setTaskModal(true); };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) { toast.error('Title is required'); return; }
    setTaskSaving(true);
    try {
      const data = { ...taskForm, title: taskForm.title.trim(), assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null };
      if (editingTask) { await tasksAPI.update(id, editingTask.id, data); toast.success('Task updated'); }
      else { await tasksAPI.create(id, data); toast.success('Task created'); }
      setTaskModal(false); fetchProject();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save task'); }
    finally { setTaskSaving(false); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id, taskId); toast.success('Task deleted'); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const updateTaskStatus = async (taskId, status) => {
    try { await tasksAPI.update(id, taskId, { status }); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // Member handlers
  const addMember = async (e) => {
    e.preventDefault();
    if (!memberEmail) return;
    setAddingMember(true);
    try { await projectsAPI.addMember(id, { email: memberEmail, role: memberRole }); toast.success('Member added!'); setMemberEmail(''); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAddingMember(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await projectsAPI.removeMember(id, userId); toast.success('Member removed'); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const changeRole = async (userId, role) => {
    try { await projectsAPI.changeMemberRole(id, userId, { role }); toast.success('Role updated'); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // Edit project
  const openEditProject = () => { setEditName(project.name); setEditDesc(project.description || ''); setEditModal(true); };
  const saveProject = async (e) => {
    e.preventDefault();
    try { await projectsAPI.update(id, { name: editName, description: editDesc }); toast.success('Project updated'); setEditModal(false); fetchProject(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try { await projectsAPI.delete(id); toast.success('Project deleted'); navigate('/projects'); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading project..." />;
  if (!project) return null;

  // Filter tasks
  const tasks = (project.tasks || []).filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = {};
  STATUSES.forEach(s => { tasksByStatus[s] = tasks.filter(t => t.status === s); });

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-surface-400 text-sm mt-1">{project.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={openEditProject} className="btn-ghost flex items-center gap-2"><Settings className="w-4 h-4" />Edit</button>
            <button onClick={deleteProject} className="btn-danger flex items-center gap-2 px-4 py-2"><Trash2 className="w-4 h-4" />Delete</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-900/50 p-1 rounded-xl w-fit">
        {[{ key: 'tasks', label: 'Tasks', icon: KanbanSquare }, { key: 'members', label: 'Members', icon: Users }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-brand-500/15 text-brand-400' : 'text-surface-400 hover:text-surface-200'}`}>
            <t.icon className="w-4 h-4" />{t.label}
            <span className="ml-1 text-xs opacity-60">({t.key === 'tasks' ? project.tasks?.length || 0 : project.members?.length || 0})</span>
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <>
          {/* Filters + Add */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto py-2 text-sm"><option value="">All Status</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input-field w-auto py-2 text-sm"><option value="">All Priority</option>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
            {(filterStatus || filterPriority) && <button onClick={() => { setFilterStatus(''); setFilterPriority(''); }} className="text-sm text-surface-400 hover:text-white transition-colors">Clear filters</button>}
            <div className="flex-1" />
            <button onClick={openNewTask} className="btn-primary flex items-center gap-2 text-sm" id="add-task-btn"><Plus className="w-4 h-4" />Add Task</button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUSES.map(status => (
              <div key={status} className="kanban-column">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'TODO' ? 'bg-surface-400' : status === 'IN_PROGRESS' ? 'bg-blue-400' : status === 'IN_REVIEW' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-sm font-medium text-surface-300">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="text-xs text-surface-500 bg-surface-800 px-2 py-0.5 rounded-full">{tasksByStatus[status].length}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {tasksByStatus[status].map(task => (
                    <div key={task.id} onClick={() => openEditTask(task)} className="glass-card p-4 cursor-pointer hover:border-brand-500/30 transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors flex-1 mr-2">{task.title}</h4>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      {task.description && <p className="text-xs text-surface-500 mb-3 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assignee ? <Avatar name={task.assignee.name} size="sm" /> : <div className="w-7 h-7 rounded-full border-2 border-dashed border-surface-600 flex items-center justify-center"><Plus className="w-3 h-3 text-surface-600" /></div>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue(task.dueDate, task.status) && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                          {task.dueDate && <span className={`text-xs ${isOverdue(task.dueDate, task.status) ? 'text-red-400' : 'text-surface-500'}`}>{formatDate(task.dueDate)}</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="mt-3 pt-2 border-t border-surface-800/50 flex justify-end">
                          <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {tasksByStatus[status].length === 0 && <div className="text-center py-8 text-surface-600 text-sm">No tasks</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <div className="max-w-2xl">
          {isAdmin && (
            <form onSubmit={addMember} className="glass-card p-6 mb-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-brand-400" />Add Member</h3>
              <div className="flex gap-3">
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className="input-field flex-1" placeholder="Enter email address" />
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)} className="input-field w-auto"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
                <button type="submit" disabled={addingMember} className="btn-primary whitespace-nowrap">{addingMember ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          )}
          <div className="space-y-2">
            {project.members?.map(m => (
              <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                <Avatar name={m.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.user.name} {m.user.id === user.id && <span className="text-surface-500">(you)</span>}</p>
                  <p className="text-xs text-surface-500 truncate">{m.user.email}</p>
                </div>
                <RoleBadge role={m.role} />
                {isAdmin && m.user.id !== user.id && (
                  <div className="flex items-center gap-2">
                    <select value={m.role} onChange={e => changeRole(m.userId, e.target.value)} className="input-field w-auto py-1.5 text-xs"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>
                    <button onClick={() => removeMember(m.userId)} className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editingTask ? 'Edit Task' : 'New Task'} size="md">
        <form onSubmit={saveTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Title</label>
            <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="input-field" placeholder="Task title" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="input-field resize-none h-20" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className="input-field">{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="input-field">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Due Date</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Assignee</label>
              <select value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })} className="input-field">
                <option value="">Unassigned</option>
                {project.members?.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setTaskModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={taskSaving} className="btn-primary">{taskSaving ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Project">
        <form onSubmit={saveProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Name</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="input-field resize-none h-24" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
