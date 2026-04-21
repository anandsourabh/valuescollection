# Frontend Testing Guide

## Overview

The frontend uses Angular's testing framework with:
- **Jasmine** - Test framework
- **Karma** - Test runner
- **Angular Testing Utilities** - TestBed, ComponentFixture, etc.

## Running Tests

### Run all tests
```bash
ng test
```

### Run tests in headless mode (CI/CD)
```bash
ng test --watch=false --code-coverage --browsers=ChromeHeadless
```

### Run specific test file
```bash
ng test --include='**/campaigns-list.component.spec.ts'
```

### Run with coverage report
```bash
ng test --code-coverage
```

## Test Structure

### Service Tests
Located in `src/app/core/*/` with `*.spec.ts` files.

Example: `api.service.spec.ts`
- Uses `HttpClientTestingModule` to mock HTTP requests
- `HttpTestingController` to verify and respond to HTTP expectations
- Tests all CRUD operations and error scenarios

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [ApiService],
  });
  service = TestBed.inject(ApiService);
  httpMock = TestBed.inject(HttpTestingController);
});

it('should get campaigns', () => {
  service.getCampaigns().subscribe(campaigns => {
    expect(campaigns.length).toBe(1);
  });
  
  const req = httpMock.expectOne('/api/campaigns');
  req.flush(mockData);
});
```

### Component Tests
Located in `src/app/features/*/` with `*.spec.ts` files.

Example: `campaigns-list.component.spec.ts`
- Uses `TestBed.createComponent()` to create component instance
- Mocks services using `jasmine.createSpyObj()`
- Tests component initialization, user interactions, and output

```typescript
beforeEach(async () => {
  const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getCampaigns']);
  
  await TestBed.configureTestingModule({
    declarations: [CampaignsListComponent],
    providers: [{ provide: ApiService, useValue: apiServiceSpy }],
  }).compileComponents();
  
  fixture = TestBed.createComponent(CampaignsListComponent);
  component = fixture.componentInstance;
});

it('should load campaigns', () => {
  apiService.getCampaigns.and.returnValue(of(mockCampaigns));
  fixture.detectChanges();
  
  expect(component.campaigns.length).toBe(2);
});
```

### Guard Tests
Located in `src/app/core/guards/` with `*.spec.ts` files.

Example: `auth.guard.spec.ts`
- Tests route guard logic
- Mocks services and router
- Verifies navigation behavior

```typescript
it('should allow access when authenticated', () => {
  authService.isAuthenticated.and.returnValue(true);
  const result = guard.canActivate(null as any, null as any);
  expect(result).toBe(true);
});
```

## Coverage Requirements

The Karma configuration enforces minimum coverage thresholds:

```javascript
check: {
  global: {
    statements: 60,
    branches: 50,
    functions: 60,
    lines: 60
  }
}
```

View coverage report:
```bash
ng test --code-coverage
open coverage/frontend/index.html
```

## Best Practices

### 1. Use Spy Objects for Services
```typescript
const spy = jasmine.createSpyObj('Service', ['method1', 'method2']);
spy.method1.and.returnValue(of(mockData));
```

### 2. Test User Interactions
```typescript
it('should update on input change', () => {
  component.searchTerm.set('test');
  fixture.detectChanges();
  
  const filtered = component.filteredCampaigns();
  expect(filtered.length).toBe(1);
});
```

### 3. Test Error Handling
```typescript
it('should handle API errors', (done) => {
  service.getCampaigns().subscribe(
    () => fail('should have failed'),
    (error) => {
      expect(error.status).toBe(404);
      done();
    }
  );
});
```

### 4. Clean Up After Tests
```typescript
afterEach(() => {
  httpMock.verify();
  localStorage.clear();
});
```

### 5. Use Meaningful Describe Blocks
```typescript
describe('CampaignsListComponent', () => {
  describe('Initialization', () => {
    // Tests for component setup
  });
  
  describe('Filtering', () => {
    // Tests for filtering logic
  });
});
```

## Common Test Patterns

### Testing Observables
```typescript
it('should emit value', (done) => {
  component.value$.subscribe(value => {
    expect(value).toBe('expected');
    done();
  });
});
```

### Testing Async Operations
```typescript
it('should load data', fakeAsync(() => {
  service.loadData();
  tick();
  expect(component.data).toBeDefined();
}));
```

### Testing DOM Elements
```typescript
it('should display campaign name', () => {
  component.campaign = mockCampaign;
  fixture.detectChanges();
  
  const name = fixture.debugElement.query(By.css('.campaign-name'));
  expect(name.nativeElement.textContent).toContain('Campaign 1');
});
```

## File Organization

```
frontend/src/app/
├── core/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   ├── http/
│   │   ├── api.service.ts
│   │   └── api.service.spec.ts
│   └── guards/
│       ├── auth.guard.ts
│       └── auth.guard.spec.ts
├── features/
│   └── campaigns/
│       ├── campaigns-list.component.ts
│       └── campaigns-list.component.spec.ts
└── shared/
    └── primeng.module.ts
```

## Debugging Tests

### Run single test
```typescript
fit('should run only this test', () => {
  // test code
});
```

### Skip test
```typescript
xit('should skip this test', () => {
  // test code
});
```

### Debug in browser
```bash
ng test --browsers=Chrome  # Leave browser open
```

Then use Chrome DevTools console to inspect test execution.

## CI/CD Integration

Tests run automatically on:
- Local commits (pre-commit hook)
- GitHub Actions (on push/PR)
- Docker build process

### GitHub Actions Configuration
See `.github/workflows/test.yml` for test execution in CI pipeline.

## Troubleshooting

### Tests timeout
Increase Karma timeout in `karma.conf.js`:
```javascript
browserDisconnectTimeout: 10000,
browserNoActivityTimeout: 60000,
```

### Chrome not found
Install Chrome or use ChromeHeadless:
```bash
ng test --browsers=ChromeHeadless
```

### Import errors
Ensure modules are imported in TestBed:
```typescript
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule, FormsModule],
});
```

## Resources

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)
