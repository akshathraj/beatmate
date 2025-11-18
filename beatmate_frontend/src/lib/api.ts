/**
 * API Client with Supabase Authentication
 * All API calls automatically include auth headers
 */
import { getAuthToken } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Get headers with authentication token
 */
async function getHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Get headers for multipart/form-data requests
 */
async function getMultipartHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = options.body instanceof FormData 
    ? await getMultipartHeaders()
    : await getHeaders();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response;
}

// ============================================
// SONG API METHODS
// ============================================

export interface GenerateRequest {
  lyrics: string;
  genre: string;
  title?: string;
  duration?: number;
  voiceType?: string;
}

export interface RemixRequest {
  song_a: string;
  song_b: string;
  title: string;
  genre: string;
  voiceType?: string;
}

export const songApi = {
  /**
   * Generate a new song
   */
  async generateSong(data: GenerateRequest) {
    const response = await fetchWithAuth('/generate-song', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Get all user songs
   */
  async getSongs() {
    const response = await fetchWithAuth('/songs');
    return response.json();
  },

  /**
   * Download a song
   */
  async downloadSong(songId: string) {
    const response = await fetchWithAuth(`/download/song/${songId}`);
    return response.blob();
  },

  /**
   * Remix two songs
   */
  async remixSongs(data: RemixRequest) {
    const response = await fetchWithAuth('/remix', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Delete a song
   */
  async deleteSong(songId: string) {
    const response = await fetchWithAuth(`/songs/${songId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// ============================================
// VIDEO API METHODS
// ============================================

export const videoApi = {
  /**
   * Generate a lyric video
   */
  async generateLyricVideo(formData: FormData) {
    const response = await fetchWithAuth('/generate-lyric-video', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  /**
   * Get a video by ID
   */
  async getVideo(videoId: string) {
    const response = await fetchWithAuth(`/video/${videoId}`);
    return response.blob();
  },
};

// ============================================
// BACKGROUND API METHODS
// ============================================

export const backgroundApi = {
  /**
   * Get all backgrounds
   */
  async getBackgrounds() {
    const response = await fetchWithAuth('/backgrounds');
    return response.json();
  },

  /**
   * Get a specific background
   */
  async getBackground(filename: string) {
    const response = await fetchWithAuth(`/background/${filename}`);
    return response.blob();
  },
};

// ============================================
// USER API METHODS
// ============================================

export const userApi = {
  /**
   * Get user profile
   */
  async getProfile() {
    const response = await fetchWithAuth('/profile');
    return response.json();
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: any) {
    const response = await fetchWithAuth('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.json();
  },
};

// Export everything as default
export default {
  song: songApi,
  video: videoApi,
  background: backgroundApi,
  user: userApi,
};

