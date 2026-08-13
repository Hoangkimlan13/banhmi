"use client";

import { dictionary, localizePath } from "@/app/i18n";
import type { Locale } from "@/app/i18n";
import { stores } from "@/app/data";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  locale: Locale;
}

export default function SiteFooter({ locale }: SiteFooterProps) {
  const t = dictionary[locale] || dictionary.ja;
  const hontenStore = stores.find((s) => s.id === "honten") || stores[0];

  const brandSlogan: Record<Locale, string> = {
    // ĐÃ SỬA: Thay từ "và" bằng trợ từ tiếng Nhật "と" đúng ngữ pháp
    ja: "1961年創業、厳選された肉質と職人技が織りなす極上のとんかつをお届けします。",
    en: "Since 1961, delivering premium tonkatsu crafted with selected meats and artisan techniques.",
    vi: "Từ năm 1961, mang đến những phần Tonkatsu thượng hạng được chế tác tinh xảo từ nguyên liệu tuyển chọn.",
    zh: "始于1961年，凭匠心工艺与精选食材，呈献极致美味的炸猪排。",
    ko: "1961년 창업래, 엄선된 육질과 장인의 기술로 빚어내는 최고의 돈카츠를 선사합니다.",
  };

  const columnTitles: Record<Locale, { map: string; service: string; headquarter: string }> = {
    ja: { map: "サイトマップ", service: "サービス", headquarter: "本店情報" },
    en: { map: "SITEMAP", service: "SERVICES", headquarter: "MAIN STORE" },
    vi: { map: "SƠ ĐỒ TRANG", service: "DỊCH VỤ", headquarter: "TRỤ SỞ CHÍNH" },
    zh: { map: "网站地图", service: "门店服务", headquarter: "总店信息" },
    ko: { map: "사이트맵", service: "서비스", headquarter: "본점 안내" },
  };

  const titles = columnTitles[locale] || columnTitles.ja;

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      e.preventDefault(); // Ngăn hành vi nhảy trang mặc định
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Nếu không tìm thấy element (ví dụ đang ở trang con khác như /terms, /privacy), 
    // thẻ <a> sẽ tự động điều hướng về trang chủ theo thuộc tính href bình thường.
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        <div className={styles.mainGrid}>
          
          {/* Cột 1: Thương hiệu & Biểu tượng */}
          <div className={styles.brandSection}>
            <img 
              src="/images/logo_footer.png" 
              alt={t.siteName} 
              className={styles.logoImage} 
            />
            <p className={styles.brandDescription}>
              {brandSlogan[locale] || brandSlogan.ja}
            </p>
            
            {/* Hàng biểu tượng kết nối cao cấp dạng Icon SVG */}
            <div className={styles.socialWrapper}>
              {/* Instagram */}
              <a href="https://www.instagram.com/tonkatsuniimura/" target="_blank" rel="noopener noreferrer" className={styles.iconLink} title="Instagram">
                <svg className={styles.svgIcon} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 264.583 264.583">
                  <defs>
                    <radialGradient xlinkHref="#a_insta" id="f_insta" cx="158.429" cy="578.088" r="52.352" fx="158.429" fy="578.088" gradientTransform="matrix(0 -4.03418 4.28018 0 -2332.227 942.236)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#b_insta" id="g_insta" cx="172.615" cy="600.692" r="65" fx="172.615" fy="600.692" gradientTransform="matrix(.67441 -1.16203 1.51283 .87801 -814.366 -47.835)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#c_insta" id="h_insta" cx="144.012" cy="51.337" r="67.081" fx="144.012" fy="51.337" gradientTransform="matrix(-2.3989 .67549 -.23008 -.81732 464.996 -26.404)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#d_insta" id="e_insta" cx="199.788" cy="628.438" r="52.352" fx="199.788" fy="628.438" gradientTransform="matrix(-3.10797 .87652 -.6315 -2.23914 1345.65 1374.198)" gradientUnits="userSpaceOnUse"/>
                    <linearGradient id="d_insta"><stop offset="0" stopColor="#ff005f"/><stop offset="1" stopColor="#fc01d8"/></linearGradient>
                    <linearGradient id="c_insta"><stop offset="0" stopColor="#780cff"/><stop offset="1" stopColor="#820bff" stopOpacity="0"/></linearGradient>
                    <linearGradient id="b_insta"><stop offset="0" stopColor="#fc0"/><stop offset="1" stopColor="#fc0" stopOpacity="0"/></linearGradient>
                    <linearGradient id="a_insta"><stop offset="0" stopColor="#fc0"/><stop offset=".124" stopColor="#fc0"/><stop offset=".567" stopColor="#fe4a05"/><stop offset=".694" stopColor="#ff0f3f"/><stop offset="1" stopColor="#fe0657" stopOpacity="0"/></linearGradient>
                  </defs>
                  <path fill="url(#e_insta)" d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z" transform="translate(-71.816 -18.143)"/>
                  <path fill="url(#f_insta)" d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z" transform="translate(-71.816 -18.143)"/>
                  <path fill="url(#g_insta)" d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z" transform="translate(-71.816 -18.143)"/>
                  <path fill="url(#h_insta)" d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z" transform="translate(-71.816 -18.143)"/>
                  <path fill="#fff" d="M132.345 33.973c-26.716 0-30.07.117-40.563.594-10.472.48-17.62 2.136-23.876 4.567-6.47 2.51-11.958 5.87-17.426 11.335-5.472 5.464-8.834 10.948-11.354 17.412-2.44 6.252-4.1 13.397-4.57 23.858-.47 10.486-.593 13.838-.593 40.535 0 26.697.119 30.037.594 40.522.482 10.465 2.14 17.609 4.57 23.859 2.515 6.465 5.876 11.95 11.346 17.414 5.466 5.468 10.955 8.834 17.42 11.345 6.26 2.431 13.41 4.088 23.881 4.567 10.493.477 13.844.594 40.559.594 26.719 0 30.061-.117 40.555-.594 10.472-.48 17.63-2.136 23.888-4.567 6.468-2.51 11.948-5.877 17.414-11.345 5.472-5.464 8.834-10.949 11.354-17.412 2.419-6.252 4.079-13.398 4.57-23.858.472-10.486.595-13.828.595-40.525s-.123-30.047-.594-40.533c-.492-10.465-2.152-17.608-4.57-23.858-2.521-6.466-5.883-11.95-11.355-17.414-5.472-5.468-10.944-8.827-17.42-11.335-6.271-2.431-13.424-4.088-23.897-4.567-10.493-.477-13.834-.594-40.558-.594zm-8.825 17.715c2.62-.004 5.542 0 8.825 0 26.266 0 29.38.094 39.752.565 9.591.438 14.797 2.04 18.264 3.385 4.591 1.782 7.864 3.912 11.305 7.352 3.443 3.44 5.575 6.717 7.362 11.305 1.346 3.46 2.951 8.663 3.388 18.247.47 10.363.573 13.475.573 39.71 0 26.233-.102 29.346-.573 39.709-.44 9.584-2.042 14.786-3.388 18.247-1.783 4.587-3.919 7.854-7.362 11.292-3.443 3.441-6.712 5.57-11.305 7.352-3.463 1.352-8.673 2.95-18.264 3.388-10.37.47-13.486.573-39.752.573-26.268 0-29.38-.102-39.751-.573-9.592-.443-14.797-2.044-18.267-3.39-4.59-1.781-7.87-3.911-11.313-7.352-3.443-3.44-5.574-6.709-7.362-11.298-1.346-3.461-2.95-8.663-3.387-18.247-.472-10.363-.566-13.476-.566-39.726s.094-29.347.566-39.71c.438-9.584 2.04-14.786 3.387-18.25 1.783-4.588 3.919-7.865 7.362-11.305 3.443-3.441 6.722-5.57 11.313-7.357 3.468-1.351 8.675-2.949 18.267-3.389 9.075-.41 12.592-.532 30.926-.553zm61.337 16.322c-6.518 0-11.805 5.277-11.805 11.792 0 6.512 5.287 11.796 11.805 11.796 6.517 0 11.804-5.284 11.804-11.796 0-6.513-5.287-11.796-11.805-11.796zm-52.512 13.782c-27.9 0-50.519 22.603-50.519 50.482 0 27.879 22.62 50.471 50.52 50.471s50.51-22.592 50.51-50.471c0-27.879-22.613-50.482-50.513-50.482zm0 17.715c18.11 0 32.792 14.67 32.792 32.767 0 18.096-14.683 32.767-32.792 32.767-18.11 0-32.791-14.671-32.791-32.767 0-18.098 14.68-32.767 32.791-32.767z"/>
                </svg>
              </a>

              {/* Google Maps */}
              <a href={hontenStore.mapsLink} target="_blank" rel="noopener noreferrer" className={styles.iconLink} title="Google Maps">
                <svg className={styles.svgIcon} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 268.152 273.883">
                  <defs>
                    <linearGradient id="a_maps"><stop offset="0" stopColor="#0fbc5c"/><stop offset="1" stopColor="#0cba65"/></linearGradient><linearGradient id="g_maps"><stop offset=".231" stopColor="#0fbc5f"/><stop offset=".312" stopColor="#0fbc5f"/><stop offset=".366" stopColor="#0fbc5e"/><stop offset=".458" stopColor="#0fbc5d"/><stop offset=".54" stopColor="#12bc58"/><stop offset=".699" stopColor="#28bf3c"/><stop offset=".771" stopColor="#38c02b"/><stop offset=".861" stopColor="#52c218"/><stop offset=".915" stopColor="#67c30f"/><stop offset="1" stopColor="#86c504"/></linearGradient><linearGradient id="h_maps"><stop offset=".142" stopColor="#1abd4d"/><stop offset=".248" stopColor="#6ec30d"/><stop offset=".312" stopColor="#8ac502"/><stop offset=".366" stopColor="#a2c600"/><stop offset=".446" stopColor="#c8c903"/><stop offset=".54" stopColor="#ebcb03"/><stop offset=".616" stopColor="#f7cd07"/><stop offset=".699" stopColor="#fdcd04"/><stop offset=".771" stopColor="#fdce05"/><stop offset=".861" stopColor="#ffce0a"/></linearGradient><linearGradient id="f_maps"><stop offset=".316" stopColor="#ff4c3c"/><stop offset=".604" stopColor="#ff692c"/><stop offset=".727" stopColor="#ff7825"/><stop offset=".885" stopColor="#ff8d1b"/><stop offset="1" stopColor="#ff9f13"/></linearGradient><linearGradient id="b_maps"><stop offset=".231" stopColor="#ff4541"/><stop offset=".312" stopColor="#ff4540"/><stop offset=".458" stopColor="#ff4640"/><stop offset=".54" stopColor="#ff473f"/><stop offset=".699" stopColor="#ff5138"/><stop offset=".771" stopColor="#ff5b33"/><stop offset=".861" stopColor="#ff6c29"/><stop offset="1" stopColor="#ff8c18"/></linearGradient><linearGradient id="d_maps"><stop offset=".408" stopColor="#fb4e5a"/><stop offset="1" stopColor="#ff4540"/></linearGradient><linearGradient id="c_maps"><stop offset=".132" stopColor="#0cba65"/><stop offset=".21" stopColor="#0bb86d"/><stop offset=".297" stopColor="#09b479"/><stop offset=".396" stopColor="#08ad93"/><stop offset=".477" stopColor="#0aa6a9"/><stop offset=".568" stopColor="#0d9cc6"/><stop offset=".667" stopColor="#1893dd"/><stop offset=".769" stopColor="#258bf1"/><stop offset=".859" stopColor="#3086ff"/></linearGradient><linearGradient id="e_maps"><stop offset=".366" stopColor="#ff4e3a"/><stop offset=".458" stopColor="#ff8a1b"/><stop offset=".54" stopColor="#ffa312"/><stop offset=".616" stopColor="#ffb60c"/><stop offset=".771" stopColor="#ffcd0a"/><stop offset=".861" stopColor="#fecf0a"/><stop offset=".915" stopColor="#fecf08"/><stop offset="1" stopColor="#fdcd01"/></linearGradient><linearGradient xlinkHref="#a_maps" id="s_maps" x1="219.7" x2="254.467" y1="329.535" y2="329.535" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#b_maps" id="m_maps" cx="109.627" cy="135.862" r="71.46" fx="109.627" fy="135.862" gradientTransform="matrix(-1.93688 1.043 1.45573 2.55542 290.525 -400.634)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#c_maps" id="n_maps" cx="45.259" cy="279.274" r="71.46" fx="45.259" fy="279.274" gradientTransform="matrix(-3.5126 -4.45809 -1.69255 1.26062 870.8 191.554)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#d_maps" id="l_maps" cx="304.017" cy="118.009" r="47.854" fx="304.017" fy="118.009" gradientTransform="matrix(2.06435 0 0 2.59204 -297.679 -151.747)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#e_maps" id="o_maps" cx="181.001" cy="177.201" r="71.46" fx="181.001" fy="177.201" gradientTransform="matrix(-.24858 2.08314 2.96249 .33417 -255.146 -331.164)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#f_maps" id="p_maps" cx="207.673" cy="108.097" r="41.102" fx="207.673" fy="108.097" gradientTransform="matrix(-1.2492 1.34326 -3.89684 -3.4257 880.501 194.905)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#g_maps" id="r_maps" cx="109.627" cy="135.862" r="71.46" fx="109.627" fy="135.862" gradientTransform="matrix(-1.93688 -1.043 1.45573 -2.55542 290.525 838.683)" gradientUnits="userSpaceOnUse"/><radialGradient xlinkHref="#h_maps" id="j_maps" cx="154.87" cy="145.969" r="71.46" fx="154.87" fy="145.969" gradientTransform="matrix(-.0814 -1.93722 2.92674 -.11625 -215.135 632.86)" gradientUnits="userSpaceOnUse"/>
                    <filter id="q_maps" width="1.097" height="1.116" x="-.048" y="-.058" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="1.701"/></filter><filter id="k_maps" width="1.033" height="1.02" x="-.017" y="-.01" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation=".242"/></filter><clipPath id="i_maps" clipPathUnits="userSpaceOnUse"><path d="M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786-4.674 7.773-10.451 13.69-16.373 18.196-17.74 13.498-38.42 16.258-52.783 16.258-36.283 0-67.283-23.286-79.285-54.928-.484-1.149-.805-2.335-1.197-3.507a81.115 81.115 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398 11.285-32.897 42.985-57.467 80.179-57.467 7.481 0 14.685.884 21.517 2.648a77.668 77.668 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32-30.878 0-59.386 9.553-82.748 25.7-18.945 13.093-34.483 30.625-44.97 50.985-9.753 18.879-15.094 39.8-15.094 62.294 0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988 15.997 11.386 44.68 26.551 84.031 26.551 22.63 0 42.687-4.051 60.375-11.644 12.76-5.478 24.065-12.622 34.301-21.804 13.525-12.132 24.117-27.139 31.347-44.404 7.23-17.265 11.097-36.79 11.097-57.957 0-9.858-.998-19.87-2.689-28.968Z"/></clipPath>
                  </defs>
                  <g clipPath="url(#i_maps)" transform="matrix(.95792 0 0 .98525 -90.174 -78.856)">
                    <path fill="url(#j_maps)" d="M92.076 219.958c.148 22.14 6.501 44.983 16.117 63.424v.127c6.949 13.392 16.445 23.97 27.26 34.452l65.327-23.67c-12.36-6.235-14.246-10.055-23.105-17.026-9.054-9.066-15.802-19.473-20.004-31.677h-.17l.17-.127c-2.765-8.058-3.037-16.613-3.14-25.503Z" filter="url(#k_maps)"/>
                    <path fill="url(#l_maps)" d="M237.083 79.025c-6.456 22.526-3.988 44.421 0 57.161 7.457.006 14.64.888 21.45 2.647a77.662 77.662 0 0 1 33.424 18.25l41.88-40.726c-24.81-22.59-54.667-37.297-96.754-37.332Z" filter="url(#k_maps)"/>
                    <path fill="url(#m_maps)" d="M236.943 78.847c-31.67 0-60.91 9.798-84.871 26.359a145.533 145.533 0 0 0-24.332 21.15c-1.904 17.744 14.257 39.551 46.262 39.37 15.528-17.936 38.495-29.542 64.056-29.542l.07.002-1.044-57.335c-.048 0-.093-.004-.14-.004Z" filter="url(#k_maps)"/>
                    <path fill="url(#n_maps)" d="m341.475 226.379-28.268 19.285c-1.24 7.562-4.028 15.002-8.107 21.786-4.674 7.772-10.45 13.69-16.373 18.196-17.702 13.47-38.328 16.244-52.687 16.255-14.842 25.102-17.444 37.675 1.043 57.934 22.877-.016 43.157-4.117 61.046-11.796 12.931-5.551 24.388-12.792 34.761-22.097 13.706-12.295 24.442-27.503 31.769-45 7.327-17.497 11.245-37.282 11.245-58.734Z" filter="url(#k_maps)"/>
                    <path fill="#3086ff" d="M234.996 191.21v57.498h136.006c1.196-7.874 5.152-18.064 5.152-26.5 0-9.858-.996-21.899-2.687-30.998Z" filter="url(#k_maps)"/>
                    <path fill="url(#o_maps)" d="M128.39 124.327c-8.394 9.119-15.564 19.326-21.249 30.364-9.753 18.879-15.094 41.83-15.094 64.324 0 .317.026.627.029.944 4.32 8.224 59.666 6.649 62.456 0-.004-.31-.039-.613-.039-.924 0-9.226 1.57-16.026 4.43-24.367 3.53-10.289 9.056-19.763 16.123-27.926 1.602-2.031 5.875-6.397 7.121-9.016.475-.997-.862-1.557-.937-1.908-.083-.393-1.876-.077-2.277-.37-1.275-.929-3.8-1.414-5.334-1.845-3.277-.921-8.708-2.953-11.725-5.06-9.536-6.658-24.417-14.612-33.505-24.216Z" filter="url(#k_maps)"/>
                    <path fill="url(#p_maps)" d="M162.099 155.857c22.112 13.301 28.471-6.714 43.173-12.977l-25.574-52.664a144.74 144.74 0 0 0-26.543 14.504c-12.316 8.512-23.192 18.9-32.176 30.72Z" filter="url(#q_maps)"/>
                    <path fill="url(#r_maps)" d="M171.099 290.222c-29.683 10.641-34.33 11.023-37.062 29.29a144.806 144.806 0 0 0 16.792 13.984c15.996 11.386 46.766 26.551 86.118 26.551.046 0 .09-.004.137-.004v-59.157l-.094.002c-14.736 0-26.512-3.843-38.585-10.527-2.977-1.648-8.378 2.777-11.123.799-3.786-2.729-12.9 2.35-16.183-.938Z" filter="url(#k_maps)"/>
                    <path fill="url(#s_maps)" d="M219.7 299.023v59.996c5.506.64 11.236 1.028 17.247 1.028 6.026 0 11.855-.307 17.52-.872v-59.748a105.119 105.119 0 0 1-17.477 1.461c-5.932 0-11.7-.686-17.29-1.865Z" filter="url(#k_maps)" opacity=".5"/>
                  </g>
                </svg>
              </a>

              {/* TripAdvisor */}
              <a href="https://www.tripadvisor.jp/Restaurant_Review-g14133667-d1687503-Reviews-Tonkatsu_Niimura_Main_Branch-Kabukicho_Shinjuku_Tokyo_Tokyo_Prefecture_Kanto.html" target="_blank" rel="noopener noreferrer" className={styles.iconLink} title="Tripadvisor">
                <svg className={styles.svgIcon} fill="#34E0A1" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"/>
                </svg>
              </a>

              {/* Uber Eats */}
              <a href="https://www.ubereats.com/jp/store/%E3%81%A8%E3%82%93%E3%81%8B%E3%81%A4%E3%81%AB%E3%81%84%E3%82%80%E3%82%89%E6%9C%AC%E5%BA%97-tonkatsu-niimura-honten/ZbTMpqvuTa2ox_kYJZ9XKQ?diningMode=DELIVERY&sc=SEARCH_SUGGESTION" target="_blank" rel="noopener noreferrer" className={styles.iconLink} title="Uber Eats">
                <svg className={styles.svgIcon} fill="#06C167" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 2.8645v4.9972c0 1.8834 1.3315 3.1297 3.0835 3.1297a2.9652 2.9652 0 0 0 2.1502-.876v.7425H6.445V2.8645H5.223v4.9339c0 1.2642-.8696 2.1198-1.9954 2.122-1.1386-.0023-1.997-.834-1.997-2.122V2.8645zm7.3625 0v7.9934h1.163v-.7318a2.9915 2.9915 0 0 0 2.1177.876c1.714.048 3.1295-1.3283 3.1295-3.0429s-1.4155-3.091-3.1295-3.0429a2.9674 2.9674 0 0 0-2.107.876V2.8645zm9.8857 2.0561c-1.6752-.0074-3.0369 1.3492-3.0356 3.0245 0 1.7366 1.3732 3.0373 3.1537 3.0373a3.123 3.123 0 0 0 2.5578-1.2438l-.8495-.6177a2.0498 2.0498 0 0 1-1.7083.8585c-.9763.0126-1.8147-.6915-1.971-1.6553h4.818v-.379c0-1.734-1.254-3.0238-2.9638-3.0245zm6.1632.0667a1.5943 1.5943 0 0 0-1.376.7657v-.7186h-1.163v5.8235h1.1741V7.5465c0-.9023.5581-1.4847 1.3268-1.4847h.4949V4.9886c-.1576.0013-.3186-.0009-.4568-.0013zm-6.2034.944a1.844 1.844 0 0 1 1.8337 1.486H15.424a1.844 1.844 0 0 1 1.784-1.486zm-6.6589.0056c1.1223-.0084 2.0365.8992 2.0364 2.0215-.0026 1.1203-.914 2.0258-2.0343 2.021a2.0151 2.0151 0 0 1-1.4159-.5987A2.0152 2.0152 0 0 1 8.55 7.9592a2.0152 2.0152 0 0 1 .5838-1.422 2.0152 2.0152 0 0 1 1.4153-.6003zM0 12.9864v7.9716h5.7222v-1.3666H1.5458v-1.971h4.0647v-1.314H1.5458v-1.9556h4.1764v-1.3644zm14.5608.4097v1.6861h-1.1519v1.338h1.1545v3.143c0 .7927.5712 1.4209 1.6005 1.4209h1.6425L17.8 19.646h-1.1412c-.3482 0-.5714-.1509-.5714-.464v-2.7683H17.8v-1.3316h-1.7062v-1.686zm-5.2974 1.5275c-1.7348-.0103-3.141 1.4035-3.1214 3.1382.0196 1.7346 1.4575 3.1163 3.1915 3.0668a2.9915 2.9915 0 0 0 1.912-.6655v.532h1.5175v-5.9129h-1.509v.5257a3.0047 3.0047 0 0 0-1.9205-.6835c-.0244-.0007-.0492-.0006-.0701-.0008zm11.771.0077c-1.5855 0-2.7002.6437-2.7002 1.8854 0 .8607.6132 1.4213 1.936 1.695l1.4478.3286c.5694.1095.7224.2585.7224.4906 0 .3701-.438.6022-1.1279.6022-.876 0-1.3774-.1907-1.5723-.8477h-1.533c.219 1.2307 1.1563 2.05 3.0484 2.05h.0022c1.752 0 2.7422-.819 2.7422-1.9534 0-.8059-.5847-1.4084-1.8089-1.6668l-1.2943-.2605c-.7511-.1358-.988-.2738-.988-.5454 0-.357.3616-.5757 1.0295-.5757.7227 0 1.2527.1925 1.406.8473h1.5175c-.0854-1.2286-.9899-2.0497-2.8273-2.0497zM9.467 16.1815c1.0092.0096 1.8188.8369 1.8067 1.8461.0014 1.0046-.8198 1.816-1.8243 1.8025-1.0075-.0048-1.8203-.8256-1.8155-1.833.0048-1.0076.8255-1.8204 1.833-1.8156z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Cột 2: Sitemap */}
          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>{titles.map}</h3>
            <a 
              href={localizePath("/", locale)} 
              onClick={(e) => handleScroll(e, "hero")} 
              className={styles.linkItem}
            >
              {t.home}
            </a>
            <a 
              href={localizePath("/", locale) + "#about"} 
              onClick={(e) => handleScroll(e, "about")} 
              className={styles.linkItem}
            >
              {t.about}
            </a>
            <a 
              href={localizePath("/", locale) + "#menu"} 
              onClick={(e) => handleScroll(e, "menu")} 
              className={styles.linkItem}
            >
              {t.menu}
            </a>
            <a 
              href={localizePath("/", locale) + "#store"} 
              onClick={(e) => handleScroll(e, "store")} 
              className={styles.linkItem}
            >
              {t.store}
            </a>
            <a 
              href={localizePath("/", locale) + "#news"} 
              onClick={(e) => handleScroll(e, "news")} 
              className={styles.linkItem}
            >
              {t.news}
            </a>
          </div>

          {/* Cột 3: Dịch vụ */}
          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>{titles.service}</h3>
            {/* ĐÃ SỬA: Bọc dấu gạch chéo trong string rõ ràng để tránh lỗi ký tự 'N' lạ trên font UI */}
            <a href={localizePath("/delivery", locale)} className={styles.linkItem}>
              {`${t.delivery} / ${t.deliveryAlt}`}
            </a>
            <a href={localizePath("/reservation", locale)} className={styles.linkItem}>{t.reservation}</a>
            <a href={localizePath("/contact", locale)} className={styles.linkItem}>{t.contact}</a>
          </div>

          {/* Cột 4: Thông tin trụ sở chính */}
          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>{titles.headquarter}</h3>
            <span className={styles.infoText}>{hontenStore.address}</span>
            <a href={`tel:${hontenStore.tel.replace(/-/g, "")}`} className={styles.linkItem}>
              Tel: {hontenStore.tel}
            </a>
            <span className={styles.infoText}>
              {hontenStore.hours[locale] || hontenStore.hours.ja}
            </span>
          </div>

        </div>

        {/* Khối pháp lý dưới cùng */}
        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            © 2026 バインミ－サンドイッチ (Bánh Mì Sandwiches Tokyo). All rights reserved.
          </p>
          <div className={styles.subLinks}>
            <a href={localizePath("/terms", locale)} className={styles.subLinkItem}>
              {locale === "ja" ? "利用規約" : locale === "vi" ? "Điều khoản" : "Terms of Service"}
            </a>
            <a href={localizePath("/privacy", locale)} className={styles.subLinkItem}>
              {locale === "ja" ? "プライバシーポリシー" : locale === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}