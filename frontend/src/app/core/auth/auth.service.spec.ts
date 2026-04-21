import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Login', () => {
    it('should login successfully and store tokens', (done) => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        delegate_l1_id: undefined,
        delegate_l2_id: undefined,
        delegate_l1_name: undefined,
        delegate_l2_name: undefined,
        password: undefined,
      };

      const mockResponse = {
        user: mockUser,
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
      };

      service.login('test@example.com', 'password123').subscribe((user) => {
        expect(user.email).toBe('test@example.com');
        expect(localStorage.getItem('accessToken')).toBe('test-access-token');
        expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      service.login('test@example.com', 'wrongpassword').subscribe(
        () => {
          fail('should have failed');
        },
        (error) => {
          expect(error.status).toBe(401);
          done();
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Logout', () => {
    it('should clear tokens on logout', () => {
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh-token');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should get access token from localStorage', () => {
      localStorage.setItem('accessToken', 'test-token');
      const token = service.getAccessToken();
      expect(token).toBe('test-token');
    });

    it('should return null if no token in localStorage', () => {
      localStorage.clear();
      const token = service.getAccessToken();
      expect(token).toBeNull();
    });

    it('should refresh token successfully', (done) => {
      localStorage.setItem('refreshToken', 'old-refresh-token');

      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'bearer',
      };

      service.refreshToken().subscribe(() => {
        expect(localStorage.getItem('accessToken')).toBe('new-access-token');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('accessToken', 'test-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      localStorage.clear();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user from API', (done) => {
      localStorage.setItem('accessToken', 'test-token');

      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        delegate_l1_id: undefined,
        delegate_l2_id: undefined,
        delegate_l1_name: undefined,
        delegate_l2_name: undefined,
        password: undefined,
      };

      service.getCurrentUser().subscribe((user) => {
        expect(user.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('External Authentication', () => {
    it('should verify external token', (done) => {
      const mockResponse = {
        token_valid: true,
        external_token: 'signed-token-123',
      };

      service.verifyExternalToken('signed-token-123').subscribe((result) => {
        expect(result.token_valid).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-external`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
