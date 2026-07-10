import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminDashboardService, DashboardSummary } from '../../core/admin-dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, DatePipe, KeyValuePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.adminDashboardService.summary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
