import React from 'react'
import tick from '../assets/Vector (1).png'
import styles from './Completed_Payment.module.scss'

const Completed_Payment = () => {
  return (
    <>
      <div className={styles.mainPage}>
        <div className={styles.greenNtick}>
          <img src={tick} alt="Tick Icon" />
        </div>
        <p>Order Complete</p>
        <p>You Will Receive a confirmation email soon!</p>
      </div>
    </>
  )
}

export default Completed_Payment