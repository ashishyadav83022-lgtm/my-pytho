import React, { useState } from 'react';

export default function CompetencyAndApprovals() {
  const [pendingUsers, setPendingUsers] = useState([
    { id: 1, name: 'Dr. Rajesh Verma', email: 'rajesh@capacity.edu', role: 'Trainer', status: 'Pending' },
    { id: 2, name: 'Neha Gupta', email: 'neha@capacity.edu', role: 'Trainee', status: 'Pending' },
  ]);

  const [trainers] = useState([
    { id: 101, name: 'Dr. Rajesh Verma', primarySkill: 'PostgreSQL & Cloud DB', matchedSubject: 'Database Architecture' },
    { id: 102, name: 'Prof. Ananya Roy', primarySkill: 'React & Frontend UX', matchedSubject: 'Web Engineering' },
  ]);

  const handleApproval = (id, newStatus) => {
    setPendingUsers(pendingUsers.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* User Approval & Role Management */}
      <div className="rounded-2xl bg-card border border-theme p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-primary">Pending User Approvals & Role Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Requested Role</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-xs">
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-secondary">
                    No pending approval requests.
                  </td>
                </tr>
              ) : (
                pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-3 font-bold text-primary">{u.name}</td>
                    <td className="py-3 px-3 text-secondary">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="bg-accent/10 text-accent font-bold px-2 py-0.5 rounded text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleApproval(u.id, 'Approved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(u.id, 'Rejected')}
                        className="rounded-lg bg-red-500/10 px-3 py-1 text-[11px] font-bold text-red-500 hover:bg-red-500/20 transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competency Mapping Engine */}
      <div className="rounded-2xl bg-card border border-theme p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-black text-primary">Competency Mapping Engine</h2>
          <p className="text-xs text-secondary">Match domain expert Trainers with appropriate subject modules</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainers.map((t) => (
            <div key={t.id} className="p-4 border border-theme rounded-xl bg-main/40 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-primary">{t.name}</h3>
                <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Matched
                </span>
              </div>
              <p className="text-xs text-secondary">Skill: <span className="text-primary font-medium">{t.primarySkill}</span></p>
              <p className="text-xs text-secondary">Assigned Subject: <span className="text-accent font-bold">{t.matchedSubject}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}