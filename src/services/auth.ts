import { get, post, patch } from './api';
import type { CanteenWithId, UserProfile } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  name?: string;
}

export interface AuthResponse {
  user: UserProfile & { _id: string; role: 'user' | 'canteen_owner' | 'admin' };
  token: string;
}

export interface OtpResponse {
  otpSent: boolean;
  expiresIn: number;
}

export interface MeResponse {
  user: AuthResponse['user'];
  canteen?: CanteenWithId | null;
}

// ─── API Calls ─────────────────────────────────────────

export function register(data: RegisterRequest) {
  return post<AuthResponse>('/auth/register', data);
}

/**
 * Exchange a verified Firebase ID token for the existing FastFeast session
 * (students only). The ID token travels in the Authorization header and is
 * verified server-side by the Firebase Admin SDK.
 */
export function firebaseSession(idToken: string) {
  return post<AuthResponse>('/auth/session', {}, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

export function login(data: LoginRequest) {
  return post<AuthResponse>('/auth/login', data);
}

export function sendOtp(data: SendOtpRequest) {
  return post<OtpResponse>('/auth/otp/send', data);
}

export function verifyOtp(data: VerifyOtpRequest) {
  return post<AuthResponse>('/auth/otp/verify', data);
}

export function getMe() {
  return get<MeResponse>('/auth/me');
}

export function updateProfile(data: Partial<{ name: string; phone: string }>) {
  return patch<{ user: AuthResponse['user'] }>('/auth/profile', data);
}
