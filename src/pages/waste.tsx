import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Trash2,
  Plus,
  Coffee,
  Package,
  Save,
  AlertTriangle,
  Download,
  Search,
  X,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface WasteItem {
  id: string
  itemName: string
  category: string
  quantity: number
  reason: string
  timestamp: string
  cost: number
  notes: string
  reportedBy: string
}

interface WasteCategory {
  name: string
  items: string[]
  unit: string
  averageCost: number
}

interface Message {
  type: 'success' | 'error'
  text: string
}

const wasteCategories: WasteCategory[] = [
  {
    name: 'Drinks',
    items: ['Hot Coffee', 'Iced Coffee', 'Latte', 'Espresso', 'Tea'],
    unit: 'cups',
    averageCost: 3.5
  },
  {
    name: 'Milk',
    items: ['Whole Milk', '2% Milk', 'Almond Milk', 'Oat Milk', 'Soy Milk'],
    unit: 'oz',
    averageCost: 0.25
  },
  {
    name: 'Food',
    items: ['Pastries', 'Sandwiches', 'Cookies', 'Muffins'],
    unit: 'pieces',
    averageCost: 4
  },
  {
    name: 'Supplies',
    items: ['Cups', 'Lids', 'Straws', 'Napkins', 'Sleeves'],
    unit: 'pieces',
    averageCost: 0.15
  },
  {
    name: 'Syrups',
    items: ['Vanilla', 'Caramel', 'Hazelnut', 'Chocolate'],
    unit: 'pumps',
    averageCost: 0.3
  }
]

const commonReasons = [
  'Expired',
  'Damaged',
  'Customer Return',
  'Made Incorrectly',
  'Quality Issues',
  'Spilled',
  'Training'
]

const WasteManagement: React.FC = () => {
  const [wasteLog, setWasteLog] = useState<WasteItem[]>([])
  const [filteredWaste, setFilteredWaste] = useState<WasteItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  const [formData, setFormData] = useState<Partial<WasteItem>>({
    itemName: '',
    category: wasteCategories[0].name,
    quantity: 1,
    reason: '',
    notes: '',
    reportedBy: ''
  })

  useEffect(() => {
    const savedWasteLog = localStorage.getItem('wasteLog')
    if (savedWasteLog) {
      setWasteLog(JSON.parse(savedWasteLog))
    }
  }, [])

  const saveWasteLog = useCallback((newLog: WasteItem[]) => {
    localStorage.setItem('wasteLog', JSON.stringify(newLog))
    setWasteLog(newLog)
  }, [])

  useEffect(() => {
    let filtered = [...wasteLog]

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(search) ||
          item.reason.toLowerCase().includes(search) ||
          item.notes.toLowerCase().includes(search)
      )
    }

    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59)

    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= startDate && itemDate <= endDate
    })

    setFilteredWaste(filtered)
  }, [wasteLog, selectedCategory, searchTerm, dateRange])

  const stats = useMemo(() => {
    const totalItems = filteredWaste.reduce(
      (sum, item) => sum + item.quantity,
      0
    )

    const totalCost = filteredWaste.reduce((sum, item) => sum + item.cost, 0)

    const categoryBreakdown = filteredWaste.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

    const topReasons = filteredWaste.reduce((acc, item) => {
      acc[item.reason] = (acc[item.reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalItems,
      totalCost,
      categoryBreakdown,
      topReasons: Object.entries(topReasons)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    }
  }, [filteredWaste])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.itemName || !formData.category || !formData.reason) {
      showMessage('Please fill in all required fields', 'error')
      return
    }

    const category = wasteCategories.find(
      (cat) => cat.name === formData.category
    )

    const newItem: WasteItem = {
      id: Date.now().toString(),
      itemName: formData.itemName,
      category: formData.category || '',
      quantity: formData.quantity || 1,
      reason: formData.reason,
      timestamp: new Date().toISOString(),
      cost: (category?.averageCost || 0) * (formData.quantity || 1),
      notes: formData.notes || '',
      reportedBy: formData.reportedBy || ''
    }

    const updatedLog = [newItem, ...wasteLog]
    saveWasteLog(updatedLog)
    setIsModalOpen(false)
    showMessage('Waste item logged successfully', 'success')

    setFormData({
      itemName: '',
      category: wasteCategories[0].name,
      quantity: 1,
      reason: '',
      notes: '',
      reportedBy: ''
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(wasteLog, null, 2)
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `waste-log-${format(
      new Date(),
      'yyyy-MM-dd'
    )}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    showMessage('Waste log exported successfully', 'success')
  }

  return (
    <div className="waste-container">
      <header className="header">
        <h1 className="page-title">Waste Management</h1>
        <div className="header-actions">
          <button onClick={() => setIsModalOpen(true)} className="add-button">
            <Plus size={16} /> Log Waste
          </button>
          <button onClick={handleExport} className="export-button">
            <Download size={16} /> Export Log
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Trash2 size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Items Wasted</h3>
            <p className="stat-value">{stats.totalItems}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Cost</h3>
            <p className="stat-value">${stats.totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="search-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search waste log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="All">All Categories</option>
          {wasteCategories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="date-range">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                start: e.target.value
              }))
            }
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                end: e.target.value
              }))
            }
            className="date-input"
          />
        </div>
      </div>

      <div className="waste-table-container">
        <table className="waste-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Reason</th>
              <th>Cost</th>
              <th>Reported By</th>
            </tr>
          </thead>
          <tbody>
            {filteredWaste.map((item) => (
              <tr key={item.id}>
                <td>{format(new Date(item.timestamp), 'MM/dd/yyyy HH:mm')}</td>
                <td>{item.itemName}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>{item.reason}</td>
                <td>${item.cost.toFixed(2)}</td>
                <td>{item.reportedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Log Waste Item</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Category*</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        itemName: ''
                      })
                    }
                    required
                  >
                    {wasteCategories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Item*</label>
                  <select
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        itemName: e.target.value
                      })
                    }
                    required
                  >
                    <option value="">Select Item</option>
                    {wasteCategories
                      .find((cat) => cat.name === formData.category)
                      ?.items.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity*</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value)
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Reason*</label>
                  <select
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reason: e.target.value
                      })
                    }
                    required
                  >
                    <option value="">Select Reason</option>
                    {commonReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reported By</label>
                  <input
                    type="text"
                    value={formData.reportedBy || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reportedBy: e.target.value
                      })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notes: e.target.value
                      })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cancel-button"
                >
                  <X size={16} /> Cancel
                </button>
                <button type="submit" className="save-button">
                  <Save size={16} /> Log Waste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className={`notification ${message.type}`}>
          {message.type === 'success' ? (
            <Check size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div className="quick-actions">
        <Link href="/pos" className="action-button">
          <Coffee size={20} /> Go to POS
        </Link>
      </div>

      <style>
        {`
        .waste-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-title {
          font-size: 24px;
          color: #4a90e2;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .add-button,
        .export-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          color: white;
        }

        .add-button {
          background-color: #28a745;
        }

        .add-button:hover {
          background-color: #218838;
        }

        .export-button {
          background-color: #17a2b8;
        }

        .export-button:hover {
          background-color: #138496;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .stat-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
        }

        .stat-icon {
          background-color: #e9ecef;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }

        .stat-content h3 {
          font-size: 14px;
          color: #6c757d;
          margin: 0 0 5px 0;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #4a90e2;
          margin: 0;
        }

        .filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          background-color: white;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #ddd;
          min-width: 200px;
        }

        .search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .category-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 150px;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .waste-table-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
          margin-bottom: 20px;
        }

        .waste-table {
          width: 100%;
          border-collapse: collapse;
        }

        .waste-table th {
          background-color: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          color: #495057;
          border-bottom: 2px solid #dee2e6;
        }

        .waste-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
        }

        .waste-table tr:hover {
          background-color: #f8f9fa;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #495057;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          color: #495057;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-button,
        .save-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          color: white;
        }

        .cancel-button {
          background-color: #6c757d;
        }

        .cancel-button:hover {
          background-color: #5a6268;
        }

        .save-button {
          background-color: #28a745;
        }

        .save-button:hover {
          background-color: #218838;
        }

        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: gap: 10px;
          color: white;
          animation: slideIn 0.3s ease-out;
          z-index: 1000;
        }

        .notification.success {
          background-color: #28a745;
        }

        .notification.error {
          background-color: #dc3545;
        }

        .quick-actions {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 20px;
          background-color: #4a90e2;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }

        .action-button:hover {
          background-color: #357abd;
        }

        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 15px;
          }

          .header-actions {
            flex-direction: column;
            width: 100%;
          }

          .add-button,
          .export-button {
            width: 100%;
            justify-content: center;
          }

          .filters {
            flex-direction: column;
          }

          .search-container {
            width: 100%;
          }

          .date-range {
            width: 100%;
            justify-content: space-between;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 15px;
          }

          .waste-table {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .waste-table-container {
            margin: 0 -20px;
            width: calc(100% + 40px);
            border-radius: 0;
          }

          .modal-content {
            padding: 16px;
          }

          .quick-actions {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
            justify-content: center;
          }
        }
        `}
      </style>
    </div>
  )
}

export default WasteManagement
