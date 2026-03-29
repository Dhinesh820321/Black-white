import { useState, useEffect } from 'react';
import { employeesAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getRoleColor, getStatusColor } from '../utils/helpers';
import { Plus, Edit, Trash2, User } from 'lucide-react';

const DEFAULT_EMPLOYEES = [];
const DEFAULT_BRANCHES = [];
const DEFAULT_FORM_DATA = { name: '', role: 'stylist', phone: '', password: '', branch_id: '', salary: 0, status: 'active' };

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, branchRes] = await Promise.all([
        employeesAPI.getAll(),
        branchesAPI.getAll()
      ]);
      if (empRes?.data?.success && Array.isArray(empRes.data.data)) {
        setEmployees(empRes.data.data);
      }
      if (branchRes?.data?.success && Array.isArray(branchRes.data.data)) {
        setBranches(branchRes.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const { password, ...updateData } = formData;
        await employeesAPI.update(editingEmployee.id, password ? formData : updateData);
      } else {
        await employeesAPI.create(formData);
      }
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, role: emp.role, phone: emp.phone, password: '',
      branch_id: emp.branch_id || '', salary: emp.salary, status: emp.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this employee?')) {
      await employeesAPI.delete(id);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage your team members</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Branch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Salary</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(employees || []).map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(emp.role)}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.branch_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">₹{emp.salary?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{editingEmployee ? 'Edit' : 'Add'} Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="empName" className="label">Name</label>
                <input id="empName" name="name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="empRole" className="label">Role</label>
                  <select id="empRole" name="role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="stylist">Stylist</option>
                    <option value="helper">Helper</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="empPhone" className="label">Phone</label>
                  <input id="empPhone" name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label htmlFor="empPassword" className="label">Password {editingEmployee && '(leave blank to keep current)'}</label>
                <input id="empPassword" name="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input" {...(!editingEmployee && { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="empBranch" className="label">Branch</label>
                  <select id="empBranch" name="branch_id" value={formData.branch_id} onChange={(e) => setFormData({...formData, branch_id: e.target.value})} className="input">
                    <option value="">Select Branch</option>
                    {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="empSalary" className="label">Salary</label>
                  <input id="empSalary" name="salary" type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label htmlFor="empStatus" className="label">Status</label>
                <select id="empStatus" name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingEmployee ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
