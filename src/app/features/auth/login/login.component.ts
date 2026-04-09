import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>
      <div class="login-card slide-up">
        <div class="login-header">
          <div class="logo-wrap">
            <span class="material-icons-round logo-icon">local_cafe</span>
          </div>
          <h1>CafeApp</h1>
          <p>Sign in to manage your cafe</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-wrap">
              <span class="material-icons-round input-icon">email</span>
              <input class="input" type="email" formControlName="email"
                placeholder="admin@cafe.com" id="login-email" autocomplete="email">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrap">
              <span class="material-icons-round input-icon">lock</span>
              <input class="input" [type]="showPass ? 'text' : 'password'"
                formControlName="password" placeholder="••••••••"
                id="login-password" autocomplete="current-password">
              <button type="button" class="pass-toggle" (click)="showPass = !showPass">
                <span class="material-icons-round">{{ showPass ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full btn-lg"
            [disabled]="loading || form.invalid" id="login-submit">
            @if (loading) { <span class="spinner" style="width:20px;height:20px;border-width:2px"></span> }
            @else { <span class="material-icons-round">login</span> }
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="login-hint">
          <span class="material-icons-round">info</span>
          <span>Demo: <strong>admin&#64;bluemooncafe.com</strong> / <strong>Admin&#64;123</strong></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--dark-bg); position: relative; overflow: hidden;
    }
    .login-bg { position: absolute; inset: 0; pointer-events: none; }
    .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; }
    .blob-1 { width: 500px; height: 500px; background: var(--primary); top: -150px; left: -100px; }
    .blob-2 { width: 400px; height: 400px; background: var(--accent); bottom: -100px; right: -80px; }
    .blob-3 { width: 300px; height: 300px; background: #7C3AED; top: 50%; left: 50%; transform: translate(-50%,-50%); }

    .login-card {
      background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-xl);
      padding: 48px 40px; width: 420px; max-width: 95vw; position: relative; z-index: 1;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5);
    }
    .login-header { text-align: center; margin-bottom: 32px; }
    .logo-wrap {
      width: 72px; height: 72px; border-radius: 20px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; box-shadow: var(--shadow-primary);
    }
    .logo-icon { font-size: 36px; color: white; }
    .login-header h1 { font-size: 28px; color: var(--dark-text); margin-bottom: 6px; }
    .login-header p { color: var(--dark-muted); font-size: 14px; }

    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .form-label { color: var(--dark-muted); font-size: 13px; font-weight: 600; }
    .input-wrap { position: relative; }
    .input-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 18px; color: var(--dark-muted); pointer-events: none;
    }
    .input {
      background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1);
      color: var(--dark-text); padding-left: 44px;
    }
    .input:focus { border-color: var(--primary); background: rgba(37,99,235,0.08); }
    .input::placeholder { color: rgba(255,255,255,0.2); }
    .pass-toggle {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--dark-muted);
      display: flex; padding: 4px;
    }

    .btn-primary { margin-top: 8px; }
    .login-hint {
      margin-top: 20px; display: flex; align-items: center; gap: 8px;
      background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2);
      border-radius: var(--radius); padding: 10px 14px; color: var(--dark-muted); font-size: 13px;
    }
    .login-hint .material-icons-round { font-size: 16px; color: var(--primary-light); }
    .login-hint strong { color: var(--dark-text); }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPass = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.success('Welcome back!', 'Signed in successfully');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Login failed', err?.error?.message || 'Invalid credentials');
      }
    });
  }
}
