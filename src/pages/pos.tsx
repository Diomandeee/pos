import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Coffee,
  X,
  DollarSign,
  Gift,
  Moon,
  Sun,
  Search,
  Bell,
  Plus,
  Minus,
  FileText,
  Star,
  Clock,
  CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import Button from '@shared/atoms/Button'
import { format } from 'date-fns'

const menuItems = [
  { id: 1, name: 'Espresso', price: 2.5, category: 'Coffee', popular: true },
  { id: 2, name: 'Americano', price: 3.0, category: 'Coffee', popular: false },
  { id: 3, name: 'Latte', price: 3.5, category: 'Coffee', popular: true },
  { id: 4, name: 'Cappuccino', price: 3.5, category: 'Coffee', popular: true },
  {
    id: 5,
    name: 'Caramel Crunch Crusher',
    price: 4.5,
    category: 'Specialty',
    popular: true
  },
  {
    id: 6,
    name: 'Vanilla Dream Latte',
    price: 4.5,
    category: 'Specialty',
    popular: false
  },
  {
    id: 7,
    name: 'Hazelnut Heaven Cappuccino',
    price: 4.5,
    category: 'Specialty',
    popular: false
  },

  {
    id: 12,
    name: 'Flat White',
    price: 3.5,
    category: 'Coffee',
    popular: false
  },
  { id: 14, name: 'Cortado', price: 3.5, category: 'Coffee', popular: false }
]

const flavorOptions = [
  'No Flavoring',
  'Vanilla',
  'Caramel',
  'Hazelnut',
  'Raspberry',
  'Pumpkin Spice'
]

const BufBaristaPOS = () => {
  // Basic state
  const [cart, setCart] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastInitial: '',
    organization: '',
    email: '',
    phone: ''
  })
  const [orderNotes, setOrderNotes] = useState('')
  const [orderNumber, setOrderNumber] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isComplimentaryMode, setIsComplimentaryMode] = useState(true)
  const [queueStartTime, setQueueStartTime] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [runningTotal, setRunningTotal] = useState(0)
  const [quickNotes, setQuickNotes] = useState([])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false)
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false)
  const [notification, setNotification] = useState(null)
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [selectedCoffeeItem, setSelectedCoffeeItem] = useState(null)
  const [showPopular, setShowPopular] = useState(false)

  // Load saved quick notes
  useEffect(() => {
    const savedQuickNotes = localStorage.getItem('quickNotes')
    if (savedQuickNotes) {
      setQuickNotes(JSON.parse(savedQuickNotes))
    }
  }, [])

  // Save quick notes
  useEffect(() => {
    localStorage.setItem('quickNotes', JSON.stringify(quickNotes))
  }, [quickNotes])

  const categories = useMemo(
    () => ['All', ...new Set(menuItems.map((item) => item.category))],
    []
  )

  useEffect(() => {
    const lastOrderNumber = localStorage.getItem('lastOrderNumber')
    if (lastOrderNumber) {
      setOrderNumber(parseInt(lastOrderNumber) + 1)
    }

    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }

    const savedComplimentaryMode = localStorage.getItem('complimentaryMode')
    if (savedComplimentaryMode) {
      setIsComplimentaryMode(JSON.parse(savedComplimentaryMode))
    }

    setQueueStartTime(new Date())
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    document.body.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem(
      'complimentaryMode',
      JSON.stringify(isComplimentaryMode)
    )
  }, [isComplimentaryMode])

  const showNotification = useCallback((message) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const addToCart = useCallback(
    (item) => {
      if (item.category === 'Coffee') {
        setSelectedCoffeeItem(item)
        setSelectedFlavor('')
        setIsFlavorModalOpen(true)
      } else {
        setCart((prevCart) => {
          const existingItem = prevCart.find(
            (cartItem) => cartItem.id === item.id && cartItem.flavor === null
          )
          if (existingItem) {
            return prevCart.map((cartItem) =>
              cartItem.id === item.id && cartItem.flavor === null
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            )
          } else {
            return [...prevCart, { ...item, flavor: null, quantity: 1 }]
          }
        })
        setRunningTotal((prevTotal) => prevTotal + item.price)
        showNotification(`Added ${item.name} to cart`)
      }
    },
    [showNotification]
  )

  const confirmFlavorSelection = useCallback(() => {
    if (selectedCoffeeItem) {
      const flavoredCoffee = {
        ...selectedCoffeeItem,
        flavor: selectedFlavor === 'No Flavoring' ? null : selectedFlavor,
        quantity: 1
      }
      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) =>
            item.id === flavoredCoffee.id &&
            item.flavor === flavoredCoffee.flavor
        )
        if (existingItem) {
          return prevCart.map((item) =>
            item.id === flavoredCoffee.id &&
            item.flavor === flavoredCoffee.flavor
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          return [...prevCart, flavoredCoffee]
        }
      })
      setRunningTotal((prevTotal) => prevTotal + selectedCoffeeItem.price)
      showNotification(
        `Added ${selectedCoffeeItem.name}${
          selectedFlavor !== 'No Flavoring' ? ` with ${selectedFlavor}` : ''
        } to cart`
      )
      setIsFlavorModalOpen(false)
    }
  }, [selectedFlavor, selectedCoffeeItem, showNotification])

  const removeFromCart = useCallback((index) => {
    setCart((prevCart) => {
      const newCart = [...prevCart]
      const item = newCart[index]
      if (item.quantity > 1) {
        newCart[index] = { ...item, quantity: item.quantity - 1 }
      } else {
        newCart.splice(index, 1)
      }
      setRunningTotal((prevTotal) => prevTotal - item.price)
      return newCart
    })
  }, [])

  const increaseQuantity = useCallback((index) => {
    setCart((prevCart) => {
      const newCart = [...prevCart]
      const item = newCart[index]
      newCart[index] = { ...item, quantity: item.quantity + 1 }
      setRunningTotal((prevTotal) => prevTotal + item.price)
      return newCart
    })
  }, [])

  const calculateTotal = useCallback(() => {
    return isComplimentaryMode
      ? 0
      : cart
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
          .toFixed(2)
  }, [cart, isComplimentaryMode])

  const handlePlaceOrder = useCallback(() => {
    if (cart.length === 0) return
    setIsModalOpen(true)
  }, [cart])

  const addQuickNote = useCallback((note) => {
    setOrderNotes((prev) => (prev ? `${prev}\n${note}` : note))
  }, [])

  const saveQuickNote = useCallback(
    (note) => {
      if (note && !quickNotes.includes(note)) {
        setQuickNotes((prev) => [...prev, note])
        showNotification('Quick note saved!')
      }
    },
    [quickNotes, showNotification]
  )

  const confirmOrder = useCallback(() => {
    if (!customerInfo.firstName || !customerInfo.lastInitial) return

    const orderStartTime = new Date()
    const newOrder = {
      id: orderNumber,
      customerName: `${customerInfo.firstName} ${customerInfo.lastInitial}.`,
      customerInfo: { ...customerInfo },
      items: [...cart],
      notes: orderNotes,
      timestamp: orderStartTime.toLocaleString(),
      status: 'Pending',
      total: calculateTotal(),
      isComplimentary: isComplimentaryMode,
      queueTime: queueStartTime
        ? (orderStartTime.getTime() - queueStartTime.getTime()) / 1000
        : 0,
      startTime: orderStartTime
    }

    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const updatedOrders = [newOrder, ...existingOrders]
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    localStorage.setItem('lastOrderNumber', orderNumber.toString())

    setCart([])
    setCustomerInfo({
      firstName: '',
      lastInitial: '',
      organization: '',
      email: '',
      phone: ''
    })
    setOrderNotes('')
    setOrderNumber(orderNumber + 1)
    setQueueStartTime(new Date())
    setRunningTotal(0)
    setIsModalOpen(false)
    showNotification('Order placed successfully!')
  }, [
    customerInfo,
    cart,
    orderNumber,
    calculateTotal,
    isComplimentaryMode,
    queueStartTime,
    showNotification,
    orderNotes
  ])

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (selectedCategory === 'All' || item.category === selectedCategory) &&
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (!showPopular || item.popular)
      ),
    [selectedCategory, searchTerm, showPopular]
  )

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handlePlaceOrder()
      }
    },
    [handlePlaceOrder]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const toggleServiceMode = useCallback(() => {
    setIsComplimentaryMode((prev) => !prev)
    showNotification(
      `Switched to ${isComplimentaryMode ? 'Pop-up' : 'Complimentary'} mode`
    )
  }, [isComplimentaryMode, showNotification])

  return (
    <div className={`pos-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="pos-header">
        <div className="header-left">
          <button onClick={toggleServiceMode} className="mode-button">
            {isComplimentaryMode ? <Gift /> : <DollarSign />}
            {isComplimentaryMode ? 'Complimentary' : 'Pop-up'}
          </button>
          <button
            onClick={() => setShowPopular(!showPopular)}
            className={`mode-button ${showPopular ? 'active' : ''}`}
          >
            <Star />
            Popular Items
          </button>
        </div>

        <div className="search-container">
          <Search />
          <input
            type="text"
            placeholder="Search menu..."
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
            {isDarkMode ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <main className="pos-main">
        <section className="cart-section">
          <h2 className="section-title">Cart</h2>

          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <ul className="cart-items">
              {cart.map((item, index) => (
                <li key={index} className="cart-item">
                  <span className="item-name">
                    {item.name}
                    {item.flavor && (
                      <span className="item-flavor"> ({item.flavor})</span>
                    )}
                  </span>
                  <div className="item-controls">
                    <button
                      onClick={() => removeFromCart(index)}
                      className="quantity-button"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(index)}
                      className="quantity-button"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="item-price">
                      {isComplimentaryMode
                        ? ''
                        : `$${(item.price * item.quantity).toFixed(2)}`}
                    </span>
                    <Button
                      onClick={() => removeFromCart(index)}
                      className="remove-item"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="order-notes-section">
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Add notes about this order..."
              className="notes-input"
            />
            <div className="quick-notes">
              <div className="quick-note-chips">
                {quickNotes.map((note, index) => (
                  <button
                    key={index}
                    onClick={() => addQuickNote(note)}
                    className="quick-note-chip"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cart-total">
            <span>Total:</span>
            <span>{isComplimentaryMode ? '' : `$${calculateTotal()}`}</span>
          </div>

          {/* <div className="running-total">
            Running Total: ${runningTotal.toFixed(2)}
          </div> */}

          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
            className="place-order-button"
          >
            Place Order
          </button>

          <Link href="/orders" passHref>
            <button className="view-orders-button">View Orders</button>
          </Link>
          <Link href="/reports" passHref>
            <button className="view-orders-button">View Reports</button>
          </Link>
        </section>

        <section className="menu-section">
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-button ${
                  category === selectedCategory ? 'active' : ''
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="menu-item"
              >
                <Coffee className="item-icon" />
                <h3 className="item-name">
                  {item.name}
                  {item.popular && <Star className="popular-icon" size={16} />}
                </h3>
                <p className="item-price">
                  {isComplimentaryMode ? '' : `$${item.price.toFixed(2)}`}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Customer Information</h3>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, firstName: e.target.value })
              }
              placeholder="First Name"
              className="modal-input"
            />
            <input
              type="text"
              value={customerInfo.lastInitial}
              onChange={(e) =>
                setCustomerInfo({
                  ...customerInfo,
                  lastInitial: e.target.value
                })
              }
              placeholder="Last Name Initial"
              className="modal-input"
            />
            <input
              type="text"
              value={customerInfo.organization}
              onChange={(e) =>
                setCustomerInfo({
                  ...customerInfo,
                  organization: e.target.value
                })
              }
              placeholder="Organization (Optional)"
              className="modal-input"
            />
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) =>
                setCustomerInfo({
                  ...customerInfo,
                  email: e.target.value
                })
              }
              placeholder="Email (Optional)"
              className="modal-input"
            />
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo({
                  ...customerInfo,
                  phone: e.target.value
                })
              }
              placeholder="Phone (Optional)"
              className="modal-input"
            />
            <div className="modal-buttons">
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-button cancel"
              >
                Cancel
              </button>
              <button onClick={confirmOrder} className="modal-button confirm">
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {isFlavorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Select Flavoring</h3>
            {flavorOptions.map((flavor) => (
              <button
                key={flavor}
                onClick={() => setSelectedFlavor(flavor)}
                className={`flavor-button ${
                  selectedFlavor === flavor ? 'selected' : ''
                }`}
              >
                {flavor}
              </button>
            ))}
            <div className="modal-buttons">
              <button
                onClick={() => setIsFlavorModalOpen(false)}
                className="modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmFlavorSelection}
                className="modal-button confirm"
                disabled={!selectedFlavor}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {isQuickNoteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Add Quick Note</h3>
            <textarea
              placeholder="Enter a quick note to save for future use..."
              className="modal-textarea"
              id="quickNoteInput"
            />
          </div>
        </div>
      )}

      {notification && (
        <div className="notification">
          <Bell size={16} />
          {notification}
        </div>
      )}
      <style jsx>{`
        /* Base Variables */
        :root {
          --primary-color: #4a90e2;
          --secondary-color: #50e3c2;
          --accent-color: #f5a623;
          --background-color: #f8f9fa;
          --text-color: #333333;
          --border-color: #e1e4e8;
          --success-color: #28a745;
          --warning-color: #ffc107;
          --danger-color: #dc3545;
        }

        /* Container Styles */
        .pos-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: var(--background-color);
        }

        /* Header Styles */
        .pos-header {
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
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: var(--secondary-color);
          color: white;
        }

        .mode-button:hover {
          background-color: var(--accent-color);
          transform: translateY(-2px);
        }

        .search-container {
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
          min-width: 200px;
        }

        /* Main Layout */
        .pos-main {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
        }

        /* Menu Section */
        .menu-section {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          align-items: center;
        }

        .section-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 1.5rem;
          color: var(--primary-color);
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          justify-content: center;
        }

        .category-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: ghostwhite;
          color: var(--primary-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        .category-button.active {
          background-color: var(--primary-color);
          color: teal;
          transform: translateY(-2px);
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          transition: all 0.3s ease;
          cursor: pointer;
          background-color: white;
          position: relative;
        }

        .menu-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .item-icon {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .popular-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          color: var(--warning-color);
        }

        .item-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .item-price {
          font-size: 14px;
          color: var(--accent-color);
          font-weight: bold;
        }

        /* Cart Section */
        .cart-section {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .empty-cart {
          text-align: center;
          color: #666;
          font-style: italic;
          margin-top: 1rem;
        }

        .cart-items {
          list-style-type: none;
          padding: 0;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .item-customization {
          font-size: 14px;
          color: var(--accent-color);
          font-style: italic;
        }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quantity-button {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .quantity-button:hover {
          background-color: var(--background-color);
        }

        .item-quantity {
          font-weight: bold;
          min-width: 24px;
          text-align: center;
        }

        .remove-item {
          color: var(--danger-color);
          cursor: pointer;
          transition: all 0.3s ease;
          background: none;
          border: none;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .remove-item:hover {
          transform: scale(1.1);
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid var(--border-color);
        }

        .running-total {
          margin-top: 1rem;
          font-weight: bold;
          color: var(--accent-color);
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

        .notes-input {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
        }

        .quick-notes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-note-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #4a90e2;
          color: white;
        }

        .quick-note-button:hover {
          background-color: #357abd;
          transform: translateY(-2px);
        }

        .quick-note-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quick-note-chip {
          padding: 6px 12px;
          border: none;
          border-radius: 15px;
          background-color: #e9ecef;
          color: #495057;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .quick-note-chip:hover {
          background-color: #4a90e2;
          color: white;
          transform: translateY(-2px);
        }

        /* Action Buttons */
        .place-order-button,
        .view-orders-button {
          width: 100%;
          margin-top: 1rem;
          padding: 0.75rem;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .place-order-button {
          background-color: #28a745;
          color: white;
        }

        .place-order-button:hover {
          background-color: #218838;
          transform: translateY(-2px);
        }

        .place-order-button:disabled {
          background-color: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .view-orders-button {
          background-color: #17a2b8;
          color: white;
        }

        .view-orders-button:hover {
          background-color: #138496;
          transform: translateY(-2px);
        }

        /* Modal Styles */
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
          padding: 25px;
          border-radius: 10px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #333;
        }

        .section-subtitle {
          font-size: 16px;
          color: #495057;
          margin-bottom: 10px;
        }

        .modal-input,
        .modal-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
          font-family: inherit;
        }

        .modal-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .customization-section {
          margin-bottom: 20px;
        }

        .milk-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .milk-button,
        .flavor-button {
          width: 100%;
          padding: 10px;
          border: 1px solid #e9ecef;
          border-radius: 5px;
          background-color: white;
          color: #495057;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .milk-button:hover,
        .flavor-button:hover {
          background-color: #f8f9fa;
        }

        .milk-button.selected,
        .flavor-button.selected {
          background-color: #4a90e2;
          color: white;
          border-color: #4a90e2;
        }

        .milk-price {
          font-size: 12px;
          opacity: 0.8;
        }

        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .modal-button {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-button.confirm {
          background-color: #28a745;
          color: white;
        }

        .modal-button.cancel {
          background-color: #dc3545;
          color: white;
        }

        .modal-button:hover {
          transform: translateY(-2px);
        }

        .modal-button:disabled {
          background-color: #e9ecef;
          color: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        /* Notification */
        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 6px;
          background-color: #4a90e2;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: slide In 0.3s ease-out;
          z-index: 1000;
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

        /* Dark Mode Styles */
        .dark-mode {
          --background-color: #1a1a1a;
          --text-color: #f0f0f0;
          --border-color: #444;
          --primary-color: #3a7bc8;
          --secondary-color: #3cc9ac;
          --accent-color: #f5a623;
        }

        .dark-mode .pos-container {
          background-color: var(--background-color);
          color: var(--text-color);
        }

        .dark-mode .pos-header,
        .dark-mode .menu-section,
        .dark-mode .cart-section,
        .dark-mode .modal-content,
        .dark-mode .menu-item {
          background-color: #2c2c2c;
          color: var(--text-color);
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
          background-color: var(--primary-color);
          color: white;
        }

        .dark-mode .order-notes-section {
          background-color: #2c2c2c;
          border-color: #444;
        }

        .dark-mode .notes-input,
        .dark-mode .modal-input,
        .dark-mode .modal-textarea {
          background-color: #3c3c3c;
          border-color: #444;
          color: var(--text-color);
        }

        .dark-mode .quick-note-chip {
          background-color: #3c3c3c;
          color: #f0f0f0;
        }

        .dark-mode .milk-button,
        .dark-mode .flavor-button {
          background-color: #3c3c3c;
          border-color: #444;
          color: var(--text-color);
        }

        .dark-mode .milk-button.selected,
        .dark-mode .flavor-button.selected {
          background-color: var(--primary-color);
          color: white;
        }

        .dark-mode .quantity-button {
          color: var(--secondary-color);
        }

        .dark-mode .remove-item {
          color: #ff6b6b;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .pos-container {
            padding: 10px;
          }

          .pos-main {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .pos-header {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
          }

          .header-left,
          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .search-container {
            width: 100%;
          }

          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .cart-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .item-controls {
            width: 100%;
            justify-content: flex-end;
            margin-top: 8px;
          }

          .category-filters {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 10px;
          }

          .category-button {
            flex-shrink: 0;
          }

          .modal-content {
            width: 95%;
            margin: 10px;
            padding: 15px;
          }

          .modal-buttons {
            flex-direction: column;
            gap: 8px;
          }

          .modal-button {
            width: 100%;
          }

          .quick-note-chips {
            max-height: 120px;
            overflow-y: auto;
          }
        }

        @media (max-width: 480px) {
          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .menu-item {
            padding: 0.75rem;
          }

          .item-name {
            font-size: 14px;
          }

          .modal-content {
            padding: 15px;
          }

          .notification {
            width: 90%;
            left: 5%;
            right: 5%;
          }
        }

        /* Print Styles */
        @media print {
          .pos-container {
            background: white;
          }

          .pos-header,
          .menu-section,
          .mode-button,
          .search-container,
          .category-filters,
          .place-order-button,
          .view-orders-button {
            display: none;
          }

          .cart-section {
            width: 100%;
            box-shadow: none;
          }

          .cart-items {
            border: 1px solid #ddd;
          }

          .notification {
            display: none;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: more) {
          :root {
            --primary-color: #0056b3;
            --secondary-color: #006644;
            --accent-color: #cc7700;
            --text-color: #000000;
            --background-color: #ffffff;
            --border-color: #000000;
          }

          .dark-mode {
            --text-color: #ffffff;
            --background-color: #000000;
            --border-color: #ffffff;
          }

          .button,
          .modal-button,
          .quick-note-button {
            border: 2px solid currentColor;
          }
        }

        /* Focus Styles */
        .button:focus,
        .modal-button:focus,
        .menu-item:focus,
        .quick-note-button:focus,
        .quick-note-chip:focus {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        .search-input:focus,
        .notes-input:focus,
        .modal-input:focus,
        .modal-textarea:focus {
          outline: 2px solid var(--primary-color);
          border-color: var(--primary-color);
        }

        /* Touch Device Optimizations */
        @media (hover: none) {
          .button:hover,
          .modal-button:hover,
          .menu-item:hover,
          .quick-note-button:hover,
          .quick-note-chip:hover {
            transform: none;
          }

          .menu-item,
          .cart-item,
          .modal-button {
            cursor: default;
          }

          .quantity-button,
          .remove-item {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  )
}
export default BufBaristaPOS
