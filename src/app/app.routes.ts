import { Routes } from '@angular/router';
import { OAuthSuccessComponent } from './components/oauth-success/oauth-success.component';
import { RoutePlaceholderComponent } from './components/route-placeholder/route-placeholder.component';

export const routes: Routes = [
  {
    path: '',
    component: RoutePlaceholderComponent
  },
  {
    path: 'oauth-success',
    component: OAuthSuccessComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
