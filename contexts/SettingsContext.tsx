import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { TenantSettings, User } from '../types';
import * as settingsService from '../lib/settingsService';
import { useAuth } from '../auth/AuthContext';

interface SettingsContextType {
    settings: TenantSettings | null;
    loading: boolean;
    updateSettings: (newSettings: TenantSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        settingsService.getTenantSettings()
            .then(setSettings)
            .finally(() => setLoading(false));
    }, []);
    
    const updateSettings = useCallback(async (newSettings: TenantSettings) => {
        if (!user) throw new Error("User must be authenticated to update settings.");
        setSettings(newSettings); // Optimistic update
        try {
            const savedSettings = await settingsService.updateTenantSettings(newSettings, user);
            setSettings(savedSettings); // Update with response from server
        } catch (error) {
            console.error("Failed to update settings", error);
            // Revert on failure (optional, might need a more robust solution)
            settingsService.getTenantSettings().then(setSettings);
            throw error;
        }
    }, [user]);

    const value = { settings, loading, updateSettings };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
