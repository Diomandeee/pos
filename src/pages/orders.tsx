import React, { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  Check,
  PlayCircle,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Phone,
  ArrowUpDown,
  Trash2,
  Edit2,
  Save,
  Download,
  Upload,
  RefreshCcw,
  Search,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Link from 'next/link'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  customerName: string
  status: string
  timestamp: string
  items: OrderItem[]
  total: number
  isComplimentary: boolean
  queueTime: number
  preparationTime?: number
  customerEmail?: string
  customerPhone?: string
  leadInterest?: boolean
  startTime?: string
  notes?: string
}

interface SearchFilters {
  customerName: string
  orderId: string
  itemName: string
  dateRange: {
    start: string
    end: string
  }
}

const ActiveOrders: React.FC = () => {
  // Basic state
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortCriteria, setSortCriteria] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Search and filter states
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    customerName: '',
    orderId: '',
    itemName: '',
    dateRange: {
      start: '',
      end: ''
    }
  })

  // Order editing states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editedItems, setEditedItems] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showEditConfirmation, setShowEditConfirmation] = useState(false)

  // Message state for user feedback
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Helper function to show messages
  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  // Load orders from localStorage
  const loadOrders = useCallback(() => {
    setIsLoading(true)
    setError(null)
    try {
      const loadedOrders = JSON.parse(
        localStorage.getItem('orders') || '[]'
      ) as Order[]
      setOrders(loadedOrders)
      setAllOrders(loadedOrders)
      setFilteredOrders(loadedOrders)
    } catch (err) {
      setError('Failed to load orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter and sort orders based on search criteria and filters
  const filterAndSortOrders = useCallback(() => {
    let filtered = orders

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Apply search filters
    if (searchFilters.customerName) {
      filtered = filtered.filter((order) =>
        order.customerName
          .toLowerCase()
          .includes(searchFilters.customerName.toLowerCase())
      )
    }

    if (searchFilters.orderId) {
      filtered = filtered.filter((order) =>
        order.id.toString().includes(searchFilters.orderId)
      )
    }

    if (searchFilters.itemName) {
      filtered = filtered.filter((order) =>
        order.items.some((item) =>
          item.name.toLowerCase().includes(searchFilters.itemName.toLowerCase())
        )
      )
    }

    // Apply date range filter
    if (searchFilters.dateRange.start && searchFilters.dateRange.end) {
      const startDate = new Date(searchFilters.dateRange.start)
      const endDate = new Date(searchFilters.dateRange.end)
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.timestamp)
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    // Sort filtered orders
    const sorted = [...filtered].sort((a, b) => {
      if (sortCriteria === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      } else if (sortCriteria === 'preparationTime') {
        return (b.preparationTime || 0) - (a.preparationTime || 0)
      } else if (sortCriteria === 'queueTime') {
        return b.queueTime - a.queueTime
      }
      return 0
    })

    if (sortDirection === 'asc') {
      sorted.reverse()
    }

    setFilteredOrders(sorted)
  }, [orders, statusFilter, searchFilters, sortCriteria, sortDirection])

  // Update filters
  const updateSearchFilters = (
    field: keyof SearchFilters,
    value: string | { start: string; end: string }
  ) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle order notes
  const updateOrderNotes = (orderId: number, notes: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, notes } : order
    )
    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    showMessage('Order notes updated successfully', 'success')
  }

  // Calculate new total based on items
  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Handle item editing
  const updateOrderItem = (
    orderId: number,
    itemId: string,
    updates: Partial<OrderItem>
  ) => {
    if (!selectedOrder) return

    const updatedItems = selectedOrder.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    )

    const newTotal = calculateTotal(updatedItems)

    setSelectedOrder({
      ...selectedOrder,
      items: updatedItems,
      total: newTotal
    })
  }
  // Effect hooks for initial load and filtering
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    filterAndSortOrders()
  }, [filterAndSortOrders])

  // Order status management
  const updateOrderStatus = (orderId: number, newStatus: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus }
        if (newStatus === 'Completed' && order.startTime) {
          const endTime = new Date()
          const startTime = new Date(order.startTime)
          updatedOrder.preparationTime =
            (endTime.getTime() - startTime.getTime()) / 1000
        }
        return updatedOrder
      }
      return order
    })

    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    showMessage('Order status updated successfully', 'success')
  }

  // Lead interest tracking
  const recordLeadInterest = (orderId: number, interested: boolean) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, leadInterest: interested } : order
    )

    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    showMessage('Lead interest recorded successfully', 'success')
  }

  // Order cancellation
  const cancelOrder = (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const updatedOrders = orders.filter((order) => order.id !== orderId)
      setOrders(updatedOrders)
      const updatedAllOrders = allOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'Cancelled' } : order
      )
      setAllOrders(updatedAllOrders)
      localStorage.setItem('orders', JSON.stringify(updatedOrders))
      showMessage('Order cancelled successfully', 'success')
    }
  }

  // Order modification
  const modifyOrder = (orderId: number) => {
    const orderToModify = orders.find((order) => order.id === orderId)
    if (orderToModify) {
      setSelectedOrder(orderToModify)
      setEditedItems([...orderToModify.items])
      setOrderNotes(orderToModify.notes || '')
      setIsEditing(true)
      setShowOrderDetails(true)
    }
  }

  // Save modified order
  const saveModifiedOrder = () => {
    if (!selectedOrder) return

    const modifiedOrder = {
      ...selectedOrder,
      items: editedItems,
      notes: orderNotes,
      total: calculateTotal(editedItems)
    }

    const updatedOrders = orders.map((order) =>
      order.id === modifiedOrder.id ? modifiedOrder : order
    )

    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    setShowOrderDetails(false)
    setSelectedOrder(null)
    setIsEditing(false)
    showMessage('Order updated successfully', 'success')
  }

  // Time formatting
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // PDF generation
  const generatePDF = () => {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF()
    const tableColumn = [
      'Order #',
      'Customer',
      'Status',
      'Total',
      'Queue Time',
      'Prep Time',
      'Notes'
    ]
    const tableRows: (string | number)[][] = []

    allOrders.forEach((order) => {
      const orderData = [
        order.id,
        order.customerName,
        order.status,
        order.isComplimentary ? 'Free' : `$${order.total}`,
        formatTime(order.queueTime),
        order.preparationTime ? formatTime(order.preparationTime) : 'N/A',
        order.notes || 'N/A'
      ]
      tableRows.push(orderData)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    })

    doc.text('Buf Barista - Complete Order Report', 14, 15)
    doc.save('buf-barista-all-orders.pdf')
  }

  // Data management functions
  const clearAllOrders = () => {
    setShowClearConfirmation(true)
  }

  const confirmClearAllOrders = () => {
    const clearedOrders = allOrders.map((order) =>
      orders.some((activeOrder) => activeOrder.id === order.id)
        ? { ...order, status: 'Cleared' }
        : order
    )
    setAllOrders(clearedOrders)
    setOrders([])
    setFilteredOrders([])
    localStorage.setItem('orders', JSON.stringify([]))
    setShowClearConfirmation(false)
    showMessage('All orders cleared successfully', 'success')
  }

  const cancelClearAllOrders = () => {
    setShowClearConfirmation(false)
  }

  const resetAllData = () => {
    setShowResetConfirmation(true)
  }

  const confirmResetAllData = () => {
    localStorage.clear()
    setOrders([])
    setAllOrders([])
    setFilteredOrders([])
    setShowResetConfirmation(false)
    showMessage('All data reset successfully', 'success')
    window.location.reload()
  }

  const cancelResetAllData = () => {
    setShowResetConfirmation(false)
  }

  const exportData = () => {
    const data = {
      orders: allOrders,
      preferences: JSON.parse(
        localStorage.getItem('systemPreferences') || '{}'
      ),
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
    showMessage('Data exported successfully', 'success')
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          localStorage.setItem('orders', JSON.stringify(data.orders))
          localStorage.setItem(
            'systemPreferences',
            JSON.stringify(data.preferences)
          )
          localStorage.setItem('inventory', JSON.stringify(data.inventory))
          loadOrders()
          showMessage('Data imported successfully', 'success')
        } catch (error) {
          showMessage(
            'Error importing data. Please check the file format.',
            'error'
          )
        }
      }
      reader.readAsText(file)
    }
  }

  const toggleEditNotes = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setOrderNotes(order.notes || '')
      setShowOrderDetails(true)
    }
  }

  // Render component
  return (
    <div className="active-orders-container">
      <h1 className="page-title">Active Orders</h1>

      {isLoading && <div className="loading">Loading orders...</div>}
      {error && <div className="error">{error}</div>}

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="search-inputs">
          <div className="search-field">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchFilters.customerName}
              onChange={(e) =>
                updateSearchFilters('customerName', e.target.value)
              }
              className="search-input"
            />
          </div>
          <div className="search-field">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchFilters.orderId}
              onChange={(e) => updateSearchFilters('orderId', e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-field">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchFilters.itemName}
              onChange={(e) => updateSearchFilters('itemName', e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="date-range">
          <Calendar size={16} />
          <input
            type="date"
            value={searchFilters.dateRange.start}
            onChange={(e) =>
              updateSearchFilters('dateRange', {
                ...searchFilters.dateRange,
                start: e.target.value
              })
            }
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={searchFilters.dateRange.end}
            onChange={(e) =>
              updateSearchFilters('dateRange', {
                ...searchFilters.dateRange,
                end: e.target.value
              })
            }
            className="date-input"
          />
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-dropdown"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          className="filter-dropdown"
        >
          <option value="timestamp">Sort by Time</option>
          <option value="preparationTime">Sort by Prep Time</option>
          <option value="queueTime">Sort by Queue Time</option>
        </select>

        <button
          onClick={() =>
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
          }
          className="sort-button"
        >
          <ArrowUpDown size={16} />
          {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        </button>

        <button onClick={generatePDF} className="pdf-button">
          <Save size={16} />
          Save as PDF
        </button>

        {/* <button onClick={loadOrders} className="refresh-button">
          <RefreshCw size={16} />
          Refresh Orders
        </button> */}

        <button onClick={clearAllOrders} className="clear-button">
          <Trash2 size={16} />
          Clear All Orders
        </button>

        <button onClick={resetAllData} className="reset-button">
          <RefreshCcw size={16} />
          Reset All Data
        </button>

        <button onClick={exportData} className="export-button">
          <Download size={16} />
          Export Data
        </button>

        <label className="import-button">
          <Upload size={16} />
          Import Data
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importData}
          />
        </label>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className={`order-card ${order.status.toLowerCase()}`}
          >
            <div className="order-header">
              <span className="order-number">Order #{order.id}</span>
              <span className={`order-status ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="order-details">
              <div className="customer-name">{order.customerName}</div>
              <div className="order-time">
                <Clock size={14} className="icon" />
                {order.timestamp}
              </div>
            </div>
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>
                    {order.isComplimentary
                      ? 'Free'
                      : `$${(item.price * item.quantity).toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="order-total">
              Total: {order.isComplimentary ? 'Free' : `$${order.total}`}
            </div>
            <div className="order-metrics">
              <div>Queue Time: {formatTime(order.queueTime)}</div>
              {order.preparationTime && (
                <div>Preparation Time: {formatTime(order.preparationTime)}</div>
              )}
            </div>

            <div className="customer-contact">
              {order.customerEmail && <Mail size={14} className="icon" />}
              {order.customerPhone && <Phone size={14} className="icon" />}
            </div>
            {/* Order Notes Section */}
            <div className="order-notes-section">
              <div className="notes-header">
                <FileText size={14} className="icon" />
                <span>Notes</span>
                <button
                  onClick={() => toggleEditNotes(order.id)}
                  className="edit-notes-button"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="notes-content">
                {order.notes ? (
                  <p>{order.notes}</p>
                ) : (
                  <p className="no-notes">No notes added</p>
                )}
              </div>
            </div>

            {/* Lead Interest Section */}
            {order.status === 'Completed' &&
              order.leadInterest === undefined && (
                <div className="lead-interest-section">
                  <div className="lead-interest-header">
                    Customer interested in sales pitch?
                  </div>
                  <div className="lead-interest-buttons">
                    <button
                      onClick={() => recordLeadInterest(order.id, true)}
                      className="lead-button yes"
                    >
                      <ThumbsUp size={16} className="icon" />
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => recordLeadInterest(order.id, false)}
                      className="lead-button no"
                    >
                      <ThumbsDown size={16} className="icon" />
                      <span>No</span>
                    </button>
                  </div>
                </div>
              )}
            {order.leadInterest !== undefined && (
              <div
                className={`lead-status ${
                  order.leadInterest ? 'interested' : 'not-interested'
                }`}
              >
                <div className="lead-status-content">
                  <span className="lead-status-label">Lead Status:</span>
                  <span className="lead-status-value">
                    {order.leadInterest ? (
                      <>
                        <ThumbsUp size={16} className="icon" />
                        Interested
                      </>
                    ) : (
                      <>
                        <ThumbsDown size={16} className="icon" />
                        Not Interested
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}
            {order.status !== 'Completed' && (
              <div className="order-actions">
                <button
                  onClick={() => updateOrderStatus(order.id, 'In Progress')}
                  className="start-button"
                  disabled={order.status === 'In Progress'}
                >
                  <PlayCircle size={16} className="icon" /> Start
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, 'Completed')}
                  className="complete-button"
                >
                  <Check size={16} className="icon" /> Complete
                </button>
                <button
                  onClick={() => modifyOrder(order.id)}
                  className="modify-button"
                  disabled={order.status === 'Completed'}
                >
                  <Edit2 size={16} className="icon" /> Modify
                </button>
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="cancel-button"
                  disabled={order.status !== 'Pending'}
                >
                  <Trash2 size={16} className="icon" /> Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showClearConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <h2>Clear All Orders</h2>
            <p>
              Are you sure you want to clear all orders? This action will remove
              orders from the active list but they will still be included in the
              PDF report.
            </p>
            <div className="modal-actions">
              <button
                onClick={confirmClearAllOrders}
                className="confirm-button"
              >
                Yes, Clear All
              </button>
              <button onClick={cancelClearAllOrders} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <h2>Reset All Data</h2>
            <p>
              Are you sure you want to reset all data? This action will clear
              all orders, preferences, and inventory data. This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button onClick={confirmResetAllData} className="confirm-button">
                Yes, Reset All Data
              </button>
              <button onClick={cancelResetAllData} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Edit Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal">
          <div className="modal-content">
            <h2>Modify Order</h2>
            <div className="order-form">
              <label>
                Customer Name:
                <input
                  type="text"
                  value={selectedOrder.customerName}
                  onChange={(e) =>
                    setSelectedOrder({
                      ...selectedOrder,
                      customerName: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Order Notes:
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add notes about the order..."
                  rows={3}
                />
              </label>

              <div className="items-list">
                <h3>Order Items</h3>
                {editedItems.map((item, index) => (
                  <div key={index} className="edit-item">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateOrderItem(selectedOrder.id, item.id, {
                          name: e.target.value
                        })
                      }
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      onChange={(e) =>
                        updateOrderItem(selectedOrder.id, item.id, {
                          quantity: parseInt(e.target.value)
                        })
                      }
                    />
                    <input
                      type="number"
                      value={item.price}
                      step="0.01"
                      min="0"
                      onChange={(e) =>
                        updateOrderItem(selectedOrder.id, item.id, {
                          price: parseFloat(e.target.value)
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        setEditedItems((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="remove-item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={saveModifiedOrder} className="confirm-button">
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowOrderDetails(false)
                  setSelectedOrder(null)
                  setIsEditing(false)
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? (
            <Check size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Navigation */}
      <div className="nav-buttons">
        <Link href="/pos" passHref>
          <button className="nav-button">Go to POS</button>
        </Link>
        <Link href="/reports" passHref>
          <button className="nav-button">Go to Reports</button>
        </Link>
        <Link href="/settings" passHref>
          <button className="nav-button">Go to Settings</button>
        </Link>
        <Link href="/" passHref>
          <button className="nav-button" style={{ backgroundColor: '' }}>
            Go to Dashboard
          </button>
        </Link>
      </div>

      <style>{`
        .nav-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        /* Container Styles */
        .active-orders-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }

        /* Page Title */
        .page-title {
          font-size: 28px;
          color: #4a90e2;
          margin-bottom: 20px;
          text-align: center;
        }

        /* Loading and Error States */
        .loading,
        .error {
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
          border-radius: 5px;
        }

        .loading {
          background-color: #e9ecef;
          color: #495057;
        }

        .error {
          background-color: #f8d7da;
          color: #721c24;
        }

        /* Search Section */
        .search-section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .search-field {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background-color: white;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          padding: 4px;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .date-input {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        /* Filters Section */
        .filters {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .filter-dropdown,
        .sort-button,
        .pdf-button,
        .refresh-button,
        .clear-button,
        .reset-button,
        .export-button,
        .import-button {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: white;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease, color 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        /* Notes Section */
        .order-notes-section {
          margin-top: 15px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .notes-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #495057;
          font-weight: 500;
        }

        .edit-notes-button {
          margin-left: auto;
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .edit-notes-button:hover {
          color: #4a90e2;
          background-color: rgba(74, 144, 226, 0.1);
        }

        .notes-content {
          font-size: 14px;
          color: #495057;
          line-height: 1.5;
        }

        .no-notes {
          color: #6c757d;
          font-style: italic;
        }

        /* Lead Interest Section */
        .lead-interest-section {
          margin-top: 15px;
          padding: 15px;
          background-color: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .lead-interest-header {
          font-size: 14px;
          font-weight: 500;
          color: #495057;
          margin-bottom: 10px;
          text-align: center;
        }

        .lead-interest-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .lead-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          max-width: 120px;
        }

        .lead-button.yes {
          background-color: #28a745;
          color: white;
        }

        .lead-button.yes:hover {
          background-color: #218838;
          transform: translateY(-2px);
        }

        .lead-button.no {
          background-color: #dc3545;
          color: white;
        }

        .lead-button.no:hover {
          background-color: #c82333;
          transform: translateY(-2px);
        }

        .lead-button:active {
          transform: translateY(1px);
        }

        .lead-button .icon {
          font-size: 16px;
        }

        /* Lead Status */
        .lead-status {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          background-color: #f8f9fa;
        }

        .lead-status.interested {
          border-left: 4px solid #28a745;
        }

        .lead-status.not-interested {
          border-left: 4px solid #dc3545;
        }

        .lead-status-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lead-status-label {
          font-weight: 500;
          color: #495057;
        }

        .lead-status-value {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .lead-status.interested .lead-status-value {
          color: #28a745;
        }

        .lead-status.not-interested .lead-status-value {
          color: #dc3545;
        }

        /* Notes Modal Enhancements */
        .order-form textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          resize: vertical;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          margin-top: 8px;
        }

        .order-form textarea:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }

        .notes-label {
          font-weight: 500;
          color: #495057;
          margin-bottom: 8px;
          display: block;
        }

        @media (max-width: 768px) {
          .lead-interest-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .lead-button {
            max-width: none;
          }
        }
        .sort-button,
        .pdf-button,
        .refresh-button,
        .export-button,
        .import-button {
          background-color: #4a90e2;
          color: white;
          border: none;
        }

        .clear-button {
          background-color: #dc3545;
          color: white;
        }

        .reset-button {
          background-color: #ffc107;
          color: #212529;
        }

        /* Orders Grid */
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .order-card {
          background-color: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .order-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        /* Order Card Elements */
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .order-number {
          font-weight: bold;
          font-size: 18px;
          color: #333;
        }

        .order-status {
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .order-status.pending {
          background-color: #ffc107;
          color: #856404;
        }

        .order-status.in-progress {
          background-color: #17a2b8;
          color: white;
        }

        .order-status.completed {
          background-color: #28a745;
          color: white;
        }

        /* Order Details */
        .order-details {
          margin-bottom: 15px;
        }

        .customer-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        /* Add these styles to the existing style block */

        /* Order Action Buttons */
        .order-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 15px;
        }
        .confirm-button,
        .start-button,
        .complete-button,
        .modify-button,
        .cancel-button,
        .nav-button {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          text-decoration: none;
          width: 100%;
        }

        .confirm-button {
          background-color: #007bff;
          color: white;
          margin-bottom: 10px;
        }

        .start-button {
          background-color: #ffc107;
          color: #856404;
        }

        .start-button:hover {
          background-color: #e0a800;
          transform: translateY(-2px);
        }

        .complete-button {
          background-color: #28a745;
          color: white;
        }

        .complete-button:hover {
          background-color: #218838;
          transform: translateY(-2px);
        }

        .modify-button {
          background-color: #17a2b8;
          color: white;
        }

        .modify-button:hover {
          background-color: #138496;
          transform: translateY(-2px);
        }

        .cancel-button {
          background-color: #dc3545;
          color: white;
        }

        .cancel-button:hover {
          background-color: #c82333;
          transform: translateY(-2px);
        }

        /* Navigation Button */
        .nav-button {
          background-color: #6c757d;
          color: white;
          margin-top: 20px;
          width: auto;
          min-width: 150px;
          padding: 12px 24px;
          font-size: 16px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
        }

        .nav-button:hover {
          background-color: #5a6268;
          transform: translateY(-2px);
        }

        /* Disabled State */
        .start-button:disabled,
        .complete-button:disabled,
        .modify-button:disabled,
        .cancel-button:disabled {
          background-color: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          transform: none;
          opacity: 0.7;
        }

        .order-actions .icon {
          font-size: 16px;
        }

        /* Add this to the media queries section */
        @media (max-width: 768px) {
          .order-actions {
            grid-template-columns: 1fr;
          }

          .start-button,
          .complete-button,
          .modify-button,
          .cancel-button {
            padding: 12px 16px;
            font-size: 16px;
          }

          .nav-button {
            width: 100%;
            margin-top: 30px;
          }
        }

        /* Add hover effect to all buttons */
        button:active {
          transform: translateY(1px);
        }

        /* Button icon alignment */
        .icon {
          margin-right: 4px;
          vertical-align: middle;
        }
        .order-time {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .order-notes {
          margin-top: 10px;
          padding: 8px;
          background-color: #f8f9fa;
          border-radius: 4px;
          font-size: 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .order-notes .icon {
          margin-top: 2px;
          color: #666;
        }

        /* Modal Styles */
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
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          padding: 25px;
          border-radius: 10px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .order-form label {
          display: block;
          margin-bottom: 15px;
        }

        .order-form input,
        .order-form textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-top: 5px;
        }

        .items-list {
          margin-top: 20px;
        }

        .edit-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .remove-item {
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
        }

        /* Message Notifications */
        .message {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          animation: slideIn 0.3s ease-out;
          z-index: 1000;
        }

        .message.success {
          background-color: #28a745;
        }

        .message.error {
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

        /* Media Queries */
        @media (max-width: 768px) {
          .search-inputs {
            grid-template-columns: 1fr;
          }

          .date-range {
            flex-direction: column;
            align-items: stretch;
          }

          .filters {
            flex-direction: column;
          }

          .filter-dropdown,
          .sort-button,
          .pdf-button,
          .refresh-button,
          .clear-button,
          .reset-button,
          .export-button,
          .import-button {
            width: 100%;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }

          .edit-item {
            grid-template-columns: 1fr;
          }
          
        }
      `}</style>
    </div>
  )
}

export default ActiveOrders
