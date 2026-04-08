const BASE_URL = 'http://localhost:3001';

function sessionCookieFromSetCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const firstPart = String(setCookieHeader).split(';')[0];
  return firstPart || '';
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });

  const data = await safeJson(response);
  const cookie = sessionCookieFromSetCookie(response.headers.get('set-cookie'));

  return {
    status: response.status,
    data,
    cookie,
    location: response.headers.get('location'),
  };
}

async function me(cookie) {
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: 'GET',
    headers: cookie ? { Cookie: cookie } : {},
    redirect: 'manual',
  });

  return {
    status: response.status,
    data: await safeJson(response),
  };
}

async function probe(path, cookie) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: cookie ? { Cookie: cookie } : {},
    redirect: 'manual',
  });

  return {
    path,
    status: response.status,
    location: response.headers.get('location'),
  };
}

function isRedirect(statusCode) {
  return statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308;
}

function assertCondition(condition, label, details) {
  if (condition) {
    console.log(`[PASS] ${label}`);
    return true;
  }

  console.error(`[FAIL] ${label}`);
  if (details) {
    console.error('       ', details);
  }
  return false;
}

async function main() {
  let allPassed = true;

  const unauthDashboard = await probe('/dashboard', '');
  allPassed = assertCondition(
    isRedirect(unauthDashboard.status),
    'Unauthenticated /dashboard redirects to login',
    JSON.stringify(unauthDashboard)
  ) && allPassed;

  const adminLogin = await login('admin@college.edu', 'admin123');
  allPassed = assertCondition(
    adminLogin.status === 200 && adminLogin.data?.role === 'admin' && Boolean(adminLogin.cookie),
    'Admin demo login succeeds',
    JSON.stringify(adminLogin)
  ) && allPassed;

  const adminMe = await me(adminLogin.cookie);
  allPassed = assertCondition(
    adminMe.status === 200 && adminMe.data?.user?.role === 'admin',
    'Admin session resolves via /api/users/me',
    JSON.stringify(adminMe)
  ) && allPassed;

  const adminRoute = await probe('/admin', adminLogin.cookie);
  allPassed = assertCondition(
    adminRoute.status === 200,
    'Admin can access /admin',
    JSON.stringify(adminRoute)
  ) && allPassed;

  const studentLogin = await login('student@college.edu', 'student123');
  allPassed = assertCondition(
    studentLogin.status === 200 && studentLogin.data?.role === 'student' && Boolean(studentLogin.cookie),
    'Student demo login succeeds',
    JSON.stringify(studentLogin)
  ) && allPassed;

  const studentMe = await me(studentLogin.cookie);
  allPassed = assertCondition(
    studentMe.status === 200 && studentMe.data?.user?.role === 'student',
    'Student session resolves via /api/users/me',
    JSON.stringify(studentMe)
  ) && allPassed;

  const studentDashboard = await probe('/dashboard', studentLogin.cookie);
  allPassed = assertCondition(
    studentDashboard.status === 200,
    'Student can access /dashboard',
    JSON.stringify(studentDashboard)
  ) && allPassed;

  const studentAdmin = await probe('/admin', studentLogin.cookie);
  allPassed = assertCondition(
    isRedirect(studentAdmin.status) && (studentAdmin.location || '').includes('/403'),
    'Student is redirected away from /admin to /403',
    JSON.stringify(studentAdmin)
  ) && allPassed;

  if (!allPassed) {
    process.exitCode = 1;
    return;
  }

  console.log('\nAll auth and routing smoke checks passed.');
}

main().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exit(1);
});
