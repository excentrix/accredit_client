// components/data-management/config-manager.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { showToast } from "@/lib/toast";

interface Config {
  site_name: string;
  organization_name: string;
  academic_year: string;
  logo_url: string;
  contact_email: string;
}

export function ConfigManager() {
  const [config, setConfig] = useState<Config>({
    site_name: "",
    organization_name: "",
    academic_year: "",
    logo_url: "",
    contact_email: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/config/");
      setConfig(response.data);
    } catch (error) {
      showToast.error("Failed to fetch configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await api.put("/config/", config);
      showToast.success("Configuration saved successfully");
    } catch (error) {
      showToast.error("Failed to save configuration");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration</h2>
        <p className="text-muted-foreground">
          Manage system-wide settings and configurations
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={config.site_name}
                  onChange={(e) =>
                    setConfig({ ...config, site_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name</Label>
                <Input
                  id="org_name"
                  value={config.organization_name}
                  onChange={(e) =>
                    setConfig({ ...config, organization_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_year">Current Academic Year</Label>
                <Input
                  id="academic_year"
                  value={config.academic_year}
                  onChange={(e) =>
                    setConfig({ ...config, academic_year: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={config.contact_email}
                  onChange={(e) =>
                    setConfig({ ...config, contact_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
