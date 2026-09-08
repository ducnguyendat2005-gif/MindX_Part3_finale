import React from 'react'
import styles from './Footer.module.scss'
import facebook from '../../assets/facebook.png';
import github from '../../assets/github.png';
import google from '../../assets/google.jpg';
import microsoft from '../../assets/microsoft.png';
import twitter from '../../assets/twitter.png';
import logo from '../../assets/logo (1).png';
import { useLanguage } from '../../context/LanguageContext.jsx';


const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer>
        <div className={styles.footerInfo}>
            <div className={styles.footerIntro}>
            <div className={styles.footerLogo}>
                <img src={logo} alt="Byway Logo" style={{ width: '31px', height: '40px' }} />
                <span>Byway</span>
            </div>
                <p>{t('footer.tagline')}</p>
                <p>{t('footer.description')}</p>
            </div>

            <div className={styles.getHelp}>
                <p className={styles.upperP}>{t('footer.getHelp')}</p>
                <p>{t('footer.contactUs')}</p>
                <p>{t('footer.latestArticles')}</p>
                <p>{t('footer.faq')}</p>
            </div>

            <div className={styles.programs}>
                <p className={styles.upperP}>{t('footer.programs')}</p>
                <p>Art & Design</p>
                <p>Business</p>
                <p>IT & Software</p>
                <p>Languages</p>
                <p>Programming</p>
            </div>

            <div className={styles.contact}>
            <div className={styles.contactUs}>
                <p className={styles.upperP}>{t('footer.contactUs')}</p>
                <p>{t('footer.address')}: 123 Main Street, Anytown, CA 12345</p>
                <p>{t('footer.tel')}: +(123) 456-7890</p>
                <p>{t('footer.mail')}: bywayellu@webkul.in</p>
            </div>
            <div className={styles.partnerButton}>
                <a href="https://www.facebook.com/facebook/" className={styles.iconBtn}><img src={facebook} alt="Facebook" /></a>
                <a href="https://x.com/?lang=vi" className={styles.iconBtn}><img src={twitter} alt="Twitter" /></a>
                <a href="https://www.google.com/" className={styles.iconBtn}><img src={google} alt="Google" /></a>
                <a href="https://github.com/" className={styles.iconBtn}><img src={github} alt="Github" /></a>
                <a href="https://www.microsoft.com/vi-vn" className={styles.iconBtn}><img src={microsoft} alt="Microsoft" /></a>
            </div>
            </div>
        </div>
    </footer>
  )
}

export default Footer
