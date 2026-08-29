'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "./order.css";

import OrderHeader from "./OrderHeader";
import CategoryTabs from "./CategoryTabs";
import FoodGrid from "./components/food-grid/FoodGrid";
import ProductDetailModal from "./components/product-detail/ProductDetailModal";
import CartSidebar from "./CartSidebar";

import { getMenuItems, getMenuCategories, getStoreInfoBySlug } from "@/app/web/actions/menu.action";
import { submitOrder } from "@/app/web/actions/order.action";
import { getSelectedStore, saveSelectedStore } from "@/app/web/store/selected-store";
import { getInitialCart, saveCartToStorage } from "@/lib/cartStorage";
import { type Locale } from "@/app/i18n";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default function OrderContainerPage({ params }: Props) {
  const [locale, setLocale] = useState<Locale>("ja");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeSlugParam = searchParams.get("store");

  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [menuId, setMenuId] =
  useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [cart, setCart] = useState<any[]>([]);
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentActiveRef = useRef<number | null>(null);
  const isProgrammaticScroll = useRef(false);

  // ============================================================
  // LẤY storeSlug TỪ URL HOẶC localStorage
  // ============================================================

  const getStoreSlug = useCallback(() => {
    // Lấy từ URL trước
    if (storeSlugParam) {
      return storeSlugParam;
    }
    // Nếu không có, lấy từ localStorage
    const saved = getSelectedStore();
    return saved?.slug ?? null;
  }, [storeSlugParam]);

  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    setStoreSlug(getStoreSlug());
  }, [getStoreSlug]);

  // ============================================================
  // CART
  // ============================================================

  useEffect(() => {
    if (!isCartHydrated) return;
    saveCartToStorage(cart);
  }, [cart, isCartHydrated]);

  useEffect(() => {
    setCart(getInitialCart() as any[]);
    setIsCartHydrated(true);
  }, []);

  // ============================================================
  // LOCALE
  // ============================================================

  useEffect(() => {
    params.then((p) => {
      setLocale(p.locale);
    });
  }, [params]);

  // ============================================================
  // STORE
  // ============================================================

  useEffect(() => {
    if (storeSlugParam) {
      getStoreInfoBySlug(storeSlugParam).then((info) => {
        if (info) {
          setStoreId(info.id);
          setStoreInfo(info);
          setMenuId(info.menuId ?? null);

          console.log(
            "[OrderContainer] Store loaded:",
            {
              storeId: info.id,
              storeType: info.type,
              menuId: info.menuId,
              storeName: info.name,
              title: info.title,
            }
          );

          saveSelectedStore({
            id: info.id,
            title: info.title,
            type: info.type,
            slug: info.slug ?? ""
          });
        } else {
          router.replace(
            `/${locale}/store-select`
          );
        }
      });
    } else {
      const saved = getSelectedStore();
      if (saved && saved.slug) {
        router.replace(`/${locale}/order?store=${saved.slug}`);
      } else {
        router.replace(`/${locale}/store-select`);
      }
    }
  }, [storeSlugParam, locale]);

  // ============================================================
  // MENU
  // ============================================================

  useEffect(() => {
    if (!storeId) {
      setMenuItems([]);
      setCategories([]);
      return;
    }

    if (storeInfo?.type === "Shop") {
      Promise.all([
        getMenuCategories(storeId),
        getMenuItems(storeId),
      ]).then(([categoriesData, itemsData]) => {
        setCategories(categoriesData);
        setMenuItems(itemsData);
      });

      return;
    }

    if (storeInfo?.type === "Truck") {
      if (!menuId) {
        console.warn(
          "[OrderContainer] Truck has no menu for today's schedule:",
          {
            storeId,
            storeName: storeInfo?.name,
            title: storeInfo?.title,
          }
        );

        setCategories([]);
        setMenuItems([]);
        return;
      }

      console.log(
        "[OrderContainer] Loading truck menu:",
        {
          storeId,
          menuId,
          storeName: storeInfo?.name,
          title: storeInfo?.title,
        }
      );

      Promise.all([
        getMenuCategories(storeId, menuId),
        getMenuItems(storeId, menuId),
      ]).then(([categoriesData, itemsData]) => {
        setCategories(categoriesData);
        setMenuItems(itemsData);
      });
    }
  }, [
    storeId,
    menuId,
    storeInfo?.type,
    storeInfo?.locationName,
  ]);

  // ============================================================
  // CATEGORIES
  // ============================================================

  const activeCategories = categories.filter((cat) => {
    const items = menuItems.filter((i) => i.category_id === cat.id);
    return items.length > 0;
  });

  useEffect(() => {
    if (!storeId || activeCategories.length === 0) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      const triggerPoint = window.scrollY + 250;
      let foundId: number | null = null;

      const firstSection = document.getElementById(`category-section-${activeCategories[0]?.id}`);
      
      if (firstSection && triggerPoint < firstSection.offsetTop) {
        foundId = null;
      } else {
        for (const cat of activeCategories) {
          const section = document.getElementById(`category-section-${cat.id}`);
          if (!section) continue;

          const start = section.offsetTop;
          const end = start + section.offsetHeight;

          if (triggerPoint >= start && triggerPoint < end) {
            foundId = cat.id;
            break;
          }
        }
      }

      if (foundId !== currentActiveRef.current) {
        currentActiveRef.current = foundId;
        setSelectedCategory(foundId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [storeId, activeCategories]);

  // ============================================================
  // HELPERS
  // ============================================================

  const getName = (item: any) => {
    if (locale === "ja") return item.name_ja;
    if (locale === "vi") return item.name_vi || item.name_ja;
    if (locale === "en") return item.name_en || item.name_ja;
    if (locale === "zh") return item.name_zh || item.name_ja;
    return item.name_ja;
  };

  const getCategoryName = (cat: any) => {
    if (locale === "ja") return cat.name_ja;
    if (locale === "vi") return cat.name_vi || cat.name_ja;
    if (locale === "en") return cat.name_en || cat.name_ja;
    if (locale === "zh") return cat.name_zh || cat.name_ja;
    return cat.name_ja;
  };

  const handleSelectCategory = (catId: number | null) => {
    setSelectedCategory(catId);
    currentActiveRef.current = catId;

    if (catId === null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const targetElement = document.getElementById(`category-section-${catId}`);
    if (targetElement) {
      isProgrammaticScroll.current = true;

      window.scrollTo({
        top: targetElement.offsetTop - 130, 
        behavior: "smooth",
      });

      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800);
    }
  };

  // ============================================================
  // MODAL
  // ============================================================

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<any>(null);

  const handleOpenOptions = (item: any) => {
    setSelectedItemId(item.id);
    setIsModalOpen(true);
  };

  const handleCloseOptions = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
  };

  const handleAddToCartFromModal = (cartItem: any) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((x) => x.cartKey === cartItem.cartKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQuantity = currentItem.quantity + cartItem.quantity;
        const unitPrice = currentItem.totalPrice / currentItem.quantity;
        
        updated[existingIndex] = {
          ...currentItem,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity
        };
        return updated;
      }
      return [...prev, cartItem];
    });
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.quantity + delta;
            const unitPrice = item.totalPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalPrice: unitPrice * newQty
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItemsCount = cart.reduce((a, b) => a + b.quantity, 0);
  const total = cart.reduce((a, b) => a + Number(b.totalPrice || 0), 0);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="menu-page"> 
      <header className="menu-hero-banner">
        <div className="hero-bg-image">
          <img 
            src="/images/order_hero/order_hero.png" 
            alt="BanhMi Sandwiches, Pho, Vietnamese Iced Coffee" 
            loading="lazy" 
            width="1920"
            height="600"
          />
        </div>
      </header>

      <OrderHeader
        locale={locale}
        storeName={storeInfo?.name}
        storeInfo={storeInfo}
      />

      {storeId && (
        <>
          <CategoryTabs
            locale={locale}
            categories={activeCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            getCategoryName={getCategoryName}
          />

          <main className="menu-layout">
            <div className="menu-sections-container" style={{ width: '100%' }}>
              {activeCategories.map((cat) => {
                const catItems = menuItems.filter((i) => i.category_id === cat.id);

                return (
                  <div 
                    key={cat.id} 
                    id={`category-section-${cat.id}`} 
                    className="category-section" 
                  >
                    <div className="category-section-header">
                      <div className="category-header-row">
                        <h2 className="category-section-title">
                          {getCategoryName(cat)}
                        </h2>
                        <div className="category-section-count">
                          {
                            locale === 'ja' ? `${catItems.length}品` :
                            locale === 'vi' ? `${catItems.length} món` :
                            locale === 'zh' ? `${catItems.length}款` : 
                            `${catItems.length} ITEMS`
                          }
                        </div>
                      </div>
                      <div className="category-divider"></div>
                    </div>

                    <div>
                      <FoodGrid
                        locale={locale}
                        items={catItems}
                        cartItems={cart}
                        getName={getName}
                        onOpenOptions={handleOpenOptions}
                        onDecreaseCart={updateQuantity} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <CartSidebar
              locale={locale}
              cart={cart}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
              updateQuantity={updateQuantity}
              totalItemsCount={totalItemsCount}
              total={total}
              loading={loading}
            />

            {/* ✅ TRUYỀN storeSlug vào ProductDetailModal */}
            <ProductDetailModal
              isOpen={isModalOpen}
              itemId={selectedItemId}
              locale={locale}
              storeSlug={storeSlug}
              onClose={handleCloseOptions}
              onAddToCart={handleAddToCartFromModal}
            />

          </main>
        </>
      )}
    </section>
  );
}