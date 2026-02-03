import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ShieldAlert } from 'lucide-react';

export const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !password) {
      setError('Please enter both User ID and Password');
      return;
    }

    const success = login(userId, password);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid User ID or Password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="bg-red-600 p-4 rounded-lg">
              <ShieldAlert className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">DAECS Login</CardTitle>
            <CardDescription>
              Disaster Alert and Emergency Coordination System
            </CardDescription>
            <p className="text-xs text-gray-500">Malaysian National Disaster Management Agency</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your User ID"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700">
              Sign In
            </Button>

            {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1 text-blue-800">
                <p>Admin: <span className="font-mono">admin001 / admin123</span></p>
                <p>Officer: <span className="font-mono">officer001 / officer123</span></p>
                <p>Shelter Manager: <span className="font-mono">shelter001 / shelter123</span></p>
                <p>Resource Manager: <span className="font-mono">resource001 / resource123</span></p>
              </div>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};