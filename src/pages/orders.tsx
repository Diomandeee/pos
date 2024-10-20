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
  RefreshCw,
  RotateCcw
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Link from 'next/link'

interface OrderItem {
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
}

const ActiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortCriteria, setSortCriteria] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showRestartConfirmation, setShowRestartConfirmation] = useState(false)

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

  const filterAndSortOrders = useCallback(() => {
    let filtered = orders
    if (statusFilter !== 'All') {
      filtered = orders.filter((order) => order.status === statusFilter)
    }

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
  }, [orders, statusFilter, sortCriteria, sortDirection])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    filterAndSortOrders()
  }, [filterAndSortOrders])

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
  }

  const recordLeadInterest = (orderId: number, interested: boolean) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, leadInterest: interested } : order
    )

    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
  }

  const cancelOrder = (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const updatedOrders = orders.filter((order) => order.id !== orderId)
      setOrders(updatedOrders)
      const updatedAllOrders = allOrders.map((order) =>
        order.id === orderId ? { ...order, status: 'Cancelled' } : order
      )
      setAllOrders(updatedAllOrders)
      localStorage.setItem('orders', JSON.stringify(updatedOrders))
    }
  }

  const modifyOrder = (orderId: number) => {
    const orderToModify = orders.find((order) => order.id === orderId)
    if (orderToModify) {
      setSelectedOrder(orderToModify)
      setShowOrderDetails(true)
    }
  }

  const saveModifiedOrder = (modifiedOrder: Order) => {
    const updatedOrders = orders.map((order) =>
      order.id === modifiedOrder.id ? modifiedOrder : order
    )
    setOrders(updatedOrders)
    setAllOrders(updatedOrders)
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const generatePDF = () => {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF()
    const tableColumn = [
      'Order #',
      'Customer',
      'Status',
      'Total',
      'Queue Time',
      'Prep Time'
    ]
    const tableRows: (string | number)[][] = []

    allOrders.forEach((order) => {
      const orderData = [
        order.id,
        order.customerName,
        order.status,
        order.isComplimentary ? 'Free' : `$${order.total}`,
        formatTime(order.queueTime),
        order.preparationTime ? formatTime(order.preparationTime) : 'N/A'
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
  }

  const cancelClearAllOrders = () => {
    setShowClearConfirmation(false)
  }

  const restartOrderId = () => {
    setShowRestartConfirmation(true)
  }

  const confirmRestartOrderId = () => {
    const resetOrders = orders.map((order, index) => ({
      ...order,
      id: index + 1
    }))
    const resetAllOrders = allOrders.map((order, index) => ({
      ...order,
      id: index + 1
    }))
    setOrders(resetOrders)
    setAllOrders(resetAllOrders)
    setFilteredOrders(resetOrders)
    localStorage.setItem('orders', JSON.stringify(resetOrders))
    setShowRestartConfirmation(false)
  }

  const cancelRestartOrderId = () => {
    setShowRestartConfirmation(false)
  }

  return (
    <div className="active-orders-container">
      <h1 className="page-title">Active Orders</h1>

      {isLoading && <div className="loading">Loading orders...</div>}
      {error && <div className="error">{error}</div>}

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

        <button onClick={loadOrders} className="refresh-button">
          <RefreshCw size={16} />
          Refresh Orders
        </button>

        <button onClick={clearAllOrders} className="clear-button">
          <Trash2 size={16} />
          Clear All Orders
        </button>

        <button onClick={restartOrderId} className="restart-button">
          <RotateCcw size={16} />
          Restart Order ID
        </button>
      </div>

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
            {order.status === 'Completed' &&
              order.leadInterest === undefined && (
                <div className="lead-interest">
                  <span>Customer interested in sales pitch?</span>
                  <button
                    onClick={() => recordLeadInterest(order.id, true)}
                    className="interest-button yes"
                  >
                    <ThumbsUp size={16} className="icon" /> Yes
                  </button>
                  <button
                    onClick={() => recordLeadInterest(order.id, false)}
                    className="interest-button no"
                  >
                    <ThumbsDown size={16} className="icon" /> No
                  </button>
                </div>
              )}
            {order.leadInterest !== undefined && (
              <div className="lead-status">
                Lead Status:{' '}
                {order.leadInterest ? 'Interested' : 'Not Interested'}
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
                  disabled={order.status !== 'Pending'}
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

      {showRestartConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <h2>Restart Order ID</h2>
            <p>
              Are you sure you want to restart the order ID? This action will
              reset all order IDs to start from 1.
            </p>
            <div className="modal-actions">
              <button
                onClick={confirmRestartOrderId}
                className="confirm-button"
              >
                Yes, Restart
              </button>
              <button onClick={cancelRestartOrderId} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
            </div>
            <div className="modal-actions">
              <button
                onClick={() => saveModifiedOrder(selectedOrder)}
                className="confirm-button"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Link href="/pos" passHref>
        <button className="restart-button">Go to POS</button>
      </Link>
      <style>{`
        .active-orders-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }

        .page-title {
          font-size: 28px;
          color: #4a90e2;
          margin-bottom: 20px;
          text-align: center;
        }

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
        .restart-button {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: white;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .sort-button,
        .pdf-button,
        .refresh-button,
        .clear-button,
        .restart-button {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: #4a90e2;
          color: white;
          border: none;
        }

        .sort-button:hover,
        .pdf-button:hover,
        .refresh-button:hover,
        .restart-button:hover {
          background-color: #357abd;
        }

        .clear-button {
          background-color: #dc3545;
        }

        .clear-button:hover {
          background-color: #c82333;
        }

        .restart-button {
          background-color: #ffc107;
          color: #212529;
        }

        .restart-button:hover {
          background-color: #e0a800;
        }

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

        .order-status.cancelled,
        .order-status.cleared {
          background-color: #6c757d;
          color: white;
        }

        .order-details {
          margin-bottom: 10px;
        }

        .customer-name {
          font-weight: bold;
          color: #333;
        }

        .order-time {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          margin-top: 5px;
        }

        .order-time .icon {
          margin-right: 4px;
        }

        .order-items {
          margin-bottom: 10px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 5px;
          color: #333;
        }

        .order-total {
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e1e4e8;
          color: #333;
        }

        .order-metrics {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }

        .customer-contact {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .customer-contact .icon {
          color: #4a90e2;
        }

        .lead-interest {
          margin-top: 15px;
          font-size: 14px;
          color: #333;
        }

        .interest-button {
          margin-top: 5px;
          margin-right: 10px;
          padding: 5px 10px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: inline-flex;
          align-items: center;
        }

        .interest-button .icon {
          margin-right: 4px;
        }

        .interest-button.yes {
          background-color: #28a745;
          color: white;
        }

        .interest-button.no {
          background-color: #dc3545;
          color: white;
        }

        .lead-status {
          margin-top: 10px;
          font-weight: bold;
          color: #4a90e2;
        }

        .order-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .start-button,
        .complete-button,
        .modify-button,
        .cancel-button {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .start-button {
          background-color: #ffc107;
          color: #856404;
        }

        .start-button:hover {
          background-color: #e0a800;
        }

        .complete-button {
          background-color: #28a745;
          color: white;
        }

        .complete-button:hover {
          background-color: #218838;
        }

        .modify-button {
          background-color: #17a2b8;
          color: white;
        }

        .modify-button:hover {
          background-color: #138496;
        }

        .cancel-button {
          background-color: #dc3545;
          color: white;
        }

        .cancel-button:hover {
          background-color: #c82333;
        }

        .start-button:disabled,
        .complete-button:disabled,
        .modify-button:disabled,
        .cancel-button:disabled {
          background-color: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          max-width: 500px;
          width: 100%;
        }

        .modal-content h2 {
          margin-bottom: 15px;
          color: #4a90e2;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          gap: 10px;
        }

        .confirm-button,
        .cancel-button {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .confirm-button {
          background-color: #28a745;
          color: white;
        }

        .confirm-button:hover {
          background-color: #218838;
        }

        .cancel-button {
          background-color: #dc3545;
          color: white;
        }

        .cancel-button:hover {
          background-color: #c82333;
        }

        .order-form label {
          display: block;
          margin-bottom: 10px;
        }

        .order-form input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
          }

          .filter-dropdown,
          .sort-button,
          .pdf-button,
          .refresh-button,
          .clear-button,
          .restart-button {
            width: 100%;
            margin-bottom: 10px;
          }

          .orders-grid {
            grid-template-columns: 1fr;
          }

          .order-actions {
            grid-template-columns: 1fr;
          }

          .start-button,
          .complete-button,
          .modify-button,
          .cancel-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default ActiveOrders
