import React from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader, Spinner, Modal } from '../components';
import { getToken, clearToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const TABS = ['Routes', 'Vehicles', 'Drivers', 'Bookings', 'Payments', 'Reports', 'Settings'];

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = React.useState('Routes');
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState(null);
  const [formData, setFormData] = React.useState({});

  // Fetch data based on tab
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = getToken();
        let endpoint = '/api/admin/';
        if (tab === 'Routes') endpoint += 'routes';
        else if (tab === 'Vehicles') endpoint += 'vehicles';
        else if (tab === 'Drivers') endpoint += 'drivers';
        else if (tab === 'Bookings') endpoint += 'bookings';
        else if (tab === 'Payments') endpoint += 'payments';
        else if (tab === 'Reports') endpoint += 'reports';

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data.data || []);
      } catch (err) {
        if (err?.response?.status === 401) {
          clearToken();
          nav('/admin/login');
        } else {
          toast.error('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    }

    if (tab !== 'Settings') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [tab, nav]);

  const filtered = data.filter(item => {
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  function handleEdit(item) {
    setEditItem(item);
    setFormData(item);
    setModalOpen(true);
  }

  function handleDelete(item) {
    if (window.confirm(`Delete ${item.name || item.id}?`)) {
      deleteItem(item.id);
    }
  }

  async function deleteItem(id) {
    try {
      const token = getToken();
      let endpoint = `/api/admin/`;
      if (tab === 'Routes') endpoint += `routes/${id}`;
      else if (tab === 'Vehicles') endpoint += `vehicles/${id}`;
      else if (tab === 'Drivers') endpoint += `drivers/${id}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data.filter(item => item.id !== id));
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error('Delete failed');
    }
  }

  function handleLogout() {
    clearToken();
    nav('/admin/login');
  }

  if (tab === 'Settings') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ToastContainer />
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white p-4">
          <h2 className="text-2xl font-bold mb-8">HuteFast Admin</h2>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left py-2 px-4 rounded mb-2 ${tab === t ? 'bg-primary' : 'hover:bg-gray-800'}`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded mt-8 bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Main */}
        <div className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8">Settings</h2>
          <div className="bg-white p-8 rounded shadow-md max-w-md">
            <div className="mb-6">
              <label className="block font-bold mb-2">Admin Email</label>
              <input type="email" className="w-full p-2 border rounded" disabled />
            </div>
            <div className="mb-6">
              <label className="block font-bold mb-2">Password</label>
              <input type="password" placeholder="Enter new password" className="w-full p-2 border rounded" />
            </div>
            <button className="bg-primary text-white px-6 py-2 rounded">Update Settings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ToastContainer />
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 fixed h-screen">
        <h2 className="text-2xl font-bold mb-8">HuteFast Admin</h2>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`w-full text-left py-2 px-4 rounded mb-2 ${tab === t ? 'bg-primary' : 'hover:bg-gray-800'}`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="w-full text-left py-2 px-4 rounded mt-8 bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{tab}</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border rounded w-48"
          />
        </div>

        {loading ? (
          <Loader message={`Loading ${tab}...`} />
        ) : (
          <div className="bg-white rounded shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {Object.keys(filtered[0] || {})
                    .filter(k => k !== 'id')
                    .map(key => (
                      <th key={key} className="text-left p-4 font-bold">
                        {key}
                      </th>
                    ))}
                  <th className="text-left p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {Object.entries(item)
                      .filter(([k]) => k !== 'id')
                      .map(([k, v], vIdx) => (
                        <td key={vIdx} className="p-4 text-sm">
                          {typeof v === 'object' ? JSON.stringify(v).substring(0, 50) : String(v).substring(0, 50)}
                        </td>
                      ))}
                    <td className="p-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-primary text-white px-3 py-1 rounded text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-8 text-center text-gray-600">No {tab.toLowerCase()} found</div>}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Edit {tab}</h3>
            <div className="space-y-4 mb-6">
              {Object.keys(formData)
                .filter(k => k !== 'id')
                .map(key => (
                  <div key={key}>
                    <label className="block text-sm font-bold mb-1">{key}</label>
                    <input
                      type="text"
                      value={formData[key] || ''}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button className="flex-1 bg-primary text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
