"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User, Building, UserCheck } from "lucide-react";
import { userManagementService } from '@/services/user_management';
  
const AccountPage = () => {
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user-details'],
    queryFn: async () => {
        try {
            const response = await userManagementService.fetchCurrentUser();
            // Ensure we always return an object, even if empty
            console.log("&&&&&&&&&&&&&&&& ", response)
            return response || {};
        } catch (error) {
            // Return empty object if there's an error
            console.error('Query error:', error);
            return {};
        }
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500 text-center">Error loading user data</div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Information</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{userData.username || userData.first_name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userData.email}</p>
              </div>
            </div>
            {userData.department && (
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{userData.department.name}</p>
                </div>
              </div>
            )}
            {userData.roles && userData.roles.length > 0 && (
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Roles</p>
                  <p className="font-medium">
                    {userData.roles.map((role: any) => role.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;