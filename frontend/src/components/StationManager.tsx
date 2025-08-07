import React, { useState, useEffect } from 'react';
import { Station, CreateStationRequest, UpdateStationRequest } from '../types/api';
import { apiClient } from '../services/api';

const StationManager: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const stationsData = await apiClient.getStations();
      setStations(stationsData);
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async (stationData: CreateStationRequest) => {
    try {
      await apiClient.createStation(stationData);
      await loadStations();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create station:', error);
    }
  };

  const handleUpdateStation = async (stationId: number, stationData: UpdateStationRequest) => {
    try {
      await apiClient.updateStation(stationId, stationData);
      await loadStations();
      setEditingStation(null);
    } catch (error) {
      console.error('Failed to update station:', error);
    }
  };

  const handleDeleteStation = async (stationId: number) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        await apiClient.deleteStation(stationId);
        await loadStations();
      } catch (error) {
        console.error('Failed to delete station:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6">Loading stations...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Station Management</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-radar-600 text-white rounded-md hover:bg-radar-700"
        >
          Add New Station
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Elevation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stations.map((station) => (
              <tr key={station.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {station.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {station.elevation ? `${station.elevation}m` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    station.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {station.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingStation(station)}
                    className="text-radar-600 hover:text-radar-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStation(station.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateStationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateStation}
        />
      )}

      {editingStation && (
        <EditStationModal
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onSubmit={(stationData) => handleUpdateStation(editingStation.id, stationData)}
        />
      )}
    </div>
  );
};

interface CreateStationModalProps {
  onClose: () => void;
  onSubmit: (stationData: CreateStationRequest) => void;
}

const CreateStationModal: React.FC<CreateStationModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateStationRequest>({
    name: '',
    latitude: 0,
    longitude: 0,
    elevation: undefined,
    distance_to_coast: undefined,
    status: 'ACTIVE',
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Station</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Station Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="any"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="any"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Elevation (m)</label>
            <input
              type="number"
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.elevation || ''}
              onChange={(e) => setFormData({ ...formData, elevation: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Distance to Coast (km)</label>
            <input
              type="number"
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.distance_to_coast || ''}
              onChange={(e) => setFormData({ ...formData, distance_to_coast: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-radar-600 text-white rounded-md hover:bg-radar-700"
            >
              Create Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditStationModalProps {
  station: Station;
  onClose: () => void;
  onSubmit: (stationData: UpdateStationRequest) => void;
}

const EditStationModal: React.FC<EditStationModalProps> = ({ station, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<UpdateStationRequest>({
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
    elevation: station.elevation,
    distance_to_coast: station.distance_to_coast,
    status: station.status,
    note: station.note
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Station: {station.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Station Name</label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.status || station.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-radar-600 text-white rounded-md hover:bg-radar-700"
            >
              Update Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationManager;
