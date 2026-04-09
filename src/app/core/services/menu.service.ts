import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MenuItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}

  getPublicMenu(slug: string) {
    return this.http.get<MenuItem[]>(`${environment.apiUrl}/${slug}/menu`);
  }

  getAdminMenu() {
    return this.http.get<MenuItem[]>(`${environment.apiUrl}/menu`);
  }

  addMenuItem(item: Partial<MenuItem>) {
    return this.http.post<MenuItem>(`${environment.apiUrl}/menu`, item);
  }

  updateMenuItem(id: string, item: Partial<MenuItem>) {
    return this.http.put<void>(`${environment.apiUrl}/menu/${id}`, item);
  }

  toggleAvailability(id: string) {
    return this.http.patch<{ isAvailable: boolean }>(`${environment.apiUrl}/menu/${id}/availability`, {});
  }

  deleteMenuItem(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/menu/${id}`);
  }

  bulkImport(items: Partial<MenuItem>[]) {
    return this.http.post<{ imported: number }>(`${environment.apiUrl}/menu/bulk`, items);
  }
}
