import React from 'react'
import styles from './Footer.module.scss'
import facebook from '../../assets/facebook.png';
import github from '../../assets/github.png';
import google from '../../assets/google.jpg';
import microsoft from '../../assets/microsoft.png';
import twitter from '../../assets/twitter.png';
import logo from '../../assets/logo (1).png';


const Footer = () => {
  return (
    <footer>
        <div className={styles.footerInfo}>
            <div className={styles.footerIntro}>
            <div className={styles.footerLogo}>
                <img src={logo} alt="Byway Logo" style={{ width: '31px', height: '40px' }} />
                <span>Byway</span>
            </div>
                <p>Empowering learners through accessible and engaging online education.</p>
                <p>Byway is a leading online learning platform dedicated to providing high-quality, flexible, and affordable educational experiences.</p>
            </div>

            <div className={styles.getHelp}>
                <p className={styles.upperP}>Get Help</p>
                <p>Contact Us</p>
                <p>Latest Articles</p>
                <p>FAQ</p>
            </div>

            <div className={styles.programs}>
                <p className={styles.upperP}>Programs</p>
                <p>Art & Design</p>
                <p>Business</p>
                <p>IT & Software</p>
                <p>Languages</p>
                <p>Programming</p>
            </div>

            <div className={styles.contact}>
            <div className={styles.contactUs}>
                <p className={styles.upperP}>Contact Us</p>
                <p>Address: 123 Main Street, Anytown, CA 12345</p>
                <p>Tel: +(123) 456-7890</p>
                <p>Mail: bywayellu@webkul.in</p>
            </div>
            <div className={styles.partnerButton}>
                <a href="#" className={styles.iconBtn}><img src={facebook} alt="Facebook" /></a>
                <a href="#" className={styles.iconBtn}><img src={twitter} alt="Twitter" /></a>
                <a href="#" className={styles.iconBtn}><img src={google} alt="Google" /></a>
                <a href="#" className={styles.iconBtn}><img src={github} alt="Github" /></a>
                <a href="#" className={styles.iconBtn}><img src={microsoft} alt="Microsoft" /></a>
            </div>
            </div>
        </div>
    </footer>
  )
}

export default Footer