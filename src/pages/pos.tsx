'use client'

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
  Minus
} from 'lucide-react'
import Link from 'next/link'
import Button from '@shared/atoms/Button'

const menuItems = [
  { id: 1, name: 'Espresso', price: 2.5, category: 'Coffee' },
  { id: 2, name: 'Americano', price: 3.0, category: 'Coffee' },
  { id: 3, name: 'Latte', price: 3.5, category: 'Coffee' },
  { id: 4, name: 'Cappuccino', price: 3.5, category: 'Coffee' },
  { id: 5, name: 'Caramel Crunch Crusher', price: 4.5, category: 'Specialty' },
  { id: 6, name: 'Vanilla Dream Latte', price: 4.5, category: 'Specialty' },
  {
    id: 7,
    name: 'Hazelnut Heaven Cappuccino',
    price: 4.5,
    category: 'Specialty'
  },
  { id: 8, name: 'Green Tea', price: 2.5, category: 'Tea' },
  { id: 9, name: 'Black Tea', price: 2.5, category: 'Tea' },
  { id: 10, name: 'Chai Tea', price: 3.0, category: 'Tea' },
  { id: 11, name: 'Croissant', price: 2.0, category: 'Pastries' },
  { id: 12, name: 'Flat White', price: 3.5, category: 'Coffee' },
  { id: 14, name: 'Cortado', price: 3.5, category: 'Coffee' }
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
  const [cart, setCart] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastInitial: '',
    organization: ''
  })
  const [orderNumber, setOrderNumber] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isComplimentaryMode, setIsComplimentaryMode] = useState(true)
  const [queueStartTime, setQueueStartTime] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [runningTotal, setRunningTotal] = useState(0)
  const [notification, setNotification] = useState(null)
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [selectedCoffeeItem, setSelectedCoffeeItem] = useState(null)

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

  const confirmOrder = useCallback(() => {
    if (!customerInfo.firstName || !customerInfo.lastInitial) return

    const orderStartTime = new Date()
    const newOrder = {
      id: orderNumber,
      customerName: `${customerInfo.firstName} ${customerInfo.lastInitial}.`,
      customerOrganization: customerInfo.organization,
      items: [...cart],
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
    setCustomerInfo({ firstName: '', lastInitial: '', organization: '' })
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
    showNotification
  ])

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (selectedCategory === 'All' || item.category === selectedCategory) &&
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [selectedCategory, searchTerm]
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
        <button onClick={toggleServiceMode} className="mode-button">
          {isComplimentaryMode ? <Gift /> : <DollarSign />}
          {isComplimentaryMode ? 'Complimentary' : 'Pop-up'}
        </button>

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

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mode-button"
        >
          {isDarkMode ? <Sun /> : <Moon />}
        </button>
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

          <div className="cart-total">
            <span>Total:</span>
            <span>{isComplimentaryMode ? '' : `$${calculateTotal()}`}</span>
          </div>

          <div className="running-total">
            Running Total: ${runningTotal.toFixed(2)}
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
            className="place-order-button"
          >
            Place Order (Ctrl + Enter)
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
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-button ${
                  selectedCategory === category ? 'active' : ''
                }`}
              >
                {category}
              </Button>
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
                <h3 className="item-name">{item.name}</h3>
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

      {notification && (
        <div className="notification">
          <Bell size={16} />
          {notification}
        </div>
      )}

      <style jsx>{`
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

        .pos-container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: var(--background-color);
          color: var(--text-color);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pos-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: var(--primary-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          background-color: white;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-input {
          border: none;
          outline: none;
          margin-left: 0.5rem;
          font-size: 14px;
          width: 200px;
        }

        .pos-main {
          display: flex;
          flex: 1;
          padding: 2rem;
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .menu-section {
          flex: 2;
          border-radius: 10px;
          padding: 1.5rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .cart-section {
          flex: 1;
          border-radius: 10px;
          padding: 1.5rem;
          height: fit-content;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        }

        .category-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 20px;
          background-color: var(--background-color);
          color: var(--text-color);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-button.active {
          background-color: var(--primary-color);
          color: white;
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
        }

        .menu-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .item-icon {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
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
          transition: all 0.3s ease;
        }

        .quantity-button:hover {
          color: var(--accent-color);
        }

        .item-quantity {
          font-weight: bold;
          min-width: 20px;
          text-align: center;
        }

        .remove-item {
          background: none;
          border: none;
          color: var(--danger-color);
          cursor: pointer;
          transition: all 0.3s ease;
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
        }

        .place-order-button {
          background-color: var(--primary-color);
          color: white;
        }

        .place-order-button:hover {
          background-color: #3a7bc8;
          transform: translateY(-2px);
        }

        .place-order-button:disabled {
          background-color: #b0b0b0;
          cursor: not-allowed;
        }

        .view-orders-button {
          background-color: var(--secondary-color);
          color: white;
        }

        .view-orders-button:hover {
          background-color: #3cc9ac;
          transform: translateY(-2px);
        }

        .empty-cart {
          text-align: center;
          color: #666;
          font-style: italic;
          margin-top: 1rem;
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
        }

        .modal-content {
          background-color: white;
          padding: 2rem;
          border-radius: 10px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 1rem;
          color: var(--primary-color);
        }

        .modal-input {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 5px;
          font-size: 14px;
        }

        .modal-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
        }

        .modal-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-button.confirm {
          background-color: var(--primary-color);
          color: white;
        }

        .modal-button.cancel {
          background-color: var(--danger-color);
          color: white;
        }

        .modal-button:hover {
          transform: translateY(-2px);
        }

        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: var(--primary-color);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease-out;
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
          --primary-color: #3a7bc8;
          --secondary-color: #3cc9ac;
          --accent-color: #f5a623;
        }

        .dark-mode .pos-container {
          background-color: var(--background-color);
          color: var(--text-color);
        }

        .dark-mode .menu-item,
        .dark-mode .cart-item,
        .dark-mode .modal-content,
        .dark-mode .menu-section,
        .dark-mode .cart-section {
          background-color: #2c2c2c;
          color: var(--text-color);
        }

        .dark-mode .menu-item:hover {
          background-color: #3c3c3c;
        }

        .dark-mode .modal-input {
          background-color: #3c3c3c;
          color: var(--text-color);
          border-color: var(--border-color);
        }

        .dark-mode .category-button {
          background-color: #3c3c3c;
          color: var(--text-color);
        }

        .dark-mode .category-button.active {
          background-color: var(--primary-color);
          color: white;
        }

        .flavor-button {
          width: 100%;
          margin: 5px 0;
          padding: 10px;
          background-color: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .flavor-button:hover {
          background-color: #3cc9ac;
        }

        .flavor-button.selected {
          background-color: var(--accent-color);
        }

        .item-flavor {
          font-style: italic;
          color: var(--accent-color);
        }

        @media (max-width: 768px) {
          .pos-main {
            flex-direction: column;
          }

          .menu-section,
          .cart-section {
            width: 100%;
          }

          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .category-filters {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .category-button {
            flex-shrink: 0;
          }

          .modal-content {
            width: 95%;
            max-width: 350px;
          }

          .pos-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .search-container {
            width: 100%;
          }

          .search-input {
            width: 100%;
          }

          .mode-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default BufBaristaPOS
