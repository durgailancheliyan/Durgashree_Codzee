import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, X, Save, Trash2 } from 'lucide-react';

type TimeSlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

// Mock data for time slots
const initialTimeSlots: TimeSlot[] = [
  { id: '1', day: 'Monday', startTime: '09:00', endTime: '12:00', isAvailable: true },
  { id: '2', day: 'Monday', startTime: '13:00', endTime: '17:00', isAvailable: true },
  { id: '3', day: 'Tuesday', startTime: '09:00', endTime: '12:00', isAvailable: true },
  { id: '4', day: 'Tuesday', startTime: '13:00', endTime: '17:00', isAvailable: true },
  { id: '5', day: 'Wednesday', startTime: '09:00', endTime: '12:00', isAvailable: true },
  { id: '6', day: 'Thursday', startTime: '09:00', endTime: '12:00', isAvailable: true },
  { id: '7', day: 'Thursday', startTime: '13:00', endTime: '17:00', isAvailable: true },
  { id: '8', day: 'Friday', startTime: '09:00', endTime: '12:00', isAvailable: true },
];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorSchedule: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState<Omit<TimeSlot, 'id'>>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    isAvailable: true,
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToggleAvailability = (id: string) => {
    setTimeSlots(
      timeSlots.map((slot) =>
        slot.id === id ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
  };

  const handleUpdateSlot = () => {
    if (editingSlot) {
      setTimeSlots(
        timeSlots.map((slot) =>
          slot.id === editingSlot.id ? editingSlot : slot
        )
      );
      setEditingSlot(null);
      showSuccessMessage('Schedule updated successfully');
    }
  };

  const handleDeleteSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    showSuccessMessage('Time slot removed');
  };

  const handleAddSlot = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTimeSlots([...timeSlots, { id: newId, ...newSlot }]);
    setIsAddingSlot(false);
    setNewSlot({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
    });
    showSuccessMessage('New time slot added');
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const formatWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday as first day
    startOfWeek.setDate(currentDate.getDate() - diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.toLocaleString('default', { month: 'short' });
    const endMonth = endOfWeek.toLocaleString('default', { month: 'short' });
    
    const startDate = startOfWeek.getDate();
    const endDate = endOfWeek.getDate();
    const year = startOfWeek.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate} - ${endDate}, ${year}`;
    } else {
      return `${startMonth} ${startDate} - ${endMonth} ${endDate}, ${year}`;
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your availability and working hours
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsAddingSlot(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Time Slot
            </button>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccessMessage('')}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {formatWeekRange()}
            </h3>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={handlePrevWeek}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextWeek}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  {editingSlot && editingSlot.id === slot.id ? (
                    // Editing mode
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={editingSlot.day}
                          onChange={(e) => setEditingSlot({ ...editingSlot, day: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        >
                          {weekdays.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={editingSlot.startTime}
                          onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={editingSlot.endTime}
                          onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={editingSlot.isAvailable ? 'available' : 'unavailable'}
                          onChange={(e) => setEditingSlot({ ...editingSlot, isAvailable: e.target.value === 'available' })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={handleUpdateSlot}
                          className="text-cyan-600 hover:text-cyan-900 mr-3"
                        >
                          <Save className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {slot.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          {slot.startTime}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          {slot.endTime}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAvailability(slot.id)}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            slot.isAvailable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {slot.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditSlot(slot)}
                          className="text-cyan-600 hover:text-cyan-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddingSlot && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Time Slot</h3>
              <button
                onClick={() => setIsAddingSlot(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700">
                  Day
                </label>
                <select
                  id="day"
                  value={newSlot.day}
                  onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                >
                  {weekdays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isAvailable"
                  type="checkbox"
                  checked={newSlot.isAvailable}
                  onChange={(e) => setNewSlot({ ...newSlot, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Available for appointments
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddingSlot(false)}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSlot}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Missing Check component definition
const Check = (props: any) => (
  <svg 
    {...props} 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default DoctorSchedule;