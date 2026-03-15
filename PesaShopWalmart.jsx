import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════════════
   PESASHOP — WALMART-STYLE LAYOUT  
   4 pages: Home · Category · Product · Cart
   Brand: Green #1b5e35 · Yellow #f5b800 · White · BR: 0px
   New: Laybye payment option on Product + Cart pages
══════════════════════════════════════════════════════════════════════ */

const G = "#1b5e35";
const Y = "#f5b800";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;color:#1a1a1a;background:#f6f7f8;overflow-x:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#1b5e35}
button{cursor:pointer;font-family:'DM Sans',sans-serif}
input,textarea,select{font-family:'DM Sans',sans-serif}

/* ── HEADER ── */
.wm-header{background:#1b5e35;position:sticky;top:0;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.wm-top-bar{background:#f5b800;padding:5px 20px;text-align:center;font-size:12px;font-weight:700;color:#1a1a1a;letter-spacing:.3px}
.wm-top-bar strong{color:#1b5e35}
.wm-header-inner{display:flex;align-items:center;gap:12px;padding:0 20px;height:62px;max-width:1440px;margin:0 auto}
.wm-logo{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;margin-right:8px}
.wm-logo-icon{background:#f5b800;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.wm-logo-text{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;line-height:1}
.wm-logo-text span{color:#f5b800}
.wm-deliver{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.75);font-size:12px;cursor:pointer;padding:6px 10px;border-radius:0;transition:background .15s;white-space:nowrap;flex-shrink:0}
.wm-deliver:hover{background:rgba(255,255,255,.1)}
.wm-deliver-loc{color:#fff;font-weight:700;font-size:12px}
.wm-search{flex:1;display:flex;height:42px;max-width:680px}
.wm-search-dept{border:none;background:rgba(255,255,255,.15);color:#fff;padding:0 12px;font-size:12px;border-right:1px solid rgba(255,255,255,.2);cursor:pointer;white-space:nowrap;font-family:'Syne',sans-serif;font-weight:700}
.wm-search-input{flex:1;border:none;padding:0 14px;font-size:14px;color:#1a1a1a;background:#fff;outline:none}
.wm-search-btn{background:#f5b800;border:none;width:46px;display:flex;align-items:center;justify-content:center;font-size:18px;transition:background .15s;flex-shrink:0}
.wm-search-btn:hover{background:#ffd235}
.wm-header-actions{display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0}
.wm-action-btn{display:flex;align-items:center;gap:5px;padding:7px 10px;background:transparent;border:none;color:#fff;font-size:12px;transition:background .15s;border-radius:0}
.wm-action-btn:hover{background:rgba(255,255,255,.12)}
.wm-action-icon{font-size:20px}
.wm-action-label{font-size:11px;font-weight:600;line-height:1.2;text-align:left}
.wm-action-sub{font-size:10px;opacity:.7;display:block}
.wm-cart-btn{position:relative;padding:7px 14px}
.wm-cart-count{position:absolute;top:4px;right:8px;background:#f5b800;color:#1a1a1a;font-size:10px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.wm-cart-total{font-size:13px;font-weight:700;color:#fff;white-space:nowrap}

/* NAV BAR */
.wm-nav{background:#154d2c;border-top:1px solid rgba(255,255,255,.1)}
.wm-nav-inner{max-width:1440px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:0;overflow-x:auto;scrollbar-width:none}
.wm-nav-inner::-webkit-scrollbar{display:none}
.wm-nav-link{color:rgba(255,255,255,.85);font-size:13px;font-weight:600;padding:9px 14px;white-space:nowrap;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s;border-bottom:2px solid transparent}
.wm-nav-link:hover,.wm-nav-link.active{color:#f5b800;border-bottom-color:#f5b800}
.wm-nav-deal{color:#f5b800;font-weight:700}
.wm-nav-spin{background:#f5b800;color:#1a1a1a;font-weight:800;padding:8px 14px;font-family:'Syne',sans-serif;font-size:12px;border:none;animation:navSpinPulse 2s infinite;margin-left:auto;flex-shrink:0}
@keyframes navSpinPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,184,0,.5)}50%{box-shadow:0 0 0 6px rgba(245,184,0,0)}}

/* ── BREADCRUMB ── */
.breadcrumb{max-width:1440px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:6px;font-size:12px;color:#76889a;flex-wrap:wrap}
.breadcrumb span{cursor:pointer;transition:color .15s}
.breadcrumb span:hover{color:#1b5e35;text-decoration:underline}
.breadcrumb-sep{color:#c5cdd4}
.breadcrumb-current{color:#1a1a1a;font-weight:600}

/* ── HOME PAGE ── */
.home-page{max-width:1440px;margin:0 auto;padding:0 20px 40px}

/* Hero */
.hero-area{display:grid;grid-template-columns:1fr 260px;gap:12px;margin-bottom:24px}
@media(max-width:860px){.hero-area{grid-template-columns:1fr}}
.hero-main{background:#1b5e35;position:relative;overflow:hidden;min-height:320px;display:flex;align-items:flex-end;cursor:pointer}
.hero-bg-emoji{position:absolute;right:-20px;top:-10px;font-size:220px;opacity:.12;transform:rotate(-15deg);pointer-events:none}
.hero-content{padding:32px 36px;position:relative;z-index:1}
.hero-kicker{background:#f5b800;color:#1a1a1a;font-size:11px;font-weight:800;padding:3px 10px;display:inline-block;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
.hero-title{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;color:#fff;line-height:1.1;margin-bottom:10px}
.hero-title span{color:#f5b800}
.hero-sub{font-size:14px;color:rgba(255,255,255,.75);margin-bottom:18px}
.hero-cta{background:#f5b800;color:#1a1a1a;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;padding:12px 24px;border:none;transition:background .15s}
.hero-cta:hover{background:#ffd235}
.hero-side{display:flex;flex-direction:column;gap:12px}
.hero-side-card{background:#fff;border:1px solid #e5eae6;padding:18px;cursor:pointer;transition:box-shadow .15s;display:flex;align-items:center;gap:12px}
.hero-side-card:hover{box-shadow:0 4px 16px rgba(27,94,53,.12)}
.hero-side-emoji{font-size:36px}
.hero-side-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:2px}
.hero-side-sub{font-size:11px;color:#76889a}
.hero-side-link{font-size:12px;color:#1b5e35;font-weight:700;margin-top:4px;display:block}

/* Dept icons */
.dept-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:24px;scrollbar-width:none}
.dept-row::-webkit-scrollbar{display:none}
.dept-icon{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 14px;background:#fff;border:1px solid #e5eae6;cursor:pointer;transition:all .15s;min-width:76px}
.dept-icon:hover{border-color:#1b5e35;box-shadow:0 2px 8px rgba(27,94,53,.1)}
.dept-icon-emoji{font-size:28px}
.dept-icon-label{font-size:11px;font-weight:600;color:#1a1a1a;text-align:center;line-height:1.2}

/* Flash deals banner */
.flash-banner{background:linear-gradient(135deg,#1b5e35,#1e7040);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.flash-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff}
.flash-title span{color:#f5b800}
.flash-timer{display:flex;align-items:center;gap:6px}
.flash-time-box{background:rgba(0,0,0,.3);border:1px solid rgba(245,184,0,.4);padding:4px 8px;font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#f5b800;min-width:34px;text-align:center}
.flash-sep{color:#f5b800;font-weight:800}
.flash-viewall{font-size:13px;color:#f5b800;font-weight:700;cursor:pointer;text-decoration:underline}

/* Product carousel */
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;margin-top:24px}
.section-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#1a1a1a}
.section-viewall{font-size:13px;color:#1b5e35;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px}
.product-carousel{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
.prod-card{background:#fff;border:1px solid #e5eae6;overflow:hidden;cursor:pointer;transition:box-shadow .2s,transform .2s;position:relative}
.prod-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.1);transform:translateY(-2px)}
.prod-card-img{height:180px;display:flex;align-items:center;justify-content:center;font-size:68px;background:#f8f9f9;border-bottom:1px solid #e5eae6;position:relative;overflow:hidden}
.prod-card-badge{position:absolute;top:8px;left:8px;background:#d93025;color:#fff;font-size:10px;font-weight:800;padding:3px 7px;text-transform:uppercase;letter-spacing:.5px}
.prod-card-badge-rollback{background:#1b5e35}
.prod-card-wishlist{position:absolute;top:8px;right:8px;width:28px;height:28px;background:#fff;border:1px solid #e5eae6;display:flex;align-items:center;justify-content:center;font-size:14px;opacity:0;transition:opacity .15s}
.prod-card:hover .prod-card-wishlist{opacity:1}
.prod-card-body{padding:12px}
.prod-card-name{font-size:13px;color:#1a1a1a;margin-bottom:6px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prod-card-stars{display:flex;align-items:center;gap:3px;margin-bottom:6px}
.prod-star{font-size:12px;color:#f5b800}
.prod-card-count{font-size:11px;color:#76889a}
.prod-card-price{display:flex;align-items:baseline;gap:6px}
.prod-price-now{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#1a1a1a}
.prod-price-now sup{font-size:13px}
.prod-price-was{font-size:12px;color:#76889a;text-decoration:line-through}
.prod-card-add{width:100%;padding:8px;background:#1b5e35;border:none;color:#a8ffca;font-family:'Syne',sans-serif;font-size:12px;font-weight:800;margin-top:10px;transition:background .15s;text-shadow:0 0 10px rgba(168,255,202,.6)}
.prod-card-add:hover{background:#1e7040}
.prod-card-add.added{background:#f5b800;color:#1a1a1a}

/* Promo strip */
.promo-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}
@media(max-width:640px){.promo-strip{grid-template-columns:1fr}}
.promo-card{padding:20px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:box-shadow .15s}
.promo-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.1)}
.promo-emoji{font-size:40px;flex-shrink:0}
.promo-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;margin-bottom:3px}
.promo-sub{font-size:12px;opacity:.75}
.promo-link{font-size:12px;font-weight:700;margin-top:5px;display:block;text-decoration:underline}

/* ── CATEGORY PAGE ── */
.cat-page{max-width:1440px;margin:0 auto;padding:0 20px 40px;display:grid;grid-template-columns:240px 1fr;gap:24px;align-items:start}
@media(max-width:760px){.cat-page{grid-template-columns:1fr}}

/* Sidebar filters */
.filter-sidebar{background:#fff;border:1px solid #e5eae6;position:sticky;top:124px}
.filter-header{background:#1b5e35;padding:12px 16px;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#fff}
.filter-section{border-bottom:1px solid #e5eae6;padding:14px 16px}
.filter-section-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#1a1a1a;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
.filter-option{display:flex;align-items:center;gap:8px;margin-bottom:7px;cursor:pointer}
.filter-checkbox{width:16px;height:16px;border:1.5px solid #c5cdd4;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.filter-checkbox.checked{background:#1b5e35;border-color:#1b5e35}
.filter-checkbox.checked::after{content:'✓';color:#fff;font-size:10px;font-weight:800}
.filter-label{font-size:13px;color:#1a1a1a}
.filter-count{font-size:11px;color:#76889a;margin-left:auto}
.filter-price-row{display:flex;gap:8px;align-items:center;margin-top:8px}
.filter-price-input{width:80px;border:1.5px solid #c5cdd4;padding:6px 8px;font-size:12px;color:#1a1a1a}
.filter-price-input:focus{outline:none;border-color:#1b5e35}
.filter-clear{background:none;border:none;font-size:12px;color:#1b5e35;font-weight:700;cursor:pointer;text-decoration:underline;padding:0;margin-top:6px;display:block}

/* Category main */
.cat-main{}
.cat-hero{background:linear-gradient(135deg,#1b5e35,#1e7040);padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:20px}
.cat-hero-emoji{font-size:56px}
.cat-hero-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff}
.cat-hero-sub{font-size:13px;color:rgba(255,255,255,.7);margin-top:4px}
.sort-bar{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #e5eae6;padding:10px 16px;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.sort-count{font-size:13px;color:#76889a}
.sort-right{display:flex;align-items:center;gap:10px}
.sort-label{font-size:13px;color:#76889a}
.sort-select{border:1.5px solid #c5cdd4;padding:6px 28px 6px 10px;font-size:13px;color:#1a1a1a;background:#fff;appearance:none;cursor:pointer;padding-right:24px}
.sort-view-btns{display:flex;gap:4px}
.sort-view-btn{width:30px;height:30px;border:1.5px solid #c5cdd4;background:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s}
.sort-view-btn.active{background:#1b5e35;border-color:#1b5e35;color:#fff}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}

/* Cat sub-categories */
.sub-cat-strip{display:flex;gap:8px;overflow-x:auto;margin-bottom:20px;padding-bottom:4px;scrollbar-width:none}
.sub-cat-strip::-webkit-scrollbar{display:none}
.sub-cat-chip{flex-shrink:0;padding:7px 14px;border:1.5px solid #c5cdd4;background:#fff;font-size:12px;font-weight:600;color:#1a1a1a;cursor:pointer;transition:all .15s;white-space:nowrap}
.sub-cat-chip:hover,.sub-cat-chip.active{border-color:#1b5e35;color:#1b5e35;background:#edf4ef}

/* ── PRODUCT PAGE ── */
.prod-page{max-width:1440px;margin:0 auto;padding:0 20px 40px}
.prod-layout{display:grid;grid-template-columns:420px 1fr 300px;gap:24px;align-items:start}
@media(max-width:1100px){.prod-layout{grid-template-columns:360px 1fr}}
@media(max-width:760px){.prod-layout{grid-template-columns:1fr}}

/* Gallery */
.prod-gallery{background:#fff;border:1px solid #e5eae6;position:sticky;top:120px}
.gallery-main-img{height:380px;display:flex;align-items:center;justify-content:center;font-size:120px;border-bottom:1px solid #e5eae6;position:relative;cursor:zoom-in;background:#f8f9f9}
.gallery-badge-abs{position:absolute;top:0;left:0;background:#d93025;color:#fff;font-size:11px;font-weight:800;padding:5px 12px;text-transform:uppercase;letter-spacing:.5px}
.gallery-thumb-strip{display:flex;gap:8px;padding:12px;overflow-x:auto;scrollbar-width:none}
.gallery-thumb{width:60px;height:60px;border:2px solid #e5eae6;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;flex-shrink:0;transition:border-color .15s;background:#f8f9f9}
.gallery-thumb.active,.gallery-thumb:hover{border-color:#1b5e35}

/* Product info */
.prod-info{background:#fff;border:1px solid #e5eae6;padding:24px}
.prod-brand{font-size:12px;color:#1b5e35;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;cursor:pointer}
.prod-name{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1.2;margin-bottom:12px}
.prod-stars-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0f2f0}
.prod-star{color:#f5b800;font-size:16px}
.prod-star.empty{color:#e0e4e0}
.prod-rating{font-size:14px;font-weight:700;color:#1a1a1a}
.prod-reviews-link{font-size:13px;color:#1b5e35;cursor:pointer;text-decoration:underline}
.prod-price-section{margin-bottom:16px}
.prod-price-main{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}
.prod-price-current{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:#1a1a1a}
.prod-price-current sup{font-size:18px}
.prod-price-old{font-size:15px;color:#76889a;text-decoration:line-through}
.prod-price-save{font-size:12px;font-weight:700;color:#d93025;background:rgba(217,48,37,.08);padding:2px 8px;border:1px solid rgba(217,48,37,.15)}
.prod-pesa-coins{display:flex;align-items:center;gap:8px;background:rgba(245,184,0,.1);border:1px solid rgba(245,184,0,.3);border-left:4px solid #f5b800;padding:10px 14px;margin-bottom:14px}
.prod-coins-text{font-size:13px;color:#1a1a1a}
.prod-coins-val{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#c49200;margin-left:auto}

/* Variants / specs */
.prod-variants{margin-bottom:16px}
.prod-variant-label{font-size:12px;font-weight:700;color:#76889a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.prod-color-btns{display:flex;gap:8px;flex-wrap:wrap}
.prod-color-btn{padding:7px 14px;border:1.5px solid #c5cdd4;font-size:13px;font-weight:600;color:#1a1a1a;background:#fff;transition:all .15s}
.prod-color-btn:hover,.prod-color-btn.active{border-color:#1b5e35;color:#1b5e35;background:#edf4ef}

/* Key specs */
.prod-specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;padding:14px;background:#f8f9f9;border:1px solid #e5eae6}
.prod-spec-item{font-size:12px;color:#76889a;display:flex;flex-direction:column;gap:2px}
.prod-spec-val{color:#1a1a1a;font-weight:600;font-size:13px}

/* ── FULFILLMENT BOX (RIGHT COLUMN) ── */
.fulfillment-box{background:#fff;border:1px solid #e5eae6;position:sticky;top:120px}
.fulfillment-price{padding:16px 16px 12px;border-bottom:1px solid #f0f2f0}
.ff-price{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#1a1a1a;margin-bottom:2px}
.ff-price sup{font-size:16px}
.ff-pesa{font-size:12px;color:#c49200;font-weight:600}

/* LAYBYE SECTION */
.laybye-section{padding:12px 16px;border-bottom:1px solid #f0f2f0;background:#fafffe}
.laybye-toggle-row{display:flex;align-items:center;gap:10px;margin-bottom:0;cursor:pointer}
.laybye-toggle-icon{font-size:18px}
.laybye-toggle-label{flex:1;font-size:13px;font-weight:700;color:#1a1a1a}
.laybye-toggle-sub{font-size:11px;color:#76889a;display:block;margin-top:1px;font-weight:400}
.laybye-toggle-btn{width:42px;height:22px;background:#c5cdd4;border-radius:11px;position:relative;transition:background .2s;flex-shrink:0}
.laybye-toggle-btn.on{background:#1b5e35}
.laybye-toggle-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.laybye-toggle-btn.on .laybye-toggle-knob{left:23px}
.laybye-details{margin-top:12px;background:#f0f9f4;border:1px solid #c8e6d4;border-left:4px solid #1b5e35;padding:12px 14px}
.laybye-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#1b5e35;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.laybye-plan-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}
.laybye-plan{border:1.5px solid #c8e6d4;padding:8px 6px;text-align:center;cursor:pointer;transition:all .15s;background:#fff}
.laybye-plan.selected{border-color:#1b5e35;background:#edf4ef}
.laybye-plan-months{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#1b5e35}
.laybye-plan-label{font-size:10px;color:#76889a;margin-top:1px}
.laybye-plan-pm{font-size:11px;font-weight:700;color:#1a1a1a;margin-top:3px}
.laybye-summary{font-size:12px;color:#5a7a62;line-height:1.6}
.laybye-summary strong{color:#1a1a1a}
.laybye-deposit{background:#fff;border:1px dashed #1b5e35;padding:8px 10px;margin-top:8px;font-size:12px;text-align:center}
.laybye-deposit strong{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#1b5e35;display:block;margin-top:2px}
.laybye-info{font-size:11px;color:#76889a;margin-top:6px;line-height:1.5}

/* Fulfillment options */
.ff-options{padding:12px 16px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid #f0f2f0}
.ff-option{display:flex;align-items:flex-start;gap:10px;padding:10px;border:1.5px solid #e5eae6;cursor:pointer;transition:border-color .15s}
.ff-option:hover,.ff-option.selected{border-color:#1b5e35}
.ff-option.selected{background:#f0f9f4}
.ff-radio{width:18px;height:18px;border:2px solid #c5cdd4;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.ff-radio.checked{border-color:#1b5e35}
.ff-radio.checked::after{content:'';width:8px;height:8px;border-radius:50%;background:#1b5e35;display:block}
.ff-option-title{font-size:13px;font-weight:700;color:#1a1a1a}
.ff-option-sub{font-size:12px;color:#76889a;margin-top:1px}
.ff-option-free{color:#1b5e35;font-weight:700}

.ff-qty{padding:12px 16px;border-bottom:1px solid #f0f2f0;display:flex;align-items:center;gap:12px}
.ff-qty-label{font-size:13px;color:#76889a;font-weight:600}
.qty-ctrl{display:flex;border:1.5px solid #c5cdd4;overflow:hidden}
.qty-btn{width:36px;height:36px;border:none;background:#f8f9f9;font-size:18px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;justify-content:center;transition:background .15s}
.qty-btn:hover{background:#1b5e35;color:#fff}
.qty-val{width:46px;height:36px;border:none;border-left:1.5px solid #c5cdd4;border-right:1.5px solid #c5cdd4;text-align:center;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;background:#fff}

.ff-actions{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.btn-ff-buy{width:100%;padding:14px;background:#1b5e35;border:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#a8ffca;text-shadow:0 0 14px rgba(168,255,202,.8);position:relative;overflow:hidden;transition:background .15s}
.btn-ff-buy::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(168,255,202,.2),transparent);animation:shimmer 2s ease-in-out infinite}
.btn-ff-buy:hover{background:#1e7040}
.btn-ff-cart{width:100%;padding:14px;background:#f5b800;border:none;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#1a1a1a;transition:background .15s}
.btn-ff-cart:hover{background:#ffd235}
.btn-ff-cart.added{background:#1b5e35;color:#a8ffca}
.ff-trust{display:flex;flex-direction:column;gap:6px;padding:12px 16px;background:#f8f9f9;font-size:12px;color:#76889a}
.ff-trust-item{display:flex;align-items:center;gap:6px}

/* Product sections */
.prod-sections{margin-top:16px;display:flex;flex-direction:column;gap:12px}
.prod-section{background:#fff;border:1px solid #e5eae6}
.prod-section-header{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border-bottom:1px solid #f0f2f0}
.prod-section-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#1a1a1a}
.prod-section-body{padding:18px}
.prod-about-list{display:flex;flex-direction:column;gap:8px}
.prod-about-item{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#1a1a1a;line-height:1.5}
.prod-about-item::before{content:'•';color:#1b5e35;font-weight:800;flex-shrink:0;margin-top:2px}
.prod-full-specs{display:grid;grid-template-columns:1fr 1fr;gap:0}
.spec-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f2f0;font-size:13px}
.spec-key{color:#76889a;font-weight:500}
.spec-val{color:#1a1a1a;font-weight:600;text-align:right;max-width:55%}

/* Reviews */
.review-overview{display:flex;gap:24px;align-items:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f2f0}
.review-big-score{font-family:'Syne',sans-serif;font-size:56px;font-weight:800;color:#1a1a1a;line-height:1}
.review-big-stars{color:#f5b800;font-size:20px;letter-spacing:2px;margin-top:4px}
.review-big-count{font-size:13px;color:#76889a;margin-top:2px}
.review-bars{flex:1;display:flex;flex-direction:column;gap:5px}
.review-bar-row{display:flex;align-items:center;gap:8px;font-size:12px}
.review-bar-label{color:#1b5e35;cursor:pointer;font-weight:600;width:36px;flex-shrink:0}
.review-bar-track{flex:1;height:8px;background:#e5eae6;overflow:hidden}
.review-bar-fill{height:100%;background:#f5b800}
.review-bar-count{color:#76889a;width:24px;text-align:right;flex-shrink:0}
.review-item{padding:16px 0;border-bottom:1px solid #f0f2f0}
.review-author{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:4px}
.review-date{font-size:11px;color:#76889a}
.review-text{font-size:13px;color:#1a1a1a;line-height:1.6;margin-top:6px}
.review-verified{font-size:11px;color:#1b5e35;font-weight:700;margin-top:5px}
.btn-write-review{padding:10px 20px;background:#fff;border:1.5px solid #1b5e35;color:#1b5e35;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;transition:all .15s;margin-bottom:16px}
.btn-write-review:hover{background:#1b5e35;color:#a8ffca}

/* ── CART PAGE ── */
.cart-page{max-width:1200px;margin:0 auto;padding:0 20px 60px}
.cart-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#1a1a1a;margin-bottom:20px}
.cart-layout{display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start}
@media(max-width:860px){.cart-layout{grid-template-columns:1fr}}
.cart-items-section{display:flex;flex-direction:column;gap:12px}
.cart-item-card{background:#fff;border:1px solid #e5eae6;padding:18px;display:flex;gap:16px;position:relative}
.cart-item-img{width:100px;height:100px;background:#f8f9f9;border:1px solid #e5eae6;display:flex;align-items:center;justify-content:center;font-size:44px;flex-shrink:0}
.cart-item-body{flex:1}
.cart-item-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:5px;line-height:1.3}
.cart-item-meta{font-size:12px;color:#76889a;margin-bottom:8px}
.cart-item-price{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#1a1a1a;margin-bottom:8px}
.cart-item-price sup{font-size:13px}
.cart-item-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cart-qty-ctrl{display:flex;border:1.5px solid #c5cdd4;overflow:hidden}
.cart-qty-btn{width:32px;height:32px;border:none;background:#f8f9f9;font-size:16px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;justify-content:center}
.cart-qty-btn:hover{background:#1b5e35;color:#fff}
.cart-qty-val{width:40px;height:32px;border:none;border-left:1.5px solid #c5cdd4;border-right:1.5px solid #c5cdd4;text-align:center;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;background:#fff}
.btn-cart-remove{background:none;border:none;font-size:12px;color:#d93025;font-weight:600;cursor:pointer;padding:0;text-decoration:underline}
.cart-item-delivery{font-size:12px;color:#1b5e35;font-weight:600;margin-top:6px}
.cart-item-remove-x{position:absolute;top:14px;right:14px;background:none;border:none;font-size:16px;color:#c5cdd4;cursor:pointer;transition:color .15s}
.cart-item-remove-x:hover{color:#d93025}

/* CART LAYBYE */
.cart-laybye-section{background:#f0f9f4;border:1.5px solid #c8e6d4;border-left:5px solid #1b5e35;padding:14px 16px;margin-top:8px}
.cart-laybye-toggle{display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:0}
.cart-laybye-toggle-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#1b5e35;flex:1}
.cart-laybye-details{margin-top:12px}
.cart-laybye-plans{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.cart-laybye-plan{border:1.5px solid #c8e6d4;padding:10px 14px;cursor:pointer;transition:all .15s;background:#fff;text-align:center;flex:1;min-width:80px}
.cart-laybye-plan.selected{border-color:#1b5e35;background:#edf4ef}
.cart-laybye-plan-months{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#1b5e35}
.cart-laybye-plan-pm{font-size:12px;font-weight:700;color:#1a1a1a;margin-top:2px}
.cart-laybye-plan-label{font-size:10px;color:#76889a}
.cart-laybye-info{font-size:12px;color:#5a7a62;line-height:1.7}
.cart-laybye-info strong{color:#1a1a1a}

/* Cart summary */
.cart-summary{background:#fff;border:1px solid #e5eae6;position:sticky;top:120px}
.cart-summary-header{background:#1b5e35;padding:14px 18px;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#fff}
.cart-summary-body{padding:18px;display:flex;flex-direction:column;gap:10px}
.summary-row{display:flex;justify-content:space-between;font-size:14px;color:#76889a}
.summary-row.total{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#1a1a1a;padding-top:10px;border-top:2px solid #f0f2f0;margin-top:4px}
.summary-row.total span:last-child{color:#1b5e35}
.summary-laybye-note{background:rgba(245,184,0,.1);border:1px solid rgba(245,184,0,.3);border-left:4px solid #f5b800;padding:10px 12px;font-size:12px;color:#1a1a1a;line-height:1.5}
.summary-laybye-note strong{color:#1b5e35;font-family:'Syne',sans-serif;font-size:14px;display:block;margin-bottom:3px}
.btn-checkout{width:100%;padding:15px;background:#1b5e35;border:none;font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#a8ffca;text-shadow:0 0 14px rgba(168,255,202,.8);position:relative;overflow:hidden;transition:background .15s;margin-top:6px}
.btn-checkout::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(168,255,202,.18),transparent);animation:shimmer 2s ease-in-out infinite}
.btn-checkout:hover{background:#1e7040}
.btn-checkout-laybye{background:#f5b800;color:#1a1a1a;text-shadow:none}
.btn-checkout-laybye:hover{background:#ffd235}
.btn-checkout-laybye::before{display:none}
.summary-secure{text-align:center;font-size:11px;color:#76889a;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:4px}
.payment-method-logos{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}
.pm-logo{padding:3px 8px;background:#f8f9f9;border:1px solid #e5eae6;font-size:10px;font-weight:800;color:#76889a;text-transform:uppercase}

/* SPIN MODAL */
.spin-overlay{position:fixed;inset:0;z-index:600;background:rgba(10,26,14,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .4s}
.spin-overlay.open{opacity:1;pointer-events:all}
.spin-modal{background:#fff;border:3px solid #1b5e35;border-top:7px solid #f5b800;width:100%;max-width:500px;max-height:96vh;overflow-y:auto;transform:scale(.85) translateY(30px);transition:transform .45s cubic-bezier(.34,1.2,.64,1)}
.spin-overlay.open .spin-modal{transform:scale(1) translateY(0)}
.spin-mhead{background:#1b5e35;border-bottom:3px solid #f5b800;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
.spin-mhead-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff}
.spin-mhead-title span{color:#f5b800}
.spin-mclose{width:30px;height:30px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center}
.spin-mbody{padding:24px;text-align:center}
.spin-gate-input{width:100%;border:1.5px solid #c5cdd4;padding:12px 14px;font-size:14px;margin-bottom:10px;color:#1a1a1a}
.spin-gate-input:focus{outline:none;border-color:#1b5e35}
.btn-spin-unlock{width:100%;padding:13px;background:#1b5e35;border:none;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#a8ffca;text-shadow:0 0 12px rgba(168,255,202,.8);position:relative;overflow:hidden}
.btn-spin-unlock::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(168,255,202,.18),transparent);animation:shimmer 2s ease-in-out infinite}
.btn-spin-unlock:hover{background:#1e7040}
.btn-do-spin{width:100%;padding:16px;background:#1b5e35;border:none;font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#a8ffca;text-shadow:0 0 14px rgba(168,255,202,.9);position:relative;overflow:hidden;margin-bottom:8px}
.btn-do-spin::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(168,255,202,.2),transparent);animation:shimmer 2s ease-in-out infinite}
.btn-do-spin:hover:not(:disabled){background:#1e7040}
.btn-do-spin:disabled{opacity:.5;cursor:not-allowed}
.wheel-wrap{position:relative;display:inline-block;margin:0 auto 24px}
.wheel-ptr{position:absolute;top:-18px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:26px solid #f5b800;filter:drop-shadow(0 2px 6px rgba(245,184,0,.7));z-index:5}
.wheel-ring{position:absolute;inset:-10px;border-radius:50%;border:4px solid #f5b800;box-shadow:0 0 20px rgba(245,184,0,.4);pointer-events:none}
.wheel-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:#1b5e35;border:4px solid #f5b800;z-index:5;display:flex;align-items:center;justify-content:center;font-size:14px}
.prize-box{background:#f8f9f9;border:2px solid #1b5e35;border-top:5px solid #f5b800;padding:24px;text-align:center;animation:prizeIn .5s cubic-bezier(.34,1.4,.64,1)}
@keyframes prizeIn{from{opacity:0;transform:scale(.8) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.prize-icon-big{font-size:60px;margin-bottom:10px;animation:prizeBounce .6s cubic-bezier(.34,1.56,.64,1) .2s both}
@keyframes prizeBounce{from{transform:scale(0) rotate(-20deg)}to{transform:scale(1) rotate(0)}}
.prize-name{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:6px}
.prize-desc{font-size:13px;color:#76889a;line-height:1.6;margin-bottom:16px}
.prize-code-box{background:#fff;border:2px dashed #1b5e35;padding:12px;margin-bottom:16px}
.prize-code-val{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#1b5e35;letter-spacing:3px}
.btn-prize-claim{width:100%;padding:13px;background:#1b5e35;border:none;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#a8ffca;text-shadow:0 0 12px rgba(168,255,202,.8);position:relative;overflow:hidden;margin-bottom:8px}
.btn-prize-claim::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(168,255,202,.18),transparent);animation:shimmer 2s ease-in-out infinite}
.btn-spin-again{width:100%;padding:10px;border:1.5px solid #c5cdd4;background:#fff;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#76889a}
.btn-spin-again:hover{border-color:#1b5e35;color:#1b5e35}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;left:20px;z-index:500;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:#fff;border:1px solid #e5eae6;border-left:4px solid #1b5e35;padding:12px 14px;display:flex;align-items:center;gap:10px;max-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.1);animation:toastIn .4s cubic-bezier(.34,1.2,.64,1)}
.toast.out{animation:toastOut .3s ease forwards}
.toast-av{width:32px;height:32px;border-radius:50%;background:#edf4ef;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.toast-name{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#1a1a1a}
.toast-action{font-size:11px;font-weight:600;margin-top:1px}
.toast-time{font-size:10px;color:#aabfac;margin-top:1px}

/* CONFETTI */
.confetti-cv{position:fixed;inset:0;pointer-events:none;z-index:700}

/* EXIT MODAL */
.exit-overlay{position:fixed;inset:0;z-index:550;background:rgba(26,46,30,.65);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .3s}
.exit-overlay.open{opacity:1;pointer-events:all}
.exit-modal{background:#fff;border:2px solid #1b5e35;border-top:6px solid #f5b800;padding:36px;max-width:380px;width:100%;text-align:center;transform:scale(.88);transition:transform .35s cubic-bezier(.34,1.3,.64,1)}
.exit-overlay.open .exit-modal{transform:scale(1)}

/* FOOTER */
.wm-footer{background:#1b5e35;padding:40px 20px 20px;margin-top:0}
.wm-footer-inner{max-width:1200px;margin:0 auto}
.wm-footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}
@media(max-width:760px){.wm-footer-top{grid-template-columns:1fr 1fr}}
.wm-footer-logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:6px}
.wm-footer-logo span{color:#f5b800}
.wm-footer-tagline{color:rgba(255,255,255,.65);font-size:12px;margin-bottom:12px;font-weight:600;letter-spacing:.5px}
.wm-footer-desc{font-size:12px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:14px}
.wm-footer-email{font-size:13px;color:#f5b800;font-weight:600}
.wm-footer-col-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#f5b800;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.15)}
.wm-footer-links{display:flex;flex-direction:column;gap:9px}
.wm-footer-link{font-size:13px;color:rgba(255,255,255,.65);cursor:pointer;transition:color .15s}
.wm-footer-link:hover{color:#f5b800}
.wm-footer-bottom{border-top:1px solid rgba(255,255,255,.15);padding-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.wm-footer-copy{font-size:11px;color:rgba(255,255,255,.4)}
.wm-footer-pay{display:flex;gap:6px;flex-wrap:wrap}
.wm-footer-pm{padding:4px 8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);font-size:10px;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px}

/* KEYFRAMES */
@keyframes shimmer{0%{left:-100%}60%,100%{left:160%}}
@keyframes toastIn{from{opacity:0;transform:translateX(-24px) scale(.92)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-20px)}}
@keyframes stockPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
`;

/* ═══ DATA ═══ */
const SEGMENTS=[
  {label:"50 PESA\nCoins",  emoji:"🪙",color:"#1b5e35",textColor:"#a8ffca",type:"coins",  value:50, code:"PESA50"},
  {label:"Zimbali\nHoliday",emoji:"✈️",color:"#f5b800",textColor:"#1a1a1a",type:"holiday",value:0,  code:"ZIMB2025"},
  {label:"100 PESA\nCoins", emoji:"🪙",color:"#2ea855",textColor:"#fff",   type:"coins",  value:100,code:"PESA100"},
  {label:"Free\nGift",      emoji:"🎁",color:"#d93025",textColor:"#fff",   type:"gift",   value:0,  code:"GIFT2025"},
  {label:"200 PESA\nCoins", emoji:"🪙",color:"#1b5e35",textColor:"#a8ffca",type:"coins",  value:200,code:"PESA200"},
  {label:"Zimbali\nHoliday",emoji:"✈️",color:"#f5b800",textColor:"#1a1a1a",type:"holiday",value:0,  code:"ZIMB2025"},
  {label:"Free\nGift",      emoji:"🎁",color:"#2ea855",textColor:"#fff",   type:"gift",   value:0,  code:"GIFT2025"},
  {label:"500 PESA\nCoins", emoji:"🪙",color:"#c49200",textColor:"#fff",   type:"coins",  value:500,code:"PESA500"},
];
const PRIZE_INFO={
  coins:(v)=>({icon:"🪙",name:`You won ${v} PESA Coins!`,desc:`Use your ${v} PESA Coins at checkout. 100 Coins = $1 off!`}),
  gift:()=>({icon:"🎁",name:"You won a FREE Gift!",desc:"A mystery gift will be added to your next order!"}),
  holiday:()=>({icon:"✈️",name:"Zimbali Holiday Draw!",desc:"You're entered to win 2 nights for 2 at Zimbali, South Africa! 🌴"}),
};

const DEPTS=["🛒 Grocery","📱 Electronics","🪑 Furniture","👕 Fashion","🧸 Toys","🏥 Health","🔧 Tools","🚗 Auto","🌿 Garden","🍳 Kitchen","👶 Baby","🐾 Pets","💄 Beauty","⚽ Sports","📚 Books"];

const FLASH_PRODUCTS=[
  {id:1,emoji:"❄️",name:"Kenmore French Door Refrigerator 28.6 cu ft",price:1299.99,was:1799.99,stars:4,reviews:247,badge:"Rollback"},
  {id:2,emoji:"🧺",name:"Samsung Front Load Washer 5.0 cu ft Steam Cycle",price:699.00,was:899.00,stars:5,reviews:183,badge:"Sale"},
  {id:3,emoji:"🍳",name:"LG Over-the-Range Microwave 2.0 cu ft Stainless Steel",price:349.00,was:479.00,stars:4,reviews:92,badge:"Clearance"},
  {id:4,emoji:"🌬️",name:"Dyson V15 Detect Absolute Cordless Vacuum",price:549.99,was:749.99,stars:5,reviews:1024,badge:"Flash"},
  {id:5,emoji:"☕",name:"Keurig K-Elite Coffee Maker Single Serve K-Cup Pod",price:89.99,was:169.99,stars:4,reviews:4782,badge:"Rollback"},
  {id:6,emoji:"🧊",name:"GE Profile French Door Smart Refrigerator 27.9 cu ft",price:2499.00,was:3199.00,stars:5,reviews:56,badge:"Sale"},
];

const CAT_PRODUCTS=[
  {id:10,emoji:"❄️",name:"Kenmore 28.6 cu. ft. French Door Refrigerator — Fingerprint-Resistant Stainless",price:1299.99,was:1799.99,stars:4,reviews:247,badge:"Rollback"},
  {id:11,emoji:"🔵",name:"Samsung 4-Door Flex French Door Refrigerator 29 cu ft",price:2299.00,was:2799.00,stars:5,reviews:89},
  {id:12,emoji:"⚪",name:"LG InstaView French Door Refrigerator Counter Depth 25.5 cu ft",price:1799.00,was:2299.00,stars:4,reviews:142,badge:"Sale"},
  {id:13,emoji:"🟤",name:"Whirlpool Side-by-Side Refrigerator 24.5 cu ft with LED Lighting",price:899.00,was:1099.00,stars:4,reviews:312},
  {id:14,emoji:"🔳",name:"GE Garage-Ready 17.3 cu ft Top Freezer Refrigerator",price:599.00,was:749.00,stars:3,reviews:64,badge:"Clearance"},
  {id:15,emoji:"🧊",name:"Hisense 20 cu ft Counter Depth French Door Fridge",price:799.00,was:999.00,stars:4,reviews:38},
  {id:16,emoji:"❄️",name:"Frigidaire Gallery 26.8 cu ft French Door Refrigerator",price:1499.00,was:1899.00,stars:4,reviews:95},
  {id:17,emoji:"⬛",name:"Maytag 36-inch Wide French Door Refrigerator 25 cu ft",price:1199.00,was:1499.00,stars:5,reviews:201,badge:"Rollback"},
];

const RELATED_PROD=[
  {id:21,emoji:"🧺",name:"LG 5.5 cu ft Mega Capacity Front Load Washer",price:999.00,stars:5,reviews:88},
  {id:22,emoji:"🍳",name:"KitchenAid 30-in 5-Element Electric Range",price:1299.00,stars:4,reviews:156},
  {id:23,emoji:"🌬️",name:"Bosch 800 Series 24-in Built-in Dishwasher",price:899.00,stars:5,reviews:243},
  {id:24,emoji:"☕",name:"Cafe 30-in 5 Burner Gas Range Stainless Steel",price:1099.00,stars:4,reviews:71},
];

const REVIEWS=[
  {author:"Tatenda M.",location:"Harare",date:"Feb 12, 2026",stars:5,text:"Absolutely love this refrigerator! The French door design is so elegant and the dual evaporator keeps everything fresh for much longer than our old fridge. The water and ice dispenser works perfectly. Delivery team was professional.",verified:true},
  {author:"Blessing T.",location:"Bulawayo",date:"Jan 28, 2026",stars:4,text:"Great fridge, very spacious and the fingerprint-resistant stainless steel actually works! It was slightly tricky to install but PesaShop sent a technician at no extra cost. Minus one star because the ice maker took 24hrs to start working.",verified:true},
  {author:"Rudo C.",location:"Harare",date:"Jan 14, 2026",stars:5,text:"Worth every cent. The adjustable shelving is a game changer — we reorganised everything to fit our needs. Our groceries stay fresh noticeably longer now.",verified:false},
];

const TOASTS_DATA=[
  {name:"Tatenda M.",city:"Harare",  action:"just added this to cart",ago:"2 min ago",  av:"👦🏾",col:"#1b5e35"},
  {name:"Chipo K.",  city:"Bulawayo",action:"is viewing this item",   ago:"just now",  av:"👩🏾",col:"#b38a00"},
  {name:"Blessing T.",city:"Mutare",action:"just purchased",          ago:"4 min ago", av:"👦🏿",col:"#1b5e35"},
  {name:"Simba D.",  city:"Harare",  action:"added to cart",          ago:"7 min ago", av:"🧑🏿",col:"#b38a00"},
];

const LAYBYE_PLANS=[
  {months:3,  label:"3 months",deposit:0.3},
  {months:6,  label:"6 months",deposit:0.2},
  {months:12, label:"12 months",deposit:0.15},
];

/* ═══ CONFETTI ═══ */
function Confetti({active}){
  const ref=useRef(null);
  const raf=useRef(null);
  useEffect(()=>{
    if(!active)return;
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    c.width=window.innerWidth;c.height=window.innerHeight;
    const colors=["#f5b800","#1b5e35","#a8ffca","#d93025","#fff","#2ea855"];
    let ps=Array.from({length:120},()=>({x:Math.random()*c.width,y:-20,r:Math.random()*7+3,color:colors[Math.floor(Math.random()*colors.length)],vx:(Math.random()-.5)*4,vy:Math.random()*4+2,angle:Math.random()*360,spin:(Math.random()-.5)*8,rect:Math.random()>.5}));
    const draw=()=>{ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.angle+=p.spin;p.vy+=.07;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle*Math.PI/180);ctx.fillStyle=p.color;if(p.rect)ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);else{ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}ctx.restore()});ps=ps.filter(p=>p.y<c.height+20);if(ps.length>0)raf.current=requestAnimationFrame(draw);else ctx.clearRect(0,0,c.width,c.height);};
    raf.current=requestAnimationFrame(draw);
    return()=>{if(raf.current)cancelAnimationFrame(raf.current)};
  },[active]);
  return <canvas ref={ref} className="confetti-cv" style={{display:active?"block":"none"}}/>;
}

/* ═══ WHEEL CANVAS ═══ */
function WheelCanvas({rotation,size=280}){
  const ref=useRef(null);
  const arc=(2*Math.PI)/SEGMENTS.length;
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d"),cx=size/2,cy=size/2,r=size/2-4;
    ctx.clearRect(0,0,size,size);
    SEGMENTS.forEach((seg,i)=>{
      const s=i*arc+rotation,e=s+arc;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();ctx.fillStyle=seg.color;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=2;ctx.stroke();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(s+arc/2);ctx.font=`${size*.065}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(seg.emoji,r*.72,0);ctx.restore();
      ctx.save();ctx.translate(cx,cy);ctx.rotate(s+arc/2);ctx.fillStyle=seg.textColor;ctx.font=`bold ${size*.048}px Syne,sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
      seg.label.split("\n").forEach((line,li,arr)=>{ctx.fillText(line,r*.38,(li-(arr.length-1)/2)*size*.055)});
      ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="#1b5e35";ctx.lineWidth=4;ctx.stroke();
  },[rotation,size]);
  return <canvas ref={ref} width={size} height={size} style={{borderRadius:"50%",display:"block"}}/>;
}

/* ═══ SPIN MODAL ═══ */
function SpinModal({open,onClose}){
  const [phase,setPhase]=useState("gate");
  const [email,setEmail]=useState("");
  const [spinning,setSpinning]=useState(false);
  const [rotation,setRotation]=useState(0);
  const [won,setWon]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const raf=useRef(null);
  const SIZE=Math.min(typeof window!=="undefined"?window.innerWidth-80:280,280);
  const spin=()=>{
    if(spinning)return;setSpinning(true);
    const w=[4,1,4,2,3,1,2,2],tot=w.reduce((a,b)=>a+b,0);
    let rnd=Math.random()*tot,wi=0;
    for(let i=0;i<w.length;i++){rnd-=w[i];if(rnd<=0){wi=i;break}}
    const seg=wi*(2*Math.PI/8)+(2*Math.PI/8)/2,target=(Math.PI*1.5)-seg+(5+Math.floor(Math.random()*4))*Math.PI*2;
    let st=null;const dur=5000,from=rotation,ease=t=>1-Math.pow(1-t,4);
    const anim=ts=>{if(!st)st=ts;const prog=Math.min((ts-st)/dur,1);setRotation(from+(target-from)*ease(prog));if(prog<1){raf.current=requestAnimationFrame(anim)}else{setSpinning(false);setWon(SEGMENTS[wi]);setConfetti(true);setTimeout(()=>setConfetti(false),4000);setTimeout(()=>setPhase("result"),600)}};
    raf.current=requestAnimationFrame(anim);
  };
  const close=()=>{setPhase("gate");setEmail("");setRotation(0);setWon(null);setSpinning(false);onClose()};
  const pi=won?PRIZE_INFO[won.type](won.value):null;
  return(<>
    <Confetti active={confetti}/>
    <div className={`spin-overlay${open?" open":""}`}>
      <div className="spin-modal">
        <div className="spin-mhead">
          <div className="spin-mhead-title">🎡 Spin &amp; <span>Win</span></div>
          <button className="spin-mclose" onClick={close}>✕</button>
        </div>
        <div className="spin-mbody">
          {phase==="gate"&&(<>
            <div style={{fontSize:48,marginBottom:10}}>🎡</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:"#1a1a1a",marginBottom:16}}>Win PESA Coins, Gifts &amp; <span style={{color:"#c49200"}}>Zimbali Holiday!</span></div>
            <div style={{background:"rgba(245,184,0,.08)",border:"1px solid rgba(245,184,0,.3)",borderLeft:"4px solid #f5b800",padding:"12px 14px",marginBottom:20,textAlign:"left"}}>
              {[["🪙","50–500 PESA Coins","Spend on your next order"],["🎁","Mystery Free Gift","Packed with your parcel"],["✈️","Zimbali Holiday Draw","2 nights in South Africa 🌴"]].map(([ic,nm,ds])=>(
                <div key={nm} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:16}}>{ic}</span>
                  <div><div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{nm}</div><div style={{fontSize:11,color:"#76889a"}}>{ds}</div></div>
                </div>
              ))}
            </div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#76889a",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6,textAlign:"left"}}>Your email to unlock your spin</label>
            <input className="spin-gate-input" type="email" placeholder="tatenda@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&email.includes("@")&&setPhase("wheel")}/>
            <button className="btn-spin-unlock" onClick={()=>email.includes("@")&&setPhase("wheel")}>🎡 Unlock My Free Spin →</button>
            <div style={{fontSize:11,color:"#aabfac",marginTop:8}}>No spam. Unsubscribe any time.</div>
          </>)}
          {phase==="wheel"&&(<>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:"#1a1a1a",marginBottom:20}}>Good luck, <span style={{color:"#1b5e35"}}>{email.split("@")[0]}</span>! 🤞</div>
            <div className="wheel-wrap" style={{marginBottom:28}}>
              <div className="wheel-ptr"/>
              <div className="wheel-ring"/>
              <WheelCanvas rotation={rotation} size={SIZE}/>
              <div className="wheel-center">⭐</div>
            </div>
            <button className="btn-do-spin" onClick={spin} disabled={spinning}>{spinning?"⏳ Spinning...":"🎡 SPIN NOW!"}</button>
            <div style={{fontSize:11,color:"#aabfac"}}>One free spin · Results are final</div>
          </>)}
          {phase==="result"&&pi&&(
            <div className="prize-box">
              <div className="prize-icon-big">{pi.icon}</div>
              <div style={{fontSize:11,fontWeight:800,color:"#76889a",textTransform:"uppercase",letterSpacing:"2px",marginBottom:5}}>🎉 Congratulations!</div>
              <div className="prize-name">{pi.name}</div>
              <div className="prize-desc">{pi.desc}</div>
              {won.code&&<div className="prize-code-box"><div style={{fontSize:10,fontWeight:700,color:"#76889a",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Your code</div><div className="prize-code-val">{won.code}</div></div>}
              <button className="btn-prize-claim" onClick={close}>✓ Claim &amp; Shop</button>
              <button className="btn-spin-again" onClick={()=>{setPhase("wheel");setWon(null)}}>See wheel again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>);
}

/* ═══ LAYBYE COMPONENT ═══ */
function LaybySectionBox({price,active,setActive,plan,setPlan}){
  const p=LAYBYE_PLANS.find(p=>p.months===plan)||LAYBYE_PLANS[0];
  const monthly=(price*(1+0.035)/p.months).toFixed(2);
  const deposit=(price*p.deposit).toFixed(2);
  return(
    <div className="laybye-section">
      <div className="laybye-toggle-row" onClick={()=>setActive(!active)}>
        <span className="laybye-toggle-icon">💳</span>
        <div>
          <div className="laybye-toggle-label">Pay with Laybye</div>
          <span className="laybye-toggle-sub">Split into monthly payments — no credit check</span>
        </div>
        <div className={`laybye-toggle-btn${active?" on":""}`}><div className="laybye-toggle-knob"/></div>
      </div>
      {active&&(
        <div className="laybye-details">
          <div className="laybye-title">📅 Choose your Laybye plan</div>
          <div className="laybye-plan-grid">
            {LAYBYE_PLANS.map(lp=>{
              const m=(price*(1+0.035)/lp.months).toFixed(2);
              return(
                <div key={lp.months} className={`laybye-plan${plan===lp.months?" selected":""}`} onClick={()=>setPlan(lp.months)}>
                  <div className="laybye-plan-months">{lp.months}</div>
                  <div className="laybye-plan-label">months</div>
                  <div className="laybye-plan-pm">${m}/mo</div>
                </div>
              );
            })}
          </div>
          <div className="laybye-summary">
            <strong>Plan: {p.months} months</strong><br/>
            Monthly payment: <strong>${monthly}</strong><br/>
            Total payable: <strong>${(price*1.035).toFixed(2)}</strong> (incl. 3.5% admin fee)
          </div>
          <div className="laybye-deposit">
            <span>Deposit due today ({(p.deposit*100).toFixed(0)}%)</span>
            <strong>${deposit}</strong>
          </div>
          <div className="laybye-info">✓ No credit check &nbsp;·&nbsp; ✓ Cancel anytime &nbsp;·&nbsp; ✓ EcoCash / OneMoney / Card<br/>Item reserved on deposit. Remaining balance due in monthly instalments.</div>
        </div>
      )}
    </div>
  );
}

/* ═══ SHARED HEADER ═══ */
function Header({page,setPage,cartCount,cartTotal,onSpin}){
  return(<>
    <div className="wm-top-bar"><strong>FREE Shipping</strong> on orders over $100 · ZMW2500 · £100 &nbsp;|&nbsp; 📍 Delivering to Harare, Zimbabwe</div>
    <div className="wm-header">
      <div className="wm-header-inner">
        <div className="wm-logo" onClick={()=>setPage("home")} style={{cursor:"pointer"}}>
          <div className="wm-logo-icon">🌍</div>
          <div>
            <div className="wm-logo-text">PESA<span>SHOP</span></div>
          </div>
        </div>
        <div className="wm-deliver">
          <span>📍</span>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)"}}>Deliver to</div>
            <div className="wm-deliver-loc">Harare, ZW</div>
          </div>
        </div>
        <div className="wm-search">
          <select className="wm-search-dept"><option>All</option><option>Electronics</option><option>Appliances</option><option>Gaming</option></select>
          <input className="wm-search-input" placeholder="Search everything at PesaShop"/>
          <button className="wm-search-btn">🔍</button>
        </div>
        <div className="wm-header-actions">
          <button className="wm-action-btn" onClick={onSpin}>
            <span className="wm-action-icon">🎡</span>
            <div className="wm-action-label">Spin<span className="wm-action-sub">&amp; Win</span></div>
          </button>
          <button className="wm-action-btn">
            <span className="wm-action-icon">👤</span>
            <div className="wm-action-label">Sign In<span className="wm-action-sub">Account</span></div>
          </button>
          <button className="wm-action-btn wm-cart-btn" onClick={()=>setPage("cart")}>
            <span className="wm-action-icon">🛒</span>
            <div className="wm-action-label">
              <span className="wm-cart-total">${cartTotal.toFixed(2)}</span>
            </div>
            {cartCount>0&&<span className="wm-cart-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </div>
    <div className="wm-nav">
      <div className="wm-nav-inner">
        <div className="wm-nav-link" onClick={()=>setPage("home")}>☰ Departments</div>
        {["Electronics","Appliances","Fashion","Grocery","Home & Garden","Auto & Tires","Pharmacy"].map(l=>(
          <div key={l} className={`wm-nav-link${l==="Appliances"&&page==="category"?" active":""}`} onClick={()=>l==="Appliances"&&setPage("category")}>{l}</div>
        ))}
        <div className="wm-nav-link wm-nav-deal">🔥 Flash Deals</div>
        <button className="wm-nav-spin" onClick={onSpin}>🎡 Spin &amp; Win</button>
      </div>
    </div>
  </>);
}

/* ═══ FOOTER ═══ */
function Footer(){
  return(
    <footer className="wm-footer">
      <div className="wm-footer-inner">
        <div className="wm-footer-top">
          <div>
            <div className="wm-footer-logo">PESA<span>SHOP</span></div>
            <div className="wm-footer-tagline">SEND · LOVE · HOME</div>
            <div className="wm-footer-desc">PesaShop is an online retail platform offering electronics, appliances, fashion, beauty and more. Delivering across Zimbabwe and South Africa.</div>
            <div className="wm-footer-email">✉️ hello@pesashop.com</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:6}}>🇿🇼 +263 78 989 1646 &nbsp;·&nbsp; 🇿🇦 +27 73 563 7564</div>
          </div>
          {[
            ["Store",["Shop","Customer Service","Shipping Policy","Refunds & Returns","Track Orders"]],
            ["Me",["My Account","Cart","Checkout","Wishlist","PESA Coins Wallet"]],
            ["Company",["About PesaShop","Sell On PesaShop","Careers","Contact Us","Privacy Policy"]],
          ].map(([title,links])=>(
            <div key={title}>
              <div className="wm-footer-col-title">{title}</div>
              <div className="wm-footer-links">{links.map(l=><div key={l} className="wm-footer-link">{l}</div>)}</div>
            </div>
          ))}
        </div>
        <div className="wm-footer-bottom">
          <div className="wm-footer-copy">© 2026 PesaShop · Send · Love · Home · All rights reserved</div>
          <div className="wm-footer-pay">
            {["VISA","MASTERCARD","ECOCASH","ONEMONEY","PAYPAL","OZOW","MUKURU","CAPITEC","GREY","LEAD"].map(p=>(
              <span key={p} className="wm-footer-pm">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: HOME
══════════════════════════════════════════════════════════ */
function HomePage({setPage,addToCart,addedItems}){
  const [time,setTime]=useState({h:3,m:47,s:22});
  useEffect(()=>{
    const t=setInterval(()=>setTime(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--}if(m<0){m=59;h--}if(h<0){h=3;m=47;s=22}return{h,m,s}}),1000);
    return()=>clearInterval(t);
  },[]);
  const pad=n=>String(n).padStart(2,"0");
  return(
    <div className="home-page">
      {/* HERO */}
      <div className="hero-area" style={{paddingTop:16}}>
        <div className="hero-main" onClick={()=>setPage("product")}>
          <div className="hero-bg-emoji">❄️</div>
          <div className="hero-content">
            <div className="hero-kicker">🔥 Flash Deal — Limited Time</div>
            <div className="hero-title">Seriously Big<br/><span>Savings</span> on Appliances</div>
            <div className="hero-sub">Up to 40% off fridges, washers & more. Delivered to your door in Zimbabwe.</div>
            <button className="hero-cta">Shop Appliances →</button>
          </div>
        </div>
        <div className="hero-side">
          {[
            {emoji:"📱",title:"Electronics from $19",sub:"Phones, Laptops, TVs",link:"Shop now →",col:"#1b5e35"},
            {emoji:"👕",title:"Fashion from $7",sub:"Men, Women & Kids",link:"Shop now →",col:"#c49200"},
            {emoji:"🪑",title:"Furniture & Home",sub:"Decor, Beds, Sofas",link:"Shop now →",col:"#1b5e35"},
          ].map(c=>(
            <div key={c.title} className="hero-side-card">
              <span className="hero-side-emoji">{c.emoji}</span>
              <div>
                <div className="hero-side-title">{c.title}</div>
                <div className="hero-side-sub">{c.sub}</div>
                <span className="hero-side-link" style={{color:c.col}}>{c.link}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEPT ICONS */}
      <div className="dept-row">
        {DEPTS.map(d=>(
          <div key={d} className="dept-icon">
            <span className="dept-icon-emoji">{d.split(" ")[0]}</span>
            <span className="dept-icon-label">{d.split(" ").slice(1).join(" ")}</span>
          </div>
        ))}
      </div>

      {/* FLASH DEALS */}
      <div className="flash-banner">
        <div>
          <div className="flash-title">⚡ Flash <span>Deals</span></div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:2}}>Up to 65% off — while stocks last</div>
        </div>
        <div className="flash-timer">
          <span style={{fontSize:12,color:"rgba(255,255,255,.7)",marginRight:4}}>Ends in:</span>
          <div className="flash-time-box">{pad(time.h)}</div>
          <span className="flash-sep">:</span>
          <div className="flash-time-box">{pad(time.m)}</div>
          <span className="flash-sep">:</span>
          <div className="flash-time-box">{pad(time.s)}</div>
        </div>
        <span className="flash-viewall" onClick={()=>setPage("category")}>View all →</span>
      </div>
      <div style={{background:"#fff",border:"1px solid #e5eae6",borderTop:"none",padding:"16px",marginBottom:0}}>
        <div className="product-carousel">
          {FLASH_PRODUCTS.map(p=>(
            <div key={p.id} className="prod-card" onClick={()=>setPage("product")}>
              <div className="prod-card-img">
                {p.badge&&<span className={`prod-card-badge${p.badge==="Rollback"?" prod-card-badge-rollback":""}`}>{p.badge}</span>}
                <span className="prod-card-wishlist">♡</span>
                {p.emoji}
              </div>
              <div className="prod-card-body">
                <div className="prod-card-name">{p.name}</div>
                <div className="prod-card-stars">
                  {[...Array(5)].map((_,i)=><span key={i} className="prod-star">{i<p.stars?"★":"☆"}</span>)}
                  <span className="prod-card-count">({p.reviews})</span>
                </div>
                <div className="prod-card-price">
                  <div className="prod-price-now"><sup>$</sup>{Math.floor(p.price)}<sup style={{fontSize:11}}>{(""+p.price.toFixed(2)).split(".")[1]}</sup></div>
                  <span className="prod-price-was">${p.was.toFixed(2)}</span>
                </div>
                <button className={`prod-card-add${addedItems[p.id]?" added":""}`} onClick={e=>{e.stopPropagation();addToCart(p)}}>
                  {addedItems[p.id]?"✓ Added to Cart":"Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROMO STRIP */}
      <div className="promo-strip" style={{marginTop:24}}>
        {[
          {emoji:"🪙",title:"Earn PESA Coins",sub:"Get coins on every purchase worth real cash",link:"Learn more →",bg:"#1b5e35",col:"#fff"},
          {emoji:"🎡",title:"Spin & Win Daily",sub:"Win coins, free gifts & a Zimbali holiday",link:"Spin now →",bg:"#f5b800",col:"#1a1a1a"},
          {emoji:"💳",title:"Pay with Laybye",sub:"Split any purchase into easy monthly payments",link:"See how →",bg:"#154d2c",col:"#fff"},
        ].map(c=>(
          <div key={c.title} className="promo-card" style={{background:c.bg,color:c.col}}>
            <span className="promo-emoji">{c.emoji}</span>
            <div>
              <div className="promo-title" style={{color:c.col}}>{c.title}</div>
              <div className="promo-sub" style={{color:c.col}}>{c.sub}</div>
              <span className="promo-link" style={{color:c.bg==="#f5b800"?"#1b5e35":"#f5b800"}}>{c.link}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RECOMMENDED */}
      <div className="section-header">
        <div className="section-title">Recommended for you</div>
        <span className="section-viewall" onClick={()=>setPage("category")}>View all →</span>
      </div>
      <div className="product-carousel">
        {CAT_PRODUCTS.slice(0,6).map(p=>(
          <div key={p.id} className="prod-card" onClick={()=>setPage("product")}>
            <div className="prod-card-img">
              {p.badge&&<span className="prod-card-badge">{p.badge}</span>}
              <span className="prod-card-wishlist">♡</span>
              {p.emoji}
            </div>
            <div className="prod-card-body">
              <div className="prod-card-name">{p.name}</div>
              <div className="prod-card-stars">
                {[...Array(5)].map((_,i)=><span key={i} className="prod-star">{i<p.stars?"★":"☆"}</span>)}
                <span className="prod-card-count">({p.reviews})</span>
              </div>
              <div className="prod-card-price">
                <div className="prod-price-now"><sup>$</sup>{Math.floor(p.price)}</div>
                {p.was&&<span className="prod-price-was">${p.was}</span>}
              </div>
              <button className={`prod-card-add${addedItems[p.id]?" added":""}`} onClick={e=>{e.stopPropagation();addToCart(p)}}>
                {addedItems[p.id]?"✓ Added":"Add to Cart"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE: CATEGORY
══════════════════════════════════════════════════════════ */
function CategoryPage({setPage,addToCart,addedItems}){
  const [filters,setFilters]=useState({Samsung:false,LG:false,Kenmore:false,GE:false,Whirlpool:false});
  const [sort,setSort]=useState("Best Match");
  const BRANDS=["Samsung","LG","Kenmore","GE","Whirlpool","Frigidaire"];
  const RATINGS=["4 stars & up","3 stars & up","Any rating"];
  const toggleFilter=k=>setFilters(f=>({...f,[k]:!f[k]}));
  const activeSub=["Refrigerators","Washers & Dryers","Dishwashers","Microwaves","Ranges & Ovens","Freezers"];

  return(<>
    <div className="breadcrumb">
      <span onClick={()=>setPage("home")}>Home</span><span className="breadcrumb-sep">/</span>
      <span>Electronics</span><span className="breadcrumb-sep">/</span>
      <span className="breadcrumb-current">Appliances</span>
    </div>
    <div className="cat-page">
      {/* SIDEBAR */}
      <div className="filter-sidebar">
        <div className="filter-header">🔍 Filter by</div>
        <div className="filter-section">
          <div className="filter-section-title">Availability</div>
          {["In Stock (127)","Pickup (43)","Delivery (118)"].map(o=>(
            <div key={o} className="filter-option"><div className="filter-checkbox"/><span className="filter-label">{o}</span></div>
          ))}
        </div>
        <div className="filter-section">
          <div className="filter-section-title">Brand</div>
          {BRANDS.map(b=>(
            <div key={b} className="filter-option" onClick={()=>toggleFilter(b)}>
              <div className={`filter-checkbox${filters[b]?" checked":""}`}/>
              <span className="filter-label">{b}</span>
              <span className="filter-count">({Math.floor(Math.random()*30+5)})</span>
            </div>
          ))}
        </div>
        <div className="filter-section">
          <div className="filter-section-title">Price</div>
          <div className="filter-price-row">
            <input className="filter-price-input" placeholder="$Min"/>
            <span style={{color:"#76889a"}}>–</span>
            <input className="filter-price-input" placeholder="$Max"/>
          </div>
          {["Under $500","$500–$1000","$1000–$2000","$2000+"].map(r=>(
            <div key={r} className="filter-option"><div className="filter-checkbox"/><span className="filter-label">{r}</span></div>
          ))}
        </div>
        <div className="filter-section">
          <div className="filter-section-title">Customer Rating</div>
          {RATINGS.map(r=>(
            <div key={r} className="filter-option"><div className="filter-checkbox"/><span className="filter-label">{r}</span></div>
          ))}
        </div>
        <div className="filter-section">
          <div className="filter-section-title">Special Offers</div>
          {["Rollback","Clearance","Flash Deals","Laybye Available"].map(o=>(
            <div key={o} className="filter-option"><div className="filter-checkbox"/><span className="filter-label">{o}</span></div>
          ))}
          <button className="filter-clear">Clear all filters</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="cat-main">
        <div className="cat-hero">
          <span className="cat-hero-emoji">🏠</span>
          <div>
            <div className="cat-hero-title">Appliances</div>
            <div className="cat-hero-sub">127 items · Free shipping on orders over $100</div>
          </div>
        </div>
        <div className="sub-cat-strip">
          {activeSub.map((s,i)=><div key={s} className={`sub-cat-chip${i===0?" active":""}`}>{s}</div>)}
        </div>
        <div className="sort-bar">
          <span className="sort-count">127 results for <strong>Appliances</strong></span>
          <div className="sort-right">
            <span className="sort-label">Sort by:</span>
            <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}>
              {["Best Match","Price Low to High","Price High to Low","Best Rating","Newest"].map(o=><option key={o}>{o}</option>)}
            </select>
            <div className="sort-view-btns">
              <button className="sort-view-btn active">⊞</button>
              <button className="sort-view-btn">☰</button>
            </div>
          </div>
        </div>
        <div className="cat-grid">
          {CAT_PRODUCTS.map(p=>(
            <div key={p.id} className="prod-card" onClick={()=>setPage("product")}>
              <div className="prod-card-img">
                {p.badge&&<span className={`prod-card-badge${p.badge==="Rollback"?" prod-card-badge-rollback":""}`}>{p.badge}</span>}
                <span className="prod-card-wishlist">♡</span>
                {p.emoji}
              </div>
              <div className="prod-card-body">
                <div className="prod-card-name">{p.name}</div>
                <div className="prod-card-stars">
                  {[...Array(5)].map((_,i)=><span key={i} className="prod-star">{i<p.stars?"★":"☆"}</span>)}
                  <span className="prod-card-count">({p.reviews})</span>
                </div>
                <div className="prod-card-price">
                  <div className="prod-price-now"><sup>$</sup>{Math.floor(p.price)}</div>
                  {p.was&&<span className="prod-price-was">${p.was}</span>}
                </div>
                <button className={`prod-card-add${addedItems[p.id]?" added":""}`} onClick={e=>{e.stopPropagation();addToCart(p)}}>
                  {addedItems[p.id]?"✓ Added":"Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>);
}

/* ══════════════════════════════════════════════════════════
   PAGE: PRODUCT
══════════════════════════════════════════════════════════ */
const PROD={
  id:10,emoji:"❄️",name:"Kenmore 28.6 cu. ft. French Door Refrigerator with Dual Evaporator Cooling, Fingerprint-Resistant Stainless Steel, Adjustable Shelving and Ice/Water Dispenser",
  brand:"Kenmore",price:1299.99,was:1799.99,stars:4,reviews:247,
  coins:865,coinVal:8.65,qtySold:42,
  delivery:"Mar 1 – Mar 3, 2026",
  freeCities:["HRE","BYO","MIDLANDS"],
  specs:[
    ["Capacity","28.6 cu. ft."],["Configuration","French Door"],["Finish","Fingerprint-Resistant SS"],
    ["Ice Maker","Yes — In-Door"],["Water Dispenser","External"],["Depth","Counter Depth"],
    ["Energy Star","Yes"],["Warranty","2-Year Parts & Labour"],
  ],
  about:[
    "Dual Evaporator Cooling keeps fresh and frozen foods properly humidified and separated so food stays fresh longer",
    "Fingerprint-resistant stainless steel finish is easy to clean and resists smudges and fingerprints for a always-clean look",
    "Adjustable door bins and shelving provide flexible storage for tall items and bulky containers",
    "In-door ice and water dispenser provides filtered water and ice without opening the refrigerator",
    "LED interior lighting is bright and energy-efficient, illuminating the full interior",
    "Sabbath mode, electronic controls and reversible door swing included",
  ],
  thumbs:["❄️","🪟","🧊","📐","💡"],
};

function ProductPage({setPage,addToCart,cartItems}){
  const [qty,setQty]=useState(1);
  const [activeThumb,setActiveThumb]=useState(0);
  const [ffOption,setFfOption]=useState("delivery");
  const [laybjeActive,setLaybjeActive]=useState(false);
  const [laybjePlan,setLaybjePlan]=useState(3);
  const [cartAdded,setCartAdded]=useState(false);
  const [openSection,setOpenSection]=useState("about");
  const [reviewSection,setReviewSection]=useState("reviews");
  const alreadyInCart=cartItems.some(i=>i.id===PROD.id);

  const doAddToCart=()=>{
    if(cartAdded)return;
    setCartAdded(true);
    addToCart({...PROD,qty,price:PROD.price*qty,laybye:laybjeActive,laybyePlan:laybjePlan});
    setTimeout(()=>setCartAdded(false),2500);
  };

  const p=LAYBYE_PLANS.find(p=>p.months===laybjePlan)||LAYBYE_PLANS[0];
  const monthly=(PROD.price*qty*(1+0.035)/p.months).toFixed(2);
  const deposit=(PROD.price*qty*p.deposit).toFixed(2);

  return(<>
    <div className="breadcrumb">
      <span onClick={()=>setPage("home")}>Home</span><span className="breadcrumb-sep">/</span>
      <span onClick={()=>setPage("category")}>Appliances</span><span className="breadcrumb-sep">/</span>
      <span onClick={()=>setPage("category")}>Refrigerators</span><span className="breadcrumb-sep">/</span>
      <span className="breadcrumb-current">Kenmore 28.6 cu. ft. French Door Refrigerator</span>
    </div>
    <div className="prod-page">
      <div className="prod-layout">

        {/* GALLERY */}
        <div className="prod-gallery">
          <div className="gallery-main-img">
            <span className="gallery-badge-abs">Save ${(PROD.was-PROD.price).toFixed(0)}</span>
            <span style={{fontSize:110}}>{PROD.thumbs[activeThumb]}</span>
          </div>
          <div className="gallery-thumb-strip">
            {PROD.thumbs.map((t,i)=>(
              <div key={i} className={`gallery-thumb${activeThumb===i?" active":""}`} onClick={()=>setActiveThumb(i)}>{t}</div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div>
          <div className="prod-info">
            <div className="prod-brand">{PROD.brand}</div>
            <div className="prod-name">{PROD.name}</div>
            <div className="prod-stars-row">
              {[...Array(5)].map((_,i)=><span key={i} className={`prod-star${i>=PROD.stars?" empty":""}`}>★</span>)}
              <span className="prod-rating">{PROD.stars}.0</span>
              <span className="prod-reviews-link">({PROD.reviews} reviews)</span>
              <span style={{marginLeft:"auto",fontSize:12,color:"#76889a"}}>QTY Sold: <strong style={{color:"#1b5e35"}}>{PROD.qtySold}</strong></span>
            </div>
            <div className="prod-price-section">
              <div className="prod-price-main">
                <div className="prod-price-current"><sup>$</sup>{Math.floor(PROD.price*qty)}<sup style={{fontSize:16}}>{(""+( PROD.price*qty).toFixed(2)).split(".")[1]}</sup></div>
                {qty===1&&<span className="prod-price-old">${PROD.was.toFixed(2)}</span>}
                {qty===1&&<span className="prod-price-save">Save ${(PROD.was-PROD.price).toFixed(0)}</span>}
              </div>
            </div>
            <div className="prod-pesa-coins">
              <span style={{fontSize:20}}>🪙</span>
              <span className="prod-coins-text">Get <strong>{PROD.coins*qty} PESA Coins</strong> worth</span>
              <span className="prod-coins-val">${(PROD.coinVal*qty).toFixed(2)}</span>
            </div>
            <div style={{fontSize:13,color:"#76889a",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              📅 Estimated delivery: <strong style={{color:"#1b5e35"}}>{PROD.delivery}</strong>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#d93025",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>🚚 FREE Shipping in:</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {PROD.freeCities.map(c=><span key={c} style={{padding:"3px 10px",border:"1.5px solid #1b5e35",fontSize:11,fontWeight:800,color:"#1b5e35",background:"#edf4ef",letterSpacing:".5px"}}>{c}</span>)}
              </div>
            </div>
            <div style={{fontSize:12,color:"#76889a",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#1b5e35",display:"inline-block",animation:"stockPulse 1.4s ease-in-out infinite"}}/>
              Only 3 units left — order soon!
            </div>

            {/* QUICK SPECS */}
            <div className="prod-specs">
              {PROD.specs.slice(0,4).map(([k,v])=>(
                <div key={k} className="prod-spec-item"><span>{k}</span><span className="prod-spec-val">{v}</span></div>
              ))}
            </div>
          </div>

          {/* PRODUCT SECTIONS */}
          <div className="prod-sections">
            {[
              {id:"about",title:"About this item"},
              {id:"specs",title:"Specifications"},
              {id:"reviews",title:`Customer Reviews (${PROD.reviews})`},
              {id:"related",title:"Customers also viewed"},
            ].map(sec=>(
              <div key={sec.id} className="prod-section">
                <div className="prod-section-header" onClick={()=>setOpenSection(openSection===sec.id?null:sec.id)}>
                  <div className="prod-section-title">{sec.title}</div>
                  <span style={{color:"#76889a",fontSize:18}}>{openSection===sec.id?"▲":"▼"}</span>
                </div>
                {openSection===sec.id&&(
                  <div className="prod-section-body">
                    {sec.id==="about"&&(
                      <div className="prod-about-list">{PROD.about.map((item,i)=><div key={i} className="prod-about-item">{item}</div>)}</div>
                    )}
                    {sec.id==="specs"&&(
                      <div className="prod-full-specs">{PROD.specs.map(([k,v])=>(
                        <div key={k} className="spec-row"><span className="spec-key">{k}</span><span className="spec-val">{v}</span></div>
                      ))}</div>
                    )}
                    {sec.id==="reviews"&&(
                      <div>
                        <div className="review-overview">
                          <div>
                            <div className="review-big-score">4.0</div>
                            <div className="review-big-stars">★★★★☆</div>
                            <div className="review-big-count">{PROD.reviews} reviews</div>
                          </div>
                          <div className="review-bars">
                            {[[5,62],[4,24],[3,8],[2,4],[1,2]].map(([s,pct])=>(
                              <div key={s} className="review-bar-row">
                                <span className="review-bar-label">{s} ★</span>
                                <div className="review-bar-track"><div className="review-bar-fill" style={{width:`${pct}%`}}/></div>
                                <span className="review-bar-count">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button className="btn-write-review">✏️ Write a Review</button>
                        {REVIEWS.map((r,i)=>(
                          <div key={i} className="review-item">
                            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                              <div className="review-author">{r.author}</div>
                              <div className="review-date">{r.date} · {r.location}</div>
                              <div style={{marginLeft:"auto",color:"#f5b800",fontSize:13}}>{[...Array(r.stars)].map((_,i)=>"★").join("")}{[...Array(5-r.stars)].map((_,i)=>"☆").join("")}</div>
                            </div>
                            <div className="review-text">{r.text}</div>
                            {r.verified&&<div className="review-verified">✓ Verified Purchase</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.id==="related"&&(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12}}>
                        {RELATED_PROD.map(r=>(
                          <div key={r.id} className="prod-card" style={{cursor:"pointer"}}>
                            <div className="prod-card-img" style={{height:130,fontSize:48}}>{r.emoji}</div>
                            <div className="prod-card-body">
                              <div className="prod-card-name">{r.name}</div>
                              <div className="prod-card-price"><div className="prod-price-now"><sup>$</sup>{Math.floor(r.price)}</div></div>
                              <button className="prod-card-add" onClick={()=>addToCart(r)}>Add to Cart</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FULFILLMENT BOX */}
        <div className="fulfillment-box">
          <div className="fulfillment-price">
            <div className="ff-price"><sup>$</sup>{Math.floor(PROD.price*qty)}<sup style={{fontSize:14}}>{(""+( PROD.price*qty).toFixed(2)).split(".")[1]}</sup></div>
            <div className="ff-pesa">🪙 {PROD.coins*qty} PESA Coins = ${(PROD.coinVal*qty).toFixed(2)}</div>
          </div>

          {/* LAYBYE TOGGLE */}
          <LaybySectionBox price={PROD.price*qty} active={laybjeActive} setActive={setLaybjeActive} plan={laybjePlan} setPlan={setLaybjePlan}/>

          {/* FULFILLMENT OPTIONS */}
          <div className="ff-options">
            <div className={`ff-option${ffOption==="delivery"?" selected":""}`} onClick={()=>setFfOption("delivery")}>
              <div className={`ff-radio${ffOption==="delivery"?" checked":""}`}/>
              <div>
                <div className="ff-option-title">🚚 Delivery <span className="ff-option-free">FREE</span></div>
                <div className="ff-option-sub">{PROD.delivery} · HRE, BYO, MIDLANDS</div>
              </div>
            </div>
            <div className={`ff-option${ffOption==="pickup"?" selected":""}`} onClick={()=>setFfOption("pickup")}>
              <div className={`ff-radio${ffOption==="pickup"?" checked":""}`}/>
              <div>
                <div className="ff-option-title">🏪 Pickup in-store</div>
                <div className="ff-option-sub">Available · 24 Kaguvi St, Harare</div>
              </div>
            </div>
          </div>

          <div className="ff-qty">
            <span className="ff-qty-label">Qty:</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
              <input className="qty-val" value={qty} readOnly/>
              <button className="qty-btn" onClick={()=>setQty(q=>q+1)}>+</button>
            </div>
          </div>

          <div className="ff-actions">
            {laybjeActive?(
              <>
                <button className="btn-ff-buy" style={{background:"#f5b800",color:"#1a1a1a",textShadow:"none"}} onClick={doAddToCart}>
                  💳 Start Laybye — ${deposit} deposit
                </button>
                <button className="btn-ff-cart" style={{background:"#1b5e35",color:"#a8ffca"}} onClick={doAddToCart}>
                  Add to Cart (Laybye)
                </button>
              </>
            ):(
              <>
                <button className="btn-ff-buy" onClick={()=>{doAddToCart();setPage("cart")}}>
                  Buy Now →
                </button>
                <button className={`btn-ff-cart${cartAdded?" added":""}`} onClick={doAddToCart}>
                  {cartAdded?"✓ Added to Cart!":"🛒 Add to Cart"}
                </button>
              </>
            )}
          </div>

          <div className="ff-trust">
            <div className="ff-trust-item">🔒 Secure checkout</div>
            <div className="ff-trust-item">↩️ 30-day returns</div>
            <div className="ff-trust-item">🚚 Delivered across Zimbabwe</div>
            <div className="ff-trust-item">📱 EcoCash · OneMoney · Visa</div>
          </div>
        </div>
      </div>
    </div>
  </>);
}

/* ══════════════════════════════════════════════════════════
   PAGE: CART
══════════════════════════════════════════════════════════ */
function CartPage({cartItems,setCartItems,setPage}){
  const [cartLaybjeActive,setCartLaybjeActive]=useState(false);
  const [cartLaybjePlan,setCartLaybjePlan]=useState(3);

  const subtotal=cartItems.reduce((s,i)=>s+i.price,0);
  const shipping=subtotal>=100?0:8.5;
  const total=subtotal+shipping;
  const p=LAYBYE_PLANS.find(lp=>lp.months===cartLaybjePlan)||LAYBYE_PLANS[0];
  const totalDeposit=(total*p.deposit).toFixed(2);
  const totalMonthly=(total*(1+0.035)/p.months).toFixed(2);

  const removeItem=id=>setCartItems(items=>items.filter(i=>i.id!==id));
  const updateQty=(id,delta)=>setCartItems(items=>items.map(i=>i.id===id?{...i,qty:Math.max(1,(i.qty||1)+delta),price:i.price/( i.qty||1)*Math.max(1,(i.qty||1)+delta)}:i));

  if(cartItems.length===0) return(
    <div className="cart-page" style={{paddingTop:40}}>
      <div style={{background:"#fff",border:"1px solid #e5eae6",padding:60,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>🛒</div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"#1a1a1a",marginBottom:8}}>Your cart is empty</div>
        <div style={{fontSize:14,color:"#76889a",marginBottom:20}}>Browse our deals and add items to get started</div>
        <button style={{padding:"12px 28px",background:"#1b5e35",border:"none",fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:800,color:"#a8ffca",cursor:"pointer"}} onClick={()=>setPage("home")}>Continue Shopping</button>
      </div>
    </div>
  );

  return(
    <div className="cart-page" style={{paddingTop:24}}>
      <div className="cart-title">Cart ({cartItems.reduce((s,i)=>s+(i.qty||1),0)} {cartItems.length===1?"item":"items"})</div>
      <div className="cart-layout">
        <div className="cart-items-section">
          {cartItems.map(item=>(
            <div key={item.id} className="cart-item-card">
              <div className="cart-item-img">{item.emoji}</div>
              <div className="cart-item-body">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-meta">Sold &amp; shipped by PesaShop · In stock</div>
                <div className="cart-item-price"><sup>$</sup>{item.price.toFixed(2)}</div>
                {item.laybye&&(
                  <div style={{fontSize:11,color:"#1b5e35",fontWeight:700,background:"#edf4ef",border:"1px solid #c8e6d4",padding:"3px 8px",display:"inline-block",marginBottom:8}}>
                    💳 Laybye selected · {item.laybyePlan} months
                  </div>
                )}
                <div className="cart-item-actions">
                  <div className="cart-qty-ctrl">
                    <button className="cart-qty-btn" onClick={()=>updateQty(item.id,-1)}>−</button>
                    <input className="cart-qty-val" value={item.qty||1} readOnly/>
                    <button className="cart-qty-btn" onClick={()=>updateQty(item.id,1)}>+</button>
                  </div>
                  <button className="btn-cart-remove" onClick={()=>removeItem(item.id)}>Remove</button>
                  <button className="btn-cart-remove" style={{color:"#1b5e35"}}>Save for later</button>
                </div>
                <div className="cart-item-delivery">🚚 FREE delivery {PROD.delivery}</div>
              </div>
              <button className="cart-item-remove-x" onClick={()=>removeItem(item.id)}>✕</button>
            </div>
          ))}

          {/* CART LAYBYE */}
          <div className="cart-laybye-section">
            <div className="cart-laybye-toggle" onClick={()=>setCartLaybjeActive(a=>!a)}>
              <span style={{fontSize:20}}>💳</span>
              <div className="cart-laybye-toggle-label">Pay with Laybye — Split into monthly payments</div>
              <div className={`laybye-toggle-btn${cartLaybjeActive?" on":""}`}><div className="laybye-toggle-knob"/></div>
            </div>
            {cartLaybjeActive&&(
              <div className="cart-laybye-details">
                <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:800,color:"#1b5e35",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>📅 Choose your Laybye plan</div>
                <div className="cart-laybye-plans">
                  {LAYBYE_PLANS.map(lp=>{
                    const m=(total*(1+0.035)/lp.months).toFixed(2);
                    return(
                      <div key={lp.months} className={`cart-laybye-plan${cartLaybjePlan===lp.months?" selected":""}`} onClick={()=>setCartLaybjePlan(lp.months)}>
                        <div className="cart-laybye-plan-months">{lp.months}</div>
                        <div className="cart-laybye-plan-pm">${m}/mo</div>
                        <div className="cart-laybye-plan-label">{lp.months} months</div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-laybye-info">
                  Plan: <strong>{p.months} months</strong> · Monthly payment: <strong>${totalMonthly}</strong><br/>
                  Total payable: <strong>${(total*1.035).toFixed(2)}</strong> (incl. 3.5% admin fee)<br/>
                  Deposit due today: <strong>${totalDeposit}</strong> ({(p.deposit*100).toFixed(0)}% of total)<br/><br/>
                  ✓ No credit check &nbsp;·&nbsp; ✓ Cancel anytime &nbsp;·&nbsp; ✓ Item reserved on deposit
                </div>
              </div>
            )}
          </div>

          {/* UPSELL */}
          <div style={{background:"#fff",border:"1px solid #e5eae6",padding:16}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:800,color:"#1a1a1a",marginBottom:12,borderBottom:"1px solid #f0f2f0",paddingBottom:8}}>⚡ Customers also bought</div>
            <div style={{display:"flex",gap:12,overflow:"auto"}}>
              {RELATED_PROD.slice(0,3).map(r=>(
                <div key={r.id} style={{background:"#f8f9f9",border:"1px solid #e5eae6",padding:12,minWidth:160,maxWidth:180,flexShrink:0}}>
                  <div style={{fontSize:40,textAlign:"center",marginBottom:8}}>{r.emoji}</div>
                  <div style={{fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:4,lineHeight:1.3}}>{r.name}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:"#1a1a1a",marginBottom:8}}>${r.price}</div>
                  <button style={{width:"100%",padding:"7px",background:"#1b5e35",border:"none",fontFamily:"Syne,sans-serif",fontSize:11,fontWeight:800,color:"#a8ffca",cursor:"pointer"}} onClick={()=>{}}>Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="cart-summary">
          <div className="cart-summary-header">
            {cartLaybjeActive?"💳 Laybye Summary":"Order Summary"}
          </div>
          <div className="cart-summary-body">
            {cartLaybjeActive?(
              <div className="summary-laybye-note">
                <strong>💳 Laybye Payment Plan ({p.months} months)</strong>
                Deposit due today: <strong style={{color:"#d93025"}}>${totalDeposit}</strong><br/>
                Then: <strong>${totalMonthly}/month</strong> for {p.months-1} more months<br/>
                Total payable: <strong>${(total*1.035).toFixed(2)}</strong>
              </div>
            ):(
              <>
                <div className="summary-row"><span>Subtotal ({cartItems.reduce((s,i)=>s+(i.qty||1),0)} items)</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Shipping</span><span style={{color:shipping===0?"#1b5e35":"#1a1a1a"}}>{shipping===0?"FREE":"$"+shipping.toFixed(2)}</span></div>
                {shipping===0&&<div style={{fontSize:11,color:"#1b5e35",marginTop:-6}}>✓ Free shipping on orders over $100</div>}
                <div className="summary-row total"><span>Estimated total</span><span>${total.toFixed(2)}</span></div>
              </>
            )}
            <div style={{fontSize:11,color:"#76889a",marginBottom:6}}>🪙 You'll earn <strong style={{color:"#c49200"}}>{cartItems.reduce((s,i)=>s+((i.coins||0)*(i.qty||1)),0)} PESA Coins</strong> on this order</div>
            {cartLaybjeActive?(
              <button className="btn-checkout btn-checkout-laybye">💳 Start Laybye — ${totalDeposit} now</button>
            ):(
              <button className="btn-checkout">Proceed to Checkout →</button>
            )}
            <div className="summary-secure">🔒 Secure · Encrypted checkout</div>
            <div className="payment-method-logos">
              {["VISA","MASTERCARD","ECOCASH","ONEMONEY","PAYPAL"].map(p=><span key={p} className="pm-logo">{p}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function PesaShopWalmart(){
  const [page,setPage]=useState("home");
  const [cartItems,setCartItems]=useState([]);
  const [addedItems,setAddedItems]=useState({});
  const [spinOpen,setSpinOpen]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [exitOpen,setExitOpen]=useState(false);
  const [exitShown,setExitShown]=useState(false);
  const [modalSecs,setModalSecs]=useState(480);
  const tidRef=useRef(0);
  const tpRef=useRef(0);

  const cartCount=cartItems.reduce((s,i)=>s+(i.qty||1),0);
  const cartTotal=cartItems.reduce((s,i)=>s+i.price,0);

  const addToCart=useCallback(prod=>{
    setCartItems(items=>{
      const ex=items.find(i=>i.id===prod.id);
      if(ex)return items.map(i=>i.id===prod.id?{...i,qty:(i.qty||1)+1,price:i.price/(i.qty||1)*((i.qty||1)+1)}:i);
      return [...items,{...prod,qty:1}];
    });
    setAddedItems(a=>({...a,[prod.id]:true}));
    setTimeout(()=>setAddedItems(a=>({...a,[prod.id]:false})),2500);
  },[]);

  const addToast=useCallback(()=>{
    const d=TOASTS_DATA[tpRef.current%TOASTS_DATA.length];tpRef.current++;
    const id=++tidRef.current;
    setToasts(t=>[...t,{...d,id,out:false}]);
    setTimeout(()=>{setToasts(t=>t.map(x=>x.id===id?{...x,out:true}:x));setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),400)},3800);
  },[]);

  useEffect(()=>{
    const f=setTimeout(()=>addToast(),3000);
    const i=setInterval(()=>addToast(),7500);
    return()=>{clearTimeout(f);clearInterval(i)};
  },[addToast]);

  useEffect(()=>{
    if(!exitOpen)return;
    const t=setInterval(()=>setModalSecs(s=>Math.max(0,s-1)),1000);
    return()=>clearInterval(t);
  },[exitOpen]);

  useEffect(()=>{
    const f=e=>{if(e.clientY<20&&!exitShown&&!spinOpen){setExitOpen(true);setExitShown(true)}};
    document.addEventListener("mouseleave",f);
    return()=>document.removeEventListener("mouseleave",f);
  },[exitShown,spinOpen]);

  const pad=n=>String(n).padStart(2,"0");
  const em=Math.floor(modalSecs/60),es=modalSecs%60;

  return(<>
    <style>{css}</style>
    <SpinModal open={spinOpen} onClose={()=>setSpinOpen(false)}/>

    {/* HEADER (all pages) */}
    <Header page={page} setPage={setPage} cartCount={cartCount} cartTotal={cartTotal} onSpin={()=>setSpinOpen(true)}/>

    {/* PAGES */}
    {page==="home"&&<HomePage setPage={setPage} addToCart={addToCart} addedItems={addedItems}/>}
    {page==="category"&&<CategoryPage setPage={setPage} addToCart={addToCart} addedItems={addedItems}/>}
    {page==="product"&&<ProductPage setPage={setPage} addToCart={addToCart} cartItems={cartItems}/>}
    {page==="cart"&&<CartPage cartItems={cartItems} setCartItems={setCartItems} setPage={setPage}/>}

    <Footer/>

    {/* TOASTS */}
    <div className="toast-wrap">
      {toasts.map(t=>(
        <div key={t.id} className={`toast${t.out?" out":""}`}>
          <div className="toast-av">{t.av}</div>
          <div>
            <div className="toast-name" style={{color:t.col}}>{t.name}</div>
            <div className="toast-action" style={{color:"#76889a"}}>{t.action}</div>
            <div className="toast-time">{t.ago} · {t.city}</div>
          </div>
        </div>
      ))}
    </div>

    {/* EXIT MODAL */}
    <div className={`exit-overlay${exitOpen?" open":""}`}>
      <div className="exit-modal">
        <button onClick={()=>setExitOpen(false)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:"#c5cdd4",fontSize:18,cursor:"pointer"}}>✕</button>
        <div style={{fontSize:48,marginBottom:12}}>🎁</div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"#1a1a1a",marginBottom:8}}>Wait! Don't go yet</div>
        <div style={{fontSize:13,color:"#76889a",marginBottom:20,lineHeight:1.6}}>You're about to leave. Grab this exclusive code — and try your luck on the wheel!</div>
        <div style={{background:"#f8f9f9",border:"2px dashed #1b5e35",padding:"14px 20px",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#76889a",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Discount code</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800,color:"#1b5e35",letterSpacing:"4px"}}>ZIM15</div>
        </div>
        <div style={{fontSize:12,color:"#d93025",marginBottom:16}}>⏱ Expires in <strong>{pad(em)}:{pad(es)}</strong></div>
        <button style={{width:"100%",padding:"14px",background:"#1b5e35",border:"none",fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:"#a8ffca",cursor:"pointer",marginBottom:8,position:"relative",overflow:"hidden"}} onClick={()=>setExitOpen(false)}>
          Claim 15% Off Now
        </button>
        <button style={{width:"100%",padding:"11px",background:"rgba(245,184,0,.1)",border:"1px solid rgba(245,184,0,.4)",fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:800,color:"#b38a00",cursor:"pointer",marginBottom:8}} onClick={()=>{setExitOpen(false);setTimeout(()=>setSpinOpen(true),300)}}>
          🎡 Or Spin the Wheel instead!
        </button>
        <button style={{background:"none",border:"none",color:"#aabfac",fontSize:12,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setExitOpen(false)}>No thanks, I'll pay full price</button>
      </div>
    </div>
  </>);
}
