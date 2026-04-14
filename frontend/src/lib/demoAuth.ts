export interface DemoUser {
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = "td3_demo_users";
const CURRENT_USER_KEY = "td3_current_user";

const defaultDemoUser: DemoUser = {
  name: "Demo Trader",
  email: "demo@td3.ai",
  password: "Demo@123",
};

function safeParseUsers(raw: string | null): DemoUser[] {
  if (!raw) return [defaultDemoUser];
  try {
    const parsed = JSON.parse(raw) as DemoUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultDemoUser];
    return parsed;
  } catch {
    return [defaultDemoUser];
  }
}

export function initDemoAuth() {
  if (typeof window === "undefined") return;
  const users = safeParseUsers(localStorage.getItem(USERS_KEY));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUsers(): DemoUser[] {
  if (typeof window === "undefined") return [defaultDemoUser];
  return safeParseUsers(localStorage.getItem(USERS_KEY));
}

export function getCurrentUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function loginDemoUser(email: string, password: string): DemoUser | null {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!user || typeof window === "undefined") return null;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function signupDemoUser(name: string, email: string, password: string) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return { ok: false, message: "Email already registered. Please login." };
  }

  const newUser: DemoUser = { name: name.trim(), email: normalizedEmail, password };
  if (typeof window !== "undefined") {
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  }

  return { ok: true, user: newUser };
}

export function logoutDemoUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

export const demoCredentials = {
  email: defaultDemoUser.email,
  password: defaultDemoUser.password,
};
