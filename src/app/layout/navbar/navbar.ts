import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth';
import { CartService } from '../../core/cart';
import { WishlistService } from '../../core/wishlist';
import { CategoryService } from '../../core/category';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  searchQuery = '';

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    readonly wishlist: WishlistService,
    readonly categoryService: CategoryService,
    private router: Router
  ) {}

  onSearch(): void {
    const q = this.searchQuery.trim();
    this.router.navigate(['/products'], { queryParams: q ? { q } : {} });
  }
}
