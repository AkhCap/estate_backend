import Link from "next/link";
import styles from "../styles/navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <Link href="/" className={styles.logo}>
          Estate
        </Link>
      </div>
      <nav className={styles.mainNav}>
        <Link href="/">Главная</Link>
        <Link href="/about">О нас</Link>
        <Link href="/contacts">Контакты</Link>
      </nav>
      <nav className={styles.userNav}>
        <ul className={styles.userNavList}>
          <li>
            <Link href="/register">Регистрация</Link>
          </li>
          <li>
            <Link href="/login">Вход</Link>
          </li>
          <li>
            <Link href="/profile">Профиль</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}