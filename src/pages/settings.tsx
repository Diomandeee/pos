import React, { useState, useEffect } from 'react'
import {
  Save,
  RefreshCw,
  AlertTriangle,
  Moon,
  DollarSign,
  Gift,
  Clock,
  User,
  Trash2,
  Download,
  Upload
} from 'lucide-react'

interface SystemPreferences {
  darkMode: boolean
  defaultServiceMode: 'complimentary' | 'paid'
  currency: string
  timeFormat: '12h' | '24h'
  language: string
}

const Settings: React.FC = () => {
  const [preferences, setPreferences] = useState<SystemPreferences>({
    darkMode: false,
    defaultServiceMode: 'paid',
    currency: 'USD',
    timeFormat: '12h',
    language: 'en'
  })
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [showConfirmClearOrders, setShowConfirmClearOrders] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const storedPreferences = localStorage.getItem('systemPreferences')
    if (storedPreferences) {
      setPreferences(JSON.parse(storedPreferences))
    }
  }, [])

  const handlePreferenceChange = (key: keyof SystemPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const savePreferences = () => {
    localStorage.setItem('systemPreferences', JSON.stringify(preferences))
    setMessage({ type: 'success', text: 'Preferences saved successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const resetLocalStorage = () => {
    localStorage.clear()
    setPreferences({
      darkMode: false,
      defaultServiceMode: 'paid',
      currency: 'USD',
      timeFormat: '12h',
      language: 'en'
    })
    setMessage({
      type: 'success',
      text: 'All local storage data has been reset.'
    })
    setTimeout(() => setMessage(null), 3000)
    setShowConfirmReset(false)
  }

  const clearOrderHistory = () => {
    localStorage.removeItem('orders')
    setMessage({ type: 'success', text: 'Order history has been cleared.' })
    setTimeout(() => setMessage(null), 3000)
    setShowConfirmClearOrders(false)
  }

  const exportData = () => {
    const data = {
      preferences: preferences,
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      inventory: JSON.parse(localStorage.getItem('inventory') || '[]')
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'buf-barista-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          localStorage.setItem(
            'systemPreferences',
            JSON.stringify(data.preferences)
          )
          localStorage.setItem('orders', JSON.stringify(data.orders))
          localStorage.setItem('inventory', JSON.stringify(data.inventory))
          setPreferences(data.preferences)
          setMessage({ type: 'success', text: 'Data imported successfully!' })
        } catch (error) {
          setMessage({
            type: 'error',
            text: 'Error importing data. Please check the file format.'
          })
        }
        setTimeout(() => setMessage(null), 3000)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="settings-container">
      <h1 className="page-title">Settings</h1>

      <section className="preferences-section">
        <h2>System Preferences</h2>
        <div className="preference-item">
          <label>
            <Moon size={16} /> Dark Mode
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={(e) =>
                handlePreferenceChange('darkMode', e.target.checked)
              }
            />
          </label>
        </div>
        <div className="preference-item">
          <label>
            <Gift size={16} /> Default Service Mode
            <select
              value={preferences.defaultServiceMode}
              onChange={(e) =>
                handlePreferenceChange('defaultServiceMode', e.target.value)
              }
            >
              <option value="complimentary">Complimentary</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
        <div className="preference-item">
          <label>
            <DollarSign size={16} /> Currency
            <input
              type="text"
              value={preferences.currency}
              onChange={(e) =>
                handlePreferenceChange('currency', e.target.value)
              }
            />
          </label>
        </div>
        <div className="preference-item">
          <label>
            <Clock size={16} /> Time Format
            <select
              value={preferences.timeFormat}
              onChange={(e) =>
                handlePreferenceChange(
                  'timeFormat',
                  e.target.value as '12h' | '24h'
                )
              }
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </label>
        </div>
        <div className="preference-item">
          <label>
            <User size={16} /> Language
            <select
              value={preferences.language}
              onChange={(e) =>
                handlePreferenceChange('language', e.target.value)
              }
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </label>
        </div>
        <button className="save-button" onClick={savePreferences}>
          <Save size={16} /> Save Preferences
        </button>
      </section>

      <section className="data-management-section">
        <h2>Data Management</h2>
        <button
          className="reset-button"
          onClick={() => setShowConfirmReset(true)}
        >
          <RefreshCw size={16} /> Reset All Data
        </button>
        <button
          className="clear-orders-button"
          onClick={() => setShowConfirmClearOrders(true)}
        >
          <Trash2 size={16} /> Clear Order History
        </button>
        <button className="export-button" onClick={exportData}>
          <Download size={16} /> Export Data
        </button>
        <label className="import-button">
          <Upload size={16} /> Import Data
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importData}
          />
        </label>
      </section>

      {showConfirmReset && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Reset</h3>
            <p>
              Are you sure you want to reset all data? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button onClick={resetLocalStorage}>Yes, Reset All Data</button>
              <button onClick={() => setShowConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClearOrders && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Clear Orders</h3>
            <p>
              Are you sure you want to clear all order history? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={clearOrderHistory}>
                Yes, Clear Order History
              </button>
              <button onClick={() => setShowConfirmClearOrders(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? (
            <Save size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message.text}
        </div>
      )}

      <style>{`
        .settings-container {
          font-family: 'Roboto', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 30px;
          background: #f7fafd; /* Soft background for better contrast */
        }

        .page-title {
          font-size: 26px;
          color: #333;
          font-weight: bold;
          margin-bottom: 25px;
        }

        section {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          font-size: 20px;
          color: #444;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .preference-item {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .preference-item label {
          display: flex;
          align-items: center;
          gap: 15px;
          color: #ff9e1c;
          font-size: 16px;
        }

        .preference-item input[type='text'],
        .preference-item select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 15px;
          width: 200px;
        }

        .preference-item input[type='checkbox'] {
          margin-left: 10px;
          transform: scale(1.2); /* Increase the checkbox size */
        }

        button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .save-button {
          background-color: #4caf50;
          color: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .save-button:hover {
          background-color: #45a049;
        }

        .reset-button,
        .clear-orders-button {
          background-color: #e53935;
          color: white;
          margin-top: 20px;
        }

        .reset-button:hover,
        .clear-orders-button:hover {
          background-color: #d32f2f;
        }

        .export-button,
        .import-button {
          background-color: #2196f3;
          color: white;
          margin-top: 20px;
        }

        .export-button:hover,
        .import-button:hover {
          background-color: #1976d2;
          margin-top: 20px;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background-color: #fff;
          padding: 30px;
          border-radius: 12px;
          max-width: 450px;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
        }

        .message {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 15px 25px;
          border-radius: 8px;
          color: white;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .message.success {
          background-color: #4caf50;
        }

        .message.error {
          background-color: #f44336;
        }

        /* New Data Management Button Layout */
        .data-management-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 20px;
          align-items: flex-start;
        }

        .data-management-buttons button {
          width: 100%; /* Buttons take full width */
          max-width: 300px; /* Limit width on large screens */
          justify-content: center;
          margin-top: 20px;
        }

        .data-management-section {
          text-align: center; /* Center section heading */
          padding-top: 20px;
        }

        .data-management-section h2 {
          margin-bottom: 25px;
          font-size: 20px;
          font-weight: 600;
          color: #444;
        }

        .import-export-section {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  )
}

export default Settings
