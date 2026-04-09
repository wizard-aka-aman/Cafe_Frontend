import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { TenantService } from '../../../core/services/tenant.service';
import { environment } from '../../../../environments/environment';

interface QrItem { tableNumber: number; url: string; base64Image: string; }

@Component({
  selector: 'app-qr-codes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">QR Codes</h1>
          <p class="page-sub">Generate and print QR codes for each table</p>
        </div>
        <div class="header-actions">
          <button class="hdr-btn outline" (click)="printAll()" [disabled]="qrCodes.length === 0" id="print-all">
            <span class="material-icons-round">print</span> Print All
          </button>
          <button class="hdr-btn primary" (click)="generate()" [disabled]="generating" id="generate-qr">
            @if (generating) { <span class="mini-spinner"></span> }
            @else { <span class="material-icons-round">qr_code_2</span> }
            {{ generating ? 'Generating...' : 'Generate QR Codes' }}
          </button>
        </div>
      </div>

      <div class="url-config">
        <span class="material-icons-round url-icon">link</span>
        <div class="url-info">
          <div class="url-label">Frontend Base URL</div>
          <div class="url-sub">Links will be: <strong>{{ baseUrl }}/slug?table=N</strong></div>
        </div>
        <input class="dark-input url-input" [(ngModel)]="baseUrl" placeholder="http://localhost:4200" id="base-url">
      </div>

      @if (loading) {
        <div class="loading-center"><div class="spinner" style="border-top-color:var(--primary-light)"></div></div>
      } @else if (qrCodes.length === 0) {
        <div class="empty-state">
          <span class="material-icons-round" style="font-size:80px;color:rgba(255,255,255,0.06)">qr_code_2</span>
          <h3 style="color:var(--dark-text)">No QR Codes Yet</h3>
          <p>Click "Generate QR Codes" to create QR codes for all your tables.</p>
        </div>
      } @else {
        <div class="info-bar">
          <span class="material-icons-round">info</span>
          {{ qrCodes.length }} QR codes — scan to open ordering page directly.
        </div>
        <div class="qr-grid" id="qr-print-area">
          @for (qr of qrCodes; track qr.tableNumber) {
            <div class="qr-card" [id]="'qr-table-' + qr.tableNumber">
              <div class="qr-img-wrap">
                <img [src]="qr.base64Image" [alt]="'QR Table ' + qr.tableNumber">
              </div>
              <div class="qr-label">
                <span class="material-icons-round">table_restaurant</span>
                Table {{ qr.tableNumber }}
              </div>
              <div class="qr-actions">
                <button class="qr-btn" (click)="downloadSingle(qr)" [id]="'dl-' + qr.tableNumber">
                  <span class="material-icons-round">download</span>
                </button>
                <button class="qr-btn" (click)="printSingle(qr)" [id]="'pr-' + qr.tableNumber">
                  <span class="material-icons-round">print</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }
    .header-actions { display: flex; gap: 8px; }
    .hdr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all var(--transition); }
    .hdr-btn.primary { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; }
    .hdr-btn.primary:hover { transform: translateY(-1px); }
    .hdr-btn.outline { background: transparent; color: var(--dark-muted); border: 1px solid var(--dark-border); }
    .hdr-btn.outline:hover { background: rgba(255,255,255,0.06); color: var(--dark-text); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    .url-config { display: flex; align-items: center; gap: 16px; background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 24px; flex-wrap: wrap; }
    .url-icon { font-size: 24px; color: var(--primary-light); flex-shrink: 0; }
    .url-info { flex: 1; min-width: 200px; }
    .url-label { font-size: 14px; font-weight: 600; color: var(--dark-text); }
    .url-sub { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }
    .url-sub strong { color: var(--accent); }
    .url-input { max-width: 280px; }
    .dark-input { background: rgba(0,0,0,0.25); border: 1.5px solid var(--dark-border); color: var(--dark-text); border-radius: var(--radius); padding: 9px 12px; font-size: 13px; }
    .dark-input:focus { border-color: var(--primary); outline: none; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; text-align: center; color: var(--dark-muted); }
    .info-bar { display: flex; align-items: center; gap: 8px; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); border-radius: var(--radius); padding: 10px 16px; color: var(--primary-light); font-size: 13px; margin-bottom: 20px; }
    .info-bar .material-icons-round { font-size: 16px; }
    .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
    .qr-card { background: white; border-radius: var(--radius-lg); padding: 20px; text-align: center; box-shadow: var(--shadow); border: 1px solid var(--gray-100); transition: all var(--transition-md); }
    .qr-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .qr-img-wrap { width: 140px; height: 140px; margin: 0 auto 12px; }
    .qr-img-wrap img { width: 100%; height: 100%; image-rendering: pixelated; }
    .qr-label { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 16px; font-weight: 800; color: var(--gray-800); margin-bottom: 12px; }
    .qr-label .material-icons-round { font-size: 18px; color: var(--primary); }
    .qr-actions { display: flex; gap: 8px; justify-content: center; }
    .qr-btn { width: 36px; height: 36px; border-radius: var(--radius); background: var(--gray-100); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--gray-600); transition: all var(--transition); }
    .qr-btn:hover { background: var(--primary); color: white; }
    .qr-btn .material-icons-round { font-size: 18px; }
    .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media print { .page-header, .url-config, .info-bar, .header-actions, .qr-actions { display: none !important; } .qr-grid { grid-template-columns: repeat(3,1fr); } }
  `]
})
export class QrCodesComponent implements OnInit {
  qrCodes: QrItem[] = [];
  loading = true;
  generating = false;
  baseUrl = 'http://localhost:4200';

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() { this.loadQrCodes(); }

  loadQrCodes() {
    this.http.get<QrItem[]>(`${environment.apiUrl}/qrcodes`).subscribe({
      next: codes => { this.qrCodes = codes; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  generate() {
    this.generating = true;
    this.http.post<{ count: number; qrCodes: QrItem[] }>(`${environment.apiUrl}/qrcodes/generate`, { baseUrl: this.baseUrl }).subscribe({
      next: res => { this.qrCodes = res.qrCodes; this.generating = false; this.toast.success(`${res.count} QR codes generated!`); },
      error: () => { this.generating = false; this.toast.error('Generation failed'); }
    });
  }

  downloadSingle(qr: QrItem) {
    const a = document.createElement('a');
    a.href = qr.base64Image; a.download = `table-${qr.tableNumber}-qr.png`; a.click();
  }

  printSingle(qr: QrItem) {
    const w = window.open('');
    if (!w) return;
    w.document.write(`<html><body style="text-align:center;font-family:sans-serif;padding:40px">
      <img src="${qr.base64Image}" style="width:200px;height:200px">
      <h2>Table ${qr.tableNumber}</h2>
      <p style="color:#666;font-size:12px">${qr.url}</p>
      <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`);
  }

  printAll() { window.print(); }
}
