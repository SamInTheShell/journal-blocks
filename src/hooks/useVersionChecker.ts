import { useState, useEffect, useCallback } from 'react';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

export function useVersionChecker() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current version from package.json (embedded at build time)
  const getCurrentVersion = (): string => {
    const version = import.meta.env.VITE_APP_VERSION || '2025.08.180401';
    console.log('getCurrentVersion debug:', {
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      finalVersion: version
    });
    return version;
  };

  // Compare versions in YYYY.MM.DDHHSS format
  const compareVersions = (current: string, latest: string): boolean => {
    // Remove 'v' prefix if present and normalize
    const normalizeVersion = (version: string) => version.replace(/^v/, '');
    
    const currentNormalized = normalizeVersion(current);
    const latestNormalized = normalizeVersion(latest);
    
    // Convert to strings for lexicographic comparison to handle leading zeros
    const currentStr = currentNormalized.replace(/\./g, '');
    const latestStr = latestNormalized.replace(/\./g, '');
    
    // Pad to same length and compare
    const maxLength = Math.max(currentStr.length, latestStr.length);
    const currentPadded = currentStr.padEnd(maxLength, '0');
    const latestPadded = latestStr.padEnd(maxLength, '0');
    
    return latestPadded > currentPadded;
  };

  // Fetch latest release from GitHub API
  const checkForUpdates = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://api.github.com/repos/SamInTheShell/journal-blocks/releases/latest',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch release information');
      }

      const release = await response.json();
      const currentVersion = getCurrentVersion();
      const latestVersion = release.tag_name; // e.g., "v2025.08.190200"
      const hasUpdate = compareVersions(currentVersion, latestVersion);

      console.log('Version check:', {
        currentVersion,
        latestVersion,
        hasUpdate,
        isDev: import.meta.env.DEV
      });

      setVersionInfo({
        currentVersion,
        latestVersion,
        hasUpdate,
        releaseUrl: release.html_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    versionInfo,
    isLoading,
    error,
    checkForUpdates,
    getCurrentVersion, // Expose for debugging
  };
}
