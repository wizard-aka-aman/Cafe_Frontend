import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { AnalyticsData } from '../../../core/models/models';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading-overlay" style="min-height:300px">
          <div class="spinner" style="border-top-color:var(--primary-light)"></div>
        </div>
      } @else if (data) {
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon primary"><span class="material-icons-round">today</span></div>
            <div class="stat-info">
              <div class="stat-label">Today's Sales</div>
              <div class="stat-value">₹{{ data.dailySales | number:'1.0-0' }}</div>
              <div class="stat-sub">{{ data.dailyOrderCount }} orders today</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon accent"><span class="material-icons-round">calendar_month</span></div>
            <div class="stat-info">
              <div class="stat-label">This Month</div>
              <div class="stat-value">₹{{ data.monthlySales | number:'1.0-0' }}</div>
              <div class="stat-sub">{{ data.monthlyOrderCount }} orders</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon success"><span class="material-icons-round">trending_up</span></div>
            <div class="stat-info">
              <div class="stat-label">Avg. Order Value</div>
              <div class="stat-value">
                ₹{{ data.monthlyOrderCount > 0 ? (data.monthlySales / data.monthlyOrderCount | number:'1.0-0') : 0 }}
              </div>
              <div class="stat-sub">Per order this month</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple"><span class="material-icons-round">star</span></div>
            <div class="stat-info">
              <div class="stat-label">Top Item</div>
              <div class="stat-value" style="font-size:16px">{{ data.topItems[0]?.displayName || '—' }}</div>
              @if (data.topItems[0]) {
                <div class="stat-sub">{{ data.topItems[0].quantitySold }} sold</div>
              }
            </div>
          </div>
        </div>

        <!-- Chart + Top Items -->
        <div class="dashboard-grid">
          <div class="chart-card">
            <h3 class="card-title">Sales Last 30 Days</h3>
            <canvas #chartCanvas id="sales-chart"></canvas>
          </div>

          <div class="top-items-card">
            <h3 class="card-title">Top Selling Items</h3>
            <div class="top-items">
              @for (item of data.topItems.slice(0, 7); track item.displayName; let i = $index) {
                <div class="top-item">
                  <div class="rank">{{ i + 1 }}</div>
                  <div class="item-info">
                    <div class="item-name">{{ item.displayName }}</div>
                    <div class="item-rev">₹{{ item.revenue | number:'1.0-0' }}</div>
                  </div>
                  <div class="item-bar-wrap">
                    <div class="item-bar"
                      [style.width]="(item.quantitySold / data.topItems[0].quantitySold * 100) + '%'">
                    </div>
                  </div>
                  <div class="item-qty">{{ item.quantitySold }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { padding: 28px; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 28px; color: var(--dark-text); margin-bottom: 4px; }
    .page-sub { color: var(--dark-muted); font-size: 14px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .stat-card {
      background: var(--dark-surface); border-radius: var(--radius-lg); padding: 20px;
      display: flex; align-items: center; gap: 16px;
      border: 1px solid var(--dark-border); transition: all var(--transition-md);
    }
    .stat-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-2px); }
    .stat-icon {
      width: 52px; height: 52px; border-radius: var(--radius-lg); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon.primary { background: rgba(37,99,235,0.15); color: var(--primary-light); }
    .stat-icon.accent  { background: rgba(245,158,11,0.15); color: var(--accent); }
    .stat-icon.success { background: rgba(16,185,129,0.15); color: var(--success); }
    .stat-icon.purple  { background: rgba(124,58,237,0.15); color: #A78BFA; }
    .stat-icon .material-icons-round { font-size: 26px; }
    .stat-label { font-size: 12px; font-weight: 600; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 800; color: var(--dark-text); font-family: var(--font-display); }
    .stat-sub { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }

    .dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .chart-card, .top-items-card {
      background: var(--dark-surface); border-radius: var(--radius-lg); padding: 24px;
      border: 1px solid var(--dark-border);
    }
    .card-title { font-size: 16px; color: var(--dark-text); margin-bottom: 20px; font-weight: 700; }
    canvas { max-height: 260px; }

    .top-items { display: flex; flex-direction: column; gap: 14px; }
    .top-item { display: flex; align-items: center; gap: 12px; }
    .rank { width: 22px; font-size: 13px; font-weight: 700; color: var(--dark-muted); text-align: center; }
    .item-info { width: 110px; flex-shrink: 0; }
    .item-name { font-size: 13px; color: var(--dark-text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-rev { font-size: 11px; color: var(--dark-muted); }
    .item-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .item-bar { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: 3px; transition: width 0.5s ease; }
    .item-qty { font-size: 12px; font-weight: 700; color: var(--dark-muted); width: 28px; text-align: right; }

    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  data: AnalyticsData | null = null;
  loading = true;
  today = new Date();
  private chart: Chart | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getAnalytics().subscribe({
      next: d => { this.data = d; this.loading = false; setTimeout(() => this.buildChart(), 100); },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit() {}

  buildChart() {
    if (!this.chartCanvas || !this.data) return;
    if (this.chart) { this.chart.destroy(); }

    const labels = this.data.salesChart.map(d => {
      const dt = new Date(d.date);
      return `${dt.getDate()}/${dt.getMonth()+1}`;
    });
    const values = this.data.salesChart.map(d => d.sales);

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sales (₹)',
          data: values,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#2563EB',
          pointRadius: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94A3B8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#94A3B8', font: { size: 11 }, callback: v => '₹' + v }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }
}
