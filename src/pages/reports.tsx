import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  eachDayOfInterval,
  isSameDay
} from 'date-fns'
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
  Scatter,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts'
import {
  Download,
  DollarSign,
  TrendingUp,
  Coffee,
  Clock,
  RefreshCw,
  AlertTriangle,
  Loader,
  Users,
  ShoppingCart,
  Percent,
  Calendar,
  Award,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
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

interface TrendMetrics {
  date: string
  sales: number
  orders: number
  movingAverageSales: number
  movingAverageOrders: number
  salesGrowth: number
  ordersGrowth: number
  trend: 'up' | 'down' | 'stable'
}

const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'orders'>(
    'sales'
  )

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
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
          start: customStartDate
            ? startOfDay(customStartDate)
            : startOfDay(now),
          end: customEndDate ? endOfDay(customEndDate) : endOfDay(now)
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
    const { start, end } = getDateRange()
    const days = eachDayOfInterval({ start, end })
    const data: { [key: string]: { sales: number; orders: number } } = {}

    days.forEach((day) => {
      const date = format(day, 'yyyy-MM-dd')
      data[date] = { sales: 0, orders: 0 }
    })

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
  }, [filteredOrders, getDateRange])

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
    if (ordersWithPrepTime.length === 0) {
      return 0
    }
    return Math.round(
      ordersWithPrepTime.reduce(
        (sum, order) => sum + (order.preparationTime || 0),
        0
      ) / ordersWithPrepTime.length
    )
  }, [filteredOrders])

  const calculateMovingAverage = (data: number[], periods: number) => {
    return data.map((_, index) => {
      const start = Math.max(0, index - periods + 1)
      const values = data.slice(start, index + 1)
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })
  }

  const enhancedSalesTrend = useMemo((): TrendMetrics[] => {
    const baseData = salesData.map((item) => ({
      date: item.date,
      sales: item.sales,
      orders: item.orders
    }))

    const salesValues = baseData.map((item) => item.sales)
    const ordersValues = baseData.map((item) => item.orders)

    const movingAverageSales = calculateMovingAverage(salesValues, 7)
    const movingAverageOrders = calculateMovingAverage(ordersValues, 7)

    return baseData.map((item, index) => {
      const previousSales = salesValues[index - 1] || salesValues[index]
      const previousOrders = ordersValues[index - 1] || ordersValues[index]

      const salesGrowth = ((item.sales - previousSales) / previousSales) * 100
      const ordersGrowth =
        ((item.orders - previousOrders) / previousOrders) * 100

      const trend =
        salesGrowth > 1 ? 'up' : salesGrowth < -1 ? 'down' : 'stable'

      return {
        date: item.date,
        sales: item.sales,
        orders: item.orders,
        movingAverageSales: movingAverageSales[index],
        movingAverageOrders: movingAverageOrders[index],
        salesGrowth,
        ordersGrowth,
        trend
      }
    })
  }, [salesData])
  // Add a helper function to format time in minutes:seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
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

  const uniqueCustomers = useMemo(() => {
    return new Set(filteredOrders.map((order) => order.customerName)).size
  }, [filteredOrders])

  const repeatCustomerRate = useMemo(() => {
    const customerOrderCounts = filteredOrders.reduce((acc, order) => {
      acc[order.customerName] = (acc[order.customerName] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    const repeatCustomers = Object.values(customerOrderCounts).filter(
      (count) => count > 1
    ).length
    return uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0
  }, [filteredOrders, uniqueCustomers])

  const averageItemsPerOrder = useMemo(() => {
    const totalItems = filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )
    return totalOrders > 0 ? totalItems / totalOrders : 0
  }, [filteredOrders, totalOrders])

  const salesTrend = useMemo(() => {
    const { start, end } = getDateRange()
    const days = eachDayOfInterval({ start, end })
    const salesByDay: { [key: string]: number } = {}

    days.forEach((day) => {
      const date = format(day, 'yyyy-MM-dd')
      salesByDay[date] = 0
    })

    filteredOrders.forEach((order) => {
      const date = format(new Date(order.timestamp), 'yyyy-MM-dd')
      salesByDay[date] += order.isComplimentary ? 0 : order.total
    })

    return Object.entries(salesByDay)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders, getDateRange])

  const customerRetentionRate = useMemo(() => {
    const { start } = getDateRange()
    const previousPeriodStart = subDays(
      start,
      getDateRange().end.getTime() - start.getTime()
    )

    const currentCustomers = new Set(
      filteredOrders.map((order) => order.customerName)
    )
    const previousCustomers = new Set(
      orders
        .filter((order) => {
          const orderDate = new Date(order.timestamp)
          return orderDate >= previousPeriodStart && orderDate < start
        })
        .map((order) => order.customerName)
    )

    const retainedCustomers = [...currentCustomers].filter((customer) =>
      previousCustomers.has(customer)
    ).length
    return previousCustomers.size > 0
      ? (retainedCustomers / previousCustomers.size) * 100
      : 0
  }, [filteredOrders, orders, getDateRange])

  // New metrics
  const peakHourSales = useMemo(() => {
    const hourlyData = filteredOrders.reduce((acc, order) => {
      const hour = new Date(order.timestamp).getHours()
      acc[hour] = (acc[hour] || 0) + (order.isComplimentary ? 0 : order.total)
      return acc
    }, {} as { [key: number]: number })

    if (Object.keys(hourlyData).length === 0) {
      return { hour: 'N/A', sales: 0 }
    }

    const peakHour = Object.entries(hourlyData).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )
    return { hour: peakHour[0], sales: peakHour[1] }
  }, [filteredOrders])
  const salesGrowthRate = useMemo(() => {
    const { start, end } = getDateRange()
    const periodLength = end.getTime() - start.getTime()
    const previousPeriodStart = new Date(start.getTime() - periodLength)

    const currentPeriodSales = filteredOrders.reduce(
      (sum, order) => sum + (order.isComplimentary ? 0 : order.total),
      0
    )
    const previousPeriodSales = orders
      .filter((order) => {
        const orderDate = new Date(order.timestamp)
        return orderDate >= previousPeriodStart && orderDate < start
      })
      .reduce(
        (sum, order) => sum + (order.isComplimentary ? 0 : order.total),
        0
      )

    return previousPeriodSales !== 0
      ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100
      : 100 // If previous period had no sales, consider it 100% growth
  }, [filteredOrders, orders, getDateRange])

  // New charts data
  const categoryPerformance = useMemo(() => {
    const categoryData: { [key: string]: { sales: number; orders: number } } =
      {}
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!categoryData[item.category]) {
          categoryData[item.category] = { sales: 0, orders: 0 }
        }
        categoryData[item.category].sales += item.price * item.quantity
        categoryData[item.category].orders += item.quantity
      })
    })
    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      sales: data.sales,
      orders: data.orders
    }))
  }, [filteredOrders])

  const dailySalesAndOrders = useMemo(() => {
    const { start, end } = getDateRange()
    const days = eachDayOfInterval({ start, end })
    const dailyData: {
      [key: string]: { date: string; sales: number; orders: number }
    } = {}

    days.forEach((day) => {
      const date = format(day, 'yyyy-MM-dd')
      dailyData[date] = { date, sales: 0, orders: 0 }
    })

    filteredOrders.forEach((order) => {
      const date = format(new Date(order.timestamp), 'yyyy-MM-dd')
      dailyData[date].sales += order.isComplimentary ? 0 : order.total
      dailyData[date].orders += 1
    })

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders, getDateRange])
  const generateCSV = useCallback(() => {
    // Prepare CSV headers
    const headers = [
      'Date',
      'Total Sales ($)',
      'Orders',
      'Average Order Value ($)',
      'Unique Customers',
      'Preparation Time (min:sec)',
      'Items Sold'
    ]

    // Prepare daily data
    const csvData = dailySalesAndOrders.map((day) => {
      const dayOrders = filteredOrders.filter((order) =>
        isSameDay(new Date(order.timestamp), new Date(day.date))
      )

      const dayUniqueCustomers = new Set(
        dayOrders.map((order) => order.customerName)
      ).size

      const dayAvgOrderValue = day.sales / (day.orders || 1)

      const dayPrepTime = dayOrders
        .filter((order) => order.preparationTime)
        .reduce(
          (avg, order, _, arr) =>
            avg + (order.preparationTime || 0) / (arr.length || 1),
          0
        )

      const dayItemsSold = dayOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      )

      return [
        day.date,
        day.sales.toFixed(2),
        day.orders,
        dayAvgOrderValue.toFixed(2),
        dayUniqueCustomers,
        formatTime(dayPrepTime),
        dayItemsSold
      ]
    })

    // Add summary data
    const summaryData = [
      ['Summary Statistics'],
      ['Total Period Sales ($)', totalSales.toFixed(2)],
      ['Total Orders', totalOrders],
      ['Average Order Value ($)', averageOrderValue.toFixed(2)],
      ['Unique Customers', uniqueCustomers],
      ['Customer Retention Rate (%)', customerRetentionRate.toFixed(2)],
      ['Average Preparation Time', formatTime(averagePreparationTime)],
      ['Repeat Customer Rate (%)', repeatCustomerRate.toFixed(2)],
      ['Sales Growth Rate (%)', salesGrowthRate.toFixed(2)],
      [''],
      ['Top Selling Items'],
      ['Item Name', 'Quantity Sold', 'Revenue ($)'],
      ...topSellingItems.map((item) => [
        item.name,
        item.quantity,
        item.revenue.toFixed(2)
      ]),
      [''],
      ['Sales by Category'],
      ['Category', 'Total Sales ($)'],
      ...salesByCategory.map((category) => [
        category.name,
        category.value.toFixed(2)
      ])
    ]

    // Combine all data
    const allRows = [
      ['Daily Sales Report'],
      [
        `Report Period: ${format(
          getDateRange().start,
          'yyyy-MM-dd'
        )} to ${format(getDateRange().end, 'yyyy-MM-dd')}`
      ],
      [''],
      headers,
      ...csvData,
      [''],
      ...summaryData
    ]

    // Convert to CSV string
    const csvContent = allRows.map((row) => row.join(',')).join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [
    dailySalesAndOrders,
    filteredOrders,
    totalSales,
    totalOrders,
    averageOrderValue,
    uniqueCustomers,
    customerRetentionRate,
    averagePreparationTime,
    repeatCustomerRate,
    salesGrowthRate,
    topSellingItems,
    salesByCategory,
    getDateRange,
    formatTime
  ])
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
            <DatePicker
              selected={customStartDate}
              onChange={(date) => setCustomStartDate(date)}
              selectsStart
              startDate={customStartDate}
              endDate={customEndDate}
              maxDate={new Date()}
              placeholderText="Start Date"
              className="custom-date-input"
            />
            <DatePicker
              selected={customEndDate}
              onChange={(date) => setCustomEndDate(date)}
              selectsEnd
              startDate={customStartDate}
              endDate={customEndDate}
              minDate={customStartDate}
              maxDate={new Date()}
              placeholderText="End Date"
              className="custom-date-input"
            />
          </div>
        )}
        <button onClick={fetchOrders} className="refresh-button">
          <RefreshCw size={16} /> Refresh Data
        </button>
        <button onClick={generateCSV} className="download-button">
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
            <p className="metric-value">{formatTime(averagePreparationTime)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Unique Customers</h3>
            <p className="metric-value">{uniqueCustomers}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Percent size={24} />
          </div>
          <div className="metric-content">
            <h3>Repeat Customer Rate</h3>
            <p className="metric-value">{repeatCustomerRate.toFixed(2)}%</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="metric-content">
            <h3>Avg Items Per Order</h3>
            <p className="metric-value">{averageItemsPerOrder.toFixed(2)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          {/* <div className="metric-content">
            <h3>Customer Retention Rate</h3>
            <p className="metric-value">{customerRetentionRate.toFixed(2)}%</p>
          </div> */}
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Award size={24} />
          </div>
          <div className="metric-content">
            <h3>Peak Hour Sales</h3>
            <p className="metric-value">
              Hour {peakHourSales.hour}, ${peakHourSales.sales.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          {/* <div className="metric-content">
            <h3>Sales Growth Rate</h3>
            <p className="metric-value">{salesGrowthRate.toFixed(2)}%</p>
          </div> */}
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card advanced">
          <h3>Sales and Orders Trend Analysis</h3>
          <div className="chart-controls">
            <button
              onClick={() => setSelectedMetric('orders')}
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
            <ComposedChart data={enhancedSalesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (typeof name === 'string' && name.includes('Growth')) {
                    return [`${Number(value).toFixed(2)}%`, name]
                  }
                  return [value, name]
                }}
              />
              <Legend />
              {selectedMetric === 'sales' ? (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="sales"
                    fill="#8884d8"
                    name="Sales"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="movingAverageSales"
                    stroke="#82ca9d"
                    name="7-day Moving Average"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="salesGrowth"
                    stroke="#ff7300"
                    name="Growth Rate %"
                  />
                </>
              ) : (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    fill="#82ca9d"
                    name="Orders"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="movingAverageOrders"
                    stroke="#8884d8"
                    name="7-day Moving Average"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ordersGrowth"
                    stroke="#ff7300"
                    name="Growth Rate %"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="trend-indicators">
            <div className="trend-summary">
              <h4>Trend Analysis</h4>
              <p>
                7-day Moving Average:{' '}
                {selectedMetric === 'sales'
                  ? `$${enhancedSalesTrend[
                      enhancedSalesTrend.length - 1
                    ]?.movingAverageSales.toFixed(2)}`
                  : enhancedSalesTrend[
                      enhancedSalesTrend.length - 1
                    ]?.movingAverageOrders.toFixed(1)}
              </p>
              <p>
                Growth Rate:{' '}
                {selectedMetric === 'sales'
                  ? `${enhancedSalesTrend[
                      enhancedSalesTrend.length - 1
                    ]?.salesGrowth.toFixed(2)}%`
                  : `${enhancedSalesTrend[
                      enhancedSalesTrend.length - 1
                    ]?.ordersGrowth.toFixed(2)}%`}
              </p>
            </div>
          </div>
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
                tickFormatter={(value) => formatTime(value)}
              />
              <YAxis
                type="number"
                dataKey="orderValue"
                name="Order Value"
                unit="$"
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'preparationTime') {
                    return [formatTime(value as number), name]
                  }
                  return [value, name]
                }}
              />
              <Scatter
                name="Orders"
                data={preparationTimeVsOrderValue}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8884d8"
                fill="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="80%"
              data={categoryPerformance}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
              <Radar
                name="Sales"
                dataKey="sales"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Orders"
                dataKey="orders"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Daily Sales and Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailySalesAndOrders}>
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis dataKey="date" scale="band" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="orders"
                barSize={20}
                fill="#413ea0"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sales"
                stroke="#ff7300"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="nav-buttons">
        <Link href="/pos" passHref>
          <button className="nav-button">Go to POS</button>
        </Link>
        <Link href="/orders" passHref>
          <button className="nav-button">Go to Orders</button>
        </Link>
      </div>
      <style>{`
        .nav-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
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
        .chart-card.advanced {
          background-color: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        
        .trend-indicators {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .trend-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .trend-summary h4 {
          margin: 0;
          color: #333;
          font-size: 16px;
        }
        
        .trend-summary p {
          margin: 0;
          color: #666;
          font-size: 14px;
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
