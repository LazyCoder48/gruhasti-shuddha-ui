import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Wishlist } from './pages/wishlist/wishlist';
import { Checkout } from './pages/checkout/checkout';
import { OrderHistory } from './pages/order-history/order-history';
import { Dashboard } from './admin/dashboard/dashboard';
import { ProductManagement } from './admin/product-management/product-management';
import { OrderManagement } from './admin/order-management/order-management';
import { Inventory } from './admin/inventory/inventory';
import { EmailTemplates } from './admin/email-templates/email-templates';
import { CouponManagement } from './admin/coupon-management/coupon-management';
import { CategoryManagement } from './admin/category-management/category-management';
import { ShippingZones } from './admin/shipping-zones/shipping-zones';
import { ReviewModeration } from './admin/review-moderation/review-moderation';
import { authGuard, adminGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetail },
  { path: 'cart', component: Cart, canActivate: [authGuard] },
  { path: 'wishlist', component: Wishlist, canActivate: [authGuard] },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  { path: 'orders', component: OrderHistory, canActivate: [authGuard] },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'products', component: ProductManagement },
      { path: 'orders', component: OrderManagement },
      { path: 'inventory', component: Inventory },
      { path: 'email-templates', component: EmailTemplates },
      { path: 'coupons', component: CouponManagement },
      { path: 'categories', component: CategoryManagement },
      { path: 'reviews', component: ReviewModeration },
      { path: 'shipping-zones', component: ShippingZones }
    ]
  },
  { path: '**', redirectTo: '' }
];
