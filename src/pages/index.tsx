import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import {
  Coffee,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: number
  customerName: string
  total: number
  status: string
  timestamp: string
  items: { name: string; quantity: number; price: number }[]
  isComplimentary: boolean
}

interface SalesData {
  date: string
  sales: number
  orders: number
}

interface TopSellingItem {
  name: string
  quantity: number
}

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<string>('today')

  const processSalesData = useCallback(
    (orders: Order[], timeRange: string): SalesData[] => {
      const now = new Date()
      const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.timestamp)
        if (timeRange === 'today') {
          return orderDate.toDateString() === now.toDateString()
        } else if (timeRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        } else if (timeRange === 'month') {
          const monthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          )
          return orderDate >= monthAgo
        }
        return true
      })

      const salesByDate: { [key: string]: { sales: number; orders: number } } =
        {}
      filteredOrders.forEach((order) => {
        const date = new Date(order.timestamp).toISOString().split('T')[0]
        if (!salesByDate[date]) {
          salesByDate[date] = { sales: 0, orders: 0 }
        }
        salesByDate[date].sales += order.isComplimentary ? 0 : order.total
        salesByDate[date].orders += 1
      })

      return Object.entries(salesByDate)
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          orders: data.orders
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    },
    []
  )

  const processTopSellingItems = useCallback(
    (orders: Order[], timeRange: string): TopSellingItem[] => {
      const now = new Date()
      const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.timestamp)
        if (timeRange === 'today') {
          return orderDate.toDateString() === now.toDateString()
        } else if (timeRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        } else if (timeRange === 'month') {
          const monthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          )
          return orderDate >= monthAgo
        }
        return true
      })

      const itemCounts: { [key: string]: number } = {}
      filteredOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = 0
          }
          itemCounts[item.name] += item.quantity
        })
      })

      return Object.entries(itemCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
    },
    []
  )

  const fetchDashboardData = useCallback(() => {
    setIsLoading(true)
    setError(null)
    try {
      const storedOrders = JSON.parse(
        localStorage.getItem('orders') || '[]'
      ) as Order[]
      setOrders(storedOrders)

      const processedSalesData = processSalesData(storedOrders, timeRange)
      setSalesData(processedSalesData)

      const processedTopSellingItems = processTopSellingItems(
        storedOrders,
        timeRange
      )
      setTopSellingItems(processedTopSellingItems)
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, processSalesData, processTopSellingItems])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const totalSales = useMemo(() => {
    return orders
      .filter((order) => !order.isComplimentary)
      .reduce((sum, order) => sum + order.total, 0)
      .toFixed(2)
  }, [orders])

  const totalOrders = useMemo(() => {
    return orders.length
  }, [orders])

  const averageOrderValue = useMemo(() => {
    const paidOrders = orders.filter((order) => !order.isComplimentary)
    return paidOrders.length > 0
      ? (
          paidOrders.reduce((sum, order) => sum + order.total, 0) /
          paidOrders.length
        ).toFixed(2)
      : '0.00'
  }, [orders])

  const recentOrders = useMemo(() => {
    return orders
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 5)
      .map((order) => ({
        id: order.id,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        time: new Date(order.timestamp).toLocaleTimeString()
      }))
  }, [orders])

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Dashboard</h1>

      {isLoading && <div className="loading">Loading dashboard data...</div>}
      {error && <div className="error">{error}</div>}

      <div className="dashboard-controls">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-select"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <button onClick={fetchDashboardData} className="refresh-button">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Sales</h3>
            <p className="metric-value">${totalSales}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Coffee size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Orders</h3>
            <p className="metric-value">{totalOrders}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Average Order Value</h3>
            <p className="metric-value">${averageOrderValue}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Customer Satisfaction</h3>
            <p className="metric-value">N/A</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Recent Orders</h3>
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/orders" className="view-all-link">
          View All Orders <ChevronRight size={16} />
        </Link>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Link href="/pos" className="action-button">
            <Coffee size={20} /> New Order
          </Link>
          <Link href="/inventory" className="action-button">
            <AlertCircle size={20} /> Check Inventory
          </Link>
          <Link href="/reports" className="action-button">
            <TrendingUp size={20} /> View Reports
          </Link>
        </div>
      </div>

      <style>{`
        .dashboard-container {
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

        .dashboard-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .time-range-select,
        .refresh-button {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: #4a90e2;
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .refresh-button:hover {
          background-color: #357abd;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
        }

        .metric-icon {
          background-color: #e9ecef;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }

        .metric-content h3 {
          font-size: 14px;
          color: #6c757d;
          margin: 0 0 5px 0;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #4a90e2;
          margin: 0;
        }

        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          font-size: 18px;
          color: #495057;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .recent-orders {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .recent-orders h3 {
          font-size: 18px;
          color: #495057;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th,
        .orders-table td {
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
        }

        .orders-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #495057;
        }

        .status {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status.pending {
          background-color: #ffeeba;
          color: #856404;
        }

        .status.completed {
          background-color: #d4edda;
          color: #155724;
        }

        .status.cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          color: #4a90e2;
          text-decoration: none;
          font-weight: bold;
          margin-top: 15px;
        }

        .quick-actions {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .quick-actions h3 {
          font-size: 18px;
          color: #495057;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 15px;
          background-color: #4a90e2;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }

        .action-button:hover {
          background-color: #357abd;
        }

        @media (max-width: 768px) {
          .charts-container {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard

