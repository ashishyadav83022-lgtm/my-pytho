import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // 1. Mock Users State
  const [users, setUsers] = useState([
    { id: 101, name: 'Rohan Sharma', email: 'rohan.s@capacity.edu', role: 'student', status: 'Pending', joinedDate: '2026-09-04', department: 'BCA' },
    { id: 102, name: 'Dr. Rajesh Verma', email: 'rajesh.trainer@capacity.edu', role: 'trainer', status: 'Active', joinedDate: '2026-08-15', department: 'Computer Science' },
    { id: 103, name: 'Aman Deep', email: 'amandeep@capacity.edu', role: 'student', status: 'Active', joinedDate: '2026-08-20', department: 'BCA' },
    { id: 104, name: 'Dr. Suresh Kumar', email: 'suresh.k@capacity.edu', role: 'admin', status: 'Active', joinedDate: '2026-07-01', department: 'Administration' },
    { id: 105, name: 'Ananya Roy', email: 'ananya.r@capacity.edu', role: 'student', status: 'Pending', joinedDate: '2026-09-05', department: 'BCA' },
  ]);

  // 2. Competency Mappings State
  const [competencyMappings, setCompetencyMappings] = useState([
    { id: 1, trainerName: 'Dr. Rajesh Verma', skill: 'PostgreSQL & Databases', subject: 'Database Systems' },
  ]);

  // 3. Submitted Student Assignments State
  const [submissions, setSubmissions] = useState([
    {
      id: 101,
      studentName: 'Rahul Sharma',
      course: 'DBMS (BCA1003)',
      title: 'Database Management Systems - ER Diagram Assignment',
      link: 'https://github.com/rahul/dbms-er-diagram',
      submittedAt: '2026-09-04',
      status: 'Submitted',
      grade: '',
    },
    {
      id: 102,
      studentName: 'Priya Verma',
      course: 'Web Dev (BCA1004)',
      title: 'Full Stack Web Architecture - Express API Docs',
      link: 'https://drive.google.com/file/d/express-docs',
      submittedAt: '2026-09-03',
      status: 'Graded',
      grade: '88 / 100',
    },
  ]);

  // 4. Course Feedback Received State
  const [feedbacks] = useState([
    {
      id: 1,
      studentName: 'Aman Gupta',
      courseTitle: 'PostgreSQL Architecture & Indexing',
      rating: 5,
      comment: 'Very clear explanation on indexing techniques and B-Tree structures!',
      date: '2026-09-02',
    },
    {
      id: 2,
      studentName: 'Sonia Mehta',
      courseTitle: 'React Performance Optimization',
      rating: 4,
      comment: 'Good hands-on examples with useMemo and useCallback.',
      date: '2026-09-01',
    },
  ]);

  // Modal States
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ trainerName: '', skill: '', subject: '' });

  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [inputGrade, setInputGrade] = useState('');

  // Tab & Search States
  const [userTab, setUserTab] = useState('All');
  const [evalTab, setEvalTab] = useState('assignments');
  const [searchQuery, setSearchQuery] = useState('');

  // Active trainers list for dynamic dropdown selection
  const activeTrainers = useMemo(() => {
    return users.filter((u) => u.role === 'trainer' && u.status === 'Active');
  }, [users]);

  // Handlers for User Management
  const handleStatusChange = (userId, newStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the system?')) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  // Handlers for Competency Mapping
  const handleAddMapping = (e) => {
    e.preventDefault();
    if (!newMapping.trainerName || !newMapping.skill || !newMapping.subject) return;

    setCompetencyMappings((prev) => [...prev, { id: Date.now(), ...newMapping }]);
    setNewMapping({ trainerName: '', skill: '', subject: '' });
    setIsCompetencyModalOpen(false);
  };

  const handleDeleteMapping = (id) => {
    setCompetencyMappings((prev) => prev.filter((item) => item.id !== id));
  };

  // Handlers for Grading
  const openGradingModal = (sub) => {
    setSelectedSub(sub);
    setInputGrade(sub.grade || '');
    setIsGradeModalOpen(true);
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!inputGrade.trim()) return;

    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === selectedSub.id
          ? { ...item, status: 'Graded', grade: inputGrade }
          : item
      )
    );

    setIsGradeModalOpen(false);
    setInputGrade('');
  };

  // Filtered Users Memoization
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchesTab =
        userTab === 'All'
          ? true
          : userTab === 'Pending'
          ? u.status === 'Pending'
          : u.role === userTab.toLowerCase();

      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.department.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [users, userTab, searchQuery]);

  // Metrics
  const metrics = useMemo(() => ({
    totalUsers: users.length,
    pendingApprovals: users.filter((u) => u.status === 'Pending').length,
    totalStudents: users.filter((u) => u.role === 'student').length,
    totalTrainers: users.filter((u) => u.role === 'trainer' || u.role === 'admin').length,
    pendingReviews: submissions.filter((s) => s.status === 'Submitted').length,
  }), [users, submissions]);

  return (
    <div className="min-h-screen bg-main text-primary transition-colors flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-theme bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center font-black text-white text-sm">
            CC
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary leading-none">CapacityConnect</h1>
            <span className="text-[10px] text-secondary uppercase tracking-wider">Executive Admin Console</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-primary">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-accent font-semibold uppercase">{user?.role || 'Admin'}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="Total Users" value={metrics.totalUsers} subtext="Active Accounts" color="emerald" />
          <MetricCard title="Pending Approvals" value={metrics.pendingApprovals} subtext="User Review Needed" color="amber" />
          <MetricCard title="Total Students" value={metrics.totalStudents} subtext="Enrolled Students" />
          <MetricCard title="Trainers & Admins" value={metrics.totalTrainers} subtext="Faculty Staff" color="accent" />
          <MetricCard title="Pending Grading" value={metrics.pendingReviews} subtext="Assignments to Review" color="amber" />
        </div>

        {/* 1. User Management Panel */}
        <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme pb-4">
            <div>
              <h2 className="text-base font-black">User Access & Role Management</h2>
              <p className="text-xs text-secondary">Approve registrations, assign roles, and manage system permissions</p>
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search by name, email, or dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-main border border-theme rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'Student', 'Trainer', 'Admin'].map((tab) => (
              <button
                key={tab}
                onClick={() => setUserTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  userTab === tab
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-main border-theme text-secondary hover:text-primary'
                }`}
              >
                {tab}
                {tab === 'Pending' && metrics.pendingApprovals > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {metrics.pendingApprovals}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme text-[11px] font-bold text-secondary uppercase tracking-wider bg-main/50">
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role Allocation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-secondary text-xs">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-main/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-primary">{u.name}</div>
                        <div className="text-[11px] text-secondary">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-secondary">{u.department}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-main border border-theme rounded-lg px-2.5 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent capitalize"
                        >
                          <option value="student">Student</option>
                          <option value="trainer">Trainer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            u.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'Active')}
                              className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold hover:opacity-90 transition"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-red-500 hover:text-white transition"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Submissions & Feedbacks Evaluation Panel */}
        <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
            <div>
              <h2 className="text-base font-black">Evaluation & Course Feedback Portal</h2>
              <p className="text-xs text-secondary">Evaluate student coursework and inspect student course ratings</p>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-main border border-theme p-1 rounded-xl gap-1">
              <button
                onClick={() => setEvalTab('assignments')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  evalTab === 'assignments' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Submissions
              </button>
              <button
                onClick={() => setEvalTab('feedbacks')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  evalTab === 'feedbacks' ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Student Feedbacks
              </button>
            </div>
          </div>

          {/* TAB 1: Student Submissions */}
          {evalTab === 'assignments' && (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-main border border-theme rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-md border border-accent/20">
                        {sub.course}
                      </span>
                      <span className="text-[10px] font-semibold text-secondary">Student: {sub.studentName}</span>
                    </div>
                    <h4 className="text-xs font-bold text-primary">{sub.title}</h4>
                    <a
                      href={sub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline inline-block"
                    >
                      🔗 View Work Link
                    </a>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        sub.status === 'Submitted'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {sub.status} {sub.grade ? `(${sub.grade})` : ''}
                    </span>

                    <button
                      onClick={() => openGradingModal(sub)}
                      className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition shadow-sm"
                    >
                      {sub.status === 'Graded' ? 'Update Grade' : 'Assign Grade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Student Course Feedbacks */}
          {evalTab === 'feedbacks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((item) => (
                <div key={item.id} className="p-4 border border-theme rounded-xl bg-main/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary">{item.studentName}</span>
                    <span className="text-xs font-bold text-amber-400">★ {item.rating} / 5</span>
                  </div>
                  <h4 className="text-xs font-bold text-primary">{item.courseTitle}</h4>
                  <p className="text-xs text-secondary italic bg-card/60 p-2.5 rounded-lg border border-theme/50">
                    "{item.comment}"
                  </p>
                  <div className="text-[10px] text-secondary text-right">{item.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Competency Mapping Panel */}
        <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-primary">Competency Mapping Engine</h2>
              <p className="text-xs text-secondary">Match domain expert Trainers with relevant subjects</p>
            </div>
            <button
              onClick={() => setIsCompetencyModalOpen(true)}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
            >
              + Add Mapping
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {competencyMappings.map((item) => (
              <div key={item.id} className="p-4 border border-theme rounded-xl bg-main/40 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-primary">{item.trainerName}</h3>
                  <p className="text-[11px] text-secondary">
                    Skill: <span className="text-primary font-medium">{item.skill}</span>
                  </p>
                  <p className="text-[11px] text-secondary">
                    Mapped Subject: <span className="text-accent font-bold">{item.subject}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMapping(item.id)}
                  className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition"
                >
                  Unmap
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal 1: Competency Mapping */}
      {isCompetencyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-theme rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-black text-primary">New Competency Mapping</h3>
            <form onSubmit={handleAddMapping} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Select Trainer</label>
                <select
                  value={newMapping.trainerName}
                  onChange={(e) => setNewMapping({ ...newMapping, trainerName: e.target.value })}
                  className="w-full bg-main border border-theme rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">Select an active trainer...</option>
                  {activeTrainers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Primary Skill / Domain</label>
                <input
                  type="text"
                  placeholder="e.g. PostgreSQL & Cloud DB"
                  value={newMapping.skill}
                  onChange={(e) => setNewMapping({ ...newMapping, skill: e.target.value })}
                  className="w-full bg-main border border-theme rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Mapped Subject / Course</label>
                <input
                  type="text"
                  placeholder="e.g. Database Systems"
                  value={newMapping.subject}
                  onChange={(e) => setNewMapping({ ...newMapping, subject: e.target.value })}
                  className="w-full bg-main border border-theme rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompetencyModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-secondary hover:bg-main transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-accent text-white hover:opacity-90 transition"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Grading Modal */}
      {isGradeModalOpen && selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-theme rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{selectedSub.studentName}</span>
                <h3 className="text-sm font-black text-primary">{selectedSub.title}</h3>
              </div>
              <button onClick={() => setIsGradeModalOpen(false)} className="text-secondary hover:text-primary font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">
                  Enter Marks / Grade (e.g., 90 / 100 or A+)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 85 / 100"
                  value={inputGrade}
                  onChange={(e) => setInputGrade(e.target.value)}
                  className="w-full bg-main border border-theme rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-theme text-secondary hover:bg-main transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-accent text-white hover:opacity-90 transition shadow-sm"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Metric Card Helper
function MetricCard({ title, value, subtext, color }) {
  const colorClasses = {
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    accent: 'text-accent',
  };

  const textColor = colorClasses[color] || 'text-primary';

  return (
    <div className="bg-card border border-theme rounded-2xl p-5 shadow-sm">
      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{title}</span>
      <div className={`text-2xl font-black mt-1 ${textColor}`}>{value}</div>
      <div className="text-[11px] text-secondary mt-1">{subtext}</div>
    </div>
  );
}