import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Trash2,
  Plus,
  Coffee,
  Package,
  Save,
  AlertTriangle,
  Minus,
  Search,
  X,
  Check,
  Moon,
  Sun,
  DollarSign,
  Star,
  Clock,
  CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface WasteItem {
  id: string
  itemName: string
  category: string
  quantity: number
  timestamp: string
  cost: number
  notes: string
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

interface WasteLogItem {
  itemName: string
  category: string
  quantity: number
  cost: number
  unit: string
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

const WasteManagement: React.FC = () => {
  const [wasteLog, setWasteLog] = useState<WasteItem[]>([])
  const [currentLog, setCurrentLog] = useState<WasteLogItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [notes, setNotes] = useState('')

  // Load initial data
  useEffect(() => {
    const savedWasteLog = localStorage.getItem('wasteLog')
    if (savedWasteLog) {
      setWasteLog(JSON.parse(savedWasteLog))
    }

    const savedDarkMode = localStorage.getItem('wasteDarkMode')
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Handle dark mode
  useEffect(() => {
    localStorage.setItem('wasteDarkMode', JSON.stringify(isDarkMode))
    document.body.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  // Save waste log
  const saveWasteLog = useCallback((newLog: WasteItem[]) => {
    localStorage.setItem('wasteLog', JSON.stringify(newLog))
    setWasteLog(newLog)
  }, [])

  // Filter categories
  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'All') {
      return wasteCategories
    }
    return wasteCategories.filter(
      (category) => category.name === selectedCategory
    )
  }, [selectedCategory])

  // Add item to current log
  const addToLog = useCallback((item: string, category: WasteCategory) => {
    setCurrentLog((prev) => {
      const existingItem = prev.find(
        (logItem) =>
          logItem.itemName === item && logItem.category === category.name
      )

      if (existingItem) {
        return prev.map((logItem) =>
          logItem.itemName === item && logItem.category === category.name
            ? { ...logItem, quantity: logItem.quantity + 1 }
            : logItem
        )
      }

      return [
        ...prev,
        {
          itemName: item,
          category: category.name,
          quantity: 1,
          cost: category.averageCost,
          unit: category.unit
        }
      ]
    })
  }, [])
  // Remove item from log
  const removeFromLog = useCallback((index: number) => {
    setCurrentLog((prev) => {
      const newLog = [...prev]
      const item = newLog[index]

      if (item.quantity > 1) {
        newLog[index] = { ...item, quantity: item.quantity - 1 }
        return newLog
      }

      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Increase item quantity
  const increaseQuantity = useCallback((index: number) => {
    setCurrentLog((prev) => {
      const newLog = [...prev]
      const item = newLog[index]
      newLog[index] = { ...item, quantity: item.quantity + 1 }
      return newLog
    })
  }, [])

  // Show notification message
  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  // Calculate total cost
  const calculateTotalCost = useMemo(() => {
    return currentLog.reduce((sum, item) => sum + item.cost * item.quantity, 0)
  }, [currentLog])

  // Handle log submission
  const handleLogSubmit = useCallback(() => {
    if (currentLog.length === 0) {
      showMessage('Please add items to log', 'error')
      return
    }

    const timestamp = new Date().toISOString()
    const newWasteItems: WasteItem[] = currentLog.map((item) => ({
      id: `${Date.now()}-${Math.random()}`,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      timestamp,
      cost: item.cost * item.quantity,
      notes
    }))

    const updatedLog = [...newWasteItems, ...wasteLog]
    saveWasteLog(updatedLog)

    setCurrentLog([])
    setNotes('')
    showMessage('Waste items logged successfully', 'success')
  }, [currentLog, notes, wasteLog, saveWasteLog, showMessage])

  return (
    <div className={`waste-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="waste-header">
        <div className="header-left">
          <h1 className="page-title">Waste Management</h1>
          <button className="mode-button">
            <Trash2 size={16} /> Total Cost: ${calculateTotalCost.toFixed(2)}
          </button>
        </div>

        <div className="search-container">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search waste items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="header-right">
          <span className="current-time">
            <Clock size={16} />
            {format(new Date(), 'HH:mm')}
          </span>
          <span className="current-date">
            <CalendarDays size={16} />
            {format(new Date(), 'MMM dd, yyyy')}
          </span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="mode-button"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <main className="waste-main">
        <section className="waste-log-section">
          <h2 className="section-title">Current Waste Log</h2>

          {!currentLog || currentLog.length === 0 ? (
            <p className="empty-log">No items added to waste log</p>
          ) : (
            <ul className="waste-items">
              {currentLog.map((item, index) => (
                <li key={index} className="waste-item">
                  <span className="item-name">
                    {item.itemName}
                    <span className="item-category">({item.category})</span>
                  </span>
                  <div className="item-controls">
                    <button
                      onClick={() => removeFromLog(index)}
                      className="quantity-button"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="item-quantity">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => increaseQuantity(index)}
                      className="quantity-button"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="item-cost">
                      ${(item.cost * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromLog(index)}
                      className="remove-button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="log-details">
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>

          <div className="log-total">
            <span>Total Cost:</span>
            <span>${calculateTotalCost.toFixed(2)}</span>
          </div>

          <button
            onClick={handleLogSubmit}
            disabled={!currentLog || currentLog.length === 0}
            className="submit-log-button"
          >
            <Save size={16} /> Submit Waste Log
          </button>

          <Link href="/log" passHref>
            <button className="nav-button">
              <Coffee size={16} /> View Waste Log History
            </button>
          </Link>

          <Link href="/pos" passHref>
            <button className="nav-button">
              <Coffee size={16} /> Return to POS
            </button>
          </Link>
        </section>
        <section className="waste-menu-section">
          <div className="category-filters">
            {['All', ...wasteCategories.map((cat) => cat.name)].map(
              (category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`category-button ${
                    category === selectedCategory ? 'active' : ''
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>

          <div className="menu-grid">
            {filteredCategories.map((category) => (
              <div key={category.name} className="category-section">
                <h3 className="category-title">{category.name}</h3>
                <div className="items-grid">
                  {category.items.map((item) => (
                    <button
                      key={item}
                      onClick={() => addToLog(item, category)}
                      className="waste-menu-item"
                    >
                      <Package className="item-icon" />
                      <h3 className="item-name">{item}</h3>
                      <p className="item-details">
                        ${category.averageCost.toFixed(2)} per {category.unit}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

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

      <style>{`
        .waste-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: var(--background-color);
          min-height: 100vh;
        }

        .waste-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-left,
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-title {
          font-size: 24px;
          color: #4a90e2;
          margin: 0;
        }

        .current-time,
        .current-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #495057;
          font-size: 14px;
        }

        .mode-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          background-color: #4a90e2;
          color: white;
          transition: background-color 0.3s ease;
        }

        .mode-button:hover {
          background-color: #357abd;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background-color: white;
          width: 300px;
        }

        .search-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .waste-main {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
        }

        .waste-log-section {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          font-size: 20px;
          color: #4a90e2;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .empty-log {
          text-align: center;
          color: #666;
          font-style: italic;
          margin: 20px 0;
        }

        .waste-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .waste-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .quantity-button {
          background: none;
          border: none;
          color: #4a90e2;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-button {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-quantity {
          font-weight: bold;
          min-width: 60px;
          text-align: center;
        }

        .item-category {
          font-size: 12px;
          color: #666;
          margin-left: 5px;
        }

        .log-details {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
          color: #495057;
        }

        .form-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .log-total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .submit-log-button,
        .nav-button {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.3s ease;
        }

        .submit-log-button {
          background-color: #28a745;
          color: white;
        }

        .submit-log-button:hover {
          background-color: #218838;
        }

        .submit-log-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .nav-button {
          background-color: #4a90e2;
          color: white;
          text-decoration: none;
        }

        .nav-button:hover {
          background-color: #357abd;
        }

        .waste-menu-section {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .category-button {
          padding: 8px 16px;
          border: none;
          border-radius: 20px;
          background-color: #f0f0f0;
          color: #495057;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-button:hover {
          background-color: #e2e6ea;
        }

        .category-button.active {
          background-color: #4a90e2;
          color: white;
        }

        .category-section {
          margin-bottom: 30px;
        }

        .category-title {
          font-size: 18px;
          color: #495057;
          margin-bottom: 15px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 15px;
        }

        .waste-menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .waste-menu-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .item-icon {
          color: #4a90e2;
          margin-bottom: 10px;
        }

        .item-name {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 0;
        }

        .item-details {
          font-size: 12px;
          color: #666;
          margin: 5px 0 0;
        }

        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
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

        .dark-mode {
          --background-color: #1a1a1a;
          --text-color: #f0f0f0;
          --border-color: #444;
        }

        .dark-mode .waste-container {
          background-color: var(--background-color);
          color: var(--text-color);
        }

        .dark-mode .waste-header,
        .dark-mode .waste-log-section,
        .dark-mode .waste-menu-section,
        .dark-mode .waste-menu-item {
          background-color: #2c2c2c;
          border-color: var(--border-color);
        }

        .dark-mode .search-container {
          background-color: #3c3c3c;
          border-color: #444;
        }

        .dark-mode .search-input {
          background-color: #3c3c3c;
          color: var(--text-color);
        }

        .dark-mode .category-button {
          background-color: #3c3c3c;
          color: var(--text-color);
        }

        .dark-mode .category-button.active {
          background-color: #4a90e2;
          color: white;
        }

        .dark-mode .log-details {
          background-color: #3c3c3c;
        }

        .dark-mode .form-textarea {
          background-color: #2c2c2c;
          border-color: #444;
          color: var(--text-color);
        }

        .dark-mode .item-category {
          color: #aaa;
        }

        .dark-mode .item-details {
          color: #aaa;
        }

        .dark-mode .waste-item {
          border-color: #444;
        }

        .dark-mode .quantity-button {
          color: #4a90e2;
        }

        .dark-mode .remove-button {
          color: #ff6b6b;
        }

        .dark-mode .log-total {
          background-color: #3c3c3c;
        }

        @media (max-width: 1024px) {
          .waste-container {
            padding: 10px;
          }

          .waste-main {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .waste-header {
            flex-direction: column;
            gap: 10px;
          }

          .header-left,
          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .search-container {
            width: 100%;
          }

          .waste-menu-section {
            margin-top: 20px;
          }

          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .category-filters {
            overflow-x: auto;
            padding-bottom: 10px;
            -webkit-overflow-scrolling: touch;
          }

          .category-button {
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .items-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .waste-menu-item {
            padding: 10px;
          }

          .item-name {
            font-size: 12px;
          }

          .notification {
            width: 90%;
            left: 5%;
            right: 5%;
          }
        }

        @media print {
          .waste-container {
            background: white;
          }

          .waste-header,
          .waste-menu-section,
          .submit-log-button,
          .nav-button {
            display: none;
          }

          .waste-log-section {
            width: 100%;
            box-shadow: none;
          }

          .notification {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

export default WasteManagement
