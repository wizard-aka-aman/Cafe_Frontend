import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading) {
      <div class="shell-loading">
        <div class="loading-brand">
          <span class="material-icons-round">local_cafe</span>
          <p>Loading cafe...</p>
        </div>
      </div>
    } @else if (error) {
      <div class="shell-error">
        <span class="material-icons-round" style="font-size:64px;color:var(--gray-300)">storefront_off</span>
        <h2>Cafe Not Found</h2>
        <p>This cafe is either inactive or doesn't exist.</p>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .shell-loading, .shell-error {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px; background: var(--gray-50);
    }
    .loading-brand { text-align: center; color: var(--primary); }
    .loading-brand .material-icons-round { font-size: 56px; animation: pulse 1.5s infinite; }
    .loading-brand p { margin-top: 12px; color: var(--gray-500); font-size: 16px; }
    .shell-error { text-align: center; color: var(--gray-500); }
    .shell-error h2 { font-size: 24px; color: var(--gray-700); }
    .shell-error p { font-size: 15px; }
  `]
})
export class CustomerShellComponent implements OnInit {
  loading = true;
  error = false;
  slug = '';

  constructor(private route: ActivatedRoute, private tenantService: TenantService) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    this.tenantService.loadSettings(this.slug).subscribe({
      next: () => this.loading = false,
      error: () => { this.loading = false; this.error = true; }
    });
  }
}
