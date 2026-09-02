import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { AdminDashboardService, DashboardSummary } from '../../core/admin-dashboard';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, KeyValuePipe, AdminNav],
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
