import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantSettings } from '../../../core/models/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  template: `
    <div class="landing">
      <div class="landing-bg">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
      </div>

      <div class="landing-content slide-up">
        <div class="cafe-logo">
          <span class="material-icons-round">local_cafe</span>
        </div>
        <h1>Welcome to CafeApp</h1>
        <p class="subtitle">Fresh food, brewed coffee, and instant ordering — right from your table.</p>

        <div class="table-badge">
          <span class="material-icons-round">table_restaurant</span>
          <span>Table <strong>{{ tableNumber }}</strong></span>
        </div>

        @if (settings?.canUserOrderWithoutLocation === false) {
          <div class="location-note">
            <span class="material-icons-round">location_on</span>
            Location will be verified before ordering
          </div>
        }

        <button class="btn btn-primary btn-lg cta-btn" (click)="goToMenu()" id="view-menu-btn">
          <span class="material-icons-round">restaurant_menu</span>
          View Menu & Order
        </button>

        <div class="features">
          <div class="feature-item">
            <span class="material-icons-round">flash_on</span>
            <span>Fast Service</span>
          </div>
          <div class="feature-item">
            <span class="material-icons-round">track_changes</span>
            <span>Live Tracking</span>
          </div>
          <div class="feature-item">
            <span class="material-icons-round">star</span>
            <span>Quality Food</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
      position: relative; overflow: hidden; padding: 20px;
    }
    .landing-bg { position: absolute; inset: 0; pointer-events: none; }
    .gradient-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.25; }
    .orb-1 { width: 600px; height: 600px; background: var(--primary); top: -200px; left: -150px; animation: floatOrb 8s ease-in-out infinite; }
    .orb-2 { width: 400px; height: 400px; background: var(--accent); bottom: -100px; right: -100px; animation: floatOrb 10s ease-in-out infinite reverse; }
    @keyframes floatOrb {
      0%,100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(20px, -30px) scale(1.05); }
    }

    .landing-content {
      text-align: center; max-width: 440px; width: 100%;
      position: relative; z-index: 1;
    }
    .cafe-logo {
      width: 90px; height: 90px; border-radius: 24px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px; box-shadow: 0 20px 60px rgba(37,99,235,0.5);
      animation: pulse 3s ease-in-out infinite;
    }
    .cafe-logo .material-icons-round { font-size: 44px; color: white; }
    h1 { font-size: 36px; color: white; margin-bottom: 12px; }
    .subtitle { color: rgba(255,255,255,0.6); font-size: 16px; margin-bottom: 28px; line-height: 1.6; }

    .table-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3);
      color: #FCD34D; padding: 10px 20px; border-radius: var(--radius-full);
      font-size: 15px; margin-bottom: 16px;
    }
    .table-badge .material-icons-round { font-size: 18px; }

    .location-note {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 24px;
    }
    .location-note .material-icons-round { font-size: 15px; color: var(--success); }

    .cta-btn {
      width: 100%; font-size: 17px; padding: 18px 24px;
      border-radius: var(--radius-lg); margin-bottom: 32px;
    }

    .features {
      display: flex; justify-content: center; gap: 24px;
    }
    .feature-item {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .feature-item .material-icons-round { font-size: 22px; color: var(--accent); }
  `]
})
export class LandingComponent implements OnInit {
  tableNumber = 1;
  settings: TenantSettings | null = null;
  slug = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantService
  ) {}

  ngOnInit() {
    this.slug = this.route.parent?.snapshot.paramMap.get('tenantSlug') || '';
    this.tableNumber = parseInt(this.route.snapshot.queryParamMap.get('table') || '1', 10);
    this.settings = this.tenantService.getSettings();
    // Store table number in session
    sessionStorage.setItem('tableNumber', String(this.tableNumber));
    sessionStorage.setItem('tenantSlug', this.slug);
  }

  goToMenu() {
    this.router.navigate([`/${this.slug}/menu`], {
      queryParams: { table: this.tableNumber }
    });
  }
}
