import React, { useState } from 'react'

const Accordion = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null)

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="accordion">
      {data.map((item, index) => (
        <div key={index} className="accordion-item">
          <button
            onClick={() => handleToggle(index)}
            className="accordion-title"
          >
            {item.question}
          </button>
          <div
            className={`accordion-content ${
              activeIndex === index ? 'active' : ''
            }`}
          >
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
      <style>{`
        .accordion {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          text-align: left;
        }
        .accordion-item {
          border-bottom: 1px solid #ccc;
        }
        .accordion-title {
          width: 100%;
          text-align: left;
          padding: 15px;
          font-size: 18px;
          background: none;
          border: none;
          cursor: pointer;
          color: #b0bec5;
        }
        .accordion-content {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease;
        }
        .accordion-content.active {
          max-height: 200px; /* Adjust as needed */
        }
        .accordion-content p {
          padding: 15px;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default Accordion
