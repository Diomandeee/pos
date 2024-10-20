import React from 'react'
import Head from 'next/head'
import Page from '@shared/Page'
import Button from '@shared/atoms/Button'
import { useRouter } from 'next/router'

export default function ContactPage() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Contact | Buf Barista</title>
      </Head>

      <Page
        title="Get in Touch"
        description="Any questions, feedback, or just want to say hello, feel free to reach out to us!"
        uri={router.route}
        headerCenter
      >
        <section className="menu">
          <div className="section-title">
            <strong>Business Contacts</strong>
          </div>
          <ul className="menu-list">
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:mo@bufbarista.com">✉️ mo@bufbarista.com</a>
            </li>
            <li>
              <strong>Instagram:</strong>{' '}
              <a href="https://www.instagram.com/bufbarista/">📸 @bufbarista</a>
            </li>
          </ul>

          <div className="section-title">
            <strong>Personal Contacts</strong>
          </div>
          <ul className="menu-list">
            <li>
              <strong>Instagram:</strong>{' '}
              <a href="https://www.instagram.com/diomandee/">📸 @diomandee</a>
            </li>
          </ul>
        </section>
        {/* Call to Action Section */}
        <section className="section cta">
          <h2>🎉 Ready to Elevate Your Event?</h2>
          <Button style="primary" to="https://www.typeform.com">
            Get a Free Estimate
          </Button>
        </section>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .menu {
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: fadeIn 1s ease-in-out;
            background: white;
            border: 10px solid #f5f5f5;
            border-radius: 16px;
            max-width: 50%;
            margin: 0 auto;
          }

          .section-title {
            text-align: center;
            font-size: 1.5rem;
            margin-bottom: 2rem;
            color: #333;
            overflow: hidden;

          }

          .menu-list {
            list-style-type: none;
            padding-left: 0;
            animation: fadeIn 1s ease-in-out;
            text-align: center;
          }

          .menu-list li {
            margin-bottom: 1rem;
            font-size: 1.2rem;
            line-height: 1.6;
          }

          .menu-list li a {
            color: #333;
            text-decoration: none;
          }
          .cta {
            text-align: center;
            margin-top: 40px;
            animation: fadeIn 1s ease-in-out;
          }

          .cta h2 {
            color: #663300;
          }
          .menu-list li a:hover {
            color: #993300;
          }
        `}</style>
      </Page>
    </>
  )
}
