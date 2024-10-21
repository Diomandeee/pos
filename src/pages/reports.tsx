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
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import {
  Download,
  DollarSign,
  TrendingUp,
  Coffee,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear
} from 'date-fns'

interface Order {
  id: number
  customerName: string
  total: number
  status: string
  timestamp: string
  items: Array<{
    name: string
    quantity: number
    price: number
    category: string
  }>
  isComplimentary: boolean
  preparationTime?: number
  queueTime: number
}
// Add this type declaration
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF
  }
}
type TimeRange = 'day' | 'week' | 'month' | 'year' | 'custom'

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d',
  '#ffc658'
]

const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'orders'>(
    'sales'
  )

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulating an API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 500))
      const storedOrders = JSON.parse(
        localStorage.getItem('orders') || '[]'
      ) as Order[]
      setOrders(storedOrders)
    } catch (err) {
      setError('Failed to fetch orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getDateRange = useCallback(() => {
    const now = new Date()
    switch (timeRange) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) }
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) }
      case 'custom':
        return {
          start: startOfDay(new Date(customStartDate)),
          end: endOfDay(new Date(customEndDate))
        }
      default:
        return { start: startOfWeek(now), end: endOfWeek(now) }
    }
  }, [timeRange, customStartDate, customEndDate])

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange()
    return orders.filter((order) => {
      const orderDate = new Date(order.timestamp)
      return orderDate >= start && orderDate <= end
    })
  }, [orders, getDateRange])

  const salesData = useMemo(() => {
    const data: { [key: string]: { sales: number; orders: number } } = {}
    filteredOrders.forEach((order) => {
      const date = format(new Date(order.timestamp), 'yyyy-MM-dd')
      if (!data[date]) {
        data[date] = { sales: 0, orders: 0 }
      }
      data[date].sales += order.isComplimentary ? 0 : order.total
      data[date].orders += 1
    })
    return Object.entries(data)
      .map(([date, values]) => ({
        date,
        sales: values.sales,
        orders: values.orders
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders])

  const topSellingItems = useMemo(() => {
    const itemCounts: { [key: string]: { quantity: number; revenue: number } } =
      {}
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { quantity: 0, revenue: 0 }
        }
        itemCounts[item.name].quantity += item.quantity
        itemCounts[item.name].revenue += item.price * item.quantity
      })
    })
    return Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [filteredOrders])

  const totalSales = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + (order.isComplimentary ? 0 : order.total),
      0
    )
  }, [filteredOrders])

  const totalOrders = useMemo(() => filteredOrders.length, [filteredOrders])

  const averageOrderValue = useMemo(() => {
    const paidOrders = filteredOrders.filter((order) => !order.isComplimentary)
    return paidOrders.length > 0 ? totalSales / paidOrders.length : 0
  }, [filteredOrders, totalSales])

  const averagePreparationTime = useMemo(() => {
    const ordersWithPrepTime = filteredOrders.filter(
      (order) => order.preparationTime !== undefined
    )
    return ordersWithPrepTime.length > 0
      ? ordersWithPrepTime.reduce(
          (sum, order) => sum + (order.preparationTime || 0),
          0
        ) / ordersWithPrepTime.length
      : 0
  }, [filteredOrders])

  const salesByCategory = useMemo(() => {
    const categorySales: { [key: string]: number } = {}
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        categorySales[item.category] =
          (categorySales[item.category] || 0) + item.price * item.quantity
      })
    })
    return Object.entries(categorySales).map(([name, value]) => ({
      name,
      value
    }))
  }, [filteredOrders])

  const ordersByHour = useMemo(() => {
    const hourlyOrders: { [key: number]: number } = {}
    filteredOrders.forEach((order) => {
      const hour = new Date(order.timestamp).getHours()
      hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1
    })
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: hourlyOrders[i] || 0
    }))
  }, [filteredOrders])

  const preparationTimeVsOrderValue = useMemo(() => {
    return filteredOrders
      .filter((order) => order.preparationTime !== undefined)
      .map((order) => ({
        preparationTime: order.preparationTime || 0,
        orderValue: order.total
      }))
  }, [filteredOrders])

  const generatePDF = useCallback(() => {
    // eslint-disable-next-line new-cap
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Buf Barista Sales Report', 14, 22)
    doc.setFontSize(12)
    doc.text(
      `Report Period: ${format(getDateRange().start, 'yyyy-MM-dd')} to ${format(
        getDateRange().end,
        'yyyy-MM-dd'
      )}`,
      14,
      30
    )
    doc.text(`Total Sales: $${totalSales.toFixed(2)}`, 14, 38)
    doc.text(`Total Orders: ${totalOrders}`, 14, 46)
    doc.text(`Average Order Value: $${averageOrderValue.toFixed(2)}`, 14, 54)

    const tableColumn = ['Date', 'Sales', 'Orders']
    const tableRows = salesData.map(({ date, sales, orders }) => [
      date,
      `$${sales.toFixed(2)}`,
      orders
    ])

    doc.autoTable({
      startY: 70,
      head: [tableColumn],
      body: tableRows
    })

    doc.save('buf-barista-sales-report.pdf')
  }, [getDateRange, totalSales, totalOrders, averageOrderValue, salesData])

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader size={48} className="spin" />
        <p>Loading report data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <p>{error}</p>
        <button onClick={fetchOrders} className="retry-button">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  return (
    <div className="reports-container">
      <h1 className="page-title">Sales Reports</h1>

      <div className="controls">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="time-range-select"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        {timeRange === 'custom' && (
          <div className="custom-date-range">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="custom-date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="custom-date-input"
            />
          </div>
        )}
        <button onClick={fetchOrders} className="refresh-button">
          <RefreshCw size={16} /> Refresh Data
        </button>
        <button onClick={generatePDF} className="download-button">
          <Download size={16} /> Download Report
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Sales</h3>
            <p className="metric-value">${totalSales.toFixed(2)}</p>
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
            <p className="metric-value">${averageOrderValue.toFixed(2)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <h3>Avg Preparation Time</h3>
            <p className="metric-value">
              {averagePreparationTime.toFixed(2)} min
            </p>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Sales and Orders Trend</h3>
          <div className="chart-controls">
            <button
              onClick={() => setSelectedMetric('sales')}
              className={`chart-control-button ${
                selectedMetric === 'sales' ? 'active' : ''
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setSelectedMetric('orders')}
              className={`chart-control-button ${
                selectedMetric === 'orders' ? 'active' : ''
              }`}
            >
              Orders
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetric === 'sales' && (
                <Line type="monotone" dataKey="sales" stroke="#8884d8" />
              )}
              {selectedMetric === 'orders' && (
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#8884d8" name="Quantity" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {salesByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Preparation Time vs Order Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="preparationTime"
                name="Preparation Time"
                unit="min"
              />
              <YAxis
                type="number"
                dataKey="orderValue"
                name="Order Value"
                unit="$"
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Orders"
                data={preparationTimeVsOrderValue}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        .reports-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-title {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .time-range-select,
        .refresh-button,
        .download-button,
        .custom-date-input {
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
        }

        .custom-date-range {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .refresh-button,
        .download-button {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: #4a90e2;
          color: white;
          border: none;
          transition: background-color 0.3s ease;
        }

        .refresh-button:hover,
        .download-button:hover {
          background-color: #357abd;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .metric-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .metric-icon {
          background-color: #f0f0f0;
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
          color: #666;
          margin: 0;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 5px 0 0;
        }

        .chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .chart-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
          font-size: 18px;
          color: #333;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .chart-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
        }

        .chart-control-button {
          padding: 5px 10px;
          font-size: 14px;
          border: 1px solid #ddd;
          background-color: white;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .chart-control-button.active {
          background-color: #4a90e2;
          color: white;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .loading-container p,
        .error-container p {
          margin-top: 20px;
          font-size: 18px;
          color: #666;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .retry-button {
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 16px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
          }

          .chart-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Reports

